// Teacher — Tests List
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getTestsByTeacher, publishTest } from '../../services/firestore';
import { ClipboardList, Clock, Users, Eye, Send, PenTool, Plus } from 'lucide-react';

export default function TestsList() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadTests();
  }, [user]);

  async function loadTests() {
    try {
      const data = await getTestsByTeacher(user.uid);
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(testId) {
    try {
      await publishTest(testId);
      setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'published' } : t));
      success('Test published!');
    } catch (err) {
      error('Failed to publish test.');
    }
  }

  const statusColors = {
    draft: 'badge-amber',
    published: 'badge-emerald',
    closed: 'badge-rose',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>My Tests</h1>
            <p>View and manage all your created tests</p>
          </div>
          <Link to="/teacher/create-test" className="btn btn-primary">
            <Plus size={16} /> Create Test
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 88 }} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ClipboardList size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No tests created yet.</p>
          <Link to="/teacher/create-test" className="btn btn-primary">
            <PenTool size={16} /> Create Your First Test
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tests.map(test => (
            <div key={test.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <h3 style={{ fontSize: '1rem' }}>{test.title}</h3>
                  <span className={`badge ${statusColors[test.status] || 'badge-amber'}`}>{test.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {test.duration} min</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ClipboardList size={12} /> {test.questions?.length || 0} questions</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {test.status === 'draft' && (
                  <button className="btn btn-success btn-sm" onClick={() => handlePublish(test.id)}>
                    <Send size={14} /> Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
