
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiChevronDown } from "react-icons/fi";

export default function Finances() {
  const [activeTab, setActiveTab] = useState("All");
  const [showAddPayeeModal, setShowAddPayeeModal] = useState(false);
  const [showMakePaymentModal, setShowMakePaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  
  // Add Payee Form State
  const [payeeForm, setPayeeForm] = useState({
    name: "",
    email: "",
    role: "Admin"
  });

  // Make Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    recipient: "",
    amount: "",
    note: ""
  });

  const [payees, setPayees] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const handleAddPayee = (e) => {
    e.preventDefault();
    const newPayee = {
      id: Date.now(),
      ...payeeForm,
      paidOut: "₹ 0",
      stripeStatus: "Connected"
    };
    setPayees([...payees, newPayee]);
    setPayeeForm({ name: "", email: "", role: "Admin" });
    setShowAddPayeeModal(false);
  };

  const handleMakePayment = (e) => {
    e.preventDefault();
    const newTransaction = {
      id: Date.now(),
      payee: paymentForm.recipient,
      date: new Date().toLocaleDateString(),
      amount: `₹ ${paymentForm.amount}`,
      status: "Completed",
      note: paymentForm.note
    };
    setTransactions([...transactions, newTransaction]);
    setPaymentForm({ recipient: "", amount: "", note: "" });
    setShowMakePaymentModal(false);
  };

  const filteredPayees = payees.filter(payee =>
    payee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.payee.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">FINANCES</h1>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Account Balance</h3>
              <span className="text-gray-500">₹</span>
            </div>
            <p className="text-2xl font-bold text-white">₹ 0</p>
            <p className="text-gray-500 text-xs mt-1">Revenue available for payouts.</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Vendor Payouts</h3>
              <span className="text-gray-500">₹</span>
            </div>
            <p className="text-2xl font-bold text-white">₹ 0</p>
            <p className="text-gray-500 text-xs mt-1">Money paid to vendor's banks.</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Total Transactions</h3>
              <span className="text-gray-500">#</span>
            </div>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
            <p className="text-gray-500 text-xs mt-1">Lifetime transactions made to vendors.</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Total Vendors</h3>
              <span className="text-gray-500">👥</span>
            </div>
            <p className="text-2xl font-bold text-white">{payees.length}</p>
            <p className="text-gray-500 text-xs mt-1">Vendors you've onboarded to date.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payees Section */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Payees</h3>
              <button
                onClick={() => setShowAddPayeeModal(true)}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Add Payee
              </button>
            </div>

            {/* Payee Filter Tabs */}
            <div className="flex items-center space-x-1 mb-4 bg-gray-800 rounded-lg p-1">
              {["All", "Vendors", "Influencers", "Admins"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>

            {/* Payees Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left py-3">Name</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-left py-3">Role</th>
                    <th className="text-left py-3">Paid Out</th>
                    <th className="text-left py-3">Stripe Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayees.length > 0 ? (
                    filteredPayees.map((payee) => (
                      <tr key={payee.id} className="border-b border-gray-700">
                        <td className="py-3 text-white">{payee.name}</td>
                        <td className="py-3 text-gray-400">{payee.email}</td>
                        <td className="py-3 text-gray-400">{payee.role}</td>
                        <td className="py-3 text-white">{payee.paidOut}</td>
                        <td className="py-3">
                          <span className="text-green-400 text-sm">{payee.stripeStatus}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-gray-500 py-8">
                        No Data Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Transactions</h3>
              <button
                onClick={() => setShowMakePaymentModal(true)}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Make Payment
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left py-3">Payee</th>
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Amount</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-700">
                        <td className="py-3 text-white">{transaction.payee}</td>
                        <td className="py-3 text-gray-400">{transaction.date}</td>
                        <td className="py-3 text-white">{transaction.amount}</td>
                        <td className="py-3">
                          <span className="text-green-400 text-sm">{transaction.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-gray-500 py-8">
                        No Data Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payee Modal */}
      <AnimatePresence>
        {showAddPayeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add Payee</h3>
                <button
                  onClick={() => setShowAddPayeeModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddPayee} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={payeeForm.name}
                    onChange={(e) => setPayeeForm({...payeeForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={payeeForm.email}
                    onChange={(e) => setPayeeForm({...payeeForm, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-3">Select Role</label>
                  <div className="flex space-x-2">
                    {["Admin", "Vendor", "Influencer"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setPayeeForm({...payeeForm, role})}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          payeeForm.role === role
                            ? "bg-white text-black"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-medium transition-colors mt-6"
                >
                  ADD
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Make Payment Modal */}
      <AnimatePresence>
        {showMakePaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Make Payment</h3>
                <button
                  onClick={() => setShowMakePaymentModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleMakePayment} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Recipient</label>
                  <select
                    value={paymentForm.recipient}
                    onChange={(e) => setPaymentForm({...paymentForm, recipient: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    required
                  >
                    <option value="">Select Recipient</option>
                    {payees.map((payee) => (
                      <option key={payee.id} value={payee.name}>
                        {payee.name} ({payee.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Payment Amount</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Note</label>
                  <textarea
                    placeholder="Leave a note for this payment"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
                  />
                  <p className="text-gray-500 text-xs mt-1">0/100 characters</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-medium transition-colors mt-6"
                >
                  INITIATE
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
