import { NotificationsProvider } from '../context/NotificationsContext.jsx';
import { UsersProvider } from '../context/UsersContext.jsx';
import { AbsenceRecordsProvider } from '../context/AbsenceRecordsContext.jsx';
import { DirectoryUsersProvider } from '../context/DirectoryUsersContext.jsx';
import { ActivityLogsProvider } from '../context/ActivityLogsContext.jsx';
import { AppPreferencesProvider } from '../context/AppPreferencesContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

export default function AppProviders({ children }) {
  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <NotificationsProvider>
          <AbsenceRecordsProvider>
            <ActivityLogsProvider>
              <UsersProvider>
                <DirectoryUsersProvider>
                  {children}
                </DirectoryUsersProvider>
              </UsersProvider>
            </ActivityLogsProvider>
          </AbsenceRecordsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </AppPreferencesProvider>
  );
}
