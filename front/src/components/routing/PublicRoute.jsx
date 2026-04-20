import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHomePath, shouldForcePasswordReset } from '../../utils/authRedirects.js';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    if (shouldForcePasswordReset(user)) {
      return <Navigate to="/ResetPassword" replace />;
    }

    return <Navigate to={getRoleHomePath(user)} replace />;
  }

  return children;
}
