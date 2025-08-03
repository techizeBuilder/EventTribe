import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiUsers, 
  FiSearch, 
  FiFilter,
  FiEdit,
  FiTrash2,
  FiEye,
  FiUserPlus,
  FiDownload,
  FiMoreVertical,
  FiX,
  FiSave,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiDollarSign
} from "react-icons/fi";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Modal states
  const [viewModal, setViewModal] = useState({ isOpen: false, user: null });
  const [editModal, setEditModal] = useState({ isOpen: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [createModal, setCreateModal] = useState({ isOpen: false });
  
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    status: ''
  });
  const [createForm, setCreateForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'attendee',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleViewUser = async (user) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        setViewModal({ isOpen: true, user: userData });
      } else {
        toast.error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const handleEditUser = async (user) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        setEditForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'attendee',
          status: userData.status || 'pending'
        });
        setEditModal({ isOpen: true, user: userData });
      } else {
        toast.error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteModal({ isOpen: true, user });
  };

  const handleCreateUser = () => {
    setCreateForm({
      email: '',
      firstName: '',
      lastName: '',
      role: 'attendee',
      password: ''
    });
    setCreateModal({ isOpen: true });
  };

  const handleViewEarnings = (user) => {
    // Navigate to earnings page
    window.open(`/admin/dashboard/earnings/${user.id}`, '_blank');
  };

  const confirmDelete = async () => {
    if (!deleteModal.user) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteModal.user.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== deleteModal.user.id));
        toast.success("User deleted successfully");
        setDeleteModal({ isOpen: false, user: null });
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editModal.user) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${editModal.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        // Update local state
        setUsers(users.map(user => 
          user.id === editModal.user.id 
            ? { ...user, ...editForm, name: `${editForm.firstName} ${editForm.lastName}`.trim() }
            : user
        ));
        toast.success("User updated successfully");
        setEditModal({ isOpen: false, user: null });
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success("User created successfully");
        setCreateModal({ isOpen: false });
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, status: newStatus } : u
        ));
        toast.success(`User status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, role: newRole } : u
        ));
        toast.success(`User role updated to ${newRole}`);
      } else {
        toast.error("Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "suspended": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "organizer": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "attendee": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <p className="text-gray-400 mt-1">Manage all platform users</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleCreateUser}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FiUserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FiFilter className="text-gray-400 w-5 h-5" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="organizer">Organizer</option>
              <option value="attendee">Attendee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">User</th>
                <th className="text-left p-4 text-gray-300 font-medium">Role</th>
                <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                <th className="text-left p-4 text-gray-300 font-medium">Verification</th>
                <th className="text-left p-4 text-gray-300 font-medium">Joined</th>
                <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                        </p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-gray-400 text-sm">Email</span>
                      <span className={`w-2 h-2 rounded-full ${user.phoneVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-gray-400 text-sm">Phone</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm">
                      {user.createdAt && !isNaN(new Date(user.createdAt)) ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded"
                        title="View User"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-green-400 hover:text-green-300 p-1 rounded"
                        title="Edit User"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-400 hover:text-red-300 p-1 rounded"
                        title="Delete User"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      {user.role === 'organizer' && (
                        <button 
                          onClick={() => handleViewEarnings(user)}
                          className="text-yellow-400 hover:text-yellow-300 p-1 rounded"
                          title="View Organization Earnings"
                        >
                          <FiDollarSign className="w-4 h-4" />
                        </button>
                      )}
                      <div className="relative">
                        <button 
                          onClick={() => handleStatusChange(user, user.status === 'active' ? 'suspended' : 'active')}
                          className="text-gray-400 hover:text-gray-300 p-1 rounded"
                          title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                        >
                          <FiMoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700"
          >
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">User Profile</h2>
                    <p className="text-gray-300 text-sm">Complete user information</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal({ isOpen: false, user: null })}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-all duration-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {viewModal.user && (
              <div className="p-6 space-y-6">
                {/* User Avatar & Basic Info */}
                <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {viewModal.user.firstName ? viewModal.user.firstName.charAt(0) : viewModal.user.email.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {viewModal.user.name || 'Unnamed User'}
                    </h3>
                    <p className="text-gray-300 text-sm">{viewModal.user.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(viewModal.user.role)}`}>
                        {viewModal.user.role}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(viewModal.user.status)}`}>
                        {viewModal.user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-600 pb-2">
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FiUserCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Full Name</p>
                          <p className="text-white font-medium">
                            {viewModal.user.firstName && viewModal.user.lastName 
                              ? `${viewModal.user.firstName} ${viewModal.user.lastName}` 
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <FiShield className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Phone Number</p>
                          <p className="text-white font-medium">
                            {viewModal.user.phoneNumber || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-600 pb-2">
                      Account Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <FiUserPlus className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Member Since</p>
                          <p className="text-white font-medium">
                            {viewModal.user.joinDate && !isNaN(new Date(viewModal.user.joinDate)) 
                              ? new Date(viewModal.user.joinDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <FiEye className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Last Active</p>
                          <p className="text-white font-medium">
                            {viewModal.user.lastLogin && !isNaN(new Date(viewModal.user.lastLogin)) 
                              ? new Date(viewModal.user.lastLogin).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600">
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                    Verification Status
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${viewModal.user.emailVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-white text-sm">Email Verification</span>
                    </div>
                    <span className={`text-xs font-medium ${viewModal.user.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                      {viewModal.user.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${viewModal.user.phoneVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-white text-sm">Phone Verification</span>
                    </div>
                    <span className={`text-xs font-medium ${viewModal.user.phoneVerified ? 'text-green-400' : 'text-red-400'}`}>
                      {viewModal.user.phoneVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setViewModal({ isOpen: false, user: null })}
                  className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewModal({ isOpen: false, user: null });
                    handleEditUser(viewModal.user);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <FiEdit className="w-4 h-4" />
                  <span>Edit User</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button
                onClick={() => setEditModal({ isOpen: false, user: null })}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                >
                  <option value="attendee">Attendee</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, user: null })}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Delete User</h2>
              <button
                onClick={() => setDeleteModal({ isOpen: false, user: null })}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, user: null })}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FiTrash2 className="w-4 h-4" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create New User</h2>
              <button
                onClick={() => setCreateModal({ isOpen: false })}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateNewUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                >
                  <option value="attendee">Attendee</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCreateModal({ isOpen: false })}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiUserPlus className="w-4 h-4" />
                  )}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
}