// Teacher — Analytics Dashboard (Real data from Firestore)
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getClassroomsByTeacher, getTestsByTeacher, getSubmissionsByTest } from '../../services/firestore';
import {
  BarChart3, TrendingUp, Users, ClipboardList,
  Award, Target, BookOpen, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e', '#a78bfa', '#34d399'];

export default function TeacherAnalytics() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    totalStudents: 0,
    totalTests: 0,
    publishedTests: 0,
    totalSubmissions: 0,
    evaluatedSubmissions: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [testPerformance, setTestPerformance] = useState([]);
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [testStatusData, setTestStatusData] = useState([]);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  async function loadAnalytics() {
    try {
      const [classrooms, tests] = await Promise.all([
        getClassroomsByTeacher(user.uid),
        getTestsByTeacher(user.uid),
      ]);

      const totalStudents = classrooms.reduce((sum, c) => sum + (c.students?.length || 0), 0);
      const publishedTests = tests.filter(t => t.status === 'published');
      const draftTests = tests.filter(t => t.status === 'draft');

      // Get submissions for all tests
      let allSubmissions = [];
      for (const test of publishedTests) {
        try {
          const subs = await getSubmissionsByTest(test.id);
          allSubmissions.push(...subs.map(s => ({ ...s, testTitle: test.title, testId: test.id })));
        } catch (err) {
          // continue on error
        }
      }

      const evaluatedSubs = allSubmissions.filter(s => s.status === 'evaluated');
      const avgScore = evaluatedSubs.length > 0
        ? Math.round(evaluatedSubs.reduce((sum, s) => sum + (s.totalMarks || 0), 0) / evaluatedSubs.length)
        : 0;

      // Potential submissions = published tests * students in respective classrooms
      let potentialSubs = 0;
      publishedTests.forEach(t => {
        const classroom = classrooms.find(c => c.id === t.classroomId);
        potentialSubs += classroom?.students?.length || 0;
      });
      const completionRate = potentialSubs > 0
        ? Math.round((allSubmissions.length / potentialSubs) * 100)
        : 0;

      setStats({
        totalClassrooms: classrooms.length,
        totalStudents,
        totalTests: tests.length,
        publishedTests: publishedTests.length,
        totalSubmissions: allSubmissions.length,
        evaluatedSubmissions: evaluatedSubs.length,
        averageScore: avgScore,
        completionRate,
      });

      // Classroom students chart
      setClassroomStudents(
        classrooms.map(c => ({
          name: c.name?.length > 15 ? c.name.substring(0, 15) + '...' : (c.name || 'Unnamed'),
          students: c.students?.length || 0,
        })).sort((a, b) => b.students - a.students).slice(0, 8)
      );

      // Test performance — avg score per test
      const perfMap = {};
      evaluatedSubs.forEach(s => {
        if (!perfMap[s.testId]) perfMap[s.testId] = { scores: [], title: s.testTitle };
        perfMap[s.testId].scores.push(s.totalMarks || 0);
      });
      setTestPerformance(
        Object.entries(perfMap).map(([id, data]) => ({
          name: data.title?.length > 18 ? data.title.substring(0, 18) + '...' : (data.title || 'Test'),
          avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
          submissions: data.scores.length,
        })).slice(0, 8)
      );

      // Score distribution
      const scoreBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      evaluatedSubs.forEach(s => {
        const score = s.totalMarks || 0;
        if (score <= 20) scoreBuckets['0-20']++;
        else if (score <= 40) scoreBuckets['21-40']++;
        else if (score <= 60) scoreBuckets['41-60']++;
        else if (score <= 80) scoreBuckets['61-80']++;
        else scoreBuckets['81-100']++;
      });
      setScoreDistribution(
        Object.entries(scoreBuckets).map(([range, count]) => ({ range, students: count }))
      );

      // Test status
      setTestStatusData([
        { name: 'Published', value: publishedTests.length, color: '#10b981' },
        { name: 'Draft', value: draftTests.length, color: '#f59e0b' },
      ].filter(d => d.value > 0));

    } catch (err) {
      console.error('[TeacherAnalytics] Error:', err);
      showError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Classrooms', value: stats.totalClassrooms, icon: <BookOpen size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Total Students', value: stats.totalStudents, icon: <Users size={20} />, color: 'var(--accent-sky)', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Published Tests', value: stats.publishedTests, icon: <ClipboardList size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Submissions', value: stats.totalSubmissions, icon: <Target size={20} />, color: 'var(--accent-violet)', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Evaluated', value: stats.evaluatedSubmissions, icon: <Award size={20} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Avg Score', value: stats.averageScore, icon: <TrendingUp size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Completion %', value: `${stats.completionRate}%`, icon: <Activity size={20} />, color: 'var(--accent-sky)', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Total Tests', value: stats.totalTests, icon: <BarChart3 size={20} />, color: 'var(--accent-rose)', bg: 'rgba(244,63,94,0.1)' },
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
        <h1>Teaching Analytics</h1>
        <p>Insights into your classrooms, tests, and student performance</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', marginBottom: '1.5rem' }}>
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
            {/* Students per Classroom */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} style={{ color: 'var(--accent-indigo)' }} />
                Students per Classroom
              </h3>
              {classroomStudents.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={classroomStudents} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No classroom data yet
                </div>
              )}
            </div>

            {/* Test Status */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={16} style={{ color: 'var(--accent-violet)' }} />
                Test Status Distribution
              </h3>
              {testStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
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
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No test data yet
                </div>
              )}
            </div>
          </div>

          {/* Test Performance */}
          {testPerformance.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} style={{ color: 'var(--accent-emerald)' }} />
                Average Score per Test
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={testPerformance} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="avgScore" name="Avg Score" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="submissions" name="Submissions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score Distribution */}
          {scoreDistribution.some(d => d.students > 0) && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent-sky)' }} />
                Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={scoreDistribution} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="range" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="students" stroke="#0ea5e9" fill="rgba(14,165,233,0.15)" strokeWidth={2} />
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
