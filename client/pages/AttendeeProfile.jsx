import { useState } from "react";
import { FiCamera, FiX } from "react-icons/fi";

export default function AttendeeProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profile, setProfile] = useState({
    firstName: user.firstName || "Farhan",
    lastName: user.lastName || "Attendee",
    phone: user.phone || "090565 13532",
    email: user.email || "farhanahmad1243@gmail.com",
    instagram: user.instagram || "@x.farhan___",
    address: user.address || "",
    dateOfBirth: user.dateOfBirth || "",
    pincode: user.pincode || "#000",
    gender: user.gender || "male"
  });

  const [notifications, setNotifications] = useState({
    featureUpdates: { email: false, push: false },
    opportunities: { email: false, push: false },
    weeklySales: { email: false, push: false }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (category, type) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type]
      }
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordUpdate = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    // Password update logic here
    console.log("Password updated");
    setShowPasswordModal(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Profile updated:", profile);
    // Update user data in Redux store
    // dispatch(updateUser(profile));  //Commented out due to lack of implementation
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Picture Section */}
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center">
            <FiCamera className="w-8 h-8 text-gray-700" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{user.firstName || "Farhan"} {user.lastName || "Attendee"}</h2>
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => handleProfileChange('firstName', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="First Name"
          />
        </div>
        <div>
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => handleProfileChange('lastName', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="Last Name"
          />
        </div>
        <div>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => handleProfileChange('phone', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="Phone Number"
          />
        </div>
        <div>
          <input
            type="text"
            value={profile.address}
            onChange={(e) => handleProfileChange('address', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="Address"
          />
        </div>
        <div>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="Email"
          />
        </div>
        <div>
          <input
            type="date"
            value={profile.dateOfBirth}
            onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="Date of Birth"
          />
        </div>
        <div>
          <input
            type="text"
            value={profile.instagram}
            onChange={(e) => handleProfileChange('instagram', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="Instagram Handle"
          />
        </div>
        <div>
          <input
            type="text"
            value={profile.pincode}
            onChange={(e) => handleProfileChange('pincode', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white"
            placeholder="Pincode"
          />
        </div>
      </div>

      {/* Gender Selection */}
      <div className="mb-8">
        <h3 className="text-white font-medium mb-4">Gender</h3>
        <div className="flex space-x-6">
          {['male', 'female', 'unistated'].map((gender) => (
            <label key={gender} className="flex items-center space-x-2">
              <input
                type="radio"
                name="gender"
                value={gender}
                checked={profile.gender === gender}
                onChange={(e) => handleProfileChange('gender', e.target.value)}
                className="w-4 h-4 text-white"
              />
              <span className="text-white capitalize">{gender}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications Center */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-white font-medium mb-6">Notifications Center</h3>

        {Object.entries(notifications).map(([category, settings]) => (
          <div key={category} className="flex items-center justify-between mb-4">
            <span className="text-white capitalize">
              {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm">On</span>
                <input
                  type="checkbox"
                  checked={settings.email}
                  onChange={() => handleNotificationChange(category, 'email')}
                  className="w-4 h-4"
                />
                <span className="text-gray-300 text-sm">Off</span>
              </label>
              <label className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm">On</span>
                <input
                  type="checkbox"
                  checked={settings.push}
                  onChange={() => handleNotificationChange(category, 'push')}
                  className="w-4 h-4"
                />
                <span className="text-gray-300 text-sm">Off</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-medium transition-colors">
          Delete Account
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-medium transition-colors" onClick={handleSubmit}>
          Update
        </button>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Change Your Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordUpdate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Current Password"
                  required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="New Password"
                  required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 mt-6"
              >
                UPDATE PASSWORD
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}