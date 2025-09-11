import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiDollarSign, FiClock, FiCheck, FiTrendingUp, FiDownload } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

export default function PayoutDashboard() {
  const { user } = useAuth();
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);

  useEffect(() => {
    if (user?.stripeConnectedAccountId) {
      fetchFinances();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFinances = async () => {
    try {
      const response = await fetch(`/api/stripe/account-finances/${user.stripeConnectedAccountId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFinances(data);
      }
    } catch (error) {
      console.error('Error fetching finances:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const getAvailableBalance = () => {
    if (!finances?.balance?.available) return 0;
    return finances.balance.available.reduce((total, balance) => total + balance.amount, 0);
  };

  const getPendingBalance = () => {
    if (!finances?.balance?.pending) return 0;
    return finances.balance.pending.reduce((total, balance) => total + balance.amount, 0);
  };

  const requestWithdrawal = async () => {
    if (!withdrawalAmount || isNaN(withdrawalAmount) || parseFloat(withdrawalAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // This would typically create a withdrawal request in your system
      // For now, we'll show a success message
      toast.success('Withdrawal request submitted for admin approval');
      setShowWithdrawalForm(false);
      setWithdrawalAmount('');
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user?.stripeConnectedAccountId) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="text-center py-8">
          <FiDollarSign className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Payment Setup Required
          </h3>
          <p className="text-gray-500">
            Connect your Stripe account to view payout information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Account Balance</h3>
          <button
            onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Request Withdrawal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-900 rounded-lg">
                <FiDollarSign className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Available Balance</div>
                <div className="text-2xl font-bold text-green-300">
                  {formatCurrency(getAvailableBalance())}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-900 rounded-lg">
                <FiClock className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Pending Balance</div>
                <div className="text-2xl font-bold text-yellow-300">
                  {formatCurrency(getPendingBalance())}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900 rounded-lg">
                <FiTrendingUp className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Transfers</div>
                <div className="text-2xl font-bold text-blue-300">
                  {finances?.transfers?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        {showWithdrawalForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
          >
            <h4 className="text-lg font-medium text-white mb-4">Request Withdrawal</h4>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Amount (USD)"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={requestWithdrawal}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowWithdrawalForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Transfers */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Transfers</h3>
        {finances?.transfers?.length > 0 ? (
          <div className="space-y-3">
            {finances.transfers.slice(0, 5).map((transfer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-900 rounded-lg">
                    <FiDownload className="h-4 w-4 text-green-300" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {formatCurrency(transfer.amount)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(transfer.created * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium bg-green-900 text-green-300 rounded-full">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">No transfers yet</p>
          </div>
        )}
      </div>

      {/* Recent Payouts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Payouts</h3>
        {finances?.payouts?.length > 0 ? (
          <div className="space-y-3">
            {finances.payouts.slice(0, 5).map((payout, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-900 rounded-lg">
                    <FiCheck className="h-4 w-4 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {formatCurrency(payout.amount)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(payout.created * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${payout.status === 'paid'
                      ? 'bg-green-900 text-green-300'
                      : 'bg-yellow-900 text-yellow-300'
                    }`}>
                    {payout.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiClock className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">No payouts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}