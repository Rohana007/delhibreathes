import { Navigate } from 'react-router-dom';

/**
 * Protected Route Component for Policy Pages
 * Checks if admin token exists in localStorage
 */
export default function PolicyProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('adminToken');

  // Require valid token
  if (!adminToken) {
    // Clear invalid session data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    sessionStorage.removeItem('adminAccessVerified');
    // Redirect to policy login
    return <Navigate to="/policy/login" replace />;
  }

  return children;
}

