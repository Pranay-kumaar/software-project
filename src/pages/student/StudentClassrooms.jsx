// Student — Join Classrooms
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getStudentClassrooms, getClassroomByCode, joinClassroom } from '../../services/firestore';
import { FolderOpen, Hash, Users, LogIn, BookOpen } from 'lucide-react';

export default function StudentClassrooms() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user) loadClassrooms();
  }, [user]);

  async function loadClassrooms() {
    try {
      const data = await getStudentClassrooms(user.uid);
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!code.trim()) return error('Please enter a classroom code.');
    setJoining(true);
    try {
      const classroom = await getClassroomByCode(code.trim().toUpperCase());
      if (!classroom) {
        error('Invalid classroom code.');
        return;
      }
      if (classroom.students?.includes(user.uid)) {
        error('You already joined this classroom.');
        return;
      }
      await joinClassroom(classroom.id, user.uid);
      setClassrooms(prev => [...prev, { ...classroom, students: [...(classroom.students || []), user.uid] }]);
      setCode('');
      success(`Joined "${classroom.name}" successfully!`);
    } catch (err) {
      error('Failed to join classroom.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Classrooms</h1>
        <p>Join a classroom with a code or view your enrolled classrooms</p>
      </div>

      <form onSubmit={handleJoin} className="glass-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Join a Classroom</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, maxWidth: 280 }}>
            <label>Classroom Code</label>
            <div className="input-with-icon">
              <Hash size={16} className="input-icon" />
              <input
                className="input"
                placeholder="e.g., A3B7K9"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 600 }}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={joining}>
            {joining ? 'Joining...' : <><LogIn size={16} /> Join</>}
          </button>
        </div>
      </form>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FolderOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>You haven't joined any classrooms yet. Enter a code above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {classrooms.map(c => (
            <div key={c.id} className="glass-card">
              <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.375rem' }}>{c.name}</h3>
              {c.subject && <span className="badge badge-indigo" style={{ marginBottom: '0.5rem' }}>{c.subject}</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                <BookOpen size={14} />
                <span>Teacher: {c.teacherName || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                <Users size={14} />
                <span>{c.students?.length || 0} students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
