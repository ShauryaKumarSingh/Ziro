import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from './apiConfig';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Interceptor to add the token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;