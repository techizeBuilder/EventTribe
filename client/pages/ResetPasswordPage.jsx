
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate password reset request
    console.log("Password reset requested for:", email);
    setIsSubmitted(true);
    
    // In a real app, you would send the email to your backend
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-4">
            Forgot Password
          </h1>
          <p className="text-slate-400 text-lg">
            Lost in the matrix? Let's get you back on track.
          </p>
        </motion.div>

        {/* Form */}
        {!isSubmitted ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-transparent border-b-2 border-slate-600 text-white text-lg py-3 px-0 focus:outline-none focus:border-slate-400 transition-colors placeholder-slate-500"
              />
            </div>

            {/* Reset Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-slate-200 hover:bg-white text-slate-800 font-semibold py-3 px-6 rounded-full text-lg transition-all duration-200 mt-8"
            >
              RESET PASSWORD
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
          >
            <div className="text-green-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Email Sent!</h3>
            <p className="text-slate-400">
              Check your email for password reset instructions.
            </p>
          </motion.div>
        )}

        {/* Back to Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6"
        >
          <Link
            to="/login"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Login
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
