import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute Component
 * Guards routes that require authentication
 * Supports both regular users and admin-only routes
 */
export default function ProtectedRoute({ children, requiresAdmin = false }) {
  const { user, token, loading } = useAuth();

  // Show nothing while checking auth (prevents flash of content)
  if (loading) {
    return null; // or a small loader if preferred
  }

  // If no token, redirect to home page (where user can authenticate via OTP)
  if (!token) {
    // FIX: user view -> policy dashboard reports (prevent admin-login redirect)
    return <Navigate to="/" replace />; // go to user login/home
  }

  // If admin required but user is not admin
  if (requiresAdmin && user?.role !== 'admin') {
    // FIX: user view -> policy dashboard reports (prevent admin-login redirect)
    // Redirect to policy dashboard instead of admin login
    return <Navigate to="/policy-dashboard" replace />;
  }

  /* DEV: guard check */
  if (import.meta.env.DEV) {
    console.debug('ProtectedRoute:', { 
      path: window.location.pathname, 
      user: user?.role, 
      requiresAdmin 
    });
  }

  return children;
}

