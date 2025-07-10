import axios from 'axios';
import { setUserCookie, getUserFromCookie } from '../utils/cookies';

const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL  // Production URL
  : 'http://localhost:8080/api';    // Development URL

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const login = async (identifier, password, userType) => {
  try {
    const response = await api.post('/auth/login', { 
      identifier, 
      password,
      userType
    });
    if (response.data.success && response.data.user) {
      setUserCookie(response.data);
      
      // Store current URL before login
      const currentPath = window.location.pathname;
      
      // Replace only the login page entry in history
      if (currentPath.includes('login')) {
        window.history.replaceState(null, '', window.location.pathname);
        
        // Add listener only for login page
        const handlePopState = (e) => {
          if (window.location.pathname.includes('login')) {
            window.history.forward();
          }
        };
        
        window.addEventListener('popstate', handlePopState);
      }
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

export const verifyEmail = async (email) => {
  try {
    const response = await api.post('/auth/verify-email', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifySignupOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-signup-otp', { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createBatch = async (formData) => {
  try {
    const response = await api.post('/batch/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error in createBatch:', error);
    throw error.response ? error.response : error;
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
    const formData = new FormData();
    
    // Basic details
    formData.append('name', batchData.name.trim());
    formData.append('subject', batchData.subject);
    formData.append('startTime', batchData.startTime.toISOString());
    formData.append('endTime', batchData.endTime.toISOString());
    formData.append('openingDate', batchData.openingDate.toISOString());
    formData.append('fees', batchData.fees);
    formData.append('numberOfInstallments', batchData.numberOfInstallments);
    
    // Convert dates to ISO strings before stringifying
    const installmentDates = batchData.installmentDates.map(date => 
      date.toISOString()
    );
    formData.append('installmentDates', JSON.stringify(installmentDates));
    
    // Payment details
    formData.append('upiHolderName', batchData.upiHolderName);
    formData.append('upiId', batchData.upiId);
    formData.append('upiNumber', batchData.upiNumber);
    
    // QR Code file if provided
    if (batchData.qrCode instanceof File) {
      formData.append('qrCode', batchData.qrCode);
    }

    const response = await api.put(`/batch/${batchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating batch:', error);
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
    const batch = await getBatchById(batchDetails.batchId);
    if (!batch.success) {
      throw new Error('Failed to fetch batch details');
    }

    const payload = {
      students,
      batchDetails: {
        ...batchDetails,
        batchId: batchDetails.batchId,
        teacherId: batch.data.teacher, // Get teacherId from batch data
        name: batch.data.name,
        subject: batch.data.subject
      }
    };

    // console.log('Sending to server:', payload); // Debug log

    const response = await api.post('/students/create-multiple', payload);
    
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

export const deleteMultipleStudents = async (studentIds, batchId) => {
  try {
    const response = await api.post(`/students/delete-multiple`, {
      studentIds,
      batchId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
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

export const updateStudentProfile = async (studentId, formData) => {
  try {
    const response = await api.put(`/students/profile/${studentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
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
    // Create FormData object if it's not already FormData
    const formData = profileData instanceof FormData ? profileData : new FormData();
    
    // If profileData is a regular object, append its properties to FormData
    if (!(profileData instanceof FormData)) {
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      });
    }

    const response = await api.put(`/auth/teacher/profile/${teacherId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
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

export const uploadNote = async (formData) => {
  try {
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
    const token = localStorage.getItem('token'); // Get token from localStorage
    const response = await api.get(`/notes/batch/${batchId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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

export const getAssignmentById = async (assignmentId) => {
  try {
    const response = await api.get(`/assignments/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitAssignment = async (assignmentId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStudentSubmission = async (assignmentId, studentId) => {
  try {
    const response = await api.get(`/assignments/${assignmentId}/submission/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const gradeAssignment = async (assignmentId, studentId, gradeData) => {
  try {
    const response = await api.post(`/assignments/${assignmentId}/grade/${studentId}`, gradeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteAssignmentSubmission = async (assignmentId) => {
  try {
    const response = await api.delete(`/assignments/${assignmentId}/submission`);
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
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete quiz');
    }
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
    const response = await api.put(`/quizzes/${quizId}`, {
      ...quizData,
      batchId: quizData.batchId
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update quiz');
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitQuiz = async (quizId, answers, studentName) => {
  try {
    const response = await api.post(`/quizzes/${quizId}/submit`, { 
      answers,
      studentName  // Add student name to the request
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getQuizAttempt = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}/attempt`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteQuizStudents = async (quizId, studentIds) => {
  try {
    const response = await api.post(`/quizzes/${quizId}/delete-students`, {
      studentIds
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const generateQuizQuestions = async (formData) => {
  try {
    const response = await api.post('/ai-quiz/generate', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBatchDetails = (batchId) => {
  return axios.get(`${API_URL}/batches/${batchId}`);
};

export const getStudentAssignments = (batchId, studentId) => {
  return axios.get(`${API_URL}/assignments/student/${studentId}/batch/${batchId}`);
};

export const getStudentBatchDetails = async (batchId) => {
  try {
    const response = await api.get(`/batch/student/${batchId}`);
    // Add some logging to debug
    // console.log('Batch details response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching batch details:', error);
    throw error.response?.data || error;
  }
};

export const uploadBook = async (bookData) => {
  try {
    const formData = new FormData();
    formData.append('title', bookData.title);
    formData.append('description', bookData.description);
    formData.append('authorName', bookData.authorName);
    formData.append('subject', bookData.subject);
    formData.append('authorTags', JSON.stringify(bookData.authorTags));
    formData.append('teacherName', bookData.teacherName); // Add teacher name to form data
    if (bookData.coverImage) {
      formData.append('coverImage', bookData.coverImage);
    }
    formData.append('file', bookData.file);

    const response = await api.post('/library/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBooks = async (teacherId) => {
  try {
    const response = await api.get(`/library?teacherId=${teacherId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBook = async (bookId) => {
  try {
    const response = await api.delete(`/library/${bookId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBookAccessUrl = async (bookId) => {
  try {
    const response = await api.get(`/library/${bookId}/access`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllBooks = async () => {
  try {
    const response = await api.get('/library/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitPayment = async (batchId, paymentData) => {
  try {
    const formData = new FormData();
    formData.append('amount', paymentData.amount);
    formData.append('feedback', paymentData.feedback || '');
    formData.append('receipt', paymentData.receipt);
    formData.append('studentId', paymentData.studentId);
    formData.append('installmentNumber', paymentData.installmentNumber); // Add this line

    const response = await api.post(`/batch/${batchId}/payment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPayments = async (batchId, studentId) => {
  try {
    const response = await api.get(`/batch/${batchId}/payments?studentId=${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPendingPayments = async (batchId) => {
  try {
    const response = await api.get(`/batch/${batchId}/payments/pending`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyPayment = async (batchId, paymentId, status, studentId) => {
  try {
    const response = await api.put(`/batch/${batchId}/payments/${paymentId}/verify`, {
      status,
      studentId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleStudentLock = async (batchId, studentId) => {
  try {
    const response = await api.post(`/batch/${batchId}/students/${studentId}/toggle-lock`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBatchesAccounting = async (teacherId) => {
  try {
    const response = await api.get(`/batch/accounting/${teacherId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendChatMessage = async (message) => {
  try {
    const response = await api.post('/ai/chat', { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeachers = async () => {
  try {
    const response = await api.get('/admin/teachers');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleTeacherStatus = async (teacherId) => {
  try {
    const response = await api.put(`/admin/teachers/${teacherId}/toggle-status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSubscriptionPlans = async () => {
  try {
    const response = await api.get('/subscription');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createSubscriptionPlan = async (planData) => {
  try {
    const response = await api.post('/subscription', planData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateSubscriptionPlan = async (planId, planData) => {
  try {
    const response = await api.put(`/subscription/${planId}`, planData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteSubscriptionPlan = async (planId) => {
  try {
    const response = await api.delete(`/subscription/${planId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSubscriptionPlanById = async (planId) => {
  try {
    const response = await api.get(`/subscription/${planId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitSubscriptionPayment = async (planId, receiptFile) => {
  try {
    const formData = new FormData();
    formData.append('receipt', receiptFile);

    const response = await api.post(`/subscription/${planId}/submit-payment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPendingSubscriptionPayments = async () => {
  try {
    const response = await api.get('/subscription/pending-payments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifySubscriptionPayment = async (userId, status) => {
  try {
    const response = await api.put(`/subscription/verify-payment/${userId}`, { 
      status: status === 'verified' ? 'active' : 'rejected' 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPendingPaymentsCount = async () => {
  try {
    const response = await api.get('/subscription/pending-payments/count');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRejectedPaymentsCount = async () => {
  try {
    const response = await api.get('/subscription/rejected-payments/count');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRejectedPayments = async () => {
  try {
    const response = await api.get('/subscription/rejected-payments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const generateTest = async (formData) => {
  try {
    const response = await api.post('/ai/generate-test', { formData });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendMessage = async (batchId, content) => {
  try {
    const response = await api.post(`/messages/${batchId}`, { content });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessages = async (batchId) => {
  try {
    const response = await api.get(`/messages/${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTeacher = async (teacherId, updateData) => {
  try {
    // Convert dayjs to ISO string for the API
    const payload = {
      ...updateData,
      subscriptionEndDate: updateData.subscriptionEndDate.toISOString()
    };
    
    const response = await api.put(`/admin/teachers/${teacherId}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTeacher = async (teacherId) => {
  try {
    const response = await api.delete(`/admin/teachers/${teacherId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete teacher' };
  }
};
