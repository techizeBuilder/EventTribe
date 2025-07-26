import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiUsers, 
  FiCalendar, 
  FiBarChart, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiDollarSign,
  FiMail,
  FiShield,
  FiTrendingUp,
  FiActivity
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Import admin page components
import AdminUsersManagement from "../components/admin/AdminUsersManagement";
import AdminEventsManagement from "../components/admin/AdminEventsManagement";
import AdminAnalytics from "../components/admin/AdminAnalytics";
import AdminSettings from "../components/admin/AdminSettings";
import AdminOverview from "../components/admin/AdminOverview";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();

  // Check admin authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    
    if (!token || !user) {
      toast.error("Admin authentication required");
      navigate("/admin-login");
      return;
    }
    
    try {
      const userData = JSON.parse(user);
      if (userData.role !== "admin") {
        toast.error("Admin access required");
        navigate("/admin-login");
        return;
      }
      setAdminUser(userData);
    } catch (error) {
      toast.error("Invalid admin session");
      navigate("/admin-login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully");
    navigate("/admin-login");
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: FiActivity },
    { id: "users", label: "Users Management", icon: FiUsers },
    { id: "events", label: "Events Management", icon: FiCalendar },
    { id: "analytics", label: "Analytics", icon: FiBarChart },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <AdminUsersManagement />;
      case "events":
        return <AdminEventsManagement />;
      case "analytics":
        return <AdminAnalytics />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            <FiShield className="w-8 h-8 text-red-500 mr-3" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-700 transition-colors ${
                activeTab === item.id
                  ? "bg-red-600 text-white border-r-4 border-red-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-4"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-semibold text-white capitalize">
                {activeTab}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-300">
                <FiShield className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Admin: {adminUser.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full max-w-full"
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}