import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const signup = async (fullName, email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if user already exists
      if (users.find((u) => u.email === email)) {
        return false;
      }

      const newUser = {
        id: Date.now().toString(),
        fullName,
        email,
      };

      // Store user credentials
      const userWithPassword = { ...newUser, password };
      users.push(userWithPassword);
      localStorage.setItem('users', JSON.stringify(users));

      return true;
    } catch (error) {
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u) => u.email === email && u.password === password);
      
      if (user) {
        const userWithoutPassword = { id: user.id, fullName: user.fullName, email: user.email };
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 