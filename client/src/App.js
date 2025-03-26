import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './utils/auth';
import Landing from './pages/landing';
import SignUp from './pages/signUp';
import Login from './pages/login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/forgot-password';
import BatchPage from './pages/BatchPage';
import AddStudent from './pages/AddStudent';
import StudentProfile from './pages/StudentProfile';
import TeacherProfile from './pages/TeacherProfile';  
import AssignmentDetail from './pages/AssignmentDetail';
import QuizCreatePage from './pages/QuizCreatePage';
import EditQuizPage from './pages/EditQuizPage';
import StudentBatchDetails from './pages/StudentBatchDetails';
import QuizAttemptPage from './pages/QuizAttemptPage';
import QuizResults from './pages/QuizResults';
import AssignmentSubmissionPage from './pages/AssignmentSubmissionPage';
import TeacherLibrary from './pages/TeacherLibrary';
import StudentLibrary from './pages/StudentLibrary';
import StudentDetails from './pages/StudentDetails';
import InstallmentDetailsPage from './pages/InstallmentDetailsPage';
import TotalAccountingPage from './pages/TotalAccountingPage';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const isAuth = isAuthenticated();
  const userRole = getUserRole();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    const dashboardPath = userRole === 'admin' ? '/admin-dashboard' 
      : userRole === 'teacher' ? '/teacher-dashboard' 
      : '/student-dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return element;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute 
                element={<AdminDashboard />} 
                allowedRoles={['admin']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard" 
            element={
              <ProtectedRoute 
                element={<TeacherDashboard />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId" 
            element={
              <ProtectedRoute 
                element={<BatchPage />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId/add-student" 
            element={
              <ProtectedRoute 
                element={<AddStudent />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId/assignment/:assignmentId" 
            element={
              <ProtectedRoute 
                element={<AssignmentDetail />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId/create-quiz" 
            element={
              <ProtectedRoute 
                element={<QuizCreatePage />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId/edit-quiz/:quizId" 
            element={
              <ProtectedRoute 
                element={<EditQuizPage />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId/quiz/:quizId/results" 
            element={
              <ProtectedRoute 
                element={<QuizResults />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId/student/:studentId" 
            element={
              <ProtectedRoute 
                element={<StudentDetails />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher-dashboard/batch/:batchId/installment/:installmentNumber" 
            element={
              <ProtectedRoute 
                element={<InstallmentDetailsPage />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher/accounting" 
            element={
              <ProtectedRoute 
                element={<TotalAccountingPage />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute 
                element={<StudentDashboard />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route 
            path="/student-dashboard/batch/:batchId" 
            element={
              <ProtectedRoute 
                element={<StudentBatchDetails />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route 
            path="/student-dashboard/batch/:batchId/quiz/:quizId" 
            element={
              <ProtectedRoute 
                element={<QuizAttemptPage />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route 
            path="/student-dashboard/batch/:batchId/assignment/:assignmentId" 
            element={
              <ProtectedRoute 
                element={<AssignmentSubmissionPage />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route 
            path="/student/settings" 
            element={
              <ProtectedRoute 
                element={<StudentProfile />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route 
            path="/teacher/settings" 
            element={
              <ProtectedRoute 
                element={<TeacherProfile />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/teacher/library" 
            element={
              <ProtectedRoute 
                element={<TeacherLibrary />} 
                allowedRoles={['teacher']} 
              />
            } 
          />
          <Route 
            path="/student/library" 
            element={
              <ProtectedRoute 
                element={<StudentLibrary />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
