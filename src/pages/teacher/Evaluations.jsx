// Teacher — Evaluations
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getTestsByTeacher, getSubmissionsByTest, updateSubmission } from '../../services/firestore';
import geminiService from '../../services/gemini';
import { Award, Brain, Check, ChevronDown, ChevronRight, Eye } from 'lucide-react';

export default function Evaluations() {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTest, setExpandedTest] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [evaluating, setEvaluating] = useState(null);

  useEffect(() => {
    if (user) loadTests();
  }, [user]);

  async function loadTests() {
    try {
      const data = await getTestsByTeacher(user.uid);
      setTests(data.filter(t => t.status === 'published'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTest(testId) {
    if (expandedTest === testId) {
      setExpandedTest(null);
      return;
    }
    setExpandedTest(testId);
    if (!submissions[testId]) {
      try {
        const subs = await getSubmissionsByTest(testId);
        setSubmissions(prev => ({ ...prev, [testId]: subs }));
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function autoEvaluate(testId, submissionId, questions, answers) {
    setEvaluating(submissionId);
    info('AI is evaluating the submission...');
    try {
      let totalMarks = 0;
      const evaluated = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const answer = answers[i];
        if (q.type === 'mcq') {
          const correct = answer === q.correct;
          totalMarks += correct ? (q.marks || 1) : 0;
          evaluated.push({ ...q, studentAnswer: answer, correct, marks: correct ? (q.marks || 1) : 0 });
        } else {
          const result = await geminiService.evaluateAnswer(q.question, answer || '', q.expectedPoints || [], q.maxMarks || 5);
          totalMarks += result.marks;
          evaluated.push({ ...q, studentAnswer: answer, marks: result.marks, feedback: result.feedback });
        }
      }

      await updateSubmission(submissionId, { evaluated, totalMarks, status: 'evaluated' });
      setSubmissions(prev => ({
        ...prev,
        [testId]: prev[testId].map(s => s.id === submissionId ? { ...s, evaluated, totalMarks, status: 'evaluated' } : s)
      }));
      success(`Evaluation complete! Total: ${totalMarks} marks`);
    } catch (err) {
      error(err.message || 'Evaluation failed.');
    } finally {
      setEvaluating(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Evaluations</h1>
        <p>Review and evaluate student submissions</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Award size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No published tests to evaluate.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tests.map(test => (
            <div key={test.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => toggleTest(test.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                  padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', textAlign: 'left'
                }}
              >
                {expandedTest === test.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{test.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{test.questions?.length || 0} questions</div>
                </div>
                <span className="badge badge-emerald">{submissions[test.id]?.length || '—'} submissions</span>
              </button>

              {expandedTest === test.id && (
                <div style={{ borderTop: '1px solid var(--border-primary)', padding: '1rem 1.25rem' }}>
                  {!submissions[test.id]?.length ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No submissions yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {submissions[test.id].map(sub => (
                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                          <div className="profile-avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                            {(sub.studentName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{sub.studentName || sub.studentId}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {sub.status === 'evaluated' ? `Score: ${sub.totalMarks}` : 'Pending evaluation'}
                            </div>
                          </div>
                          {sub.status !== 'evaluated' && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={evaluating === sub.id}
                              onClick={() => autoEvaluate(test.id, sub.id, test.questions, sub.answers)}
                            >
                              {evaluating === sub.id ? (
                                <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: '2px' }} />
                              ) : (
                                <><Brain size={14} /> AI Evaluate</>
                              )}
                            </button>
                          )}
                          {sub.status === 'evaluated' && (
                            <span className="badge badge-emerald"><Check size={12} /> Evaluated</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
