import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, CreditCard, Download, AlertCircle, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayoutDashboard() {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    immediateEarnings: 0,
    pendingEarnings: 0,
    requestedEarnings: 0,
    paidEarnings: 0,
    availableForWithdrawal: 0,
    totalTransactions: 0,
    totalWithdrawals: 0,
    averageTransactionAmount: 0,
    lastTransactionAt: null,
    lastWithdrawalAt: null
  });
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isImmediateWithdrawalModalOpen, setIsImmediateWithdrawalModalOpen] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    requestedAmount: '',
    requestReason: '',
    bankDetails: {
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
      bankName: ''
    }
  });
  const [immediateWithdrawalForm, setImmediateWithdrawalForm] = useState({
    requestedAmount: '',
    bankDetails: {
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
      bankName: ''
    }
  });
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [submittingImmediateWithdrawal, setSubmittingImmediateWithdrawal] = useState(false);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankAccountForm, setBankAccountForm] = useState({
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    accountType: 'checking'
  });
  const [addingBankAccount, setAddingBankAccount] = useState(false);

  useEffect(() => {
    fetchEarnings();
    fetchWithdrawalRequests();
    fetchPayouts();
    fetchBankAccounts();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/organizer/earnings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEarnings(data.earnings);
      } else {
        console.error('Failed to fetch earnings');
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const response = await fetch('/api/organizer/withdrawal-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawalRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/organizer/finances/payouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/organizer/bank-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const handleAddBankAccount = async () => {
    try {
      setAddingBankAccount(true);

      if (!bankAccountForm.accountNumber || !bankAccountForm.routingNumber || !bankAccountForm.accountHolderName) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/organizer/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bankAccountForm)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Bank account added successfully!');
        setBankAccountForm({
          accountNumber: '',
          routingNumber: '',
          accountHolderName: '',
          accountType: 'checking'
        });
        fetchBankAccounts();
      } else {
        toast.error(data.message || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
      toast.error('Failed to add bank account');
    } finally {
      setAddingBankAccount(false);
    }
  };

  const handleDeleteBankAccount = async (accountId) => {
    try {
      const response = await fetch(`/api/organizer/bank-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Bank account deleted successfully!');
        fetchBankAccounts();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete bank account');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Failed to delete bank account');
    }
  };

  const handleSetDefaultBankAccount = async (accountId) => {
    try {
      const response = await fetch(`/api/organizer/bank-accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isDefault: true })
      });

      if (response.ok) {
        toast.success('Default bank account updated!');
        fetchBankAccounts();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update bank account');
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast.error('Failed to update bank account');
    }
  };

  const handleWithdrawalSubmit = async () => {
    try {
      setSubmittingWithdrawal(true);

      if (!withdrawalForm.requestedAmount || parseFloat(withdrawalForm.requestedAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (parseFloat(withdrawalForm.requestedAmount) > earnings.availableForWithdrawal) {
        toast.error(`Insufficient balance. Available: $${earnings.availableForWithdrawal}`);
        return;
      }

      if (!withdrawalForm.bankDetails.accountNumber || !withdrawalForm.bankDetails.routingNumber) {
        toast.error('Please fill in all bank details');
        return;
      }

      const response = await fetch('/api/organizer/withdrawal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestedAmount: parseFloat(withdrawalForm.requestedAmount),
          requestReason: withdrawalForm.requestReason,
          bankDetails: withdrawalForm.bankDetails
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Withdrawal request submitted successfully! It will be reviewed by our admin team.');
        setIsWithdrawalModalOpen(false);
        setWithdrawalForm({
          requestedAmount: '',
          requestReason: '',
          bankDetails: { accountNumber: '', routingNumber: '', accountHolderName: '', bankName: '' }
        });
        fetchEarnings();
        fetchWithdrawalRequests();
        fetchPayouts();
      } else {
        toast.error(data.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleImmediateWithdrawalSubmit = async () => {
    try {
      setSubmittingImmediateWithdrawal(true);

      if (!immediateWithdrawalForm.requestedAmount || parseFloat(immediateWithdrawalForm.requestedAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (parseFloat(immediateWithdrawalForm.requestedAmount) > earnings.immediateEarnings) {
        toast.error(`Insufficient balance. Available: $${earnings.immediateEarnings.toFixed(2)}`);
        return;
      }

      if (!immediateWithdrawalForm.bankDetails.accountNumber || !immediateWithdrawalForm.bankDetails.routingNumber ||
        !immediateWithdrawalForm.bankDetails.accountHolderName || !immediateWithdrawalForm.bankDetails.bankName) {
        toast.error('Please fill in all bank details');
        return;
      }

      const response = await fetch('/api/organizer/withdraw-immediate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(immediateWithdrawalForm.requestedAmount),
          type: 'immediate',
          bankDetails: immediateWithdrawalForm.bankDetails
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Immediate withdrawal processed successfully!');
        setIsImmediateWithdrawalModalOpen(false);
        setImmediateWithdrawalForm({
          requestedAmount: '',
          bankDetails: { accountNumber: '', routingNumber: '', accountHolderName: '', bankName: '' }
        });
        fetchEarnings();
        fetchPayouts();
      } else {
        toast.error(data.message || 'Failed to process immediate withdrawal');
      }
    } catch (error) {
      console.error('Error processing immediate withdrawal:', error);
      toast.error('Failed to process immediate withdrawal');
    } finally {
      setSubmittingImmediateWithdrawal(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', icon: Clock, text: "Pending Review" },
      approved: { color: 'bg-green-500', icon: CheckCircle, text: "Approved" },
      rejected: { color: 'bg-red-500', icon: XCircle, text: "Rejected" },
      processed: { color: 'bg-blue-500', icon: CheckCircle, text: "Processed" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6" data-testid="payout-dashboard-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6" data-testid="payout-dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Payout Dashboard</h1>
            <p className="text-gray-400">Manage your earnings and withdrawal requests</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowBankAccountModal(true)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              data-testid="button-manage-bank-accounts"
            >
              <Settings className="w-4 h-4" />
              Manage Bank Accounts
            </button>

            {earnings.immediateEarnings > 0 && (
              <button
                onClick={() => {
                  setImmediateWithdrawalForm({
                    requestedAmount: earnings.immediateEarnings.toFixed(2),
                    bankDetails: {
                      accountNumber: '',
                      routingNumber: '',
                      accountHolderName: '',
                      bankName: ''
                    }
                  });
                  setIsImmediateWithdrawalModalOpen(true);
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                data-testid="button-withdraw-80-percent"
              >
                <DollarSign className="w-4 h-4" />
                Withdraw 80% (${earnings.immediateEarnings.toFixed(2)})
              </button>
            )}

            <button
              onClick={() => setIsWithdrawalModalOpen(true)}
              disabled={earnings.availableForWithdrawal <= 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
              data-testid="button-request-withdrawal"
            >
              <Download className="w-4 h-4" />
              Request Withdrawal
            </button>
          </div>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6" data-testid="card-total-earnings">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">${earnings.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500">From {earnings.totalTransactions} transactions</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6" data-testid="card-immediate-earnings">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Immediate (80%)</p>
                <p className="text-2xl font-bold text-green-400">${earnings.immediateEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Available immediately</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6" data-testid="card-pending-earnings">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending (20%)</p>
                <p className="text-2xl font-bold text-yellow-400">${earnings.pendingEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Requires admin approval</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6" data-testid="card-available-withdrawal">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Available for Withdrawal</p>
                <p className="text-2xl font-bold text-blue-400">${earnings.availableForWithdrawal.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Ready to withdraw</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* How Payouts Work */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">How Payouts Work</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">80%</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Immediate Payment</h3>
                <p>80% of your ticket sales are available immediately after each successful transaction.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">20%</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Pending Review</h3>
                <p>20% is held for admin approval. Request withdrawal when ready to receive these funds.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Payouts */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6" data-testid="card-payouts">
          <h2 className="text-xl font-semibold text-white mb-2">Payouts & Withdrawals</h2>
          <p className="text-gray-400 mb-6">Your completed payouts and withdrawal history</p>

          {payouts.length === 0 ? (
            <div className="text-center py-12 text-gray-500" data-testid="text-no-payouts">
              <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No payouts yet</p>
              <p className="text-sm">Your payouts will appear here once you request them</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="list-payouts">
              {payouts.map((payout, index) => (
                <div
                  key={payout._id}
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800"
                  data-testid={`payout-${index}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="font-medium text-white" data-testid={`payout-amount-${index}`}>
                          ${payout.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400" data-testid={`payout-date-${index}`}>
                          {new Date(payout.processedAt || payout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white bg-green-500">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </span>
                    </div>
                    {payout.description && (
                      <p className="text-sm text-gray-300 mt-2" data-testid={`payout-description-${index}`}>
                        <strong>Description:</strong> {payout.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 mt-1" data-testid={`payout-method-${index}`}>
                      <strong>Method:</strong> {payout.method || 'Bank Transfer'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawal Requests */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6" data-testid="card-withdrawal-requests">
          <h2 className="text-xl font-semibold text-white mb-2">Withdrawal Requests</h2>
          <p className="text-gray-400 mb-6">Track your withdrawal requests and their status</p>

          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500" data-testid="text-no-requests">
              <Download className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No withdrawal requests yet</p>
              <p className="text-sm">Submit your first withdrawal request to get started</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="list-withdrawal-requests">
              {withdrawalRequests.map((request, index) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800"
                  data-testid={`withdrawal-request-${index}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="font-medium text-white" data-testid={`text-amount-${index}`}>
                          ${request.requestedAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400" data-testid={`text-date-${index}`}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.requestReason && (
                      <p className="text-sm text-gray-300 mt-2" data-testid={`text-reason-${index}`}>
                        <strong>Reason:</strong> {request.requestReason}
                      </p>
                    )}
                    {request.adminRemarks && (
                      <p className="text-sm text-blue-400 mt-2" data-testid={`text-admin-remarks-${index}`}>
                        <strong>Admin:</strong> {request.adminRemarks}
                      </p>
                    )}
                    {request.rejectionReason && (
                      <p className="text-sm text-red-400 mt-2" data-testid={`text-rejection-reason-${index}`}>
                        <strong>Rejection Reason:</strong> {request.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank Account Management Modal */}
      {showBankAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Manage Bank Accounts</h2>
              <button
                onClick={() => setShowBankAccountModal(false)}
                className="text-gray-400 hover:text-white"
                data-testid="button-close-bank-modal"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Add New Bank Account Section */}
            <div className="mb-8 p-4 border border-gray-700 rounded-lg bg-gray-800">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Bank Account
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    value={bankAccountForm.accountHolderName}
                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    placeholder="Full name as it appears on the account"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-account-holder-name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Account Type *</label>
                  <select
                    value={bankAccountForm.accountType}
                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountType: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="select-account-type"
                    required
                  >
                    <option value="current">Current Account</option>
                    <option value="savings">Savings Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Account Number *</label>
                  <input
                    type="text"
                    value={bankAccountForm.accountNumber}
                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="Enter your account number"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-bank-account-number"
                    maxLength="20"
                    required
                  />
                  {bankAccountForm.accountNumber && bankAccountForm.accountNumber.length < 4 && (
                    <p className="text-xs text-red-400 mt-1">Account number must be at least 4 digits</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Routing Number *</label>
                  <input
                    type="text"
                    value={bankAccountForm.routingNumber}
                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, routingNumber: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="9-digit routing number"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-bank-routing-number"
                    maxLength="9"
                    required
                  />
                  {bankAccountForm.routingNumber && bankAccountForm.routingNumber.length > 0 && bankAccountForm.routingNumber.length !== 9 && (
                    <p className="text-xs text-red-400 mt-1">Routing number must be exactly 9 digits</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddBankAccount}
                  disabled={addingBankAccount || !bankAccountForm.accountNumber || !bankAccountForm.routingNumber || !bankAccountForm.accountHolderName || bankAccountForm.routingNumber.length !== 9 || bankAccountForm.accountNumber.length < 4}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  data-testid="button-add-bank-account"
                >
                  <Plus className="w-4 h-4" />
                  {addingBankAccount ? 'Adding Account...' : 'Add Bank Account'}
                </button>
              </div>

              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-200">
                    <p className="font-medium mb-1">Bank Account Security</p>
                    <p>Your bank account information is encrypted and securely validated through Stripe. We never store your full account details.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Bank Accounts */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Your Bank Accounts</h3>

              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No bank accounts added</p>
                  <p className="text-sm">Add your first bank account above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((account, index) => (
                    <div
                      key={account.id}
                      className={`p-4 border rounded-lg ${account.isDefault
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-800'
                        }`}
                      data-testid={`bank-account-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-white">
                                {account.bankName || 'Bank Account'} ****{account.last4}
                              </p>
                              <p className="text-sm text-gray-400">
                                {account.accountHolderName} • {account.accountType?.charAt(0).toUpperCase() + account.accountType?.slice(1)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Routing: {account.routingNumber}
                              </p>
                            </div>
                            {account.isDefault && (
                              <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!account.isDefault && (
                            <button
                              onClick={() => handleSetDefaultBankAccount(account.id)}
                              className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 border border-blue-600 rounded-lg transition-colors"
                              data-testid={`button-set-default-${index}`}
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBankAccount(account.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg transition-colors"
                            data-testid={`button-delete-account-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowBankAccountModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                data-testid="button-close-bank-management"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-white mb-2">Request Withdrawal</h2>
            <p className="text-gray-400 mb-6">Available balance: ${earnings.availableForWithdrawal.toFixed(2)}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={earnings.availableForWithdrawal}
                  value={withdrawalForm.requestedAmount}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, requestedAmount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="input-withdrawal-amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reason (Optional)</label>
                <textarea
                  value={withdrawalForm.requestReason}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, requestReason: e.target.value }))}
                  placeholder="Reason for withdrawal..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  data-testid="input-withdrawal-reason"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Bank Details</label>
                <input
                  placeholder="Account Number"
                  value={withdrawalForm.bankDetails.accountNumber}
                  onChange={(e) => setWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="input-account-number"
                />
                <input
                  placeholder="Routing Number"
                  value={withdrawalForm.bankDetails.routingNumber}
                  onChange={(e) => setWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, routingNumber: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="input-routing-number"
                />
                <input
                  placeholder="Account Holder Name"
                  value={withdrawalForm.bankDetails.accountHolderName}
                  onChange={(e) => setWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="input-account-holder"
                />
                <input
                  placeholder="Bank Name"
                  value={withdrawalForm.bankDetails.bankName}
                  onChange={(e) => setWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="input-bank-name"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsWithdrawalModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid="button-cancel-withdrawal"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawalSubmit}
                disabled={submittingWithdrawal}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                data-testid="button-submit-withdrawal"
              >
                {submittingWithdrawal ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Withdrawal Modal */}
      {isImmediateWithdrawalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-white mb-2">Withdraw Immediate Earnings (80%)</h2>
            <p className="text-gray-400 mb-6">Available balance: ${earnings.immediateEarnings.toFixed(2)}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={earnings.immediateEarnings}
                  value={immediateWithdrawalForm.requestedAmount}
                  onChange={(e) => setImmediateWithdrawalForm(prev => ({ ...prev, requestedAmount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  data-testid="input-immediate-withdrawal-amount"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Bank Details</label>
                <input
                  placeholder="Account Number"
                  value={immediateWithdrawalForm.bankDetails.accountNumber}
                  onChange={(e) => setImmediateWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  data-testid="input-immediate-account-number"
                />
                <input
                  placeholder="Routing Number"
                  value={immediateWithdrawalForm.bankDetails.routingNumber}
                  onChange={(e) => setImmediateWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, routingNumber: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  data-testid="input-immediate-routing-number"
                />
                <input
                  placeholder="Account Holder Name"
                  value={immediateWithdrawalForm.bankDetails.accountHolderName}
                  onChange={(e) => setImmediateWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  data-testid="input-immediate-account-holder"
                />
                <input
                  placeholder="Bank Name"
                  value={immediateWithdrawalForm.bankDetails.bankName}
                  onChange={(e) => setImmediateWithdrawalForm(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  data-testid="input-immediate-bank-name"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsImmediateWithdrawalModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid="button-cancel-immediate-withdrawal"
              >
                Cancel
              </button>
              <button
                onClick={handleImmediateWithdrawalSubmit}
                disabled={submittingImmediateWithdrawal}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                data-testid="button-submit-immediate-withdrawal"
              >
                {submittingImmediateWithdrawal ? 'Processing...' : 'Withdraw Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}