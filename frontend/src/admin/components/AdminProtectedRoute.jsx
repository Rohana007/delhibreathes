import { Navigate } from 'react-router-dom';

/**
 * Protected Route Component for Admin Pages
 * Checks if both access code is verified and admin token exists
 */
export default function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('adminToken');
  const accessVerified = sessionStorage.getItem('adminAccessVerified');

  // Require both access code verification and valid token
  if (!adminToken || accessVerified !== 'true') {
    // Clear invalid session data
    if (!adminToken) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
    }
    if (accessVerified !== 'true') {
      sessionStorage.removeItem('adminAccessVerified');
    }
    // Redirect to login
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

