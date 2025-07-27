import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiUsers, FiCopy, FiArrowLeft, FiSearch } from 'react-icons/fi';

function DuplicateEvent() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch organizer's events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        
        if (!token) {
          toast.error("Please login first");
          navigate("/login");
          return;
        }

        const response = await fetch('/api/organizer/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched events for duplication:', data);
          setEvents(data);
          setFilteredEvents(data);
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to fetch events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [navigate]);

  // Filter events based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venueName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchTerm, events]);

  // Handle selecting an event to duplicate
  const handleDuplicateEvent = (event) => {
    // Store the event data in localStorage temporarily
    const eventDataForDuplication = {
      ...event,
      // Remove only system fields that shouldn't be copied
      _id: undefined,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      organizerId: undefined,
      // Keep ALL original data including dates, capacity, venue, etc.
      // Only modify the title to indicate it's a duplicate
      title: `${event.title} - Copy`,
    };

    localStorage.setItem('duplicateEventData', JSON.stringify(eventDataForDuplication));
    
    // Navigate to create event page with duplication flag
    navigate('/organizer/createEvent?duplicate=true');
    
    toast.success('Event selected for duplication. Please review and update the details.');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading your events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/organizer/events')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Duplicate Event</h1>
              <p className="text-gray-400 mt-1">
                Select an event to duplicate and create a new version
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events by title, venue, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <FiCalendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {events.length === 0 ? 'No Events Found' : 'No Matching Events'}
            </h3>
            <p className="text-gray-500 mb-6">
              {events.length === 0 
                ? "You haven't created any events yet. Create your first event to enable duplication."
                : "Try adjusting your search terms to find the event you want to duplicate."
              }
            </p>
            {events.length === 0 && (
              <button
                onClick={() => navigate('/organizer/createEvent')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event._id || event.id}
                className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
              >
                {/* Event Image */}
                <div className="aspect-video bg-gray-800 overflow-hidden">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiCalendar className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2 truncate">
                    {event.title || 'Untitled Event'}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <FiCalendar className="w-4 h-4" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    
                    {event.venueName && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FiMapPin className="w-4 h-4" />
                        <span className="truncate">{event.venueName}</span>
                      </div>
                    )}
                    
                    {event.maxAttendees && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FiUsers className="w-4 h-4" />
                        <span>Max {event.maxAttendees} attendees</span>
                      </div>
                    )}
                  </div>

                  {/* Event Description Preview */}
                  {event.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'published' 
                        ? 'bg-green-900 text-green-300' 
                        : event.status === 'draft'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {event.status || 'Draft'}
                    </span>
                    
                    {event.tickets && event.tickets.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {event.tickets.length} ticket type{event.tickets.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Duplicate Button */}
                  <button
                    onClick={() => handleDuplicateEvent(event)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <FiCopy className="w-4 h-4" />
                    Duplicate This Event
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DuplicateEvent;