// Teacher Dashboard Overview
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClassroomsByTeacher, getTestsByTeacher } from '../../services/firestore';
import {
  FolderOpen, ClipboardList, Users, PenTool,
  TrendingUp, Award, Plus
} from 'lucide-react';

export default function TeacherOverview() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const [cls, tst] = await Promise.all([
        getClassroomsByTeacher(user.uid),
        getTestsByTeacher(user.uid),
      ]);
      setClassrooms(cls);
      setTests(tst);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalStudents = classrooms.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  const publishedTests = tests.filter(t => t.status === 'published').length;

  const stats = [
    { label: 'My Classrooms', value: classrooms.length, icon: <FolderOpen size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Total Students', value: totalStudents, icon: <Users size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Tests', value: tests.length, icon: <ClipboardList size={20} />, color: 'var(--accent-sky)', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Published', value: publishedTests, icon: <TrendingUp size={20} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Teacher Dashboard</h1>
        <p>Manage your classrooms and tests</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{loading ? '—' : stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Recent Classrooms</h3>
            <Link to="/teacher/classrooms" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
            </div>
          ) : classrooms.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>No classrooms yet</p>
              <Link to="/teacher/classrooms" className="btn btn-primary btn-sm">
                <Plus size={14} /> Create Classroom
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {classrooms.slice(0, 3).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {c.code} · {c.students?.length || 0} students</div>
                  </div>
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
            <Link to="/teacher/classrooms" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <FolderOpen size={16} /> Manage Classrooms
            </Link>
            <Link to="/teacher/create-test" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <PenTool size={16} /> Create New Test
            </Link>
            <Link to="/teacher/evaluations" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Award size={16} /> Review Submissions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
