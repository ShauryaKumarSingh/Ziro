import api from './axios'; // Import the centralized axios instance



// Signup
export const signup = async (username, email, password) => {
  try {
    const response = await api.post(`/api/auth/signup`, { username, email, password });
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }
};

// Login
export const login = async (email, password) => {
  try {
    const response = await api.post(`/api/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }
};

// Get Protected Data Example (Clean and simple)
export const getProfile = async () => {
  try {
    // Auth token is added automatically!
    const response = await api.get(`/api/auth/profile`);
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }

};
export const submitKyc = async (kycData) => {
  try {
    const response = await api.post('/api/kyc', kycData);
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }
};
export const getTouristIdCard = async (touristId) => {
  try {
    const response = await api.get(`/api/tourist/${touristId}`);
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }
};
export const triggerSos = async (location) => {
  try {
    const response = await api.post('/api/sos/trigger', location);
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }
};


export const updateLocation = async (location) => {
  try {
    const response = await api.post('/api/location/update', location);
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }
};

export const stopSos = async (sosId) => {
  try {
    const response = await api.patch(`/api/sos/stop/${sosId}`);
    return response.data;
  } catch (error) {
    throw (error.response?.data) || error;
  }
};
