import "./App.css";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { Route, Routes, useLocation } from "react-router-dom";
import EventDetailsPage from "./pages/EventDetailsPage";
import OrganizerDashboard from "./pages/OrganizerDashboard ";
import ManageEvents from "./pages/organizer/Events";
import ManageOrganization from "./pages/ManageOrganization";
import Finances from "./pages/organizer/Finances";
import Management from "./pages/Management";
import OrganizerHome from "./pages/OrganizerHome";
import ManageUser from "./pages/ManageUser";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import Marketing from "./pages/organizer/Marketing";
import Audience from "./pages/organizer/Audience";
import AttendeeDashboard from "./pages/AttendeeDashboard";
import MyBookings from "./pages/MyBookings";
import PaymentDetails from "./pages/PaymentDetails";
import MyReservations from "./pages/MyReservations";
import AttendeeProfile from "./pages/AttendeeProfile";
import AboutPage from "./pages/AboutPage";
import Payouts from "./pages/Payouts";
import Disputes from "./pages/Disputes";
import Analytics from "./pages/organizer/Analytics";
import SupportCenter from "./pages/organizer/Support";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications";
import NotificationsPage from "./pages/NotificationsPage";
import OrganizerNotifications from "./pages/OrganizerNotifications";
import CartPage from "./pages/CartPage";
import ResetPasswordPage from "./pages/ResetPasswordPage"; //Import the new Page
import OrganizerLogin from "./pages/OrganizerLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOverview from "./components/admin/AdminOverview";
import AdminUsersManagement from "./components/admin/AdminUsersManagement";
import AdminEventsManagement from "./components/admin/AdminEventsManagement";
import AdminAnalytics from "./components/admin/AdminAnalytics";
import AdminSettings from "./components/admin/AdminSettings";
import DuplicateEvent from "./pages/DuplicateEvent";
import OrganizationEarnings from "./pages/organizer/OrganizationEarnings";

function AppContent() {
  const location = useLocation();

  // Hide Navbar on all routes under /organizer and /admin
  const hideNavbar = location.pathname.startsWith("/organizer") || location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <>
        {!hideNavbar && <Navbar />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/attendee-dashboard"
            element={
              <ProtectedRoute requiredRole="attendee">
                <AttendeeDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<MyBookings />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="payment-details" element={<PaymentDetails />} />
            <Route path="my-reservations" element={<MyReservations />} />
            <Route path="profile" element={<AttendeeProfile />} />
          </Route>
          <Route path="/about" element={<AboutPage />} />
          <Route path="/events" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/organizer-login" element={<OrganizerLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/event/:eventId" element={<EventDetailsPage />} />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute requiredRole="organizer">
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrganizerHome />} />
            <Route path="events" element={<ManageEvents />} />
            <Route path="users" element={<ManageUser />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="audience" element={<Audience />} />

            <Route path="finances" element={<Finances />} />
            <Route path="organization" element={<ManageOrganization />} />
            <Route path="management" element={<Management />} />
            <Route path="createEvent" element={<CreateEvent />} />
            <Route path="editEvent" element={<EditEvent />} />
            <Route path="duplicate-event" element={<DuplicateEvent />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="disputes" element={<Disputes />} />

            <Route path="analytics" element={<Analytics />} />
            <Route path="support-center" element={<SupportCenter />} />
            <Route path="notifications" element={<OrganizerNotifications />} />
          </Route>
          <Route path="/admin/dashboard" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsersManagement />} />
            <Route path="events" element={<AdminEventsManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/admin/organization-earnings/:userId" element={<ProtectedRoute requiredRole="organizer"><OrganizationEarnings /></ProtectedRoute>} />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
            marginTop: "80px", // Add margin to position below the fixed navbar
          },
          success: {
            style: {
              background: "#065f46",
              color: "#fff",
              marginTop: "80px",
            },
          },
          error: {
            style: {
              background: "#7f1d1d",
              color: "#fff",
              marginTop: "80px",
            },
          },
        }}
      />
    </Provider>
  );
}