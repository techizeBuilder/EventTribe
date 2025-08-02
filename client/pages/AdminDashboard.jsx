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
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    { id: "overview", label: "Overview", icon: FiActivity, path: "/admin/dashboard" },
    { id: "users", label: "Users Management", icon: FiUsers, path: "/admin/dashboard/users" },
    { id: "events", label: "Events Management", icon: FiCalendar, path: "/admin/dashboard/events" },
    { id: "analytics", label: "Analytics", icon: FiBarChart, path: "/admin/dashboard/analytics" },
    { id: "settings", label: "Settings", icon: FiSettings, path: "/admin/dashboard/settings" },
  ];

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/admin/dashboard") return "overview";
    if (path.includes("/users")) return "users";
    if (path.includes("/events")) return "events";
    if (path.includes("/analytics")) return "analytics";
    if (path.includes("/settings")) return "settings";
    return "overview";
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
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-700 transition-colors ${
                getActiveTab() === item.id
                  ? "bg-red-600 text-white border-r-4 border-red-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
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
                {sidebarItems.find(item => item.id === getActiveTab())?.label || "Dashboard"}
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
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full max-w-full"
            >
              <Outlet />
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