import { useState } from "react";

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("message");
  const [messageText, setMessageText] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedLink, setSelectedLink] = useState("");

  const insertFirstName = () => {
    if (activeTab === "message") {
      setMessageText((prev) => prev + "{firstName}");
    } else if (activeTab === "email") {
      setEmailContent((prev) => prev + "{firstName}");
    } else if (activeTab === "notifications") {
      setNotificationMessage((prev) => prev + "{firstName}");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "message":
        return (
          <div className="flex gap-8">
            {/* Left Section */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Marketing</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Send an instant Message to your fan base.
                </p>

                <div className="mb-6">
                  <h3 className="text-white font-medium mb-2">
                    Farhans Organization:
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Type your Message here. Use {"{firstName}"} to address the
                    recipient by their first name.
                  </p>

                  <div className="relative">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 h-32 resize-none"
                      placeholder="Type your message here..."
                      maxLength={130}
                    />
                    <div className="absolute bottom-2 right-3 text-gray-400 text-xs">
                      {messageText.length}/130
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <select
                      value={selectedAudience}
                      onChange={(e) => setSelectedAudience(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value="">Select Audience</option>
                      <option value="all">All Users</option>
                      <option value="vip">VIP Members</option>
                      <option value="regular">Regular Members</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value="">Select City</option>
                      <option value="new-york">New York</option>
                      <option value="los-angeles">Los Angeles</option>
                      <option value="chicago">Chicago</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <select
                    value={selectedLink}
                    onChange={(e) => setSelectedLink(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                  >
                    <option value="">Select Link</option>
                    <option value="event-1">Event Link 1</option>
                    <option value="event-2">Event Link 2</option>
                    <option value="website">Website Link</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                    Preview
                  </button>
                  <button className="px-8 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-medium transition-colors">
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="w-80">
              <div className="mb-6">
                <button
                  onClick={insertFirstName}
                  className="w-full bg-white hover:bg-gray-100 text-black px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Insert First Name
                </button>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-white font-medium mb-2">Past Campaigns</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Check deliverability reports.
                </p>

                <div className="flex items-center justify-between text-gray-400 text-sm mb-4 border-b border-gray-700 pb-2">
                  <span>Title & Date</span>
                  <div className="flex space-x-8">
                    <span>Preview</span>
                    <span>Delivery</span>
                  </div>
                </div>

                {[
                  {
                    id: 1,
                    title: "Summer Festival Early Bird Campaign",
                    date: "Dec 20, 2024",
                    type: "Email",
                    status: "Sent",
                    opens: "1,234",
                    clicks: "456"
                  },
                  {
                    id: 2,
                    title: "Tech Conference Reminder",
                    date: "Dec 18, 2024",
                    type: "Push",
                    status: "Delivered",
                    opens: "2,567",
                    clicks: "789"
                  },
                  {
                    id: 3,
                    title: "Food Expo Last Chance",
                    date: "Dec 15, 2024",
                    type: "SMS",
                    status: "Sent",
                    opens: "987",
                    clicks: "234"
                  }
                ].map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between py-4 border-b border-gray-800 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{campaign.title}</h4>
                      <p className="text-gray-400 text-sm">{campaign.date} • {campaign.type}</p>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="text-gray-400">Opens: </span>
                        <span className="text-white">{campaign.opens}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Clicks: </span>
                        <span className="text-white">{campaign.clicks}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        campaign.status === 'Sent' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="flex gap-8">
            {/* Left Section */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Marketing</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Send an instant Message to your fan base.
                </p>

                <div className="mb-6">
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter subject here"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 mb-4"
                  />

                  {/* Rich Text Editor Toolbar */}
                  <div className="bg-gray-800 border border-gray-700 rounded-t-lg px-4 py-2 flex items-center space-x-2">
                    <select className="bg-gray-700 text-white text-sm px-2 py-1 rounded border-none">
                      <option>Normal</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <div className="flex items-center space-x-1">
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        <strong>B</strong>
                      </button>
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        <em>I</em>
                      </button>
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        <u>U</u>
                      </button>
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        <s>S</s>
                      </button>
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        A
                      </button>
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        A
                      </button>
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        ≡
                      </button>
                      <button className="text-white hover:bg-gray-600 p-1 rounded">
                        ≡
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="w-full bg-gray-900 border-x border-b border-gray-700 rounded-b-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 h-40 resize-none"
                    placeholder="Type your email content here..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <select
                      value={selectedAudience}
                      onChange={(e) => setSelectedAudience(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value="">Select Audience</option>
                      <option value="all">All Users</option>
                      <option value="vip">VIP Members</option>
                      <option value="regular">Regular Members</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value="">Select City</option>
                      <option value="new-york">New York</option>
                      <option value="los-angeles">Los Angeles</option>
                      <option value="chicago">Chicago</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <select
                    value={selectedLink}
                    onChange={(e) => setSelectedLink(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                  >
                    <option value="">Select Link</option>
                    <option value="event-1">Event Link 1</option>
                    <option value="event-2">Event Link 2</option>
                    <option value="website">Website Link</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button className="px-8 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-medium transition-colors">
                    Send Email
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="w-80">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-white font-medium mb-2">Past Campaigns</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Check deliverability reports.
                </p>

                <div className="flex items-center justify-between text-gray-400 text-sm mb-4 border-b border-gray-700 pb-2">
                  <span>Title & Date</span>
                  <div className="flex space-x-8">
                    <span>Preview</span>
                  </div>
                </div>

                {[
                  {
                    id: 1,
                    title: "Summer Festival Early Bird Campaign",
                    date: "Dec 20, 2024",
                    type: "Email",
                    status: "Sent",
                    opens: "1,234",
                    clicks: "456"
                  },
                  {
                    id: 2,
                    title: "Tech Conference Reminder",
                    date: "Dec 18, 2024",
                    type: "Push",
                    status: "Delivered",
                    opens: "2,567",
                    clicks: "789"
                  },
                  {
                    id: 3,
                    title: "Food Expo Last Chance",
                    date: "Dec 15, 2024",
                    type: "SMS",
                    status: "Sent",
                    opens: "987",
                    clicks: "234"
                  }
                ].map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between py-4 border-b border-gray-800 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{campaign.title}</h4>
                      <p className="text-gray-400 text-sm">{campaign.date} • {campaign.type}</p>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="flex gap-8">
            {/* Left Section */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Marketing</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Send an instant message to your fan base via mobile app.
                </p>

                <div className="mb-6">
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="Enter title here"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 mb-4"
                  />

                  <div className="relative">
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 h-32 resize-none"
                      placeholder="Type your Message here. Type your message here."
                      maxLength={130}
                    />
                    <div className="absolute bottom-2 right-3 text-gray-400 text-xs">
                      {notificationMessage.length}/130
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="px-8 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-medium transition-colors">
                    Send Notifications
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="w-80">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-white font-medium mb-2">Past Campaigns</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Check deliverability reports.
                </p>

                <div className="flex items-center justify-between text-gray-400 text-sm mb-4 border-b border-gray-700 pb-2">
                  <span>Title & Date</span>
                  <div className="flex space-x-8">
                    <span>Preview</span>
                  </div>
                </div>

                {[
                  {
                    id: 1,
                    title: "Summer Festival Early Bird Campaign",
                    date: "Dec 20, 2024",
                    type: "Email",
                    status: "Sent",
                    opens: "1,234",
                    clicks: "456"
                  },
                  {
                    id: 2,
                    title: "Tech Conference Reminder",
                    date: "Dec 18, 2024",
                    type: "Push",
                    status: "Delivered",
                    opens: "2,567",
                    clicks: "789"
                  },
                  {
                    id: 3,
                    title: "Food Expo Last Chance",
                    date: "Dec 15, 2024",
                    type: "SMS",
                    status: "Sent",
                    opens: "987",
                    clicks: "234"
                  }
                ].map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between py-4 border-b border-gray-800 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{campaign.title}</h4>
                      <p className="text-gray-400 text-sm">{campaign.date} • {campaign.type}</p>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">MARKETING</h1>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Tabs */}
        <div className="flex items-center space-x-6 mb-8">
          <button
            onClick={() => setActiveTab("message")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "message"
                ? "text-white bg-gray-800 rounded-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Message
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "email"
                ? "text-white bg-gray-800 rounded-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "notifications"
                ? "text-white bg-gray-800 rounded-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Notifications
          </button>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}