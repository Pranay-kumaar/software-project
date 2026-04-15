// Gemini API Key Rotation Service
// Manages a pool of API keys with round-robin selection, model fallback, and health checking
import { GoogleGenerativeAI } from '@google/generative-ai';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Model fallback chain — if one model's quota is exhausted, try the next
// Updated April 2026: Old 1.5/2.0 models are deprecated. Using current stable models.
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

class GeminiService {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.failedKeys = new Set();
    this.failedModels = new Set(); // Track models that hit quota limits
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
          this.failedModels.clear();
          console.log(`[GeminiService] Loaded ${this.keys.length} active API keys from Firestore`);
        } else {
          console.warn('[GeminiService] No gemini_keys config document found in Firestore');
        }
      } catch (error) {
        console.error('[GeminiService] Failed to fetch Gemini API keys from Firestore:', error);
      }

      // Always include the env variable key as a fallback
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (envKey && envKey.trim()) {
        const envKeyExists = this.keys.some(k => k.key === envKey.trim());
        if (!envKeyExists) {
          this.keys.push({ key: envKey.trim(), label: 'env-fallback' });
          console.log('[GeminiService] Added environment API key as fallback');
        }
      }

      if (this.keys.length === 0) {
        console.error('[GeminiService] No API keys available from Firestore or environment');
      }

      this._fetchPromise = null;
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

  /**
   * Check if an error is a 429 rate-limit / quota error
   */
  isQuotaError(error) {
    const msg = (error?.message || '').toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('resource has been exhausted') ||
      msg.includes('too many requests')
    );
  }

  /**
   * Get the best available model name, skipping models known to be quota-exhausted
   */
  getAvailableModel(preferredModel) {
    // If the preferred model isn't blocked, use it
    if (!this.failedModels.has(preferredModel)) {
      return preferredModel;
    }

    // Try fallback models
    for (const model of MODEL_FALLBACK_CHAIN) {
      if (!this.failedModels.has(model)) {
        console.log(`[GeminiService] Falling back from ${preferredModel} to ${model}`);
        return model;
      }
    }

    // All models failed — reset and try the first one
    console.warn('[GeminiService] All models quota-exhausted, resetting model failures...');
    this.failedModels.clear();
    return MODEL_FALLBACK_CHAIN[0];
  }

  async getModel(modelName = 'gemini-2.5-flash') {
    await this.fetchKeys();
    const apiKey = this.getNextKey();
    const actualModel = this.getAvailableModel(modelName);

    if (!apiKey) {
      throw new Error('No valid Gemini API keys available. Please ask an admin to add API keys in the API Keys management page.');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      return { model: genAI.getGenerativeModel({ model: actualModel }), apiKey, modelName: actualModel };
    } catch (error) {
      this.markKeyFailed(apiKey);
      // Try next key
      return this.getModel(modelName);
    }
  }

  /**
   * Sleep for a given number of milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateContent(prompt, modelName = 'gemini-2.5-flash') {
    await this.fetchKeys();

    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys available. Please check your setup.');
    }

    // Try each model in the fallback chain (starting with the preferred one)
    const modelsToTry = [
      modelName,
      ...MODEL_FALLBACK_CHAIN.filter(m => m !== modelName)
    ];

    let lastError;
    let attempt = 0;

    for (const currentModel of modelsToTry) {
      if (this.failedModels.has(currentModel)) continue;

      console.log(`[GeminiService] Trying model: ${currentModel}`);
      
      // Try every single key for this model
      for (let keyIdx = 0; keyIdx < this.keys.length; keyIdx++) {
        attempt++;
        const apiKey = this.getNextKey();
        
        if (!apiKey) continue;

        try {
          console.log(`[GeminiService] Attempt ${attempt}: Using key ${apiKey.substring(0, 8)}... with model ${currentModel}`);
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: currentModel });
          
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          
          console.log(`[GeminiService] Generation successful with model ${currentModel}`);
          return text;
        } catch (error) {
          lastError = error;
          this.markKeyFailed(apiKey);

          if (this.isQuotaError(error)) {
            console.warn(`[GeminiService] Quota error for ${currentModel} with key ${apiKey.substring(0, 8)}...:`, error.message);
            
            // Short delay before trying next key
            const backoffMs = Math.min(500 * Math.pow(1.5, keyIdx), 2000);
            await this.sleep(backoffMs);
          } else {
            console.warn(`[GeminiService] Non-quota error with model ${currentModel}:`, error.message);
          }
        }
      }

      // If we're here, all keys failed for this model
      console.warn(`[GeminiService] All keys failed for model ${currentModel}. Falling back to next available model.`);
      this.failedModels.add(currentModel);
      this.failedKeys.clear(); // Reset key failures for the next model
    }

    // CRITICAL: If we've exhausted ALL models, reset the failures for the next request
    if (this.failedModels.size >= modelsToTry.length) {
      console.warn('[GeminiService] All possible models and keys exhausted. Resetting failure trackers.');
      this.failedModels.clear();
      this.failedKeys.clear();
    }

    throw new Error(`All Gemini API attempts failed after ${attempt} tries. Last error: ${lastError?.message || 'unknown error'}. Please verify your API keys are valid and have sufficient quota.`);
  }

  /**
   * Simple health check for a single key
   */
  async isKeyValid(apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      await model.generateContent('Hi');
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
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
