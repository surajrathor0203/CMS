import axios from 'axios';
import { setUserCookie, getUserFromCookie } from '../utils/cookies';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const login = async (identifier, password, userType) => {
  try {
    const response = await api.post('/auth/login', { 
      identifier, 
      password,
      userType
    });
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

export const sendResetOTP = async (email, userType) => {
  try {
    const response = await api.post('/auth/forgot-password', {
      email,
      userType
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send OTP');
  }
};

export const verifyResetOTP = async (email, otp, userType) => {
  try {
    const response = await api.post('/auth/verify-otp', {
      email,
      otp,
      userType
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Invalid OTP');
  }
};

export const resetPassword = async (email, otp, newPassword, userType) => {
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
      userType
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to reset password');
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
    throw error.response?.data || error;
  }
};

export const deleteBatch = async (batchId) => {
  try {
    const userData = getUserFromCookie();
    const response = await api.delete(`/batch/${batchId}?teacherId=${userData.user.id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const addStudent = async (batchId, studentData) => {
  const response = await axios.post(`/api/batches/${batchId}/students`, studentData);
  return response.data;
};

// export const uploadFiles = async (batchId, files) => {
//   const formData = new FormData();
//   files.forEach(file => {
//     formData.append('files', file);
//   });
//   const response = await axios.post(`/api/batches/${batchId}/files`, formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   });
//   return response.data;
// };

export const createMultipleStudents = async (students, batchDetails) => {
  try {
    const response = await api.post('/students/create-multiple', {
      students,
      batchDetails
    });
    
    if (response.data.errors?.length > 0) {
      return {
        success: true,
        partialSuccess: true,
        data: response.data.data,
        errors: response.data.errors,
        message: response.data.message
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || error;
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

export const checkStudentEmail = async (email, teacherId) => {
  try {
    const response = await api.post(`/students/check-email`, {
      email,
      teacherId
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Email verification failed');
  }
};

export const updateStudentTeacherInfo = async (email, teacherInfo) => {
  try {
    const response = await api.put(`/students/update-teacher-info/${email}`, { teacherInfo });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update student');
  }
};

export const deleteStudentFromBatch = async (studentId, batchId) => {
  const response = await api.delete(`/students/${studentId}/batch/${batchId}`);
  return response.data;
};

export const getStudentBatches = async (studentId) => {
  try {
    const response = await api.get(`/students/${studentId}/batches`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStudentProfile = async (studentId) => {
  try {
    const response = await api.get(`/students/profile/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateStudentProfile = async (studentId, profileData) => {
  try {
    const response = await api.put(`/students/profile/${studentId}`, profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateStudentPassword = async (studentId, passwordData) => {
  try {
    const response = await api.put(`/students/profile/${studentId}/password`, passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherProfile = async (teacherId) => {
  try {
    const response = await api.get(`/auth/teacher/profile/${teacherId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTeacherProfile = async (teacherId, profileData) => {
  try {
    const response = await api.put(`/auth/teacher/profile/${teacherId}`, profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTeacherPassword = async (teacherId, passwordData) => {
  try {
    const response = await api.put(`/auth/teacher/profile/${teacherId}/password`, passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const uploadNote = async (file, batchId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchId', batchId);

    const response = await api.post('/notes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotesByBatch = async (batchId) => {
  try {
    const response = await api.get(`/notes/batch/${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteNote = async (noteId, batchId) => {
  try {
    const response = await api.delete(`/notes/${noteId}?batchId=${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateNote = async (noteId, file, batchId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.put(`/notes/${noteId}?batchId=${batchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createAssignment = async (assignmentData, batchId) => {
  try {
    const formData = new FormData();
    formData.append('title', assignmentData.title);
    formData.append('question', assignmentData.question);
    formData.append('endTime', assignmentData.endTime);
    if (assignmentData.file) {
      formData.append('file', assignmentData.file);
    }
    formData.append('batchId', batchId);

    const response = await api.post('/assignments/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAssignmentsByBatch = async (batchId) => {
  try {
    const response = await api.get(`/assignments/batch/${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteAssignment = async (assignmentId, batchId) => {
  try {
    const response = await api.delete(`/assignments/${assignmentId}?batchId=${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const editAssignment = async (assignmentId, assignmentData, batchId) => {
  try {
    const formData = new FormData();
    formData.append('title', assignmentData.title);
    formData.append('question', assignmentData.question);
    formData.append('endTime', assignmentData.endTime);
    formData.append('batchId', batchId); // Ensure batchId is included
    if (assignmentData.file) {
      formData.append('file', assignmentData.file);
    }

    const response = await api.put(`/assignments/${assignmentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createQuiz = async (quizData, batchId) => {
  try {
    const response = await api.post('/quizzes/create', {
      ...quizData,
      batchId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getQuizzesByBatch = async (batchId) => {
  try {
    const response = await api.get(`/quizzes/batch/${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    const response = await api.delete(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateQuiz = async (quizId, quizData) => {
  try {
    const response = await api.put(`/quizzes/${quizId}`, quizData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
