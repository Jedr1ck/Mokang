import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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
import ProviderBookings from "./components/ProviderDashboard/ProviderBookings";
import ProviderJobs from "./components/ProviderDashboard/ProviderJobs";

// =====================================================
// APP
// =====================================================

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
          element={<AdminDashboard />}
        />


        {/* =================================================
                    HOMEOWNER ROUTES
        ================================================== */}

        {/* Homeowner Dashboard */}
        <Route
          path="/homeowner-dashboard"
          element={<HomeownerDashboard />}
        />

        {/* Find Service */}
        <Route
          path="/services"
          element={<FindService />}
        />

        {/* Provider Profile */}
        <Route
          path="/provider/:id"
          element={<ProviderProfile />}
        />

        {/* Track Booking */}
        <Route
          path="/track-booking"
          element={<TrackBooking />}
        />

        {/* Bookings */}
        <Route
          path="/bookings"
          element={<BookingsTab />}
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* History */}
        <Route
          path="/history"
          element={<History />}
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={<Notifications />}
        />

        {/* Calendar */}
        <Route
          path="/calendar"
          element={<CalendarView />}
        />

        {/* Messages */}
        <Route
          path="/messages"
          element={<Messages />}
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={<Settings />}
        />


        {/* =================================================
                    PROVIDER ROUTES
        ================================================== */}

        {/* Provider Dashboard */}
        <Route
          path="/provider-dashboard"
          element={<ProviderDashboard />}
        />

        {/* Provider Booking Requests */}
        <Route
          path="/provider-bookings"
          element={<ProviderBookings />}
        />

        {/* Provider Jobs */}
        <Route
          path="/provider-jobs"
          element={<ProviderJobs />}
        />


        {/* =================================================
                    TEMPORARY PROVIDER ROUTES
        ================================================== */}

        {/* Provider Schedule */}
        <Route
          path="/provider-schedule"
          element={<ProviderDashboard />}
        />

        {/* Provider Messages */}
        <Route
          path="/provider-messages"
          element={<ProviderDashboard />}
        />

        {/* Provider Reviews */}
        <Route
          path="/provider-reviews"
          element={<ProviderDashboard />}
        />

        {/* Provider Earnings */}
        <Route
          path="/provider-earnings"
          element={<ProviderDashboard />}
        />

        {/* Provider Notifications */}
        <Route
          path="/provider-notifications"
          element={<ProviderDashboard />}
        />

        {/* Provider Profile */}
        <Route
          path="/provider-profile"
          element={<ProviderDashboard />}
        />

        {/* Provider Availability */}
        <Route
          path="/provider-availability"
          element={<ProviderDashboard />}
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