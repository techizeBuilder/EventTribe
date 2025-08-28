import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiUsers,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiEdit3,
  FiTrash2,
  FiUserPlus,
  FiDownload,
  FiUpload,
  FiFilter,
  FiTag,
  FiTrendingUp,
} from "react-icons/fi";

export default function Audience() {
  const [contacts, setContacts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Fetch contacts and segments from API
  useEffect(() => {
    fetchContacts();
    fetchSegments();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/organizer/audience/contacts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch("/api/organizer/audience/segments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSegments(data);
      }
    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  // Create new contact
  const handleCreateContact = async (contactData) => {
    try {
      const response = await fetch("/api/organizer/audience/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });

      if (response.ok) {
        const newContact = await response.json();
        setContacts((prev) => [newContact, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Error creating contact:", error);
    }
  };

  // Create new segment
  const handleCreateSegment = async (segmentData) => {
    try {
      const response = await fetch("/api/organizer/audience/segments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(segmentData),
      });

      if (response.ok) {
        const newSegment = await response.json();
        setSegments((prev) => [newSegment, ...prev]);
        setShowSegmentModal(false);
      }
    } catch (error) {
      console.error("Error creating segment:", error);
    }
  };

  // Delete contact
  const handleDeleteContact = async (contactId) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(
        `/api/organizer/audience/contacts/${contactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        setContacts((prev) =>
          prev.filter((contact) => contact._id !== contactId),
        );
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "subscribed" && contact.subscribed) ||
      (statusFilter === "unsubscribed" && !contact.subscribed);

    const matchesSegment =
      segmentFilter === "all" || contact.segments?.includes(segmentFilter);

    return matchesSearch && matchesStatus && matchesSegment;
  });

  // Handle contact selection
  const handleSelectContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const handleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === filteredContacts.length
        ? []
        : filteredContacts.map((contact) => contact._id),
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading audience...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Audience</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage your contacts and audience segments
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSegmentModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FiTag className="w-4 h-4" />
            <span className="hidden sm:inline">Create Segment</span>
            <span className="sm:hidden">Create</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Audience Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total Contacts</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{contacts.length}</p>
            </div>
            <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Subscribed</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {contacts.filter((c) => c.subscribed).length}
              </p>
            </div>
            <FiMail className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total Segments</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{segments.length}</p>
            </div>
            <FiTag className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Avg. Spent</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                $
                {contacts.length > 0
                  ? (
                      contacts.reduce(
                        (sum, c) => sum + (c.totalSpent || 0),
                        0,
                      ) / contacts.length
                    ).toFixed(0)
                  : "0"}
              </p>
            </div>
            <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FiFilter className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
          >
            <option value="all">All Status</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
          >
            <option value="all">All Segments</option>
            {segments.map((segment) => (
              <option key={segment._id} value={segment._id}>
                {segment.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors">
            <FiUpload className="w-4 h-4" />
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors">
            <FiDownload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="bg-blue-900 border border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-200">
            {selectedContacts.length} contact
            {selectedContacts.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Add to Segment
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      {filteredContacts.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      checked={
                        selectedContacts.length === filteredContacts.length &&
                        filteredContacts.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Contact
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Location
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Events
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Spent
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Status
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className="hover:bg-gray-800 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact._id)}
                        onChange={() => handleSelectContact(contact._id)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="text-sm text-gray-400">
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">
                        {contact.city && contact.country
                          ? `${contact.city}, ${contact.country}`
                          : contact.country || "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">
                        {contact.totalEvents || 0} events
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-green-400">
                        ${(contact.totalSpent || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          contact.subscribed
                            ? "bg-green-900 text-green-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {contact.subscribed ? "Subscribed" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            /* Edit contact */
                          }}
                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact._id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FiUsers className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            No contacts found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== "all" || segmentFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Start building your audience by adding contacts"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-6 text-xs sm:text-sm py-3 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <FiUserPlus className="w-5 h-5" />
            Add Your First Contact
          </button>
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreateModal && (
        <CreateContactModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateContact}
        />
      )}

      {/* Create Segment Modal */}
      {showSegmentModal && (
        <CreateSegmentModal
          onClose={() => setShowSegmentModal(false)}
          onCreate={handleCreateSegment}
        />
      )}
    </div>
  );
}

// Create Contact Modal Component
function CreateContactModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    subscribed: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Add New Contact</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="subscribed"
              checked={formData.subscribed}
              onChange={handleChange}
              className="rounded bg-gray-700 border-gray-600 mr-2"
            />
            <label className="text-sm text-gray-300">
              Subscribe to marketing emails
            </label>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Add Contact
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Segment Modal Component
function CreateSegmentModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    criteria: {
      totalSpent: "",
      totalEvents: "",
      location: "",
      subscribed: "all",
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCriteriaChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [e.target.name]: e.target.value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            Create Audience Segment
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Segment Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Criteria</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Spent ($)
                </label>
                <input
                  type="number"
                  name="totalSpent"
                  value={formData.criteria.totalSpent}
                  onChange={handleCriteriaChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Events
                </label>
                <input
                  type="number"
                  name="totalEvents"
                  value={formData.criteria.totalEvents}
                  onChange={handleCriteriaChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.criteria.location}
                onChange={handleCriteriaChange}
                placeholder="e.g., New York, USA"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subscription Status
              </label>
              <select
                name="subscribed"
                value={formData.criteria.subscribed}
                onChange={handleCriteriaChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="true">Subscribed Only</option>
                <option value="false">Unsubscribed Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Segment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
