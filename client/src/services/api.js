import axios from 'axios';
import { setUserCookie } from '../utils/cookies';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const login = async (identifier, password) => {
  try {
    const response = await api.post('/auth/login', { identifier, password });
    if (response.data.success) {
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
