import { lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/routing/ProtectedRoute.jsx';
import PublicRoute from '../components/routing/PublicRoute.jsx';
import RoleHomeRedirect from '../components/routing/RoleHomeRedirect.jsx';
import { useAppPreferences } from '../context/AppPreferencesContext.jsx';

const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const Wowzers = lazy(() => import('../pages/Wowzers'));
const WrongInfoPage = lazy(() => import('../pages/WrongInfoPage'));
const DashboardShell = lazy(() => import('../pages/DashboardShell'));
const TeacherShell = lazy(() => import('../pages/TeacherShell'));
const TeacherDashboardPage = lazy(() => import('../pages/TeacherDashboardPage'));
import { TeacherPortalProvider } from '../context/TeacherPortalContext';
const TeacherGroupsPage = lazy(() => import('../pages/TeacherGroupsPage'));
const LiveAttendancePage1 = lazy(() => import('../pages/LiveAttendancePage1').then(m => ({ default: m.LiveAttendancePage1 })));
const TeacherFeaturePlaceholderPage = lazy(() => import('../pages/TeacherFeaturePlaceholderPage'));
const TeacherSettingsPage = lazy(() => import('../pages/TeacherSettingsPage'));
const ResetPassword = lazy(() => import('../pages/ResetPassword').then((module) => ({ default: module.ResetPassword })));

export default function AppRoutes() {
  const { t } = useAppPreferences();

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        )}
      />

      <Route path="/contact" element={<ContactPage />} />

      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardShell />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/teacher"
        element={(
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherShell />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        {/* Wrap dashboard + attendance in ONE shared TeacherPortalProvider so they share context state */}
        <Route element={<TeacherPortalProvider><Outlet /></TeacherPortalProvider>}>
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="attendance" element={<LiveAttendancePage1 />} />
        </Route>
        <Route path="groups" element={<TeacherGroupsPage />} />
        <Route
          path="sessions"
          element={(
            <TeacherFeaturePlaceholderPage
              eyebrow={t('teacherPlaceholders.flow')}
              title={t('teacherPlaceholders.sessions')}
              endpoint="/teacher/sessions/"
            />
          )}
        />
        <Route path="settings" element={<TeacherSettingsPage />} />
      </Route>

      <Route
        path="/home"
        element={(
          <ProtectedRoute>
            <RoleHomeRedirect />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/ResetPassword"
        element={(
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        )}
      />

      <Route path="/wow" element={<Wowzers />} />
      <Route path="/dumbahh" element={<WrongInfoPage />} />
      <Route
        path="*"
        element={(
          <ProtectedRoute>
            <RoleHomeRedirect />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}
