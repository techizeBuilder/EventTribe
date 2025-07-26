
import { useState } from "react";
import { FiBell, FiMail, FiMessageSquare, FiCheck, FiX, FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Notifications() {
  const [notifications] = useState([
    {
      id: 1,
      type: "event",
      title: "New event registration",
      message: "Someone just registered for your JUNETEENTH MADNESS event",
      time: "2 minutes ago",
      read: false,
      icon: <FiBell className="w-5 h-5 text-blue-400" />
    },
    {
      id: 2,
      type: "payment",
      title: "Payment received",
      message: "Payment of ₹500 received for ticket sale",
      time: "1 hour ago",
      read: false,
      icon: <FiCheck className="w-5 h-5 text-green-400" />
    },
    {
      id: 3,
      type: "message",
      title: "New message",
      message: "You have a new message from an attendee",
      time: "3 hours ago",
      read: true,
      icon: <FiMessageSquare className="w-5 h-5 text-purple-400" />
    },
    {
      id: 4,
      type: "email",
      title: "Marketing campaign sent",
      message: "Your email campaign has been successfully sent to 245 subscribers",
      time: "1 day ago",
      read: true,
      icon: <FiMail className="w-5 h-5 text-yellow-400" />
    }
  ]);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventUpdates: true,
    paymentAlerts: true,
    marketingUpdates: false
  });

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/organizer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
              <p className="text-gray-400 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
              </p>
            </div>
          </div>
          <button className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors duration-200">
            Mark All Read
          </button>
        </div>
      </header>

      <div className="px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notifications List */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Notifications</h3>
                
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors duration-200 ${
                        notification.read
                          ? "bg-gray-800/50 border-gray-700"
                          : "bg-gray-800 border-gray-600"
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 p-2 bg-gray-700 rounded-lg">
                          {notification.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-semibold ${
                              notification.read ? "text-gray-300" : "text-white"
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            )}
                          </div>
                          <p className={`text-sm ${
                            notification.read ? "text-gray-400" : "text-gray-300"
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Notification Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Email Notifications</p>
                      <p className="text-gray-400 text-xs">Get notified via email</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('emailNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Push Notifications</p>
                      <p className="text-gray-400 text-xs">Browser notifications</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('pushNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Event Updates</p>
                      <p className="text-gray-400 text-xs">New registrations & updates</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('eventUpdates')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.eventUpdates ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.eventUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Payment Alerts</p>
                      <p className="text-gray-400 text-xs">Payment confirmations</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('paymentAlerts')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.paymentAlerts ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.paymentAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Marketing Updates</p>
                      <p className="text-gray-400 text-xs">Event Tribe news & tips</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('marketingUpdates')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.marketingUpdates ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.marketingUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">This Week</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">New registrations</span>
                    <span className="text-white font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Messages received</span>
                    <span className="text-white font-semibold">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Payments processed</span>
                    <span className="text-white font-semibold">8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
