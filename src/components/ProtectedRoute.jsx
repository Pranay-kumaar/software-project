// Protected Route component — role-based access control
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPaths = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student'
    };
    return <Navigate to={dashboardPaths[userProfile.role] || '/'} replace />;
  }

  // Teacher not yet approved
  if (userProfile?.role === 'teacher' && userProfile?.status === 'pending') {
    return (
      <div className="pending-approval-screen">
        <div className="pending-card glass-card animate-scale-in" style={{
          maxWidth: '480px',
          margin: '15vh auto',
          textAlign: 'center',
          padding: '3rem 2rem'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            background: 'rgba(245,158,11,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
          }}>
            <svg width="32" height="32" fill="none" stroke="var(--accent-amber)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h2 style={{ marginBottom: '0.75rem' }}>Approval Pending</h2>
          <p style={{ marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Your teacher account is awaiting admin approval. You'll be notified once approved.
          </p>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return children;
}
