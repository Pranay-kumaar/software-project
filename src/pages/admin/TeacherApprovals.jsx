// Admin — Teacher Approvals Page
import { useState, useEffect } from 'react';
import { getPendingTeachers, approveTeacher, rejectTeacher } from '../../services/firestore';
import { useToast } from '../../contexts/ToastContext';
import { UserCheck, UserX, Mail, Clock, Search } from 'lucide-react';

export default function TeacherApprovals() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { success, error } = useToast();

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      const data = await getPendingTeachers();
      setTeachers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(uid) {
    try {
      await approveTeacher(uid);
      setTeachers(prev => prev.filter(t => t.id !== uid));
      success('Teacher approved successfully!');
    } catch (err) {
      error('Failed to approve teacher.');
    }
  }

  async function handleReject(uid) {
    try {
      await rejectTeacher(uid);
      setTeachers(prev => prev.filter(t => t.id !== uid));
      success('Teacher rejected.');
    } catch (err) {
      error('Failed to reject teacher.');
    }
  }

  const filtered = teachers.filter(t =>
    t.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Teacher Approvals</h1>
        <p>Review and approve pending teacher registrations</p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div className="input-with-icon" style={{ maxWidth: 360 }}>
          <Search size={16} className="input-icon" />
          <input
            className="input"
            placeholder="Search teachers..."
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <UserCheck size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {search ? 'No matching teachers found.' : 'No pending teacher approvals.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(teacher => (
            <div key={teacher.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
              <div className="profile-avatar" style={{ width: 42, height: 42, fontSize: '1rem' }}>
                {(teacher.displayName || 'T').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {teacher.displayName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Mail size={12} /> {teacher.email}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-success btn-sm" onClick={() => handleApprove(teacher.id)}>
                  <UserCheck size={14} /> Approve
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(teacher.id)}>
                  <UserX size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
