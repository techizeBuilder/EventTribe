import React, { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiBarChart,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiSearch,
  FiEye,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiX,
} from 'react-icons/fi';

export default function Finances() {
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState(''); // 'immediate' or 'pending'
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    reason: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    bankName: ''
  });

  // Fetch financial data
  useEffect(() => {
    fetchFinancialData();
    fetchTransactions();
    fetchPayouts();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange));
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/organizer/finances/summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange));
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/organizer/finances/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/organizer/payouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  // Open withdrawal modal
  const openWithdrawalModal = (type) => {
    const amount = type === 'immediate' 
      ? financialData?.financials?.availableBalance || 0
      : financialData?.financials?.pendingRevenue || 0;
    
    if (amount <= 0) {
      alert('No available balance for withdrawal');
      return;
    }

    setWithdrawalType(type);
    setWithdrawalForm({
      amount: amount.toString(),
      reason: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
      bankName: ''
    });
    setShowWithdrawalModal(true);
  };

  // Submit withdrawal request
  const handleSubmitWithdrawal = async () => {
    // Validate form
    if (!withdrawalForm.accountNumber || !withdrawalForm.routingNumber || 
        !withdrawalForm.accountHolderName || !withdrawalForm.bankName) {
      alert('Please fill in all bank details');
      return;
    }

    try {
      const response = await fetch('/api/organizer/withdrawals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawalForm.amount),
          type: withdrawalType,
          reason: withdrawalForm.reason,
          bankDetails: {
            accountNumber: withdrawalForm.accountNumber,
            routingNumber: withdrawalForm.routingNumber,
            accountHolderName: withdrawalForm.accountHolderName,
            bankName: withdrawalForm.bankName
          },
          method: 'bank_transfer'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Withdrawal request submitted successfully! Reference: ${data.referenceNumber}`);
        setShowWithdrawalModal(false);
        fetchPayouts();
        fetchFinancialData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      alert('Error submitting withdrawal request');
    }
  };

  // Filter transactions
  const filteredTransactions = (transactions || []).filter(transaction => {
    const matchesSearch = 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-400" />;
      case 'failed': return <FiAlertCircle className="w-4 h-4 text-red-400" />;
      default: return <FiClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-900 text-green-300';
      case 'pending': return 'bg-yellow-900 text-yellow-300';
      case 'failed': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  // Open transaction modal
  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Pagination calculations
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading financial data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Finances</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Track your revenue, payouts, and financial performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={fetchFinancialData}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base justify-center"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-900 rounded-lg">
              <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
            <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm">Total Revenue</h3>
          <p className="text-xl sm:text-2xl font-bold text-white">
            ${(financialData?.events?.totalRevenue || financialData?.financials?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-green-400 text-xs sm:text-sm mt-1">
            +30 vs last period
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-900 rounded-lg">
              <FiCreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <FiTrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-gray-400 text-sm">Available Balance (80%)</h3>
          <p className="text-2xl font-bold text-white">
            ${(financialData?.financials?.availableBalance || 0).toLocaleString()}
          </p>
          <p className="text-blue-400 text-sm mt-1">Ready for payout</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-900 rounded-lg">
              <FiBarChart className="w-6 h-6 text-purple-400" />
            </div>
            <FiTrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-gray-400 text-sm">Pending Revenue (20%)</h3>
          <p className="text-2xl font-bold text-white">
            ${(financialData?.financials?.pendingRevenue || 0).toLocaleString()}
          </p>
          <p className="text-purple-400 text-sm mt-1">Needs admin approval</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-900 rounded-lg">
              <FiBarChart className="w-6 h-6 text-orange-400" />
            </div>
            <FiTrendingDown className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="text-gray-400 text-sm">Platform Fees</h3>
          <p className="text-2xl font-bold text-white">
            ${(financialData?.financials?.platformFees || 0).toLocaleString()}
          </p>
          <p className="text-orange-400 text-sm mt-1">
            0% of gross revenue
          </p>
        </div>
      </div>


      {/* Transactions Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Transaction</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Event</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Amount</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {currentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-800 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">
                          {transaction.id || transaction._id}
                        </div>
                        <div className="text-sm text-gray-400">
                          {transaction.description || 'Ticket purchase'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">
                        {transaction.eventName || transaction.eventTitle || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">
                        {new Date(transaction.createdAt || transaction.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-green-400">
                        ${(transaction.amount || 0).toLocaleString()}
                      </div>
                      {transaction.fees && (
                        <div className="text-xs text-gray-500">
                          Fee: ${transaction.fees.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm text-gray-300 capitalize">
                          {transaction.status || 'completed'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => openTransactionModal(transaction)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        data-testid={`button-view-transaction-${transaction._id || transaction.id}`}
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <FiBarChart className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your transactions will appear here once you start selling tickets'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > transactionsPerPage && (
          <div className="p-6 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  data-testid="button-prev-page"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                        data-testid={`button-page-${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  data-testid="button-next-page"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Transaction Details</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="button-close-transaction-modal"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Transaction ID</h4>
                  <p className="text-white font-mono text-sm">{selectedTransaction.id || selectedTransaction._id}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Amount</h4>
                  <p className="text-white text-lg font-bold">${(selectedTransaction.amount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Status</h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTransaction.status)}
                    <span className="text-white capitalize">{selectedTransaction.status || 'completed'}</span>
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Date</h4>
                  <p className="text-white">{new Date(selectedTransaction.createdAt || selectedTransaction.date).toLocaleString()}</p>
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Event Details</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">Event: </span>
                    <span className="text-white">{selectedTransaction.eventName || selectedTransaction.eventTitle || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Ticket Type: </span>
                    <span className="text-white">{selectedTransaction.ticketType || 'General Admission'}</span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Customer Details</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">Name: </span>
                    <span className="text-white">{selectedTransaction.customer || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Email: </span>
                    <span className="text-white">{selectedTransaction.customerEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Details</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">Payment Method: </span>
                    <span className="text-white">{selectedTransaction.paymentMethod || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Currency: </span>
                    <span className="text-white">{selectedTransaction.currency || 'USD'}</span>
                  </div>
                  {selectedTransaction.paymentIntentId && (
                    <div>
                      <span className="text-gray-400 text-sm">Payment Intent ID: </span>
                      <span className="text-white font-mono text-sm">{selectedTransaction.paymentIntentId}</span>
                    </div>
                  )}
                  {selectedTransaction.bookingId && (
                    <div>
                      <span className="text-gray-400 text-sm">Booking ID: </span>
                      <span className="text-white font-mono text-sm">{selectedTransaction.bookingId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                data-testid="button-close-transaction-detail"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Request Withdrawal
            </h3>
            <p className="text-gray-300 mb-4">
              Available balance: ${parseFloat(withdrawalForm.amount || 0).toLocaleString()}
            </p>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  readOnly={withdrawalType === 'immediate'}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={withdrawalForm.reason}
                  onChange={(e) => setWithdrawalForm({...withdrawalForm, reason: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Reason for withdrawal..."
                  rows="3"
                />
              </div>

              {/* Bank Details */}
              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-lg font-semibold text-white mb-3">Bank Details</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={withdrawalForm.accountNumber}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, accountNumber: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Account Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      value={withdrawalForm.routingNumber}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, routingNumber: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Routing Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={withdrawalForm.accountHolderName}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, accountHolderName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Account Holder Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={withdrawalForm.bankName}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, bankName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Bank Name"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithdrawal}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}