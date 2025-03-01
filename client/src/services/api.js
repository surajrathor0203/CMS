import axios from 'axios';
import { setUserCookie, getUserFromCookie } from '../utils/cookies';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const login = async (identifier, password) => {
  try {
    const response = await api.post('/auth/login', { identifier, password });
    if (response.data.success && response.data.user) {
      // Store the complete user data
      setUserCookie(response.data);
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const signup = async (userData) => {
  try {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const sendResetOTP = async (email) => {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to send OTP');
  }
};

export const verifyResetOTP = async (email, otp) => {
  try {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw new Error(error.message || 'Invalid OTP');
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to reset password');
  }
};

export const createBatch = async (batchData) => {
  try {
    const response = await api.post('/batch/create', batchData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to create batch';
    throw new Error(errorMessage);
  }
};

export const getBatches = (teacherId) => {
  return api.get(`/batch?teacherId=${teacherId}`);
};

export const getBatchById = async (batchId) => {
  try {
    const userData = getUserFromCookie();
    const response = await api.get(`/batch/${batchId}?teacherId=${userData.user.id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBatch = async (batchId, batchData) => {
  try {
    const response = await api.put(`/batch/${batchId}`, batchData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteBatch = async (batchId) => {
  try {
    const response = await api.delete(`/batch/${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const addStudent = async (batchId, studentData) => {
  const response = await axios.post(`/api/batches/${batchId}/students`, studentData);
  return response.data;
};

export const uploadFiles = async (batchId, files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  const response = await axios.post(`/api/batches/${batchId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const createMultipleStudents = async (students) => {
  try {
    const response = await api.post('/students/create-multiple', 
      { students },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create students');
    }
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || error;
  }
};

export const checkStudentEmail = async (email, teacherId) => {
  try {
    const response = await api.get(`/students/check-email/${email}`, {
      params: { teacherId }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getStudentsByBatch = async (batchId) => {
  try {
    const response = await api.get(`/students/batch/${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
