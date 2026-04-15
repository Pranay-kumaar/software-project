// Admin — Analytics Dashboard (Real data from Firestore)
import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { getUsersByRole, getPendingTeachers } from '../../services/firestore';
import {
  collection, getDocs, query, where, orderBy
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Users, GraduationCap, BookOpen, ClipboardList,
  BarChart3, TrendingUp, FileText, UserCheck, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e'];

export default function AdminAnalytics() {
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    activeTeachers: 0,
    pendingTeachers: 0,
    totalTests: 0,
    publishedTests: 0,
    draftTests: 0,
    totalSubmissions: 0,
    evaluatedSubmissions: 0,
    totalClassrooms: 0,
  });
  const [roleData, setRoleData] = useState([]);
  const [testStatusData, setTestStatusData] = useState([]);
  const [classroomData, setClassroomData] = useState([]);
  const [submissionTrend, setSubmissionTrend] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      // Fetch all data in parallel
      const [usersSnap, testsSnap, submissionsSnap, classroomsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'tests')),
        getDocs(collection(db, 'submissions')),
        getDocs(collection(db, 'classrooms')),
      ]);

      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const tests = testsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const submissions = submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const classrooms = classroomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const admins = users.filter(u => u.role === 'admin');
      const activeTeachers = teachers.filter(t => t.status === 'active');
      const pendingTeachers = teachers.filter(t => t.status === 'pending');
      const publishedTests = tests.filter(t => t.status === 'published');
      const draftTests = tests.filter(t => t.status === 'draft');
      const evaluatedSubs = submissions.filter(s => s.status === 'evaluated');

      setStats({
        totalUsers: users.length,
        students: students.length,
        teachers: teachers.length,
        activeTeachers: activeTeachers.length,
        pendingTeachers: pendingTeachers.length,
        totalTests: tests.length,
        publishedTests: publishedTests.length,
        draftTests: draftTests.length,
        totalSubmissions: submissions.length,
        evaluatedSubmissions: evaluatedSubs.length,
        totalClassrooms: classrooms.length,
      });

      // Role distribution
      setRoleData([
        { name: 'Students', value: students.length, color: '#0ea5e9' },
        { name: 'Teachers', value: teachers.length, color: '#10b981' },
        { name: 'Admins', value: admins.length, color: '#f43f5e' },
      ].filter(d => d.value > 0));

      // Test status distribution
      setTestStatusData([
        { name: 'Published', value: publishedTests.length, color: '#10b981' },
        { name: 'Draft', value: draftTests.length, color: '#f59e0b' },
      ].filter(d => d.value > 0));

      // Classrooms — students per classroom
      const topClassrooms = classrooms
        .map(c => ({
          name: c.name || 'Unnamed',
          students: c.students?.length || 0,
        }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 8);
      setClassroomData(topClassrooms);

      // Submission trends — group by date
      const subsByDate = {};
      submissions.forEach(s => {
        const date = s.submittedAt?.toDate?.()
          ? s.submittedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Unknown';
        if (date !== 'Unknown') {
          subsByDate[date] = (subsByDate[date] || 0) + 1;
        }
      });
      const trendData = Object.entries(subsByDate)
        .map(([date, count]) => ({ date, submissions: count }))
        .slice(-14); // last 14 data points
      setSubmissionTrend(trendData);

    } catch (err) {
      console.error('[AdminAnalytics] Error:', err);
      showError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Students', value: stats.students, icon: <GraduationCap size={20} />, color: 'var(--accent-sky)', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Active Teachers', value: stats.activeTeachers, icon: <BookOpen size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Pending Approvals', value: stats.pendingTeachers, icon: <UserCheck size={20} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Total Tests', value: stats.totalTests, icon: <ClipboardList size={20} />, color: 'var(--accent-violet)', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Submissions', value: stats.totalSubmissions, icon: <FileText size={20} />, color: 'var(--accent-rose)', bg: 'rgba(244,63,94,0.1)' },
    { label: 'Classrooms', value: stats.totalClassrooms, icon: <BarChart3 size={20} />, color: 'var(--accent-sky)', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Evaluated', value: stats.evaluatedSubmissions, icon: <Activity size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)' },
  ];

  const chartTooltipStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.8125rem',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <p>Real-time insights across the entire ExamineAI platform</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{loading ? '—' : stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 300 }} />)}
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* User Role Distribution */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} style={{ color: 'var(--accent-indigo)' }} />
                User Distribution
              </h3>
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend
                      wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No user data yet
                </div>
              )}
            </div>

            {/* Test Status */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={16} style={{ color: 'var(--accent-violet)' }} />
                Test Status
              </h3>
              {testStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={testStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {testStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '0.8125rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No test data yet
                </div>
              )}
            </div>
          </div>

          {/* Students per Classroom */}
          {classroomData.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={16} style={{ color: 'var(--accent-emerald)' }} />
                Students per Classroom
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classroomData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border-primary)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border-primary)' }}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Submission Trend */}
          {submissionTrend.length > 0 && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent-sky)' }} />
                Submission Activity
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={submissionTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border-primary)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border-primary)' }}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke="#0ea5e9"
                    fill="rgba(14,165,233,0.1)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      <style>{`
        .stats-grid { display: grid; gap: 1rem; }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
