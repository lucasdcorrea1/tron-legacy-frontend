import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminLayoutSkeleton } from './LoadingSkeleton';

export default function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AdminLayoutSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
