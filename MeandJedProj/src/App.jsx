import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";

// =====================================================
// AUTH
// =====================================================

import HomeownerAuth from "./components/SignUp/HomeownerAuth";
import ProviderAuth from "./components/SignUp/ProviderAuth";


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

        {/* =========================================
                    LANDING PAGE
                ========================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />


        {/* =========================================
                    AUTHENTICATION
                ========================================== */}

        <Route
          path="/auth/homeowner"
          element={<HomeownerAuth />}
        />

        <Route
          path="/auth/provider"
          element={<ProviderAuth />}
        />


        {/* =========================================
                    HOMEOWNER ROUTES
                ========================================== */}

        <Route
          path="/homeowner-dashboard"
          element={<HomeownerDashboard />}
        />

        <Route
          path="/services"
          element={<FindService />}
        />

        <Route
          path="/provider/:id"
          element={<ProviderProfile />}
        />

        <Route
          path="/track-booking"
          element={<TrackBooking />}
        />

        <Route
          path="/bookings"
          element={<BookingsTab />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route
          path="/calendar"
          element={<CalendarView />}
        />

        <Route
          path="/messages"
          element={<Messages />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />


        {/* =========================================
                    PROVIDER ROUTES
                ========================================== */}

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

        {/* Provider job  */}
        <Route
          path="/provider-jobs"
          element={<ProviderJobs />}
        />


        {/* =========================================
                    TEMPORARY PROVIDER ROUTES
                    ==========================================

                    These are temporary only.
                    We will replace them with their
                    actual Provider components later.
                ========================================== */}

        <Route
          path="/provider-jobs"
          element={<ProviderDashboard />}
        />

        <Route
          path="/provider-schedule"
          element={<ProviderDashboard />}
        />

        <Route
          path="/provider-messages"
          element={<ProviderDashboard />}
        />

        <Route
          path="/provider-reviews"
          element={<ProviderDashboard />}
        />

        <Route
          path="/provider-earnings"
          element={<ProviderDashboard />}
        />

        <Route
          path="/provider-notifications"
          element={<ProviderDashboard />}
        />

        <Route
          path="/provider-profile"
          element={<ProviderDashboard />}
        />

        <Route
          path="/provider-availability"
          element={<ProviderDashboard />}
        />


        {/* =========================================
                    FALLBACK
                ========================================== */}

        <Route
          path="*"
          element={<LandingPage />}
        />

      </Routes>

    </Router>
  );
}

export default App;