import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { CreateListingPage } from '../pages/admin/CreateListingPage';
import { EditListingPage } from '../pages/admin/EditListingPage';
import { PublicListingPage } from '../pages/public/PublicListingPage';
import { PrivateAccessPage } from '../pages/auth/PrivateAccessPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Explicit Private Access / Login Screen */}
      <Route path="/access" element={<PrivateAccessPage />} />
      <Route path="/login" element={<PrivateAccessPage />} />
      <Route path="/admin/login" element={<PrivateAccessPage />} />

      {/* Root Route - Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard Routes - Protected */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Create Listing Routes - Protected */}
      <Route
        path="/admin/new"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />

      {/* Edit Listing Routes - Protected */}
      <Route
        path="/admin/edit/:id"
        element={
          <ProtectedRoute>
            <EditListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit/:id"
        element={
          <ProtectedRoute>
            <EditListingPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Preview Route - Protected */}
      <Route
        path="/admin/preview/:id"
        element={
          <ProtectedRoute>
            <PublicListingPage />
          </ProtectedRoute>
        }
      />

      {/* Property Showcase / Public Pages - Protected while ACCESS_CONTROL_ENABLED is true */}
      <Route
        path="/p/:slug"
        element={
          <ProtectedRoute>
            <PublicListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sample"
        element={
          <ProtectedRoute>
            <PublicListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview"
        element={
          <ProtectedRoute>
            <PublicListingPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback 404 Route - Protected */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
