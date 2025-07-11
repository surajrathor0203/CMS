import { getUserFromCookie } from './cookies';

const DASHBOARD_PATHS = {
  teacher: '/teacher-dashboard',
  student: '/student-dashboard',
  admin: '/admin-dashboard',
  default: '/login'
};

export const getDashboardPath = (role) => {
  return DASHBOARD_PATHS[role] || DASHBOARD_PATHS.default;
};

export const isAuthenticated = () => {
  const user = getUserFromCookie();
  return !!user;
};

export const getUserRole = () => {
  const user = getUserFromCookie();
  return user?.user.role || null;
};

export const logout = () => {
  // Clear all cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};
