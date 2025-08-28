import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiSettings, 
  FiSave,
  FiMail,
  FiShield,
  FiGlobe,
  FiDollarSign,
  FiBell,
  FiDatabase,
  FiKey,
  FiToggleLeft,
  FiToggleRight
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    general: {
      siteName: "Event Tribe",
      siteDescription: "Your premier event management platform",
      contactEmail: "admin@eventtribe.com",
      maxEventsPerUser: 10,
      defaultCurrency: "USD",
      timezone: "America/New_York"
    },
    security: {
      requireEmailVerification: true,
      requirePhoneVerification: false,
      enableTwoFactorAuth: true,
      passwordMinLength: 8,
      sessionTimeout: 30,
      maxLoginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      marketingEmails: false,
      systemAlerts: true,
      eventReminders: true
    },
    payments: {
      stripeEnabled: true,
      paypalEnabled: false,
      platformFee: 5.0,
      processingFee: 2.9,
      payoutSchedule: "weekly",
      minimumPayout: 50
    },
    api: {
      rateLimit: 1000,
      enableApiKeys: true,
      webhookUrl: "",
      apiVersion: "v1"
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleToggle = (section, field) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success("Settings updated successfully!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const settingsTabs = [
    { id: "general", label: "General", icon: FiSettings },
    { id: "security", label: "Security", icon: FiShield }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Site Name
          </label>
          <input
            type="text"
            value={settings.general.siteName}
            onChange={(e) => handleInputChange("general", "siteName", e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={settings.general.contactEmail}
            onChange={(e) => handleInputChange("general", "contactEmail", e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Site Description
        </label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => handleInputChange("general", "siteDescription", e.target.value)}
          rows={3}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Events Per User
          </label>
          <input
            type="number"
            value={settings.general.maxEventsPerUser}
            onChange={(e) => handleInputChange("general", "maxEventsPerUser", parseInt(e.target.value))}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Default Currency
          </label>
          <select
            value={settings.general.defaultCurrency}
            onChange={(e) => handleInputChange("general", "defaultCurrency", e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleInputChange("general", "timezone", e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">GMT</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Email Verification</p>
              <p className="text-gray-400 text-sm">Require email verification for new accounts</p>
            </div>
            <button
              onClick={() => handleToggle("security", "requireEmailVerification")}
              className="flex items-center"
            >
              {settings.security.requireEmailVerification ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Phone Verification</p>
              <p className="text-gray-400 text-sm">Require phone verification for new accounts</p>
            </div>
            <button
              onClick={() => handleToggle("security", "requirePhoneVerification")}
              className="flex items-center"
            >
              {settings.security.requirePhoneVerification ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-gray-400 text-sm">Enable 2FA for enhanced security</p>
            </div>
            <button
              onClick={() => handleToggle("security", "enableTwoFactorAuth")}
              className="flex items-center"
            >
              {settings.security.enableTwoFactorAuth ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password Minimum Length
            </label>
            <input
              type="number"
              value={settings.security.passwordMinLength}
              onChange={(e) => handleInputChange("security", "passwordMinLength", parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleInputChange("security", "sessionTimeout", parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              value={settings.security.maxLoginAttempts}
              onChange={(e) => handleInputChange("security", "maxLoginAttempts", parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-gray-400 text-sm">Send email notifications to users</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "emailNotifications")}
              className="flex items-center"
            >
              {settings.notifications.emailNotifications ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">SMS Notifications</p>
              <p className="text-gray-400 text-sm">Send SMS notifications to users</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "smsNotifications")}
              className="flex items-center"
            >
              {settings.notifications.smsNotifications ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Push Notifications</p>
              <p className="text-gray-400 text-sm">Send push notifications to users</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "pushNotifications")}
              className="flex items-center"
            >
              {settings.notifications.pushNotifications ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Marketing Emails</p>
              <p className="text-gray-400 text-sm">Send marketing emails to users</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "marketingEmails")}
              className="flex items-center"
            >
              {settings.notifications.marketingEmails ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">System Alerts</p>
              <p className="text-gray-400 text-sm">Send system alerts to admins</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "systemAlerts")}
              className="flex items-center"
            >
              {settings.notifications.systemAlerts ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Event Reminders</p>
              <p className="text-gray-400 text-sm">Send event reminders to attendees</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "eventReminders")}
              className="flex items-center"
            >
              {settings.notifications.eventReminders ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Stripe Integration</p>
              <p className="text-gray-400 text-sm">Enable Stripe payment processing</p>
            </div>
            <button
              onClick={() => handleToggle("payments", "stripeEnabled")}
              className="flex items-center"
            >
              {settings.payments.stripeEnabled ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">PayPal Integration</p>
              <p className="text-gray-400 text-sm">Enable PayPal payment processing</p>
            </div>
            <button
              onClick={() => handleToggle("payments", "paypalEnabled")}
              className="flex items-center"
            >
              {settings.payments.paypalEnabled ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Platform Fee (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.payments.platformFee}
              onChange={(e) => handleInputChange("payments", "platformFee", parseFloat(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Processing Fee (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.payments.processingFee}
              onChange={(e) => handleInputChange("payments", "processingFee", parseFloat(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Payout Schedule
            </label>
            <select
              value={settings.payments.payoutSchedule}
              onChange={(e) => handleInputChange("payments", "payoutSchedule", e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minimum Payout ($)
            </label>
            <input
              type="number"
              value={settings.payments.minimumPayout}
              onChange={(e) => handleInputChange("payments", "minimumPayout", parseFloat(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={settings.api.rateLimit}
              onChange={(e) => handleInputChange("api", "rateLimit", parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Version
            </label>
            <select
              value={settings.api.apiVersion}
              onChange={(e) => handleInputChange("api", "apiVersion", e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="v1">Version 1</option>
              <option value="v2">Version 2</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">API Keys</p>
              <p className="text-gray-400 text-sm">Enable API key authentication</p>
            </div>
            <button
              onClick={() => handleToggle("api", "enableApiKeys")}
              className="flex items-center"
            >
              {settings.api.enableApiKeys ? (
                <FiToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={settings.api.webhookUrl}
              onChange={(e) => handleInputChange("api", "webhookUrl", e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "general": return renderGeneralSettings();
      case "security": return renderSecuritySettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
          <p className="text-gray-400 mt-1">Configure platform-wide settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          <span>Save Settings</span>
        </button>
      </div>

      {/* Settings Navigation */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-700">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                activeTab === tab.id
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}