// Student — Results History
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSubmissionsByStudent, getTestById } from '../../services/firestore';
import { Award, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

export default function Results() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadResults();
  }, [user]);

  async function loadResults() {
    try {
      const subs = await getSubmissionsByStudent(user.uid);
      // Load test details for each submission
      const enriched = await Promise.all(subs.map(async (sub) => {
        try {
          const test = await getTestById(sub.testId);
          return { ...sub, testTitle: test?.title || 'Unknown Test', testQuestions: test?.questions?.length || 0 };
        } catch {
          return { ...sub, testTitle: 'Unknown Test', testQuestions: 0 };
        }
      }));
      setResults(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Results</h1>
        <p>View your test performance history</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Award size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No test results yet. Take a test to see your scores!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {results.map(result => (
            <div key={result.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: result.status === 'evaluated' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: result.status === 'evaluated' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                flexShrink: 0
              }}>
                {result.status === 'evaluated' ? <CheckCircle size={22} /> : <Clock size={22} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {result.testTitle}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {result.timeTaken && <span><Clock size={12} style={{ verticalAlign: 'middle' }} /> {formatTime(result.timeTaken)}</span>}
                  <span>{result.testQuestions} questions</span>
                  {result.tabSwitchCount > 0 && (
                    <span style={{ color: 'var(--accent-rose)' }}>⚠ {result.tabSwitchCount} tab switches</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {result.status === 'evaluated' ? (
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {result.totalMarks}
                  </div>
                ) : (
                  <span className="badge badge-amber">Pending</span>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {result.status === 'evaluated' ? 'marks' : 'evaluation'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
