import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCopy, FiCalendar, FiMapPin, FiSearch, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function DuplicateEventPage() {
  console.log("DuplicateEventPage component rendered");
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/organizer/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        toast.error("Failed to fetch your events");
      }
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateEvent = async (event) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/organizer/events/${event._id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const duplicatedEvent = await response.json();
        toast.success(`Event "${event.title}" duplicated successfully!`);
        // Navigate to edit the duplicated event
        navigate(`/organizer/editEvent?id=${duplicatedEvent._id}`);
      } else {
        toast.error("Failed to duplicate event");
      }
    } catch (error) {
      toast.error("Failed to duplicate event");
    }
  };

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/organizer/events')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back to Events</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Duplicate Event
            </h1>
            <p className="text-gray-300 text-lg">
              Select an existing event to create a duplicate copy
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-xl mb-4">
                {searchTerm ? 'No events found matching your search' : 'No events found'}
              </div>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first event to duplicate it later'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-300"
                >
                  {/* Event Image */}
                  <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiCalendar className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-20" />
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center text-gray-400 mb-2">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Date TBD'}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-400 mb-4">
                      <FiMapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm line-clamp-1">
                        {event.location || event.venue || 'Location TBD'}
                      </span>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {event.description || 'No description available'}
                    </p>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === 'published' 
                          ? 'bg-green-500/20 text-green-400' 
                          : event.status === 'draft'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {event.status || 'draft'}
                      </span>
                      
                      {event.ticketTypes && (
                        <span className="text-xs text-gray-400">
                          {event.ticketTypes.length} ticket type{event.ticketTypes.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Duplicate Button */}
                    <button
                      onClick={() => handleDuplicateEvent(event)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <FiCopy className="w-4 h-4" />
                      <span>Duplicate Event</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}