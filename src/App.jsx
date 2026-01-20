// App.jsx — Main Application Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardRedirect from './pages/DashboardRedirect';
import AdminSetup from './pages/AdminSetup';

// Admin
import AdminOverview from './pages/admin/AdminOverview';
import TeacherApprovals from './pages/admin/TeacherApprovals';
import ApiKeyManagement from './pages/admin/ApiKeyManagement';
import UsersManagement from './pages/admin/UsersManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Teacher
import TeacherOverview from './pages/teacher/TeacherOverview';
import ClassroomManagement from './pages/teacher/ClassroomManagement';
import CreateTest from './pages/teacher/CreateTest';
import TestsList from './pages/teacher/TestsList';
import Evaluations from './pages/teacher/Evaluations';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';

// Student
import StudentOverview from './pages/student/StudentOverview';
import StudentClassrooms from './pages/student/StudentClassrooms';
import StudentTests from './pages/student/StudentTests';
import ExamPlayer from './pages/student/ExamPlayer';
import Results from './pages/student/Results';
import StudyHub from './pages/student/StudyHub';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/setup-admin" element={<AdminSetup />} />

              {/* Dashboard Redirect */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } />

              {/* Admin Dashboard */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminOverview />} />
                <Route path="teachers" element={<TeacherApprovals />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="api-keys" element={<ApiKeyManagement />} />
                <Route path="classrooms" element={<div className="animate-fade-in"><div className="page-header"><h1>Classrooms</h1><p>Monitor all platform classrooms</p></div><div className="glass-card" style={{textAlign:'center',padding:'3rem'}}><p style={{color:'var(--text-muted)'}}>Classroom monitoring — connect Firebase to view data.</p></div></div>} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>

              {/* Teacher Dashboard */}
              <Route path="/teacher" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<TeacherOverview />} />
                <Route path="classrooms" element={<ClassroomManagement />} />
                <Route path="tests" element={<TestsList />} />
                <Route path="create-test" element={<CreateTest />} />
                <Route path="evaluations" element={<Evaluations />} />
                <Route path="analytics" element={<TeacherAnalytics />} />
              </Route>

              {/* Student Dashboard */}
              <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<StudentOverview />} />
                <Route path="classrooms" element={<StudentClassrooms />} />
                <Route path="tests" element={<StudentTests />} />
                <Route path="exam/:testId" element={<ExamPlayer />} />
                <Route path="results" element={<Results />} />
                <Route path="study-hub" element={<StudyHub />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
