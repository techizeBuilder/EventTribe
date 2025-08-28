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
} from 'react-icons/fi';

export default function Finances() {
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
        setTransactions(data);
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

  // Request payout
  const handleRequestPayout = async () => {
    try {
      const response = await fetch('/api/organizer/payouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: financialData?.availableBalance || 0,
          method: 'bank_transfer',
        }),
      });

      if (response.ok) {
        fetchPayouts();
        fetchFinancialData();
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
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
            ${(financialData?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-green-400 text-xs sm:text-sm mt-1">
            +${(financialData?.revenueGrowth || 0).toLocaleString()} vs last period
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-900 rounded-lg">
              <FiCreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <FiTrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-gray-400 text-sm">Available Balance</h3>
          <p className="text-2xl font-bold text-white">
            ${(financialData?.availableBalance || 0).toLocaleString()}
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
          <h3 className="text-gray-400 text-sm">Pending Revenue</h3>
          <p className="text-2xl font-bold text-white">
            ${(financialData?.pendingRevenue || 0).toLocaleString()}
          </p>
          <p className="text-purple-400 text-sm mt-1">Processing</p>
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
            ${(financialData?.totalFees || 0).toLocaleString()}
          </p>
          <p className="text-orange-400 text-sm mt-1">
            {financialData?.feePercentage || 5}% of gross revenue
          </p>
        </div>
      </div>

      {/* Payout Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Payouts</h2>
          {financialData?.availableBalance > 0 && (
            <button
              onClick={handleRequestPayout}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <FiDollarSign className="w-5 h-5" />
              Request Payout
            </button>
          )}
        </div>

        {payouts.length > 0 ? (
          <div className="space-y-4">
            {payouts.slice(0, 5).map((payout) => (
              <div key={payout._id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <FiDollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      ${payout.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">
                      Requested on {new Date(payout.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPayoutStatusColor(payout.status)}`}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </span>
                  <div className="text-sm text-gray-400">
                    {payout.method === 'bank_transfer' ? 'Bank Transfer' : payout.method}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No payouts yet</h3>
            <p className="text-gray-500">Your payouts will appear here once you request them</p>
          </div>
        )}
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
                {filteredTransactions.map((transaction) => (
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
                        {transaction.eventTitle || 'N/A'}
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
                      <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
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
      </div>
    </div>
  );
}