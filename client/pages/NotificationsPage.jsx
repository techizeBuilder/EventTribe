import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiBell, FiCheck, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchNotifications();
      // Automatically mark all notifications as read when page loads
      markAllAsReadOnLoad();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?email=${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "POST",
        },
      );
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId),
        );
        toast.success("Notification deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true })),
        );
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const markAllAsReadOnLoad = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });
      if (response.ok) {
        // Silently mark all as read without showing toast
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true })),
        );
      }
    } catch (error) {
      console.error("Error automatically marking all as read:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 text-gray-400">
          Please log in to view notifications
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="mr-4 p-2 rounded-lg bg-white bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 text-gray-300" />
            </button>
            <div className="flex items-center">
              <FiBell className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 text-white">
                Notifications
              </h1>
            </div>
          </div>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 text-gray-400">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <FiBell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-gray-400">
                No notifications yet
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white bg-gray-800 rounded-lg shadow-sm border-l-4 p-4 ${
                  notification.isRead
                    ? "border-gray-300 border-gray-600"
                    : "border-blue-500 bg-blue-50 bg-blue-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-white mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 text-gray-300 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                            title="Mark as read"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete notification"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
