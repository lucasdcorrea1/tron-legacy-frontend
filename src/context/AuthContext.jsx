import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

// Read directly from localStorage on init
const getInitialState = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { user: null, profile: null, hasToken: false };
  }

  let user = null;
  let profile = null;

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {
    // silently ignore corrupt localStorage
  }

  try {
    const profileStr = localStorage.getItem('profile');
    if (profileStr) profile = JSON.parse(profileStr);
  } catch (e) {
    // silently ignore corrupt localStorage
  }

  return { user, profile, hasToken: true };
};

const initialState = getInitialState();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialState.user);
  const [profile, setProfile] = useState(initialState.profile);
  // loading = true while we're validating the token on mount
  const [loading, setLoading] = useState(initialState.hasToken);

  const isAuthenticated = !!localStorage.getItem('token');

  // Revalidate profile from server on mount to keep role in sync
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    auth.me().then((data) => {
      const freshProfile = data.profile || data;
      const freshUser = data.user || data;
      localStorage.setItem('profile', JSON.stringify(freshProfile));
      localStorage.setItem('user', JSON.stringify(freshUser));
      setProfile(freshProfile);
      setUser(freshUser);
    }).catch(() => {
      // Token expired or invalid — force logout
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      localStorage.removeItem('lastOrgId');
      setUser(null);
      setProfile(null);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const saveAuthData = (data) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refreshToken', data.refresh_token);
    }
    // Handle both flat response and nested user/profile
    const userData = data.user || data;
    const profileData = data.profile || data;

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('profile', JSON.stringify(profileData));
    setUser(userData);
    setProfile(profileData);
  };

  // Update profile data (partial update)
  const updateProfile = useCallback((updates) => {
    setProfile(prev => {
      const newProfile = { ...prev, ...updates };
      localStorage.setItem('profile', JSON.stringify(newProfile));
      return newProfile;
    });
    setUser(prev => {
      if (!prev) return prev;
      const newUser = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const login = async (credentials) => {
    const data = await auth.login(credentials);
    saveAuthData(data);
    return data;
  };

  const register = async ({ name, email, password }) => {
    const data = await auth.register({ name, email, password });
    saveAuthData(data);
    return data;
  };

  const logout = async () => {
    try { await auth.logout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    localStorage.removeItem('lastOrgId');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      login,
      register,
      logout,
      updateProfile,
      saveAuthData,
      loading,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
