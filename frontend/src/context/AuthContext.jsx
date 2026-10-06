import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Ensure cookies are sent with requests and set dynamic base URL for production
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Add global interceptor to attach subdomain
axios.interceptors.request.use((config) => {
    const hostParts = window.location.hostname.split('.');
    if (hostParts.length > 2 || (hostParts.length === 2 && hostParts[1] === 'localhost')) {
        config.headers['X-Subdomain'] = hostParts[0];
    }
    return config;
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    // Subdomain is now automatically passed via X-Subdomain header, but authController might still expect it in body
    // So we'll pass it in body as well just in case
    const hostParts = window.location.hostname.split('.');
    let subdomain = null;
    if (hostParts.length > 2 || (hostParts.length === 2 && hostParts[1] === 'localhost')) {
        subdomain = hostParts[0];
    }
    
    const response = await axios.post('/api/auth/login', { email, password, subdomain });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  // We expose checkAuth so other components can trigger a manual state refresh if needed
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
