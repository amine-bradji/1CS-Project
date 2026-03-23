import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { UsersProvider } from './context/UsersContext.jsx';
import { AbsenceRecordsProvider } from './context/AbsenceRecordsContext.jsx';
import { DirectoryUsersProvider } from './context/DirectoryUsersContext.jsx';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
        <NotificationsProvider>
          <AbsenceRecordsProvider>
            <UsersProvider>
              <DirectoryUsersProvider>
                <App />
              </DirectoryUsersProvider>
            </UsersProvider>
          </AbsenceRecordsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
