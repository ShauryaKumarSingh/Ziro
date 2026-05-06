import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { login as apiLogin, signup as apiSignup } from '../apis/authapi'; // Adjust path as needed
import api from '../apis/axios'; // Import the axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [isOnboardingComplete, setOnboardingComplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token refresh function
  const refreshToken = async () => {
    try {
      // For now, we'll re-login with stored credentials
      // In a production app, you'd have a separate refresh token endpoint
      const email = await SecureStore.getItemAsync('userEmail');
      const password = await SecureStore.getItemAsync('userPassword');

      if (email && password) {
        const response = await apiLogin(email, password);
        setAuthToken(response.token);
        await SecureStore.setItemAsync('authToken', response.token);
        return response.token;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
    }
    return null;
  };

  // Add response interceptor to handle 401 errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const newToken = await refreshToken();
          if (newToken && error.config) {
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return api(error.config);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      const token = await SecureStore.getItemAsync('authToken');
      const onboardingStatus = await AsyncStorage.getItem('@onboarding_complete');

      if (token) {
        setAuthToken(token);
      }
      setOnboardingComplete(onboardingStatus === 'true');
      setIsLoading(false);
    }
    loadData();
  }, []);

  const login = async (email, password) => {
    console.log('🔥 LOGIN called with:', { email, password: '***' });
    try {
      const response = await apiLogin(email, password);
      console.log('✅ LOGIN API response:', response);
      setAuthToken(response.token);
      await SecureStore.setItemAsync('authToken', response.token);
      // Store credentials for token refresh (in production, use secure storage differently)
      await SecureStore.setItemAsync('userEmail', email);
      await SecureStore.setItemAsync('userPassword', password);
      console.log('✅ Token stored, authToken set to:', response.token ? '***' : null);
      return response;
    } catch (error) {
      console.log('❌ LOGIN API error:', error);
      // Re-throw the error to be caught by the caller
      throw error;
    }
  };

  const signup = async (username, email, password) => {
    console.log('🔥 SIGNUP called with:', { username, email, password: '***' });
    try {
      const result = await apiSignup(username, email, password);
      console.log('✅ SIGNUP API response:', result);
      return result;
    } catch (error) {
      console.log('❌ SIGNUP API error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userEmail');
    await SecureStore.deleteItemAsync('userPassword');
  };

  const completeOnboarding = async () => {
    console.log('✅ COMPLETING ONBOARDING');
    setOnboardingComplete(true);
    await AsyncStorage.setItem('@onboarding_complete', 'true');
  };

  return (
    // 4. Expose the new values to the rest of the app
    <AuthContext.Provider value={{ authToken, isLoading, login, signup, logout, isOnboardingComplete, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};