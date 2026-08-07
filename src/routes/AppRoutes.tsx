import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { CreateListingPage } from '../pages/admin/CreateListingPage';
import { EditListingPage } from '../pages/admin/EditListingPage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { PublicListingPage } from '../pages/public/PublicListingPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ENABLE_AUTH } from '../lib/auth';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect to Admin Workspace */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Admin Login - Redirects to /admin when auth is disabled for internal dev */}
      <Route
        path="/admin/login"
        element={ENABLE_AUTH ? <AdminLoginPage /> : <Navigate to="/admin" replace />}
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/new"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/edit/:id"
        element={
          <ProtectedRoute>
            <EditListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/preview/:id"
        element={
          <ProtectedRoute>
            <PublicListingPage />
          </ProtectedRoute>
        }
      />

      {/* Public Pages */}
      <Route path="/p/:slug" element={<PublicListingPage />} />

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

