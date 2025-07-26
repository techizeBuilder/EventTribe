import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Audience() {
  const [activeTab, setActiveTab] = useState("attendees");
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const navigate = useNavigate();

  const handleCreateEvent = () => {
    navigate("/organizer/createEvent");
  };

  const handleUploadClick = () => {
    setActiveTab("uploaded");
  };

  const handleUploadContacts = () => {
    setShowImportModal(true);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadCSV = () => {
    if (selectedFile && consentChecked && selectedCity) {
      // Handle CSV upload logic here
      console.log("Uploading CSV:", selectedFile.name);
      setShowImportModal(false);
      setSelectedFile(null);
      setConsentChecked(false);
      setSelectedCity("");
    }
  };

  const renderAttendeesTab = () => (
    <div className="flex gap-8">
      {/* Left Section */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-1">My Attendees</h2>
          <p className="text-gray-400 text-sm mb-6">Everyone.</p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">Total:</span>
              <span className="text-white font-bold">0 Attendees</span>
            </div>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search Attendees"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Contacts List */}
          <div className="space-y-3">
            {[
              { name: "John Smith", email: "john.smith@email.com", events: 3, lastActivity: "2 days ago" },
              { name: "Sarah Johnson", email: "sarah.j@email.com", events: 7, lastActivity: "1 day ago" },
              { name: "Mike Davis", email: "mike.davis@email.com", events: 2, lastActivity: "5 days ago" },
              { name: "Emily Brown", email: "emily.b@email.com", events: 12, lastActivity: "3 hours ago" },
              { name: "Alex Wilson", email: "alex.wilson@email.com", events: 5, lastActivity: "1 week ago" },
              { name: "Lisa Garcia", email: "lisa.garcia@email.com", events: 8, lastActivity: "4 days ago" }
            ].map((contact, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{contact.name}</h4>
                    <p className="text-gray-400 text-sm">{contact.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm">{contact.events} events attended</p>
                  <p className="text-gray-400 text-xs">Active {contact.lastActivity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center py-12">
            <h3 className="text-white text-lg font-medium mb-4">
              You have no attendees yet, as you sell tickets your attendees will
              appear.
            </h3>
            <p className="text-gray-400 mb-6">
              Get started with just a few clicks.
            </p>
            <button
              onClick={handleCreateEvent}
              className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors mb-6"
            >
              Create Event
            </button>
            <div className="mt-6">
              <p className="text-white text-sm mb-4">
                If you want to upload a contact list, click here and upload a
                csv and send blasts.
              </p>
              <button
                onClick={handleUploadClick}
                className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-80">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">Audience Builder</h3>
          <p className="text-gray-400 text-sm mb-6">
            Craft a custom audience for enhanced retargeting.
          </p>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                placeholder="Audience Name"
              />
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">City</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option>Select Cities</option>
                <option>New York</option>
                <option>Los Angeles</option>
                <option>Chicago</option>
              </select>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Events</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option>Select Events</option>
                <option>Event 1</option>
                <option>Event 2</option>
              </select>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-white font-medium">
                Custom Audience Size:
              </span>
              <span className="text-white font-bold">0 Attendees</span>
            </div>

            <button className="w-full bg-white text-black px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploadedTab = () => (
    <div className="flex gap-8">
      {/* Left Section */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-1">Uploaded Contacts</h2>
          <p className="text-gray-400 text-sm mb-6">Everyone.</p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">Total:</span>
              <span className="text-white font-bold">0 Contacts</span>
            </div>
            <button
              onClick={handleUploadContacts}
              className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Upload Contacts
            </button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search Attendees"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="text-center py-12">
            <h3 className="text-white text-lg font-medium mb-4">
              You have no attendees yet, as you sell tickets your attendees will
              appear.
            </h3>
            <button
              onClick={handleCreateEvent}
              className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Create Event
            </button>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-80">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">Audience Builder</h3>
          <p className="text-gray-400 text-sm mb-6">
            Craft a custom audience for enhanced retargeting.
          </p>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                placeholder="Audience Name"
              />
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">City</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option>Select Cities</option>
                <option>New York</option>
                <option>Los Angeles</option>
                <option>Chicago</option>
              </select>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Events</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option>Select Events</option>
                <option>Event 1</option>
                <option>Event 2</option>
              </select>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-white font-medium">
                Custom Audience Size:
              </span>
              <span className="text-white font-bold">0 Attendees</span>
            </div>

            <button className="w-full bg-white text-black px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">AUDIENCE</h1>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Tabs */}
        <div className="flex items-center space-x-6 mb-8">
          <button
            onClick={() => setActiveTab("attendees")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "attendees"
                ? "text-white bg-gray-800 rounded-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Attendees
          </button>
          <button
            onClick={() => setActiveTab("uploaded")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "uploaded"
                ? "text-white bg-gray-800 rounded-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Uploaded
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "attendees" ? renderAttendeesTab() : renderUploadedTab()}
      </div>

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-semibold">
                Import Contacts
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-400 text-center mb-6">
              Upload a CSV with first name, last name, phone number, email.
            </p>

            <div className="mb-6">
              <button className="flex items-center space-x-2 text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors mb-4">
                <span>📄</span>
                <span>Download Sample CSV</span>
              </button>
            </div>

            <div className="mb-6">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white file:bg-gray-700 file:border-none file:text-white file:rounded file:px-3 file:py-1 file:mr-3"
              />
              {!selectedFile && (
                <p className="text-gray-400 text-sm mt-2">No file chosen</p>
              )}
            </div>

            <div className="mb-6">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Select City</option>
                <option value="new-york">New York</option>
                <option value="los-angeles">Los Angeles</option>
                <option value="chicago">Chicago</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 accent-orange-500"
                />
                <span className="text-gray-300 text-sm">
                  I confirm that I have obtained necessary{" "}
                  <span className="text-orange-500">consent</span> from all
                  contacts being uploaded.
                </span>
              </label>
            </div>

            <button
              onClick={handleUploadCSV}
              disabled={!selectedFile || !consentChecked || !selectedCity}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedFile && consentChecked && selectedCity
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Upload CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}