// Student — Exam Player (fullscreen, timer, anti-cheat)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getTestById, createSubmission, getStudentSubmission } from '../../services/firestore';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Maximize, Flag } from 'lucide-react';
import './ExamPlayer.css';

export default function ExamPlayer() {
  const { testId } = useParams();
  const { user, userProfile } = useAuth();
  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    loadTest();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [testId]);

  async function loadTest() {
    try {
      const data = await getTestById(testId);
      setTest(data);
      if (data) {
        setAnswers(new Array(data.questions.length).fill(null));
        setTimeLeft(data.duration * 60);
        // Check if already submitted
        const existing = await getStudentSubmission(testId, user.uid);
        if (existing) setAlreadySubmitted(true);
      }
    } catch (err) {
      error('Failed to load test.');
    } finally {
      setLoading(false);
    }
  }

  function startExam() {
    setStarted(true);
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Try fullscreen
    try { document.documentElement.requestFullscreen?.(); } catch {}

    // Tab switch detection
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          warning(`Tab switch detected! (${newCount})`);
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }

  function setAnswer(qIndex, value) {
    setAnswers(prev => { const next = [...prev]; next[qIndex] = value; return next; });
  }

  function toggleFlag(qIndex) {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  }

  async function handleSubmit(auto = false) {
    if (submitting) return;
    if (!auto && !confirm('Are you sure you want to submit? You cannot change your answers after submission.')) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      await createSubmission({
        testId,
        studentId: user.uid,
        studentName: userProfile?.displayName || user.email,
        answers,
        tabSwitchCount,
        timeTaken: (test.duration * 60) - timeLeft,
        status: 'submitted',
      });
      success(auto ? 'Time\'s up! Test auto-submitted.' : 'Test submitted successfully!');
      try { document.exitFullscreen?.(); } catch {}
      navigate('/student/results', { replace: true });
    } catch (err) {
      error('Failed to submit test.');
      setSubmitting(false);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) return <div className="exam-loading"><div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: '3px', borderColor: 'var(--border-secondary)', borderTopColor: 'var(--accent-indigo)' }} /></div>;

  if (!test) return <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', margin: '2rem' }}><p>Test not found.</p></div>;

  if (alreadySubmitted) return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', margin: '2rem auto', maxWidth: 500 }}>
      <AlertTriangle size={40} style={{ color: 'var(--accent-amber)', marginBottom: '1rem' }} />
      <h2 style={{ marginBottom: '0.5rem' }}>Already Submitted</h2>
      <p style={{ marginBottom: '1.5rem' }}>You have already submitted this test.</p>
      <button className="btn btn-primary" onClick={() => navigate('/student/results')}>View Results</button>
    </div>
  );

  if (!started) return (
    <div className="exam-start-screen">
      <div className="glass-card animate-scale-in" style={{ maxWidth: 500, textAlign: 'center', padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{test.title}</h2>
        {test.description && <p style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>{test.description}</p>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={16} /> {test.duration} min</span>
          <span>{test.questions.length} questions</span>
        </div>
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--accent-amber)', textAlign: 'left' }}>
          <strong>⚠️ Instructions:</strong>
          <ul style={{ margin: '0.375rem 0 0 1.25rem', lineHeight: 1.7 }}>
            <li>The test will enter fullscreen mode</li>
            <li>Tab switching is monitored and logged</li>
            <li>Timer auto-submits when time runs out</li>
          </ul>
        </div>
        <button className="btn btn-primary btn-lg" onClick={startExam}>
          <Maximize size={18} /> Start Exam
        </button>
      </div>
    </div>
  );

  const question = test.questions[currentQ];
  const answeredCount = answers.filter(a => a !== null).length;

  return (
    <div className="exam-player">
      {/* Header */}
      <div className="exam-header">
        <h3 style={{ fontSize: '0.9375rem', flex: 1 }}>{test.title}</h3>
        <div className={`exam-timer ${timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warning' : ''}`}>
          <Clock size={16} />
          {formatTime(timeLeft)}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(false)} disabled={submitting}>
          <Send size={14} /> Submit
        </button>
      </div>

      <div className="exam-body">
        {/* Question Navigator */}
        <div className="exam-navigator">
          <div className="nav-title">Questions</div>
          <div className="nav-grid">
            {test.questions.map((_, i) => (
              <button
                key={i}
                className={`nav-btn ${currentQ === i ? 'current' : ''} ${answers[i] !== null ? 'answered' : ''} ${flagged.has(i) ? 'flagged' : ''}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="nav-legend">
            <span><span className="legend-dot answered" /> Answered ({answeredCount})</span>
            <span><span className="legend-dot flagged" /> Flagged ({flagged.size})</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="exam-question-area">
          <div className="question-header">
            <span className="question-number">Question {currentQ + 1} of {test.questions.length}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${question.type === 'mcq' ? 'badge-indigo' : 'badge-amber'}`}>{question.type.toUpperCase()}</span>
              <button className={`btn btn-icon btn-sm ${flagged.has(currentQ) ? 'btn-danger' : 'btn-ghost'}`} onClick={() => toggleFlag(currentQ)} title="Flag for review">
                <Flag size={14} />
              </button>
            </div>
          </div>

          <div className="question-text">{question.question}</div>

          {question.type === 'mcq' ? (
            <div className="mcq-options">
              {question.options.map((opt, oi) => (
                <label key={oi} className={`mcq-option ${answers[currentQ] === oi ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`q-${currentQ}`}
                    checked={answers[currentQ] === oi}
                    onChange={() => setAnswer(currentQ, oi)}
                  />
                  <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                  <span className="option-text">{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="input subjective-answer"
              rows={6}
              placeholder="Type your answer here..."
              value={answers[currentQ] || ''}
              onChange={e => setAnswer(currentQ, e.target.value)}
            />
          )}

          <div className="question-nav-buttons">
            <button className="btn btn-secondary" disabled={currentQ === 0} onClick={() => setCurrentQ(prev => prev - 1)}>
              <ChevronLeft size={16} /> Previous
            </button>
            <button className="btn btn-primary" disabled={currentQ === test.questions.length - 1} onClick={() => setCurrentQ(prev => prev + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
