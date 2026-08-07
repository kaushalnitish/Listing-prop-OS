import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated, ENABLE_AUTH } from '../../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  if (ENABLE_AUTH && !isAdminAuthenticated()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

