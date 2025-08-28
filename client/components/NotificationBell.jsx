import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NotificationBell = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.email) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notifications/unread-count?email=${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleBellClick = () => {
    navigate('/notifications');
  };

  if (!user) return null;

  return (
    <div className="relative cursor-pointer" onClick={handleBellClick}>
      <FiBell className="w-6 h-6 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;