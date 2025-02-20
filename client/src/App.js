import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './utils/auth';
import SignUp from './pages/signUp';
import Login from './pages/login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
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
            path="/student-dashboard" 
            element={
              <ProtectedRoute 
                element={<StudentDashboard />} 
                allowedRoles={['student']} 
              />
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
