import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHomePath, shouldForcePasswordReset } from '../../utils/authRedirects.js';

export default function RoleHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (shouldForcePasswordReset(user)) {
    return <Navigate to="/ResetPassword" replace />;
  }

  return <Navigate to={getRoleHomePath(user)} replace />;
}
