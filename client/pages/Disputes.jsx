import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Disputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [disputeStats, setDisputeStats] = useState({
    needResponse: 0,
    disputeRate: "0%", 
    moneyOnHold: "₹ 0.00",
    winRate: "0%"
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Need Response", "In Review", "Won", "Lost"];

  useEffect(() => {
    fetchDisputes();
  }, [activeTab]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const query = activeTab !== "All" ? `?status=${encodeURIComponent(activeTab)}` : "";
      const response = await fetch(`/api/organizer/disputes${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
        if (data.stats) {
          setDisputeStats(data.stats);
        }
      } else {
        console.error('Failed to fetch disputes');
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondDispute = async (disputeId) => {
    const response = prompt("Enter your response to this dispute:");
    if (response) {
      try {
        const result = await fetch(`/api/organizer/disputes/${disputeId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            response: response,
            evidence: "Response provided by organizer"
          })
        });

        if (result.ok) {
          alert('Response submitted successfully');
          fetchDisputes(); // Refresh the list
        } else {
          alert('Failed to submit response');
        }
      } catch (error) {
        console.error('Error responding to dispute:', error);
        alert('Error submitting response');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">DISPUTE MANAGEMENT</h1>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Need Response</h3>
              <span className="text-gray-500">⏰</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{disputeStats.needResponse}</p>
            <p className="text-gray-500 text-xs mt-1">disputes need immediate response</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Dispute Rate</h3>
              <span className="text-gray-500">%</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{disputeStats.disputeRate}</p>
            <p className="text-gray-500 text-xs mt-1">percentage of transactions disputed</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Money on Hold</h3>
              <span className="text-gray-500">₹</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{disputeStats.moneyOnHold}</p>
            <p className="text-gray-500 text-xs mt-1">due to payment disputes</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Win Rate</h3>
              <span className="text-gray-500">%</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{disputeStats.winRate}</p>
            <p className="text-gray-500 text-xs mt-1">percentage of disputes won</p>
          </div>
        </div>

        {/* My Disputes Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">My Disputes</h3>
          <p className="text-gray-400 text-sm mb-6">All Disputed Transactions</p>

          {/* Tabs */}
          <div className="flex items-center space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading disputes...</p>
              </div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No disputes found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {activeTab === "All" ? "You have no disputes at this time" : `No disputes in ${activeTab} status`}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Event</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Dispute Date</th>
                    <th className="text-left py-3 px-4">Evidence Due</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-4 px-4 text-white">{dispute.customer}</td>
                      <td className="py-4 px-4 text-white">{dispute.orderName}</td>
                      <td className="py-4 px-4 text-white font-medium">{dispute.amount}</td>
                      <td className="py-4 px-4 text-gray-300">{dispute.disputeDate}</td>
                      <td className="py-4 px-4 text-gray-300">{dispute.evidenceDate}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          dispute.status === 'won' ? 'bg-green-900 text-green-300' :
                          dispute.status === 'lost' ? 'bg-red-900 text-red-300' :
                          dispute.status === 'under_review' || dispute.status === 'Under Review' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-orange-900 text-orange-300'
                        }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {(dispute.status === 'Pending' || dispute.status === 'pending_response' || !dispute.status) && (
                          <button
                            onClick={() => handleRespondDispute(dispute.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            data-testid={`button-respond-${dispute.id}`}
                          >
                            Respond
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}