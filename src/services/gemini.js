// Gemini API Key Rotation Service
// Manages a pool of API keys with round-robin selection and health checking
import { GoogleGenerativeAI } from '@google/generative-ai';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

class GeminiService {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.failedKeys = new Set();
    this.model = null;
    this.lastFetchTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this._fetchPromise = null;
  }

  async fetchKeys() {
    const now = Date.now();
    if (this.keys.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.keys;
    }

    // Prevent concurrent fetches
    if (this._fetchPromise) return this._fetchPromise;

    this._fetchPromise = (async () => {
      try {
        const docRef = doc(db, 'config', 'gemini_keys');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const allKeys = data.keys || [];
          this.keys = allKeys.filter(k => k.enabled !== false && k.key && k.key.trim());
          this.lastFetchTime = Date.now();
          this.failedKeys.clear();
          console.log(`[GeminiService] Loaded ${this.keys.length} active API keys`);
        } else {
          console.warn('[GeminiService] No gemini_keys config document found in Firestore');
        }
      } catch (error) {
        console.error('[GeminiService] Failed to fetch Gemini API keys:', error);
        // Fall back to env variable if Firestore fails
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (envKey) {
          this.keys = [{ key: envKey, label: 'env' }];
          console.log('[GeminiService] Falling back to environment API key');
        }
      } finally {
        this._fetchPromise = null;
      }

      return this.keys;
    })();

    return this._fetchPromise;
  }

  getNextKey() {
    if (this.keys.length === 0) return null;

    let attempts = 0;
    while (attempts < this.keys.length) {
      const keyObj = this.keys[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;

      if (!this.failedKeys.has(keyObj.key)) {
        return keyObj.key;
      }
      attempts++;
    }

    // All keys failed — reset and try again
    console.warn('[GeminiService] All keys previously failed, resetting...');
    this.failedKeys.clear();
    return this.keys[0]?.key || null;
  }

  markKeyFailed(key) {
    this.failedKeys.add(key);
    console.warn(`[GeminiService] Marked key as failed: ${key?.substring(0, 8)}...`);
  }

  async getModel(modelName = 'gemini-2.0-flash') {
    await this.fetchKeys();
    const apiKey = this.getNextKey();

    if (!apiKey) {
      throw new Error('No valid Gemini API keys available. Please ask an admin to add API keys in the API Keys management page.');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      return { model: genAI.getGenerativeModel({ model: modelName }), apiKey };
    } catch (error) {
      this.markKeyFailed(apiKey);
      // Try next key
      return this.getModel(modelName);
    }
  }

  async generateContent(prompt, modelName = 'gemini-2.0-flash') {
    // CRITICAL FIX: Fetch keys BEFORE calculating maxRetries
    await this.fetchKeys();

    const maxRetries = Math.max(Math.min(this.keys.length, 4), 1);
    let lastError;

    console.log(`[GeminiService] Attempting generation with ${maxRetries} retries, ${this.keys.length} keys available`);

    for (let i = 0; i < maxRetries; i++) {
      try {
        const { model, apiKey } = await this.getModel(modelName);
        console.log(`[GeminiService] Attempt ${i + 1}: Using key ${apiKey?.substring(0, 8)}...`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`[GeminiService] Generation successful on attempt ${i + 1}`);
        return text;
      } catch (error) {
        lastError = error;
        const currentKey = this.keys[
          (this.currentIndex - 1 + this.keys.length) % this.keys.length
        ]?.key;
        if (currentKey) this.markKeyFailed(currentKey);
        console.warn(`[GeminiService] API call failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      }
    }

    throw new Error(`All Gemini API attempts failed. Last error: ${lastError?.message}. Please verify your API keys are valid.`);
  }

  async generateQuestions(content, type = 'mcq', count = 10) {
    const prompt = type === 'mcq'
      ? `Generate exactly ${count} multiple choice questions based on the following content. Each question must have exactly 4 options. Return ONLY a valid JSON array with this exact format (no other text): [{"question": "...", "options": ["A option", "B option", "C option", "D option"], "correct": 0, "explanation": "..."}] where "correct" is the 0-based index of the correct option.\n\nContent:\n${content}`
      : `Generate exactly ${count} subjective/essay questions based on the following content. Return ONLY a valid JSON array with this exact format (no other text): [{"question": "...", "expectedPoints": ["point1", "point2"], "maxMarks": 5}]\n\nContent:\n${content}`;

    const response = await this.generateContent(prompt);
    try {
      const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('[GeminiService] Failed to parse questions JSON:', response.substring(0, 200));
      throw new Error('Failed to parse AI-generated questions. The AI returned an invalid format.');
    }
  }

  async generateFlashcards(content, count = 15) {
    const prompt = `Generate exactly ${count} study flashcards from the following content. Each flashcard should have a question/term on the front and a clear answer/definition on the back. Return ONLY a valid JSON array with this exact format (no other text): [{"front": "question or term", "back": "answer or definition"}]\n\nContent:\n${content}`;
    const response = await this.generateContent(prompt);
    try {
      const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('[GeminiService] Failed to parse flashcards JSON:', response.substring(0, 200));
      throw new Error('Failed to parse AI-generated flashcards. The AI returned an invalid format.');
    }
  }

  async generateSummary(content) {
    const prompt = `Generate a comprehensive study summary from the following content. Structure it with clear headings, key points, and important definitions. Use markdown-style formatting with ## for headings, bullet points for lists, and **bold** for key terms. Make it concise but thorough.\n\nContent:\n${content}`;
    return await this.generateContent(prompt);
  }

  async evaluateAnswer(question, studentAnswer, expectedPoints, maxMarks) {
    const prompt = `You are an exam evaluator. Evaluate this student's answer strictly but fairly.

Question: ${question}
Student's Answer: ${studentAnswer}
Expected Points: ${expectedPoints.join(', ')}
Maximum Marks: ${maxMarks}

Return ONLY valid JSON (no other text): {"marks": <number between 0 and ${maxMarks}>, "feedback": "<detailed feedback>", "pointsCovered": ["<points the student covered>"]}`;

    const response = await this.generateContent(prompt);
    try {
      const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('[GeminiService] Failed to parse evaluation JSON:', response.substring(0, 200));
      throw new Error('Failed to parse AI evaluation result.');
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
