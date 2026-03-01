// Admin — Users Management
import { useState, useEffect } from 'react';
import { getUsersByRole, updateUser } from '../../services/firestore';
import { useToast } from '../../contexts/ToastContext';
import { Users, Search, Shield, BookOpen, GraduationCap, Ban, CheckCircle } from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { success, error } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const [students, teachers, admins] = await Promise.all([
        getUsersByRole('student'),
        getUsersByRole('teacher'),
        getUsersByRole('admin'),
      ]);
      setUsers([...admins, ...teachers, ...students]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(uid, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUser(uid, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: newStatus } : u));
      success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}.`);
    } catch (err) {
      error('Failed to update user status.');
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleIcons = {
    admin: <Shield size={14} style={{ color: 'var(--accent-rose)' }} />,
    teacher: <BookOpen size={14} style={{ color: 'var(--accent-emerald)' }} />,
    student: <GraduationCap size={14} style={{ color: 'var(--accent-sky)' }} />,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>User Management</h1>
        <p>View and manage all platform users</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="input-icon" />
          <input
            className="input"
            placeholder="Search users..."
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 160 }}>
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="teacher">Teachers</option>
          <option value="student">Students</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Users size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No users found.</p>
        </div>
      ) : (
        <div className="table-wrapper glass-card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="profile-avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                        {(user.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                      {user.displayName || '—'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role === 'admin' ? 'rose' : user.role === 'teacher' ? 'emerald' : 'sky'}`}>
                      {roleIcons[user.role]} {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'badge-emerald' : user.status === 'pending' ? 'badge-amber' : 'badge-rose'}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td>
                    {user.role !== 'admin' && (
                      <button
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(user.id, user.status)}
                      >
                        {user.status === 'active' ? <><Ban size={12} /> Suspend</> : <><CheckCircle size={12} /> Activate</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
