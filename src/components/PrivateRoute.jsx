import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { AdminLayoutSkeleton } from './LoadingSkeleton';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { orgs, loading: orgLoading, currentOrg } = useOrg();

  if (authLoading || orgLoading) {
    return <AdminLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user has no orgs, redirect to onboarding to create one
  if (orgs.length === 0 && !currentOrg) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
