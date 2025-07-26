
import { useState } from "react";
import { FiMessageCircle, FiBook, FiHelpCircle, FiMail, FiPhone } from "react-icons/fi";

export default function SupportCenter() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs = [
    {
      id: 1,
      question: "How do I create my first event?",
      answer: "To create your first event, navigate to the 'My Events' section and click on 'Create New Event'. Fill in all the required details including event name, date, venue, and ticket information.",
      category: "events"
    },
    {
      id: 2,
      question: "How do payouts work?",
      answer: "Payouts are processed weekly. Your earnings from ticket sales will be transferred to your registered bank account after deducting our platform fees.",
      category: "finance"
    },
    {
      id: 3,
      question: "How can I customize my event page?",
      answer: "You can customize your event page by uploading images, adding detailed descriptions, setting ticket types, and configuring various event settings from the event management dashboard.",
      category: "events"
    }
  ];

  const filteredFaqs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Support Center</h1>
            <p className="text-gray-400 text-sm">
              Get help and find answers to your questions
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors duration-200">
            <FiMessageCircle className="w-4 h-4" />
            <span>Contact Support</span>
          </button>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:bg-gray-800 transition-colors cursor-pointer">
            <FiBook className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
            <p className="text-gray-400 text-sm">Browse our comprehensive guides and tutorials</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:bg-gray-800 transition-colors cursor-pointer">
            <FiMail className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
            <p className="text-gray-400 text-sm">Send us an email and we'll get back to you</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:bg-gray-800 transition-colors cursor-pointer">
            <FiPhone className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Phone Support</h3>
            <p className="text-gray-400 text-sm">Call us for immediate assistance</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Frequently Asked Questions</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Categories</option>
              <option value="events">Events</option>
              <option value="finance">Finance</option>
              <option value="account">Account</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiHelpCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-2">{faq.question}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                      {faq.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Still need help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Email Support</h4>
              <p className="text-gray-400 text-sm mb-2">support@eventtribe.com</p>
              <p className="text-gray-500 text-xs">We typically respond within 24 hours</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Phone Support</h4>
              <p className="text-gray-400 text-sm mb-2">+1 (555) 123-TRIBE</p>
              <p className="text-gray-500 text-xs">Available Mon-Fri, 9 AM - 6 PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
