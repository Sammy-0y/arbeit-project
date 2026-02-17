import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);
  
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      const { access_token, user: userData, must_change_password } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      setMustChangePassword(must_change_password || false);
      
      return { success: true, mustChangePassword: must_change_password || false };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMustChangePassword(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to change password'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    mustChangePassword,
    setMustChangePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isRecruiter: user?.role === 'recruiter',
    isClientUser: user?.role === 'client_user'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};