// Student — Tests List
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentClassrooms, getActiveTestsForStudent, getStudentSubmission } from '../../services/firestore';
import { ClipboardList, Clock, PlayCircle, CheckCircle } from 'lucide-react';

export default function StudentTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [submitted, setSubmitted] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadTests();
  }, [user]);

  async function loadTests() {
    try {
      const classrooms = await getStudentClassrooms(user.uid);
      const classroomIds = classrooms.map(c => c.id);
      if (classroomIds.length > 0) {
        const tst = await getActiveTestsForStudent(classroomIds);
        setTests(tst);
        // Check which tests are already submitted
        const subMap = {};
        await Promise.all(tst.map(async (t) => {
          const sub = await getStudentSubmission(t.id, user.uid);
          if (sub) subMap[t.id] = true;
        }));
        setSubmitted(subMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Available Tests</h1>
        <p>View and take tests from your classrooms</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ClipboardList size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No tests available right now. Join a classroom to see upcoming tests.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tests.map(test => (
            <div key={test.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{test.title}</h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {test.duration} min</span>
                  <span>{test.questions?.length || 0} questions</span>
                </div>
              </div>
              {submitted[test.id] ? (
                <span className="badge badge-emerald"><CheckCircle size={12} /> Submitted</span>
              ) : (
                <Link to={`/student/exam/${test.id}`} className="btn btn-primary btn-sm">
                  <PlayCircle size={14} /> Take Test
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
