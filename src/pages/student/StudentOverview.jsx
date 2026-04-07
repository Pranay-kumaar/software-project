// Student Dashboard Overview
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentClassrooms, getActiveTestsForStudent, getSubmissionsByStudent } from '../../services/firestore';
import {
  FolderOpen, ClipboardList, Award, Brain, TrendingUp, BookOpen
} from 'lucide-react';

export default function StudentOverview() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const cls = await getStudentClassrooms(user.uid);
      setClassrooms(cls);
      const classroomIds = cls.map(c => c.id);
      if (classroomIds.length > 0) {
        const [tst, res] = await Promise.all([
          getActiveTestsForStudent(classroomIds),
          getSubmissionsByStudent(user.uid),
        ]);
        setTests(tst);
        setResults(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: 'My Classrooms', value: classrooms.length, icon: <FolderOpen size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Upcoming Tests', value: tests.length, icon: <ClipboardList size={20} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Completed', value: results.length, icon: <Award size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Avg Score', value: results.length ? Math.round(results.reduce((s, r) => s + (r.totalMarks || 0), 0) / results.length) : '—', icon: <TrendingUp size={20} />, color: 'var(--accent-sky)', bg: 'rgba(14,165,233,0.1)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>Your learning overview at a glance</p>
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
            <h3 style={{ fontSize: '1rem' }}>Upcoming Tests</h3>
            <Link to="/student/tests" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
            </div>
          ) : tests.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No upcoming tests</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tests.slice(0, 3).map(t => (
                <Link key={t.id} to={`/student/exam/${t.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit', transition: 'background 0.15s' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.duration} min · {t.questions?.length || 0} questions</div>
                  </div>
                  <span className="badge badge-amber">Take Test</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/student/classrooms" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <FolderOpen size={16} /> Join Classroom
            </Link>
            <Link to="/student/results" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Award size={16} /> View Results
            </Link>
            <Link to="/student/study-hub" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Brain size={16} /> AI Study Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
