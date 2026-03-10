// Teacher — Classroom Management
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createClassroom, getClassroomsByTeacher, removeStudentFromClassroom } from '../../services/firestore';
import { FolderOpen, Plus, Copy, Users, X, Hash } from 'lucide-react';

export default function ClassroomManagement() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) loadClassrooms();
  }, [user]);

  async function loadClassrooms() {
    try {
      const data = await getClassroomsByTeacher(user.uid);
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return error('Please enter a classroom name.');
    setCreating(true);
    try {
      const classroom = await createClassroom({
        name: newName.trim(),
        subject: newSubject.trim(),
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
      });
      setClassrooms(prev => [classroom, ...prev]);
      setNewName('');
      setNewSubject('');
      setShowCreate(false);
      success('Classroom created!');
    } catch (err) {
      error('Failed to create classroom.');
    } finally {
      setCreating(false);
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    success(`Code "${code}" copied to clipboard!`);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Classrooms</h1>
            <p>Create and manage your virtual classrooms</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <Plus size={16} /> New Classroom
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card animate-fade-in-down" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Create New Classroom</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
              <label>Classroom Name</label>
              <input className="input" placeholder="e.g., Physics 101" value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
              <label>Subject (optional)</label>
              <input className="input" placeholder="e.g., Physics" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FolderOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No classrooms yet. Create your first one!</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Classroom
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {classrooms.map(c => (
            <div key={c.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.25rem' }}>{c.name}</h3>
                  {c.subject && <span className="badge badge-indigo">{c.subject}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
                <Hash size={14} style={{ color: 'var(--text-muted)' }} />
                <code style={{ flex: 1, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent-indigo-light)', fontFamily: 'var(--font-mono)' }}>{c.code}</code>
                <button className="btn btn-icon btn-ghost" onClick={() => copyCode(c.code)} title="Copy code">
                  <Copy size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                <Users size={14} />
                <span>{c.students?.length || 0} students enrolled</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
