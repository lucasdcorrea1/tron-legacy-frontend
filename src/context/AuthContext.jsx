import { createContext, useContext, useState } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

// Read directly from localStorage on init
const getInitialState = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { user: null, profile: null };
  }

  let user = null;
  let profile = null;

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user:', e);
  }

  try {
    const profileStr = localStorage.getItem('profile');
    if (profileStr) profile = JSON.parse(profileStr);
  } catch (e) {
    console.error('Error parsing profile:', e);
  }

  return { user, profile };
};

const initialState = getInitialState();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialState.user);
  const [profile, setProfile] = useState(initialState.profile);

  const isAuthenticated = !!localStorage.getItem('token');

  const saveAuthData = (data) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    // Handle both flat response and nested user/profile
    const userData = data.user || data;
    const profileData = data.profile || data;

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('profile', JSON.stringify(profileData));
    setUser(userData);
    setProfile(profileData);
  };

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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
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
      loading: false,
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
