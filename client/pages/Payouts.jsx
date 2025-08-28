import { useState } from "react";

export default function Payouts() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectStripe = () => {
    // Simulate Stripe connection
    setIsConnected(true);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen  bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-5xl mx-auto px-6">
          <h1 className="text-2xl font-bold text-white mb-6">MY PAYOUTS</h1>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Connect Payouts
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Flite integrates with Stripe for the fastest and most secure way
              to manage your funds.
            </p>

            <button
              onClick={handleConnectStripe}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors mb-4"
            >
              Connect with Stripe
            </button>

            <p className="text-gray-500 text-xs">
              If you are being asked to connect a second time, Stripe requires
              more information. Simply follow the above link.
            </p>
          </div>

          <div className="text-left space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Instant Transfers</h3>
              <p className="text-gray-400 text-sm">
                Get your money in minutes, not days.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">
                Bank-Level Security
              </h3>
              <p className="text-gray-400 text-sm">
                Your financial data is protected with industry-leading security.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Payouts</h1>
            <p className="text-gray-400 text-sm">
              Manage your payout settings and history
            </p>
          </div>
          <button
            onClick={() => setIsConnected((pre) => !pre)}
            className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            New Payout
          </button>
        </div>
      </header>

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Available Balance
            </h2>
            <p className="text-gray-400 text-sm mb-2">Ready for payout</p>
            <p className="text-3xl font-bold text-green-400">₹ 0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Pending Payouts
            </h2>
            <p className="text-gray-400 text-sm mb-2">Processing payouts</p>
            <p className="text-3xl font-bold text-yellow-400">₹ 0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Total Paid Out
            </h2>
            <p className="text-gray-400 text-sm mb-2">Lifetime payouts</p>
            <p className="text-3xl font-bold text-blue-400">₹ 0</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Payout History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Amount</th>
                  <th className="text-left py-3">Method</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-8">
                    No payout history available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
