import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import Wowzers from './pages/Wowzers';
import WrongInfoPage from './pages/WrongInfoPage';
import DashboardShell from './pages/DashboardShell';
import { useAuth } from './context/AuthContext';
import './App.css';
import { ResetPassword } from './pages/ResetPassword';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Login is Public: If already logged in, redirect to dashboard */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />

      {/* Dashboard is Protected: If not logged in, redirect to login */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardShell />
          </ProtectedRoute>
        } 
      />

      <Route path="/ResetPassword" element={<ResetPassword />} />
      <Route path="/wow" element={<Wowzers />} />
      <Route path="/dumbahh" element={<WrongInfoPage />} />

      {/* Catch-all: Redirect unknown URLs to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}