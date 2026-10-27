import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getMyProfile, logout, token } from "./services/api";

import LandingPage from "./pages/LandingPage";

// =====================================================
// AUTH
// =====================================================

import HomeownerAuthSimple from "./components/SignUp/HomeownerAuthSimple";
import ProviderAuth from "./components/SignUp/ProviderAuth";
import AdminAuth from "./components/SignUp/AdminAuth";

// =====================================================
// ADMIN DASHBOARD
// =====================================================

import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

// =====================================================
// HOMEOWNER COMPONENTS
// =====================================================

import HomeownerDashboard from "./components/HomeOwnerDashboard/HomeownerDashboard";
import FindService from "./components/HomeOwnerDashboard/FindService";
import ProviderProfile from "./components/HomeOwnerDashboard/ProviderProfile";
import TrackBooking from "./components/HomeOwnerDashboard/TrackBooking";
import BookingsTab from "./components/HomeOwnerDashboard/BookingsTab";
import Profile from "./components/HomeOwnerDashboard/Profile";
import History from "./components/HomeOwnerDashboard/History";
import Notifications from "./components/HomeOwnerDashboard/Notifications";
import CalendarView from "./components/HomeOwnerDashboard/CalendarView";
import Messages from "./components/HomeOwnerDashboard/Messages";
import Settings from "./components/HomeOwnerDashboard/Settings";

// =====================================================
// PROVIDER COMPONENTS
// =====================================================

import ProviderDashboard from "./components/ProviderDashboard/ProviderDashboard";
import ProviderBookings from "./components/ProviderDashboard/ProviderBookingSystem";
import ProviderJobs from "./components/ProviderDashboard/ProviderJobs";

// =====================================================
// APP
// =====================================================

function RoleProtectedRoute({ role, children }) {
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(() => Boolean(token()));
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    if (!token()) return undefined;

    let active = true;
    getMyProfile()
      .then((profile) => {
        if (active) {
          setUserRole(profile.role || '');
          localStorage.setItem('user', JSON.stringify(profile));
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          logout();
          setUserRole('');
          return;
        }
        setAccessError(error.message || 'Unable to verify account access.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center" role="status">
        <span className="spinner-border text-warning" aria-hidden="true" />
        <span className="visually-hidden">Checking account access...</span>
      </div>
    );
  }

  if (accessError) {
    return <div className="container py-5 text-center" role="alert">{accessError}</div>;
  }

  if (userRole === role) return children;
  if (userRole === 'provider') return <Navigate to="/provider-dashboard" replace />;
  if (userRole === 'homeowner') return <Navigate to="/homeowner-dashboard" replace />;
  if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
  return <Navigate to={role === 'provider' ? '/auth/provider' : role === 'admin' ? '/admin-login' : '/auth/homeowner'} replace />;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* =================================================
                    LANDING PAGE
        ================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />


        {/* =================================================
                    AUTHENTICATION
        ================================================== */}

        {/* Homeowner Authentication */}
        <Route
          path="/auth/homeowner"
          element={<HomeownerAuthSimple />}
        />

        {/* Provider Authentication */}
        <Route
          path="/auth/provider"
          element={<ProviderAuth />}
        />

        {/* Admin Authentication */}
        <Route
          path="/admin-login"
          element={<AdminAuth />}
        />


        {/* =================================================
                    ADMIN DASHBOARD
        ================================================== */}

        <Route
          path="/admin-dashboard"
          element={<RoleProtectedRoute role="admin"><AdminDashboard /></RoleProtectedRoute>}
        />


        {/* =================================================
                    HOMEOWNER ROUTES
        ================================================== */}

        {/* Homeowner Dashboard */}
        <Route
          path="/homeowner-dashboard"
          element={<RoleProtectedRoute role="homeowner"><HomeownerDashboard /></RoleProtectedRoute>}
        />

        {/* Find Service */}
        <Route
          path="/services"
          element={<RoleProtectedRoute role="homeowner"><FindService /></RoleProtectedRoute>}
        />

        {/* Provider Profile */}
        <Route
          path="/provider/:id"
          element={<RoleProtectedRoute role="homeowner"><ProviderProfile /></RoleProtectedRoute>}
        />

        {/* Track Booking */}
        <Route
          path="/track-booking"
          element={<RoleProtectedRoute role="homeowner"><TrackBooking /></RoleProtectedRoute>}
        />

        {/* Bookings */}
        <Route
          path="/bookings"
          element={<RoleProtectedRoute role="homeowner"><BookingsTab /></RoleProtectedRoute>}
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={<RoleProtectedRoute role="homeowner"><Profile /></RoleProtectedRoute>}
        />

        {/* History */}
        <Route
          path="/history"
          element={<RoleProtectedRoute role="homeowner"><History /></RoleProtectedRoute>}
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={<RoleProtectedRoute role="homeowner"><Notifications /></RoleProtectedRoute>}
        />

        {/* Calendar */}
        <Route
          path="/calendar"
          element={<RoleProtectedRoute role="homeowner"><CalendarView /></RoleProtectedRoute>}
        />

        {/* Messages */}
        <Route
          path="/messages"
          element={<RoleProtectedRoute role="homeowner"><Messages /></RoleProtectedRoute>}
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={<RoleProtectedRoute role="homeowner"><Settings /></RoleProtectedRoute>}
        />


        {/* =================================================
                    PROVIDER ROUTES
        ================================================== */}

        {/* Provider Dashboard */}
        <Route
          path="/provider-dashboard"
          element={<RoleProtectedRoute role="provider"><ProviderDashboard /></RoleProtectedRoute>}
        />

        {/* Provider Booking Requests */}
        <Route
          path="/provider-bookings"
          element={<RoleProtectedRoute role="provider"><ProviderBookings /></RoleProtectedRoute>}
        />

        {/* Provider Jobs */}
        <Route
          path="/provider-jobs"
          element={<RoleProtectedRoute role="provider"><ProviderJobs /></RoleProtectedRoute>}
        />


        {/* =================================================
                    TEMPORARY PROVIDER ROUTES
        ================================================== */}

        {/* Provider Schedule */}
        <Route
          path="/provider-schedule"
          element={<RoleProtectedRoute role="provider"><ProviderDashboard /></RoleProtectedRoute>}
        />

        {/* Provider Messages */}
        <Route
          path="/provider-messages"
          element={<RoleProtectedRoute role="provider"><ProviderDashboard /></RoleProtectedRoute>}
        />

        {/* Provider Reviews */}
        <Route
          path="/provider-reviews"
          element={<RoleProtectedRoute role="provider"><ProviderDashboard /></RoleProtectedRoute>}
        />

        {/* Redirect the retired online earnings page to provider bookings. */}
        <Route
          path="/provider-earnings"
          element={<RoleProtectedRoute role="provider"><Navigate to="/provider-bookings" replace /></RoleProtectedRoute>}
        />

        {/* Provider Notifications */}
        <Route
          path="/provider-notifications"
          element={<RoleProtectedRoute role="provider"><ProviderDashboard /></RoleProtectedRoute>}
        />

        {/* Provider Profile */}
        <Route
          path="/provider-profile"
          element={<RoleProtectedRoute role="provider"><ProviderDashboard /></RoleProtectedRoute>}
        />

        {/* Provider Availability */}
        <Route
          path="/provider-availability"
          element={<RoleProtectedRoute role="provider"><ProviderDashboard /></RoleProtectedRoute>}
        />


        {/* =================================================
                    FALLBACK
        ================================================== */}

        <Route
          path="*"
          element={<LandingPage />}
        />

      </Routes>
    </Router>
  );
}

export default App;