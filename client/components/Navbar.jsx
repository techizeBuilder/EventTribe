import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import { logoutUser } from "../store/slices/authSlice";
import toast from "react-hot-toast";
import CartIcon from "./CartIcon";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const getFirstLetter = (name) => {
    if (name) return name.charAt(0).toUpperCase();
    return "U";
  };

  const baseNavItems = [
    { id: "home", label: "HOME", path: "/" },
    { id: "about", label: "ABOUT", path: "/about" },
    { id: "events", label: "EVENTS", path: "/events" },
  ];

  const authNavItems = [
    { id: "login", label: "LOGIN", path: "/login" },
    { id: "signup", label: "SIGNUP", path: "/signup" },
  ];

  return (
    <motion.nav
      className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 font-sans"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/")}
          >
            <img
              src="/logo.png"
              alt="Event Tribe"
              className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto object-contain hover:opacity-90 transition-opacity duration-200"
            />
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="ml-4 lg:ml-10 flex items-center space-x-1 lg:space-x-2">
              {/* Base Navigation Items */}
              {baseNavItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Link
                    to={item.path}
                    className="relative px-2 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 backdrop-blur-sm border border-transparent hover:border-slate-600/50 group overflow-hidden"
                  >
                    <span className="relative z-10">{item.label}</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      layoutId="navbar-hover"
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-slate-400 to-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                    />
                  </Link>
                </motion.div>
              ))}

              {/* User Authentication Section */}
              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="ml-2 p-2"
                  >
                    <NotificationBell />
                  </motion.div>

                  {/* Shopping Cart Icon */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.3,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <CartIcon />
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.4,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Link
                      to="/attendee-dashboard"
                      className="relative px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 backdrop-blur-sm border border-transparent hover:border-slate-600/50 group overflow-hidden"
                    >
                      <span className="relative z-10">My Tickets</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        layoutId="navbar-hover"
                      />
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-slate-400 to-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                      />
                    </Link>
                  </motion.div>
                  <div className="relative ml-4">
                    <motion.button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center rounded-full bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-500 hover:from-slate-600 hover:to-slate-500 hover:border-slate-400 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {getFirstLetter(user?.name || user?.email)}
                        </span>
                      </div>
                    </motion.button>

                    {/* User Dropdown Menu */}
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                      >
                        <div className="py-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-left"
                          >
                            <FiLogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                /* Auth Buttons */
                authNavItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: (baseNavItems.length + index) * 0.1,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Link
                      to={item.path}
                      className="relative px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 text-white border border-slate-500 hover:from-slate-600 hover:to-slate-500 hover:border-slate-400 shadow-lg hover:shadow-xl group overflow-hidden"
                    >
                      <span className="relative z-10">{item.label}</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        layoutId="navbar-hover"
                      />
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white p-2 cursor-pointer hover:bg-slate-800 rounded-md transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div
            className="lg:hidden border-t border-slate-700/50 bg-slate-900/98 backdrop-blur-md"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="px-4 pt-4 pb-6 space-y-3 sm:px-6">
              {/* User Info Section (Mobile) */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600 rounded-xl mb-4"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {getFirstLetter(user?.name || user?.email)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {user?.name || user?.email?.split("@")[0] || "User"}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Base Navigation Items */}
              {baseNavItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-base font-semibold w-full text-left transition-all duration-300 tracking-wide rounded-xl cursor-pointer border-l-4 border-transparent hover:border-slate-400 text-slate-300 hover:text-white hover:bg-slate-800/70 backdrop-blur-sm hover:shadow-lg group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      {item.label}
                      <motion.span
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        →
                      </motion.span>
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      layoutId="mobile-hover"
                    />
                  </Link>
                </motion.div>
              ))}

              {/* Auth or User Actions */}
              {isAuthenticated ? (
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-base font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all duration-300 w-full text-left"
                    >
                      <FiLogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                </div>
              ) : (
                authNavItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: (baseNavItems.length + index) * 0.1,
                      type: "spring",
                      stiffness: 300,
                    }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-base font-semibold w-full text-left transition-all duration-300 tracking-wide rounded-xl cursor-pointer border-l-4 border-transparent hover:border-slate-400 bg-gradient-to-r from-slate-800/80 to-slate-700/80 text-white border border-slate-600 hover:from-slate-700/80 hover:to-slate-600/80 hover:border-slate-500 shadow-lg group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center">
                        {item.label}
                        <motion.span
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                        >
                          →
                        </motion.span>
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        layoutId="mobile-hover"
                      />
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>

    </motion.nav>
  );
}
