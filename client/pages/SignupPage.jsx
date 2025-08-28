import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { loginUser } from "../store/slices/authSlice";
import toast from "react-hot-toast";

export default function Signup() {
  const [role, setRole] = useState("attendee");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currency: "",
    dateOfBirth: "",
    phone: "",
    organizationName: "",
    instagramHandle: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      toast.error("Please accept the Terms and Privacy Policy.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const userData = { role, ...formData };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("authToken", data.token);

        // Dispatch login action to Redux store
        dispatch(
          loginUser({
            user: data.user,
            token: data.token,
          }),
        );

        toast.success("Account created successfully!");

        // Redirect based on role
        if (role === "organizer") {
          navigate("/organizer");
        } else {
          navigate("/attendee-dashboard");
        }
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please try again.");
    }
  };

  // ✅ EyeToggle inner component for reuse
  const EyeToggle = ({ visible, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
    >
      {visible ? (
        <FaEyeSlash size={16} className="sm:w-4 sm:h-4" />
      ) : (
        <FaEye size={16} className="sm:w-4 sm:h-4" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex mt-6 items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-white/20 bg-white/5 backdrop-blur-md"
      >
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center text-white mb-4 sm:mb-6">
          Event Tribe | OS for Creators to Grow Their Brands
        </h1>

        {/* Role Selection */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          {["attendee", "organizer"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-3 sm:px-4 md:px-6 py-2 rounded-md border text-xs sm:text-sm md:text-base font-medium ${
                role === r
                  ? "bg-white text-gray-900 border-white"
                  : "text-white border-white hover:bg-white/10"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <input
            name="firstName"
            placeholder="First Name"
            onChange={handleChange}
            required
            className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 rounded-md bg-transparent focus:outline-none focus:border-white/70"
          />
          <input
            name="lastName"
            placeholder="Last Name"
            onChange={handleChange}
            required
            className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 rounded-md bg-transparent focus:outline-none focus:border-white/70"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 rounded-md bg-transparent focus:outline-none focus:border-white/70"
          />
          {role === "organizer" && (
            <select
              name="currency"
              onChange={handleChange}
              value={formData.currency}
              className="w-full bg-gray-800 text-white border border-white/30 text-sm sm:text-base px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
            >
              <option value="" disabled>
                Select your currency
              </option>
              <option value="USD">🇺🇸 US Dollars ($)</option>
              <option value="EUR">🇪🇺 Euro (€)</option>
              <option value="GBP">🇬🇧 British Pound (£)</option>
              <option value="JPY">🇯🇵 Japanese Yen (¥)</option>
              <option value="CAD">🇨🇦 Canadian Dollar (C$)</option>
              <option value="AUD">🇦🇺 Australian Dollar (A$)</option>
              <option value="CHF">🇨🇭 Swiss Franc (CHF)</option>
              <option value="CNY">🇨🇳 Chinese Yuan (¥)</option>
              <option value="INR">🇮🇳 Indian Rupee (₹)</option>
              <option value="BRL">🇧🇷 Brazilian Real (R$)</option>
            </select>
          )}
          <input
            name="dateOfBirth"
            type="date"
            onChange={handleChange}
            required
            className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 rounded-md bg-transparent focus:outline-none focus:border-white/70"
          />
          <input
            name="phone"
            placeholder="Phone Number"
            onChange={handleChange}
            required
            className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 rounded-md bg-transparent focus:outline-none focus:border-white/70"
          />
          {role === "attendee" && (
            <input
              name="instagramHandle"
              placeholder="Instagram Handle"
              onChange={handleChange}
              className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 rounded-md bg-transparent focus:outline-none focus:border-white/70"
            />
          )}
          {role === "organizer" && (
            <input
              name="organizationName"
              placeholder="Organization Name"
              onChange={handleChange}
              className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 rounded-md bg-transparent focus:outline-none focus:border-white/70"
            />
          )}
        </div>

        {/* Password Fields (both with their own toggles) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={handleChange}
              required
              className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 pr-10 rounded-md bg-transparent focus:outline-none focus:border-white/70"
            />
            <EyeToggle
              visible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>

          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              onChange={handleChange}
              required
              className="w-full border border-white text-white text-xs sm:text-sm md:text-base px-2 sm:px-3 py-2 sm:py-3 pr-10 rounded-md bg-transparent focus:outline-none focus:border-white/70"
            />
            <EyeToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start text-white text-xs sm:text-sm mb-4 sm:mb-6">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            className="mr-2 mt-1 flex-shrink-0"
          />
          <span className="leading-relaxed">
            I accept{" "}
            <a
              href="https://www.eventtribe.com/TermsAndConditions"
              className="underline mx-1 text-white hover:text-gray-300"
              target="_blank"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://www.eventtribe.com/PrivacyPolicy"
              className="underline ml-1 text-white hover:text-gray-300"
              target="_blank"
            >
              Privacy Policy
            </a>
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-white text-gray-900 py-2 sm:py-3 rounded-md font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
        >
          JOIN EVENT TRIBE
        </button>

        {/* Divider */}
        <div className="my-4 sm:my-6 flex items-center">
          <div className="flex-1 border-t border-gray-600"></div>
          <div className="px-3 text-gray-400 text-xs sm:text-sm">or</div>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={() => (window.location.href = "/api/auth/google")}
          className="w-full bg-gray-100 text-gray-900 py-2 sm:py-3 rounded-md font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2 border border-gray-300 text-sm sm:text-base"
        >
          <FaGoogle className="text-red-500 text-sm sm:text-base" />
          Continue with Google
        </button>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center text-white text-xs sm:text-sm">
          Already have an account?{" "}
          <a
            href="/login"
            className="underline font-medium hover:text-gray-300"
          >
            Login
          </a>
          <p className="mt-2 text-xs opacity-50">© Event Tribe Corporation</p>
        </div>
      </form>
    </div>
  );
}
