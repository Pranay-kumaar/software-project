// Dashboard Redirect — sends user to their role-based dashboard
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function DashboardRedirect() {
  const { userProfile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const paths = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
  };

  const target = paths[userProfile?.role] || '/student';
  return <Navigate to={target} replace />;
}
