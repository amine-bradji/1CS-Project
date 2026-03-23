import { createContext, useContext, useState } from 'react';

const UsersContext = createContext(null);

// Helper to get initials from any user name
function buildInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

// Helper to build professional ESI-SBA emails
function buildUserEmail(name) {
  return `${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')}@esi-sba.dz`;
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);

  // Generic function to add any type of user
  function addUser(userData) {
    const safeName = userData.name?.trim() || 'New User';
    const initials = buildInitials(safeName);
    const now = Date.now();
    
    const department = userData.department || userData.specialization || 'General';
    const specialization = userData.specialization || department;

    setUsers((prev) => [
      ...prev,
      {
        ...userData,
        id: `user-${now}`,
        idNumber: userData.idNumber || `ID-${now}`,
        initials,
        name: safeName,
        email: userData.email || buildUserEmail(safeName),
        specialization,
        department,
        validation: userData.validation || 'PENDING REVIEW',
        status: userData.status || 'pending',
        role: userData.role || 'user', // Default to generic user
        accountStatus: userData.accountStatus || 'active',
        avatarTone: userData.avatarTone || 'blue',
        timestamp: userData.timestamp || new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      },
    ]);
  }

  function deleteUser(id) {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  }

  function updateUser(id, updates) {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== id) return user;

        const safeName = updates.name?.trim() || user.name;
        const department = updates.department || updates.specialization || user.department;
        const specialization = updates.specialization || updates.department || user.specialization;

        return {
          ...user,
          ...updates,
          name: safeName,
          initials: buildInitials(safeName),
          email: updates.email || user.email || buildUserEmail(safeName),
          department,
          specialization,
        };
      })
    );
  }

  return (
    <UsersContext.Provider value={{ users, addUser, deleteUser, updateUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}