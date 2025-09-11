import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCreditCard, FiCheck, FiAlertCircle, FiExternalLink } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

export default function StripeConnectOnboarding() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [onboardingUrl, setOnboardingUrl] = useState(null);

  useEffect(() => {
    if (user?.stripeConnectedAccountId) {
      setAccountId(user.stripeConnectedAccountId);
      checkAccountStatus(user.stripeConnectedAccountId);
    }
  }, [user]);

  const checkAccountStatus = async (accountId) => {
    try {
      const response = await fetch(`/api/stripe/account-status/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccountStatus(data.status);
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    }
  };

  const createConnectedAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ')[1] || '',
          businessName: user.businessName || user.name
        })
      });

      const data = await response.json();

      if (data.success) {
        setAccountId(data.accountId);
        toast.success('Stripe account created! Starting onboarding...');
        createOnboardingLink(data.accountId);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error creating connected account:', error);
      toast.error('Failed to create Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const createOnboardingLink = async (accountId) => {
    try {
      const response = await fetch('/api/stripe/create-onboarding-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ accountId })
      });

      const data = await response.json();

      if (data.success) {
        setOnboardingUrl(data.url);
        // Automatically redirect to onboarding
        window.open(data.url, '_blank');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      toast.error('Failed to create onboarding link');
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'gray';
    if (status.chargesEnabled && status.payoutsEnabled) return 'green';
    if (status.detailsSubmitted) return 'yellow';
    return 'red';
  };

  const getStatusText = (status) => {
    if (!status) return 'Not Connected';
    if (status.chargesEnabled && status.payoutsEnabled) return 'Active & Ready';
    if (status.detailsSubmitted) return 'Pending Review';
    return 'Setup Required';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FiCreditCard className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Payment Setup</h3>
        </div>
        {accountStatus && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
            ${getStatusColor(accountStatus) === 'green' ? 'bg-green-900 text-green-300' :
              getStatusColor(accountStatus) === 'yellow' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'}`}>
            {getStatusColor(accountStatus) === 'green' ? <FiCheck className="h-4 w-4" /> :
              <FiAlertCircle className="h-4 w-4" />}
            <span>{getStatusText(accountStatus)}</span>
          </div>
        )}
      </div>

      {!accountId ? (
        // No account created yet
        <div className="text-center py-8">
          <FiCreditCard className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">
            Set Up Your Payment Account
          </h4>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Connect your bank account to receive payments from ticket sales.
            80% goes to you immediately, 20% requires admin approval.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createConnectedAccount}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FiCreditCard className="h-5 w-5" />
            )}
            <span>{loading ? 'Creating Account...' : 'Connect Stripe Account'}</span>
          </motion.button>
        </div>
      ) : accountStatus && !accountStatus.chargesEnabled ? (
        // Account created but needs onboarding
        <div className="text-center py-8">
          <FiAlertCircle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">
            Complete Your Setup
          </h4>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You need to complete your Stripe account setup to start receiving payments.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => createOnboardingLink(accountId)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            <FiExternalLink className="h-5 w-5" />
            <span>Complete Stripe Onboarding</span>
          </motion.button>
        </div>
      ) : (
        // Account is ready
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-900 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="h-8 w-8 text-green-300" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                Payment Setup Complete!
              </h4>
              <p className="text-gray-400">
                Your Stripe account is ready to receive payments.
              </p>
            </div>
          </div>

          {accountStatus && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-gray-400">Charges</div>
                <div className={`font-medium ${accountStatus.chargesEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {accountStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-gray-400">Payouts</div>
                <div className={`font-medium ${accountStatus.payoutsEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {accountStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}