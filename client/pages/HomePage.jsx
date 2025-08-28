import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EventCard from "../components/EventCard";
import EventCarousel from "../components/EventCarousel";
import toast from "react-hot-toast";

export default function HomePage({ setCurrentPage }) {
  const [searchName, setSearchName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [showPreloader, setShowPreloader] = useState(false);
  const [showAdditionalContent, setShowAdditionalContent] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Dynamic event states
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [categoryEvents, setCategoryEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const heroRef = useRef(null);
  const additionalContentRef = useRef(null);

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Fetch all events
      const eventsResponse = await fetch("/api/events");
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();

        setEvents(eventsData);
      } else {
        toast.error("Failed to load events");
      }

      // Fetch trending events
      const trendingResponse = await fetch("/api/events/trending");
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingEvents(trendingData);
      }

      // Fetch past events
      const pastResponse = await fetch("/api/events/past");
      if (pastResponse.ok) {
        const pastData = await pastResponse.json();
        setPastEvents(pastData);
      }

      // Fetch a sample category events for display
      const techResponse = await fetch("/api/events/category/Technology");
      if (techResponse.ok) {
        const techData = await techResponse.json();
        setCategoryEvents((prev) => ({ ...prev, Technology: techData }));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events data");
    } finally {
      setLoading(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Function to handle category click
  const handleCategoryClick = async (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      return;
    }

    setSelectedCategory(category);

    // Fetch events for this category if not already loaded
    if (!categoryEvents[category]) {
      try {
        const response = await fetch(`/api/events/category/${category}`);
        if (response.ok) {
          const categoryData = await response.json();
          setCategoryEvents((prev) => ({ ...prev, [category]: categoryData }));
        }
      } catch (error) {
        console.error(`Error fetching ${category} events:`, error);
        toast.error(`Failed to load ${category} events`);
      }
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesName = (event.title || "")
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchesLocation = (event.location || "")
      .toLowerCase()
      .includes(searchLocation.toLowerCase());
    return matchesName && matchesLocation;
  });

  // Check if user has bypassed preloader before
  const hasBypassedPreloader = localStorage.getItem("flite-preloader-bypassed");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When hero section starts leaving viewport and user hasn't triggered preloader yet
          if (!entry.isIntersecting && !hasTriggered && !hasBypassedPreloader) {
            setHasTriggered(true);
            setShowPreloader(true);

            // Show preloader for 2.5 seconds
            setTimeout(() => {
              setShowPreloader(false);
              setShowAdditionalContent(true);
              // Set bypass flag for returning users
              localStorage.setItem("flite-preloader-bypassed", "true");
            }, 2500);
          } else if (
            !entry.isIntersecting &&
            hasBypassedPreloader &&
            !showAdditionalContent
          ) {
            // For returning users, show content immediately
            setShowAdditionalContent(true);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-100px 0px 0px 0px",
      },
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, [hasTriggered, hasBypassedPreloader, showAdditionalContent]);
  console.log("filter", filteredEvents);
  return (
    <div className="min-h-screen font-sans">
      {/* Scroll-triggered Preloader */}
      <AnimatePresence>
        {showPreloader && (
          <motion.div
            className="scroll-preloader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="spinner"></div>
              <motion.p
                className="text-slate-300 mt-4 font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Loading more amazing events...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.h2
                  className="text-slate-400 text-lg font-medium tracking-wide"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  MONETIZE OUTSIDE THE FEED.
                </motion.h2>

                <motion.h1
                  className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  AUTOMATE DEALS,
                  <br />
                  EVENTS, AND EARNINGS
                  <br />
                  <span className="text-slate-400">– ALL IN ONE PLACE.</span>
                </motion.h1>
              </div>

              <motion.button
                className="bg-white text-slate-900 font-semibold px-8 py-3 rounded-lg hover:bg-slate-100 transition-all duration-200 flex items-center space-x-2"
                onClick={() => setCurrentPage("about")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>ABOUT US</span>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.button>
            </motion.div>

            {/* Right Content - Event Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {loading ? (
                <div className="text-white text-center py-8">
                  Loading events...
                </div>
              ) : events.length > 0 ? (
                <EventCarousel events={events.slice(0, 3)} />
              ) : (
                <div className="text-white text-center py-8">
                  <p>No events available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Check back soon for new events!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 bg-slate-850/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-8 border border-slate-700/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  WHAT ARE YOU LOOKING FOR?
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full search-input text-white placeholder-slate-400 px-4 py-3 rounded-lg focus:ring-2 focus:ring-slate-500 transition-all duration-200"
                  placeholder="Event name..."
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  WHERE?
                </label>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full search-input text-white placeholder-slate-400 px-4 py-3 rounded-lg focus:ring-2 focus:ring-slate-500 transition-all duration-200"
                  placeholder="Location..."
                />
              </div>

              <motion.button
                className="bg-white text-slate-900 font-semibold px-8 py-3 rounded-lg hover:bg-slate-100 transition-all duration-200 cursor-pointer hover:shadow-lg"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                SEARCH
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Upcoming Events
            </h2>
            <p className="text-slate-400 font-medium">
              Discover what's happening near you
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {loading ? (
              <div className="col-span-full text-white text-center py-8">
                Loading events...
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))
            ) : (
              <div className="col-span-full text-white text-center py-8">
                <p>No events found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Additional Content Sections - Triggered by Scroll */}
      <AnimatePresence>
        {showAdditionalContent && (
          <div ref={additionalContentRef}>
            {/* Trending Now Section */}
            <motion.section
              className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-850/30"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="max-w-7xl mx-auto">
                <motion.div className="mb-8 fade-in-up">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Trending Now
                  </h2>
                  <p className="text-slate-400 font-medium">
                    The hottest events everyone's talking about
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {loading ? (
                    <div className="col-span-full text-white text-center py-8">
                      Loading trending events...
                    </div>
                  ) : trendingEvents.length > 0 ? (
                    trendingEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <EventCard event={event} index={index} />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-white text-center py-8">
                      <p>No trending events</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Stay tuned for popular events!
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.section>

            {/* Featured Categories Section */}
            <motion.section
              className="py-16 px-4 sm:px-6 lg:px-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="max-w-7xl mx-auto">
                <motion.div className="mb-8 slide-in-left">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Explore by Category
                  </h2>
                  <p className="text-slate-400 font-medium">
                    Find exactly what you're looking for
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  {[
                    "TECHNOLOGY",
                    "MUSIC",
                    "BUSINESS",
                    "FITNESS",
                    "NETWORKING",
                    "ENTERTAINMENT",
                  ].map((category, index) => (
                    <motion.div
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-slate-700/60 transition-all duration-300 cursor-pointer border border-slate-700/50 hover:border-slate-600/60 ${
                        selectedCategory === category
                          ? "bg-red-600/20 border-red-500/50"
                          : ""
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <h3 className="text-white font-semibold text-sm">
                        {category}
                      </h3>
                      {categoryEvents[category] && (
                        <p className="text-slate-400 text-xs mt-2">
                          {categoryEvents[category].length} event
                          {categoryEvents[category].length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Display events for selected category */}
                {selectedCategory && categoryEvents[selectedCategory] && (
                  <motion.div
                    className="mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <h3 className="text-2xl font-bold text-white mb-6">
                      {selectedCategory} Events
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryEvents[selectedCategory].map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                          <EventCard event={event} index={index} />
                        </motion.div>
                      ))}
                    </div>
                    {categoryEvents[selectedCategory].length === 0 && (
                      <p className="text-slate-400 text-center py-8">
                        No events found in {selectedCategory} category
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.section>

            {/* Past Events Section */}
            <motion.section
              className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-850/50"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              <div className="max-w-7xl mx-auto">
                <motion.div className="mb-8 fade-in-up">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Recently Concluded
                  </h2>
                  <p className="text-slate-400 font-medium">
                    See what amazing events you missed
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                >
                  {pastEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
                    >
                      <EventCard event={event} index={index} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
