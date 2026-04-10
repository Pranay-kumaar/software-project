// Admin Dashboard Overview — Live data from Firestore
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Users, GraduationCap, BookOpen, ClipboardList,
  UserCheck, TrendingUp, AlertCircle, Key, BarChart3
} from 'lucide-react';

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    activeTeachers: 0,
    totalStudents: 0,
    liveTests: 0,
  });
  const [pendingTeachers, setPendingTeachers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersSnap, testsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'tests'), where('status', '==', 'published'))),
      ]);

      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const active = teachers.filter(t => t.status === 'active');
      const pending = teachers.filter(t => t.status === 'pending');

      setStatsData({
        totalUsers: users.length,
        activeTeachers: active.length,
        totalStudents: students.length,
        liveTests: testsSnap.size,
      });
      setPendingTeachers(pending);
    } catch (err) {
      console.error('[AdminOverview] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: 'Total Users', value: loading ? '—' : statsData.totalUsers, icon: <Users size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Active Teachers', value: loading ? '—' : statsData.activeTeachers, icon: <BookOpen size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Students', value: loading ? '—' : statsData.totalStudents, icon: <GraduationCap size={20} />, color: 'var(--accent-sky)', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Live Tests', value: loading ? '—' : statsData.liveTests, icon: <ClipboardList size={20} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Monitor and manage the entire platform</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Pending Approvals</h3>
            <Link to="/admin/teachers" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
            </div>
          ) : pendingTeachers.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <UserCheck size={32} style={{ marginBottom: '0.75rem', opacity: 0.4, color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No pending teacher approvals</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pendingTeachers.slice(0, 5).map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.75rem', background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div className="profile-avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                    {(t.displayName || t.email || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t.displayName || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email}</div>
                  </div>
                  <span className="badge badge-amber">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/admin/teachers" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <UserCheck size={16} /> Review Teachers
            </Link>
            <Link to="/admin/api-keys" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Key size={16} /> Manage API Keys
            </Link>
            <Link to="/admin/users" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Users size={16} /> Manage Users
            </Link>
            <Link to="/admin/analytics" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <BarChart3 size={16} /> View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
