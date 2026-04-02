'use client'

import React, { createContext, useState, useEffect } from 'react';
import { identify, reset, setPersonProperties } from '@/app/lib/analytics/posthog';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const TOKEN_NAME = process.env.NEXT_PUBLIC_AUTH_TOKEN_NAME || '_osmo_token';
  const USER_ID_NAME = process.env.NEXT_PUBLIC_USER_ID || '_osmo_user_id';

  const [authState, setAuthState] = useState({
    accessToken: null,
    user: null,
    loading: true
  });

  const setCookie = (name, value, days) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
  };

  const refreshUserData = async () => {
    if (!authState.accessToken || !authState.user?._id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${authState.user._id}`, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      // console.log(userData)
      setAuthState(prev => ({
        ...prev,
        user: userData
      }));

      return userData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/candidate/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const login = (data) => {
    setCookie(TOKEN_NAME, data.accessToken, 7);
    setCookie(USER_ID_NAME, data.user._id, 7);

    setAuthState({
      accessToken: data.accessToken,
      user: data.user,
      loading: false
    });
  };

  const logout = () => {
    setAuthState({
      accessToken: null,
      user: null,
      loading: false
    });
    setCookie(TOKEN_NAME, '', -1);
    setCookie(USER_ID_NAME, '', -1);
  };

  const updateUser = (updatedUser) => {
    setAuthState(prevState => ({
      ...prevState,
      user: updatedUser,
    }));
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getCookie(TOKEN_NAME);
      const userId = getCookie(USER_ID_NAME);

      if (token && userId) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const userData = await response.json();
          setAuthState({
            accessToken: token,
            user: userData,
            loading: false
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          logout();
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  // PostHog identity lifecycle (no PII)
  useEffect(() => {
    if (authState.loading) return;

    if (authState.user?._id) {
      const captureEmail = process.env.NEXT_PUBLIC_POSTHOG_CAPTURE_EMAIL === 'true';
      const captureName = process.env.NEXT_PUBLIC_POSTHOG_CAPTURE_NAME === 'true';
      const email = typeof authState.user.email === 'string' ? authState.user.email.trim().toLowerCase() : '';
      const emailDomain = email.includes('@') ? email.split('@').pop() : '';
      const fullName = typeof authState.user.name === 'string' ? authState.user.name.trim() : '';

      identify(authState.user._id);
      setPersonProperties({
        ...(captureName && fullName ? { full_name: fullName } : {}),
        ...(captureEmail && email ? { email } : {}),
        ...(emailDomain ? { email_domain: emailDomain } : {}),
        has_resume: Boolean(authState.user.resumeFileId),
        has_portfolio: Boolean(authState.user.portfolioFileId),
        area_of_expertise_count: Array.isArray(authState.user.areaOfExpertise) ? authState.user.areaOfExpertise.length : 0,
        location_preference_count: Array.isArray(authState.user.locationPreference) ? authState.user.locationPreference.length : 0,
        min_experience_level: typeof authState.user.minExperienceLevel === 'number' ? authState.user.minExperienceLevel : null,
        max_experience_level: typeof authState.user.maxExperienceLevel === 'number' ? authState.user.maxExperienceLevel : null,
      });
    } else {
      reset();
    }
  }, [authState.loading, authState.user?._id]);

  return (
    <AuthContext.Provider value={{
      authState,
      handleLogin,
      logout,
      updateUser,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};
