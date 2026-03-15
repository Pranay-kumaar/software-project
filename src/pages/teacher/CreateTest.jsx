// Teacher — Test Creation Studio
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createTest, getClassroomsByTeacher } from '../../services/firestore';
import geminiService from '../../services/gemini';
import {
  PenTool, Plus, Trash2, Brain, Save, ChevronDown, ChevronUp,
  Type, ListChecks, Clock, FileText
} from 'lucide-react';

export default function CreateTest() {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [aiType, setAiType] = useState('mcq');

  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    classroomId: '',
    duration: 30,
    questions: [],
  });

  useEffect(() => {
    if (user) loadClassrooms();
  }, [user]);

  async function loadClassrooms() {
    try {
      const data = await getClassroomsByTeacher(user.uid);
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    }
  }

  function updateForm(field, value) {
    setTestForm(prev => ({ ...prev, [field]: value }));
  }

  function addQuestion(type = 'mcq') {
    const q = type === 'mcq'
      ? { type: 'mcq', question: '', options: ['', '', '', ''], correct: 0, marks: 1 }
      : { type: 'subjective', question: '', expectedPoints: [''], maxMarks: 5 };
    setTestForm(prev => ({ ...prev, questions: [...prev.questions, q] }));
  }

  function updateQuestion(index, data) {
    setTestForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? { ...q, ...data } : q)
    }));
  }

  function removeQuestion(index) {
    setTestForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  }

  function updateOption(qIndex, oIndex, value) {
    setTestForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options];
        options[oIndex] = value;
        return { ...q, options };
      })
    }));
  }

  async function handleAIGenerate() {
    if (!aiContent.trim()) return error('Please paste some study content first.');
    setGenerating(true);
    info('Generating questions with AI...');
    try {
      const questions = await geminiService.generateQuestions(aiContent, aiType, aiCount);
      const formatted = questions.map(q => {
        if (aiType === 'mcq') {
          return { type: 'mcq', question: q.question, options: q.options, correct: q.correct, marks: 1, explanation: q.explanation };
        } else {
          return { type: 'subjective', question: q.question, expectedPoints: q.expectedPoints, maxMarks: q.maxMarks || 5 };
        }
      });
      setTestForm(prev => ({ ...prev, questions: [...prev.questions, ...formatted] }));
      success(`Generated ${formatted.length} questions!`);
    } catch (err) {
      error(err.message || 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(publish = false) {
    if (!testForm.title) return error('Please enter a test title.');
    if (!testForm.classroomId) return error('Please select a classroom.');
    if (testForm.questions.length === 0) return error('Add at least one question.');

    setSaving(true);
    try {
      await createTest({
        ...testForm,
        teacherId: user.uid,
        status: publish ? 'published' : 'draft',
      });
      success(publish ? 'Test published!' : 'Test saved as draft!');
      setTestForm({ title: '', description: '', classroomId: '', duration: 30, questions: [] });
    } catch (err) {
      error('Failed to save test.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Create Test</h1>
            <p>Build a new test manually or with AI assistance</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
              <Save size={16} /> Save Draft
            </button>
            <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving}>
              <FileText size={16} /> Publish
            </button>
          </div>
        </div>
      </div>

      {/* Test Info */}
      <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Test Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Test Title</label>
            <input className="input" placeholder="e.g., Chapter 3 — Forces & Motion" value={testForm.title} onChange={e => updateForm('title', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Classroom</label>
            <select className="input" value={testForm.classroomId} onChange={e => updateForm('classroomId', e.target.value)}>
              <option value="">Select classroom...</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Duration (minutes)</label>
            <input type="number" className="input" min={5} max={300} value={testForm.duration} onChange={e => updateForm('duration', parseInt(e.target.value) || 30)} />
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Description (optional)</label>
            <textarea className="input" rows={2} placeholder="Add instructions for students..." value={testForm.description} onChange={e => updateForm('description', e.target.value)} />
          </div>
        </div>
      </div>

      {/* AI Generator */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', borderColor: 'var(--border-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Brain size={18} style={{ color: 'var(--accent-violet)' }} />
          <h3 style={{ fontSize: '1rem' }}>AI Question Generator</h3>
          <span className="badge badge-indigo">Gemini</span>
        </div>
        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
          <label>Paste study content</label>
          <textarea className="input" rows={4} placeholder="Paste your lecture notes, textbook content, or topic description here..." value={aiContent} onChange={e => setAiContent(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group">
            <label>Question Type</label>
            <select className="input" value={aiType} onChange={e => setAiType(e.target.value)} style={{ width: 160 }}>
              <option value="mcq">Multiple Choice</option>
              <option value="subjective">Subjective</option>
            </select>
          </div>
          <div className="input-group">
            <label>Count</label>
            <input type="number" className="input" min={1} max={30} value={aiCount} onChange={e => setAiCount(parseInt(e.target.value) || 10)} style={{ width: 80 }} />
          </div>
          <button className="btn btn-primary" onClick={handleAIGenerate} disabled={generating}>
            {generating ? (
              <><span className="btn-spinner" style={{ width: 16, height: 16, borderWidth: '2px' }} /> Generating...</>
            ) : (
              <><Brain size={16} /> Generate</>
            )}
          </button>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem' }}>Questions ({testForm.questions.length})</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => addQuestion('mcq')}>
            <ListChecks size={14} /> Add MCQ
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => addQuestion('subjective')}>
            <Type size={14} /> Add Subjective
          </button>
        </div>
      </div>

      {testForm.questions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <PenTool size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No questions yet. Add manually or use AI.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {testForm.questions.map((q, qi) => (
            <div key={qi} className="glass-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Q{qi + 1}</span>
                  <span className={`badge ${q.type === 'mcq' ? 'badge-indigo' : 'badge-amber'}`}>{q.type.toUpperCase()}</span>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => removeQuestion(qi)} style={{ color: 'var(--accent-rose)' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <textarea className="input" rows={2} placeholder="Enter question..." value={q.question} onChange={e => updateQuestion(qi, { question: e.target.value })} />
              </div>

              {q.type === 'mcq' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correct === oi}
                        onChange={() => updateQuestion(qi, { correct: oi })}
                        style={{ accentColor: 'var(--accent-emerald)' }}
                      />
                      <input className="input" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} />
                    </div>
                  ))}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Select the correct answer above</div>
                </div>
              ) : (
                <div className="input-group">
                  <label>Max Marks</label>
                  <input type="number" className="input" min={1} max={50} value={q.maxMarks} onChange={e => updateQuestion(qi, { maxMarks: parseInt(e.target.value) || 5 })} style={{ width: 100 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
