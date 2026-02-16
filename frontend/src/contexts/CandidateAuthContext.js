import React, { createContext, useContext, useState, useEffect } from 'react';

const CandidateAuthContext = createContext(null);

export const useCandidateAuth = () => {
  const context = useContext(CandidateAuthContext);
  if (!context) {
    throw new Error('useCandidateAuth must be used within a CandidateAuthProvider');
  }
  return context;
};

export const CandidateAuthProvider = ({ children }) => {
  const [candidate, setCandidate] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('candidateToken'));
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCandidateProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCandidateProfile = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/candidate-portal/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCandidate(data);
        setMustChangePassword(data.must_change_password || false);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('candidateToken');
        setToken(null);
        setCandidate(null);
      }
    } catch (error) {
      console.error('Failed to fetch candidate profile:', error);
      localStorage.removeItem('candidateToken');
      setToken(null);
      setCandidate(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/candidate-portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('candidateToken', data.access_token);
    setToken(data.access_token);
    setCandidate(data.candidate);
    setMustChangePassword(data.must_change_password || false);
    return data;
  };

  const register = async (candidateData) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/candidate-portal/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return await response.json();
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/candidate-portal/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }

    setMustChangePassword(false);
    return await response.json();
  };

  const logout = () => {
    localStorage.removeItem('candidateToken');
    setToken(null);
    setCandidate(null);
    setMustChangePassword(false);
  };

  return (
    <CandidateAuthContext.Provider value={{
      candidate,
      token,
      loading,
      mustChangePassword,
      login,
      register,
      changePassword,
      logout,
      isAuthenticated: !!candidate
    }}>
      {children}
    </CandidateAuthContext.Provider>
  );
};
