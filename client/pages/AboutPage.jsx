import { motion } from 'framer-motion'

export default function AboutPage() {
  const features = [
    {
      icon: "🎯",
      title: "Event Creation",
      description: "Create and customize your events with our intuitive tools designed for creators."
    },
    {
      icon: "🎫",
      title: "Ticket Sales",
      description: "Seamlessly sell tickets and manage attendee lists with built-in payment processing."
    },
    {
      icon: "👥",
      title: "Team Management",
      description: "Collaborate with your team and manage permissions for different event roles."
    },
    {
      icon: "💬",
      title: "Community Engagement",
      description: "Build and engage with your community through integrated social features."
    },
    {
      icon: "📊",
      title: "Analytics & Insights",
      description: "Track your events' performance with detailed analytics and reporting tools."
    },
    {
      icon: "💰",
      title: "Revenue Optimization",
      description: "Maximize your earnings with smart pricing and promotional tools."
    }
  ]

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            About <span className="gradient-text">Event Tribe</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            We're building the ultimate operating system for creators and influencers. 
            Event Tribe empowers you to monetize your influence through in-person events, 
            moving beyond the limitations of social media feeds.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 mb-16 border border-slate-700/50"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            To revolutionize how creators monetize their influence by providing a comprehensive 
            platform that automates deals, events, and earnings management. We believe in empowering 
            creators to build meaningful connections with their audience through real-world experiences.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-600/30"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Creator Journey?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using FLITE to build sustainable 
            businesses through in-person event experiences.
          </p>
          <motion.button
            className="bg-white text-slate-900 font-semibold px-8 py-4 rounded-lg hover:bg-slate-100 transition-all duration-200 text-lg cursor-pointer hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Today
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}