import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiUser, FiLogOut } from "react-icons/fi";
import { logoutUser } from "../store/slices/authSlice";
import toast from "react-hot-toast";

export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("my-bookings");
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const tabs = [
    {
      id: "my-bookings",
      label: "MY BOOKINGS",
      path: "/attendee-dashboard/my-bookings",
    },
    {
      id: "payment-details",
      label: "PAYMENT DETAILS",
      path: "/attendee-dashboard/payment-details",
    },
    {
      id: "my-reservations",
      label: "MY RESERVATIONS",
      path: "/attendee-dashboard/my-reservations",
    },
  ];

  const currentTab = location.pathname.split("/").pop() || "my-bookings";

  return (
    <div className="min-h-screen bg-gray-900 pt-10 text-white">
      <div className="px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            WELCOME BACK, {user?.name?.toUpperCase() || user?.email?.split("@")[0]?.toUpperCase() || "USER"}
          </h1>
          <div className="w-24 h-1 bg-white mx-auto"></div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-0 bg-gray-800 rounded-lg p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === tab.id
                    ? "bg-white text-black"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            ))}
            <Link
              to="/attendee-dashboard/profile"
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <FiUser className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}