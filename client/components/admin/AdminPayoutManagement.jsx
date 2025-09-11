import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPayoutManagement() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPlatformFees: 0,
    totalOrganizationPayouts: 0,
    pendingWithdrawals: 0,
    monthlyRevenue: 0,
    monthlyPayouts: 0,
    pendingRequestsCount: 0,
    approvedRequestsCount: 0,
    rejectedRequestsCount: 0,
    currentMonth: "",
  });
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ action: "", remarks: "" });
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchStats();
    fetchWithdrawalRequests();
  }, [currentPage, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/payout/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching payout stats:", error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/admin/payout/withdrawal-requests?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setWithdrawalRequests(data.requests);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (request, action) => {
    setSelectedRequest(request);
    setReviewForm({ action, remarks: "" });
    setReviewModal(true);
  };

  const submitReview = async () => {
    try {
      setSubmittingReview(true);

      const response = await fetch(
        `/api/admin/payout/withdrawal-requests/${selectedRequest._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            action: reviewForm.action,
            remarks: reviewForm.remarks,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(`Request ${reviewForm.action}ed successfully!`);
        setReviewModal(false);
        setSelectedRequest(null);
        setReviewForm({ action: "", remarks: "" });
        fetchStats();
        fetchWithdrawalRequests();
      } else {
        toast.error(data.error || `Failed to ${reviewForm.action} request`);
      }
    } catch (error) {
      console.error("Error reviewing request:", error);
      toast.error(`Failed to ${reviewForm.action} request`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock, text: "Pending Review" },
      approved: { color: "bg-green-500", icon: CheckCircle, text: "Approved" },
      rejected: { color: "bg-red-500", icon: XCircle, text: "Rejected" },
      processed: { color: "bg-blue-500", icon: CheckCircle, text: "Processed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: "bg-gray-500",
      medium: "bg-yellow-500",
      high: "bg-red-500",
    };

    const safePriority = priority || "medium";

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${colors[safePriority] || colors.medium}`}
      >
        {safePriority.toUpperCase()}
      </span>
    );
  };

  if (loading && withdrawalRequests.length === 0) {
    return (
      <div className="p-6" data-testid="admin-payout-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="admin-payout-management">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 text-white">
          Payout Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and approve withdrawal requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          data-testid="stat-total-revenue"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                ${stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">
                This month: ${stats.monthlyRevenue.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          data-testid="stat-pending-requests"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Pending Requests
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingRequestsCount}
              </p>
              <p className="text-xs text-gray-400">
                Amount: ${stats.pendingWithdrawals.toFixed(2)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          data-testid="stat-approved-requests"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Approved This Month
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approvedRequestsCount}
              </p>
              <p className="text-xs text-gray-400">
                Total payouts: ${stats.totalOrganizationPayouts.toFixed(2)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          data-testid="stat-platform-fees"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Platform Fees</p>
              <p className="text-2xl font-bold text-blue-600">
                ${stats.totalPlatformFees.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">Revenue percentage</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters and Requests */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white">
            Withdrawal Requests
          </h2>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-400">Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-600 rounded-md bg-gray-700 text-white text-sm"
              data-testid="filter-status"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
            </select>
          </div>
        </div>

        {withdrawalRequests.length === 0 ? (
          <div
            className="text-center py-12 text-gray-400"
            data-testid="no-requests"
          >
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No withdrawal requests found</p>
            <p className="text-sm">
              Requests will appear here when organizations submit them
            </p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="requests-list">
            {withdrawalRequests.map((request, index) => (
              <div
                key={request._id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-800"
                data-testid={`request-${index}`}
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <h3
                          className="font-medium text-white"
                          data-testid={`org-name-${index}`}
                        >
                          {request.organization?.name || "Unknown Organization"}
                        </h3>
                        <p
                          className="text-sm text-gray-400"
                          data-testid={`request-date-${index}`}
                        >
                          Requested:{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-300">
                          <strong>Amount:</strong> $
                          {(request.requestedAmount || 0).toFixed(2)}
                        </p>
                        <p className="text-gray-300">
                          <strong>Available Balance:</strong> $
                          {(request.availableBalance || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300">
                          <strong>Bank:</strong>{" "}
                          {request.bankDetails?.bankName || "N/A"}
                        </p>
                        <p className="text-gray-300">
                          <strong>Account:</strong> ****
                          {(request.bankDetails?.accountNumber || "0000").slice(
                            -4,
                          )}
                        </p>
                      </div>
                    </div>

                    {request.reason && (
                      <p
                        className="text-sm text-gray-300 mt-2"
                        data-testid={`reason-${index}`}
                      >
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    )}

                    {request.adminRemarks && (
                      <p
                        className="text-sm text-blue-400 mt-2"
                        data-testid={`admin-remarks-${index}`}
                      >
                        <strong>Admin Remarks:</strong> {request.adminRemarks}
                      </p>
                    )}

                    {request.rejectionReason && (
                      <p
                        className="text-sm text-red-400 mt-2"
                        data-testid={`rejection-reason-${index}`}
                      >
                        <strong>Rejection Reason:</strong>{" "}
                        {request.rejectionReason}
                      </p>
                    )}
                  </div>

                  {request.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleReviewRequest(request, "approve")}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        data-testid={`button-approve-${index}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewRequest(request, "reject")}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        data-testid={`button-reject-${index}`}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex justify-center items-center gap-2 mt-6"
            data-testid="pagination"
          >
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              {reviewForm.action === "approve" ? "Approve" : "Reject"}{" "}
              Withdrawal Request
            </h2>

            <div className="space-y-4">
              <div className="text-sm text-gray-300">
                <p>
                  <strong>Organization:</strong>{" "}
                  {selectedRequest.organization?.name}
                </p>
                <p>
                  <strong>Amount:</strong> $
                  {(selectedRequest.requestedAmount || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Bank:</strong>{" "}
                  {selectedRequest.bankDetails?.bankName || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {reviewForm.action === "approve"
                    ? "Approval Remarks"
                    : "Rejection Reason"}
                </label>
                <textarea
                  value={reviewForm.remarks}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder={
                    reviewForm.action === "approve"
                      ? "Optional remarks..."
                      : "Reason for rejection..."
                  }
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  data-testid="review-remarks"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setReviewModal(false);
                  setSelectedRequest(null);
                  setReviewForm({ action: "", remarks: "" });
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                data-testid="button-cancel-review"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                  reviewForm.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
                data-testid="button-submit-review"
              >
                {submittingReview
                  ? "Processing..."
                  : reviewForm.action === "approve"
                    ? "Approve"
                    : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
