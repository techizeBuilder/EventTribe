
import { useState } from "react";
import { FiCamera, FiUpload, FiSave, FiArrowLeft, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function EditProfile() {
  const [profileForm, setProfileForm] = useState({
    firstName: "Farhan",
    lastName: "Akhtar",
    contactNumber: "",
    location: "",
    organizationName: "Farhan's Organization",
    email: "akhtarfarhan281@gmail.com",
    instagramUsername: "",
    profileColor: "#3B82F6",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = () => {
    console.log("Updating profile:", profileForm);
    // Add your profile update logic here
  };

  const handlePasswordUpdate = () => {
    console.log("Updating password:", passwordForm);
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    // Add your password update logic here
  };

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
              <FiArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
              <p className="text-gray-400 text-sm">
                Update your personal information and settings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Change Password
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">
                  Profile Picture
                </h3>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white cursor-pointer transition-all duration-200 group-hover:scale-105"
                      style={{ backgroundColor: profileForm.profileColor }}
                    >
                      {profileForm.firstName.charAt(0)}
                      <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <FiCamera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-gray-400 text-sm mb-2">
                      Profile Color
                    </label>
                    <input
                      type="color"
                      name="profileColor"
                      value={profileForm.profileColor}
                      onChange={handleInputChange}
                      className="w-full h-12 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-3">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">
                  Personal Information
                </h3>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateProfile();
                }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-3">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-3">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-3">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-3">
                        Contact Number
                      </label>
                      <div className="flex">
                        <span className="bg-gray-700 border border-r-0 border-gray-600 rounded-l-lg px-3 py-3 text-gray-300 text-sm">
                          🇺🇸 +1
                        </span>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={profileForm.contactNumber}
                          onChange={handleInputChange}
                          className="flex-1 bg-gray-800 border border-gray-600 rounded-r-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-3">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={profileForm.location}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Enter your location"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-3">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        name="organizationName"
                        value={profileForm.organizationName}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Enter organization name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-3">
                        Instagram Username
                      </label>
                      <div className="flex">
                        <span className="bg-gray-700 border border-r-0 border-gray-600 rounded-l-lg px-3 py-3 text-gray-300">
                          @
                        </span>
                        <input
                          type="text"
                          name="instagramUsername"
                          value={profileForm.instagramUsername}
                          onChange={handleInputChange}
                          className="flex-1 bg-gray-800 border border-gray-600 rounded-r-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="your_username"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      <FiSave className="w-4 h-4" />
                      <span>Update Profile</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
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
              className="space-y-5"
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
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Confirm New Password"
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
