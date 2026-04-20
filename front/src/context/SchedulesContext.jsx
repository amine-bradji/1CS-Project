import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import {
  fetchScheduleSessions,
  createScheduleSession,
  updateScheduleSession,
  deleteScheduleSession,
  createEmptyScheduleMetadata,
} from '../services/schedulesEndpoint';
import { useUsers } from './UsersContext';

const SchedulesContext = createContext(null);

export function SchedulesProvider({ children }) {
  const { users, fetchAllUsers } = useUsers();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derive teachers list directly from UsersContext — no duplicate API call needed
  const teachers = useMemo(
    () => users.filter((u) => u.role === 'teacher').map((u) => ({ id: u.id, name: u.name })),
    [users]
  );

  // Fetch teachers on first mount if the users list is empty
  useEffect(() => {
    if (users.length === 0) {
      fetchAllUsers({ role: 'TEACHER' }).catch((err) => {
        console.error('SchedulesContext: failed to pre-fetch teachers', err);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const metadata = useMemo(() => ({
    ...createEmptyScheduleMetadata(),
    teachers,
  }), [teachers]);

  const loadSessions = useCallback(async (filters) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchScheduleSessions(filters);
      setSessions(data);
      return data;
    } catch (err) {
      console.error('Failed to load sessions', err);
      setError('Failed to load sessions');
      setSessions([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (payload) => {
    return createScheduleSession(payload);
  }, []);

  const updateSession = useCallback(async (id, payload, initial) => {
    return updateScheduleSession(id, payload, initial);
  }, []);

  const deleteSession = useCallback(async (id) => {
    await deleteScheduleSession(id);
  }, []);

  const value = {
    metadata,
    sessions,
    loading,
    error,
    // keep loadMetadata as a stable shim so SchedulesPage doesn't break
    loadMetadata: useCallback(async () => metadata, [metadata]),
    loadSessions,
    createSession,
    updateSession,
    deleteSession,
  };

  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
}

export function useSchedules() {
  const context = useContext(SchedulesContext);
  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
}
