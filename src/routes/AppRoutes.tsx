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
      {/* =========================================================================
          PART 2 — PUBLIC PROPERTY LISTING PAGES (100% PUBLIC 🌍)
          - NO PASSWORD
          - NO LOGIN
          - NO ACCESS GATE
          - NO REDIRECT
          Anyone with this link (clients, buyers, WhatsApp, Instagram, incognito)
          sees the property page immediately.
          ========================================================================= */}
      <Route path="/p/:slug" element={<PublicListingPage />} />
      <Route path="/property/:slug" element={<PublicListingPage />} />
      <Route path="/listing/:slug" element={<PublicListingPage />} />
      <Route path="/sample" element={<PublicListingPage />} />
      <Route path="/preview" element={<PublicListingPage />} />

      {/* Explicit Private Access / Login Screen */}
      <Route path="/access" element={<PrivateAccessPage />} />
      <Route path="/login" element={<PrivateAccessPage />} />
      <Route path="/admin/login" element={<PrivateAccessPage />} />

      {/* =========================================================================
          PART 1 — PRIVATE WEBSITE & MANAGEMENT SYSTEM (LOCKED 🔒)
          Passcode: 9736648956
          Protected routes require passcode authentication.
          ========================================================================= */}
      {/* Root Homepage - LOCKED */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard Routes - LOCKED */}
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

      {/* Create Listing Routes - LOCKED */}
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
      <Route
        path="/admin/new"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-listing"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-listing/*"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/listing/create"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />

      {/* Edit & Management Routes - LOCKED */}
      <Route
        path="/edit/:id"
        element={
          <ProtectedRoute>
            <EditListingPage />
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
        path="/manage/:id"
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

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
