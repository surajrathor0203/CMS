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
import './App.css';

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
            path="/student-dashboard" 
            element={
              <ProtectedRoute 
                element={<StudentDashboard />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
