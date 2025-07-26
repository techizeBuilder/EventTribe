import { useState } from "react";
import { Link } from "react-router-dom";
import { FiX } from "react-icons/fi";

export default function Management() {
  const [showRehireModal, setShowRehireModal] = useState(false);
  const [rehireFormData, setRehireFormData] = useState({
    selectedEvent: "",
    commissionPercentage: "",
    message: "",
  });

  // Sample events data (you can replace this with real data)
  const events = [
    { id: 1, title: "JUNETEENTH MADNESS 18+" },
    { id: 2, title: "Summer Music Festival" },
    { id: 3, title: "Tech Conference 2024" },
  ];

  const handleRehireInputChange = (e) => {
    const { name, value } = e.target;
    setRehireFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendRequests = () => {
    console.log("Sending rehire requests:", rehireFormData);
    setShowRehireModal(false);
    // Reset form
    setRehireFormData({
      selectedEvent: "",
      commissionPercentage: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">MY TEAM</h1>
          </div>
          <button
            onClick={() => setShowRehireModal(true)}
            className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Rehire All
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-8">
        <div className="text-center max-w-md">
          <h2 className="text-white text-xl font-medium mb-4">
            Create your first event to add your team members
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Get started with just a few clicks
          </p>
          <Link
            to="/organizer/createEvent"
            className="block w-full bg-white hover:bg-gray-100 text-black py-3 px-6 rounded-lg font-medium transition-colors duration-200"
          >
            Create Event
          </Link>
        </div>
      </div>

      {/* Rehire All Modal */}
      {showRehireModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 relative border border-gray-700 rounded-xl w-full max-w-md">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-center w-full">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Re-Hire All Promoter
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Send Your Request. Get Approved. Boost Sales.
                  </p>
                </div>
                <button
                  onClick={() => setShowRehireModal(false)}
                  className="text-gray-400 hover:text-white transition-colors absolute top-4 right-4"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Select Event */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Select an Event
                  </label>
                  <select
                    name="selectedEvent"
                    value={rehireFormData.selectedEvent}
                    onChange={handleRehireInputChange}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500 appearance-none"
                  >
                    <option value="">Select an Event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commission Percentage */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Commission Percentage
                  </label>
                  <input
                    type="text"
                    name="commissionPercentage"
                    value={rehireFormData.commissionPercentage}
                    onChange={handleRehireInputChange}
                    placeholder="Commission Percentage"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={rehireFormData.message}
                    onChange={handleRehireInputChange}
                    placeholder="Message"
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendRequests}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 mt-6"
                >
                  SEND REQUESTS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
