import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiMail,
  FiMessageSquare,
  FiShare2,
  FiPercent,
  FiPlay,
  FiPause,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiFilter,
} from "react-icons/fi";

export default function Marketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch campaigns from API
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/organizer/marketing/campaigns", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create new campaign
  const handleCreateCampaign = async (campaignData) => {
    try {
      const response = await fetch("/api/organizer/marketing/campaigns", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        const newCampaign = await response.json();
        setCampaigns((prev) => [newCampaign, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  // Launch campaign
  const handleLaunchCampaign = async (campaignId) => {
    try {
      const response = await fetch(
        `/api/organizer/marketing/campaigns/${campaignId}/launch`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        fetchCampaigns(); // Refresh campaigns list
      }
    } catch (error) {
      console.error("Error launching campaign:", error);
    }
  };

  // Pause campaign
  const handlePauseCampaign = async (campaignId) => {
    try {
      const response = await fetch(
        `/api/organizer/marketing/campaigns/${campaignId}/pause`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        fetchCampaigns(); // Refresh campaigns list
      }
    } catch (error) {
      console.error("Error pausing campaign:", error);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(
        `/api/organizer/marketing/campaigns/${campaignId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        setCampaigns((prev) =>
          prev.filter((campaign) => campaign._id !== campaignId),
        );
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || campaign.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get campaign type icon
  const getCampaignIcon = (type) => {
    switch (type) {
      case "email":
        return <FiMail className="w-5 h-5" />;
      case "sms":
        return <FiMessageSquare className="w-5 h-5" />;
      case "social":
        return <FiShare2 className="w-5 h-5" />;
      case "discount":
        return <FiPercent className="w-5 h-5" />;
      default:
        return <FiTrendingUp className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Marketing</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage your marketing campaigns and promotions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Create Campaign</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total Campaigns</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {campaigns.length}
              </p>
            </div>
            <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Active Campaigns</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {campaigns.filter((c) => c.status === "active").length}
              </p>
            </div>
            <FiPlay className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total Reach</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {campaigns
                  .reduce((sum, c) => sum + (c.reach || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total Clicks</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {campaigns
                  .reduce((sum, c) => sum + (c.clicks || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <FiEye className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400 w-5 h-5" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="social">Social</option>
            <option value="discount">Discount</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
            >
              {/* Campaign Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    {getCampaignIcon(campaign.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {campaign.type} Campaign
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    campaign.status === "active"
                      ? "bg-green-900 text-green-300"
                      : campaign.status === "draft"
                        ? "bg-gray-700 text-gray-300"
                        : campaign.status === "paused"
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-blue-900 text-blue-300"
                  }`}
                >
                  {campaign.status?.charAt(0).toUpperCase() +
                    campaign.status?.slice(1)}
                </span>
              </div>

              {/* Campaign Description */}
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {campaign.description || "No description available"}
              </p>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-xs">Reach</p>
                  <p className="text-white font-semibold">
                    {(campaign.reach || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Clicks</p>
                  <p className="text-white font-semibold">
                    {(campaign.clicks || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">CTR</p>
                  <p className="text-white font-semibold">
                    {campaign.reach > 0
                      ? ((campaign.clicks / campaign.reach) * 100).toFixed(1)
                      : "0"}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Budget</p>
                  <p className="text-white font-semibold">
                    ${(campaign.budget || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Campaign Dates */}
              {campaign.startDate && (
                <div className="text-xs text-gray-500 mb-4">
                  {campaign.status === "active" ? "Started" : "Scheduled"}:{" "}
                  {new Date(campaign.startDate).toLocaleDateString()}
                  {campaign.endDate && (
                    <>
                      {" "}
                      • Ends: {new Date(campaign.endDate).toLocaleDateString()}
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    /* View campaign stats */
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium text-nowrap transition-colors flex items-center justify-center gap-2"
                >
                  <FiEye className="w-4 h-4" />
                  View
                </button>

                {campaign.status === "draft" && (
                  <button
                    onClick={() => handleLaunchCampaign(campaign._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiPlay className="w-4 h-4" />
                  </button>
                )}

                {campaign.status === "active" && (
                  <button
                    onClick={() => handlePauseCampaign(campaign._id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiPause className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    /* Edit campaign */
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteCampaign(campaign._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FiTrendingUp className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            No campaigns found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || typeFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first marketing campaign"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <FiPlus className="w-5 h-5" />
            Create Your First Campaign
          </button>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCampaign}
        />
      )}
    </div>
  );
}

// Create Campaign Modal Component
function CreateCampaignModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "email",
    targetAudience: "",
    budget: "",
    startDate: "",
    endDate: "",
    content: "",
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Create New Campaign</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Name
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
              Campaign Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="email">Email Campaign</option>
              <option value="sms">SMS Campaign</option>
              <option value="social">Social Media Campaign</option>
              <option value="discount">Discount Campaign</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleChange}
              placeholder="e.g., All subscribers, Event attendees, VIP customers"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                step="0.01"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={4}
              placeholder="Enter your campaign message or content..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Campaign
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
