import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiInfo } from 'react-icons/fi';

const TicketModal = ({ isOpen, onClose, onSave, editingTicket = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    displayPrice: '',
    qtyAvailable: '',
    maxCartQty: '10',
    availability: 'Available',
    description: '',
    enableSkipLine: false,
    passwordProtect: false,
    enableBundle: false,
    enableEarlyBird: false,
    coverTicket: false,
    enableComboTickets: false,
    enableWaitlist: false,
    hideTicket: false,
    bundlePrice: '',
    waitlistTicket: '',
    // Additional dynamic fields
    ticketPassword: '',
    earlyBirdPrice: '',
    earlyBirdEndDate: '',
    creditPrice: '',
  });

  // Reset form when editingTicket changes
  useEffect(() => {
    console.log('TicketModal editingTicket:', editingTicket); // Debug log
    if (editingTicket) {
      const newFormData = {
        name: editingTicket.name || '',
        price: editingTicket.price || '',
        displayPrice: editingTicket.displayPrice || editingTicket.price || '',
        qtyAvailable: editingTicket.quantity || '',
        maxCartQty: editingTicket.maxCartQty || '10',
        availability: editingTicket.availability || 'Available',
        description: editingTicket.description || '',
        // Handle boolean values properly - check for truthy values including strings
        enableSkipLine: editingTicket.enableSkipLine === true || editingTicket.enableSkipLine === 'true',
        passwordProtect: editingTicket.passwordProtect === true || editingTicket.passwordProtect === 'true',
        enableBundle: editingTicket.enableBundle === true || editingTicket.enableBundle === 'true',
        enableEarlyBird: editingTicket.enableEarlyBird === true || editingTicket.enableEarlyBird === 'true',
        coverTicket: editingTicket.coverTicket === true || editingTicket.coverTicket === 'true',
        enableComboTickets: editingTicket.enableComboTickets === true || editingTicket.enableComboTickets === 'true',
        enableWaitlist: editingTicket.enableWaitlist === true || editingTicket.enableWaitlist === 'true',
        hideTicket: editingTicket.hideTicket === true || editingTicket.hideTicket === 'true',
        bundlePrice: editingTicket.bundlePrice || '',
        waitlistTicket: editingTicket.waitlistTicket || '',
        // Additional dynamic fields
        ticketPassword: editingTicket.ticketPassword || '',
        earlyBirdPrice: editingTicket.earlyBirdPrice || '',
        earlyBirdEndDate: editingTicket.earlyBirdEndDate || '',
        creditPrice: editingTicket.creditPrice || '',
      };
      console.log('Setting form data:', newFormData); // Debug log
      setFormData(newFormData);
    } else {
      // Reset to empty form for new ticket
      setFormData({
        name: '',
        price: '',
        displayPrice: '',
        qtyAvailable: '',
        maxCartQty: '10',
        availability: 'Available',
        description: '',
        enableSkipLine: false,
        passwordProtect: false,
        enableBundle: false,
        enableEarlyBird: false,
        coverTicket: false,
        enableComboTickets: false,
        enableWaitlist: false,
        hideTicket: false,
        bundlePrice: '',
        waitlistTicket: '',
        ticketPassword: '',
        earlyBirdPrice: '',
        earlyBirdEndDate: '',
        creditPrice: '',
      });
    }
  }, [editingTicket]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter a ticket name');
      return;
    }
    
    // Convert the form data to match the ticket structure
    const ticketData = {
      id: editingTicket ? editingTicket.id : Date.now(),
      name: formData.name || 'General Admission',
      description: formData.description || 'Event ticket',
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.qtyAvailable) || 100,
      displayPrice: parseFloat(formData.displayPrice) || parseFloat(formData.price) || 0,
      maxCartQty: parseInt(formData.maxCartQty) || 10,
      availability: formData.availability || 'Available',
      isActive: formData.availability === 'Available',
      sold: editingTicket ? editingTicket.sold || 0 : 0, // Keep existing sold count when editing
      // Store original form data for editing
      originalData: formData,
      // Additional advanced settings
      enableSkipLine: formData.enableSkipLine,
      passwordProtect: formData.passwordProtect,
      enableBundle: formData.enableBundle,
      enableEarlyBird: formData.enableEarlyBird,
      coverTicket: formData.coverTicket,
      enableComboTickets: formData.enableComboTickets,
      enableWaitlist: formData.enableWaitlist,
      hideTicket: formData.hideTicket,
      bundlePrice: formData.bundlePrice ? parseFloat(formData.bundlePrice) : null,
      waitlistTicket: formData.waitlistTicket,
      // Dynamic fields
      ticketPassword: formData.ticketPassword,
      earlyBirdPrice: formData.earlyBirdPrice ? parseFloat(formData.earlyBirdPrice) : null,
      earlyBirdEndDate: formData.earlyBirdEndDate,
      creditPrice: formData.creditPrice ? parseFloat(formData.creditPrice) : null
    };
    
    onSave(ticketData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 border border-gray-600 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-medium text-lg">
            {editingTicket ? 'Edit Ticket' : 'Create Ticket'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Ticket Name */}
          <div>
            <label className="block text-white text-sm mb-2">Ticket Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Enter ticket name"
            />
          </div>

          {/* Price Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-2">Ticket Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-2 flex items-center">
                Display Price
                <FiInfo className="ml-1 text-gray-400" size={12} />
              </label>
              <input
                type="number"
                name="displayPrice"
                value={formData.displayPrice}
                onChange={handleInputChange}
                className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          {/* Quantity Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-2">Qty Available</label>
              <input
                type="number"
                name="qtyAvailable"
                value={formData.qtyAvailable}
                onChange={handleInputChange}
                className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-2">Max Cart Qty</label>
              <input
                type="number"
                name="maxCartQty"
                value={formData.maxCartQty}
                onChange={handleInputChange}
                className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          {/* Availability section removed - tickets are always available */}

          {/* Description */}
          <div>
            <label className="block text-white text-sm mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Enter ticket description..."
            />
          </div>

          {/* Additional Settings */}
          <div>
            <label className="block text-white text-sm mb-3">Additional Settings</label>
            <div className="space-y-3">
              {[
                { key: 'enableSkipLine', label: 'Enable Skip the Line', hasInfo: true },
                { key: 'passwordProtect', label: 'Password Protect' },
                { key: 'enableBundle', label: 'Enable Bundle', hasInfo: true },
                { key: 'enableEarlyBird', label: 'Enable Early Bird' },
                { key: 'coverTicket', label: 'Cover Ticket' },
                { key: 'enableComboTickets', label: 'Enable Combo Tickets' },
                { key: 'enableWaitlist', label: 'Enable Waitlist' },
                { key: 'hideTicket', label: 'Hide this ticket' },
              ].map(({ key, label, hasInfo }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      name={key}
                      checked={formData[key]}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={key} className="ml-2 text-white text-sm flex items-center">
                      {label}
                      {hasInfo && <FiInfo className="ml-1 text-gray-400" size={12} />}
                    </label>
                  </div>
                  
                  {/* Dynamic input fields based on selection */}
                  {key === 'enableBundle' && formData[key] && (
                    <input
                      type="number"
                      name="bundlePrice"
                      value={formData.bundlePrice}
                      onChange={handleInputChange}
                      placeholder="Enter Bundle Qty"
                      className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm ml-6"
                      step="0.01"
                    />
                  )}
                  
                  {key === 'passwordProtect' && formData[key] && (
                    <input
                      type="password"
                      name="ticketPassword"
                      value={formData.ticketPassword || ''}
                      onChange={handleInputChange}
                      placeholder="Enter Password"
                      className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm ml-6"
                    />
                  )}
                  
                  {key === 'enableEarlyBird' && formData[key] && (
                    <div className="ml-6 space-y-2">
                      <input
                        type="number"
                        name="earlyBirdPrice"
                        value={formData.earlyBirdPrice || ''}
                        onChange={handleInputChange}
                        placeholder="Early Bird Price"
                        className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                        step="0.01"
                      />
                      <input
                        type="datetime-local"
                        name="earlyBirdEndDate"
                        value={formData.earlyBirdEndDate || ''}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                  
                  {key === 'coverTicket' && formData[key] && (
                    <div className="ml-6">
                      <label className="block text-white text-xs mb-1">Credit Price</label>
                      <input
                        type="number"
                        name="creditPrice"
                        value={formData.creditPrice || ''}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                        step="0.01"
                      />
                    </div>
                  )}
                  
                  {key === 'enableWaitlist' && formData[key] && (
                    <div className="ml-6">
                      <label className="block text-white text-xs mb-1">Select Waitlist Ticket</label>
                      <select
                        name="waitlistTicket"
                        value={formData.waitlistTicket}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="">Select ticket</option>
                        <option value="general">General Admission</option>
                        <option value="vip">VIP Access</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>



          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-white text-black py-3 rounded font-medium hover:bg-gray-200 transition-colors mt-6"
          >
            SAVE
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TicketModal;