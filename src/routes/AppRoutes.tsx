import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { CreateListingPage } from '../pages/admin/CreateListingPage';
import { EditListingPage } from '../pages/admin/EditListingPage';
import { PublicListingPage } from '../pages/public/PublicListingPage';
import { PrivateAccessPage } from '../pages/auth/PrivateAccessPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ServiceSelectionPage } from '../pages/ServiceSelectionPage';
import { CreatePortfolioPage } from '../pages/admin/CreatePortfolioPage';
import { EditPortfolioPage } from '../pages/admin/EditPortfolioPage';
import { PublicPortfolioPage } from '../pages/public/PublicPortfolioPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* =========================================================================
          PART 0 — UNIFIED SERVICE SELECTION HUB
          "What do you want to create? Listing OS or Creator Portfolio"
          ========================================================================= */}
      <Route path="/" element={<ServiceSelectionPage />} />
      <Route path="/select" element={<ServiceSelectionPage />} />
      <Route path="/hub" element={<ServiceSelectionPage />} />

      {/* =========================================================================
          PART 1 — PUBLIC CREATOR PORTFOLIO PAGES (100% PUBLIC 🌍)
          ========================================================================= */}
      <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
      <Route path="/p/portfolio/:slug" element={<PublicPortfolioPage />} />
      <Route path="/creator/:slug" element={<PublicPortfolioPage />} />
      <Route path="/sample-portfolio" element={<PublicPortfolioPage />} />

      {/* =========================================================================
          PART 2 — PUBLIC PROPERTY LISTING PAGES (100% PUBLIC 🌍)
          - NO PASSWORD
          - NO LOGIN
          - NO ACCESS GATE
          - NO REDIRECT
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
          PART 3 — UNIFIED ADMIN DASHBOARD & MANAGEMENT (LOCKED 🔒)
          Passcode: 9736648956
          Protected routes require passcode authentication.
          ========================================================================= */}
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

      {/* Creator Portfolio Management Routes - LOCKED */}
      <Route
        path="/portfolio/create"
        element={
          <ProtectedRoute>
            <CreatePortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio/new"
        element={
          <ProtectedRoute>
            <CreatePortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio/edit/:id"
        element={
          <ProtectedRoute>
            <EditPortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/portfolio/edit/:id"
        element={
          <ProtectedRoute>
            <EditPortfolioPage />
          </ProtectedRoute>
        }
      />

      {/* Property Listing Creation Routes - LOCKED */}
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

      {/* Property Listing Edit & Management Routes - LOCKED */}
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
