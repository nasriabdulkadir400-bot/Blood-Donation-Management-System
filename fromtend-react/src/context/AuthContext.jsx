import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Demo admin credentials (in real project, this would be backend auth)
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bdms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (username, password) => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const userData = { username, role: 'Admin', loginTime: new Date().toISOString() };
      setUser(userData);
      localStorage.setItem('bdms_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: 'Username ama password khalad ah' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bdms_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
