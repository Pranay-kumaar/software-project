// Dashboard Layout — Shared sidebar + header for all dashboards
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import {
  Zap, Sun, Moon, LogOut, Menu, X, ChevronDown,
  LayoutDashboard, Users, BookOpen, ClipboardList,
  Settings, BarChart3, GraduationCap, FolderOpen,
  PenTool, Award, Brain, Key, UserCheck, MonitorPlay
} from 'lucide-react';
import './DashboardLayout.css';

const navItems = {
  admin: [
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Overview', end: true },
    { to: '/admin/teachers', icon: <UserCheck size={18} />, label: 'Teacher Approvals' },
    { to: '/admin/users', icon: <Users size={18} />, label: 'Users' },
    { to: '/admin/classrooms', icon: <FolderOpen size={18} />, label: 'Classrooms' },
    { to: '/admin/api-keys', icon: <Key size={18} />, label: 'API Keys' },
    { to: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  ],
  teacher: [
    { to: '/teacher', icon: <LayoutDashboard size={18} />, label: 'Overview', end: true },
    { to: '/teacher/classrooms', icon: <FolderOpen size={18} />, label: 'Classrooms' },
    { to: '/teacher/tests', icon: <ClipboardList size={18} />, label: 'Tests' },
    { to: '/teacher/create-test', icon: <PenTool size={18} />, label: 'Create Test' },
    { to: '/teacher/evaluations', icon: <Award size={18} />, label: 'Evaluations' },
    { to: '/teacher/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  ],
  student: [
    { to: '/student', icon: <LayoutDashboard size={18} />, label: 'Overview', end: true },
    { to: '/student/classrooms', icon: <FolderOpen size={18} />, label: 'My Classrooms' },
    { to: '/student/tests', icon: <ClipboardList size={18} />, label: 'Tests' },
    { to: '/student/results', icon: <Award size={18} />, label: 'Results' },
    { to: '/student/study-hub', icon: <Brain size={18} />, label: 'AI Study Hub' },
  ],
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const navigate = useNavigate();

  const role = userProfile?.role || 'student';
  const items = navItems[role] || navItems.student;

  async function handleLogout() {
    await logout();
    success('Logged out successfully.');
    navigate('/', { replace: true });
  }

  const roleLabels = {
    admin: { label: 'Administrator', color: 'var(--accent-rose)' },
    teacher: { label: 'Teacher', color: 'var(--accent-emerald)' },
    student: { label: 'Student', color: 'var(--accent-sky)' },
  };

  const roleInfo = roleLabels[role] || roleLabels.student;

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="landing-logo" style={{ gap: '0.5rem' }}>
            <div className="logo-mark" style={{ width: 30, height: 30 }}><Zap size={16} /></div>
            <span className="logo-text" style={{ fontSize: '1.05rem' }}>Examine<span className="logo-accent">AI</span></span>
          </div>
          <button className="btn btn-icon btn-ghost sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-role-badge" style={{ '--role-color': roleInfo.color }}>
          <span className="role-dot" />
          {roleInfo.label}
        </div>

        <nav className="sidebar-nav">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme} style={{ width: '100%', justifyContent: 'flex-start' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <button className="btn btn-icon btn-ghost mobile-menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }} />

          <div className="header-profile" onClick={() => setProfileDropdown(!profileDropdown)}>
            <div className="profile-avatar">
              {(userProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">{userProfile?.displayName || 'User'}</span>
              <span className="profile-email">{user?.email || ''}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: profileDropdown ? 'rotate(180deg)' : 'none' }} />

            {profileDropdown && (
              <div className="profile-dropdown glass-card animate-fade-in-down">
                <button className="dropdown-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
