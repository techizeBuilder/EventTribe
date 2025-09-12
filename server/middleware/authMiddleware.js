import { enhancedAuthService } from "../authServiceEnhanced.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header received:", authHeader ? "Bearer ***" : "None");

    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      console.log("No token provided in request for:", req.method, req.path);
      return res.status(401).json({ message: "Access token required" });
    }

    console.log(
      "Verifying token:",
      token.substring(0, 20) + "...",
      "for:",
      req.method,
      req.path,
    );

    // Add detailed debugging for token verification
    try {
      const decoded = enhancedAuthService.verifyAccessToken(token);
      console.log("Token decoded successfully for user:", decoded.userId, "role:", decoded.role);

      // Ensure auth service is connected before querying user
      if (!enhancedAuthService.users) {
        console.log("Auth service not connected, connecting...");
        await enhancedAuthService.connect();
      }

      const user = await enhancedAuthService.getUserById(decoded.userId);
      console.log("User found:", user ? user.email : "No user", "role:", user ? user.role : "N/A");

      if (!user) {
        console.log("User not found in database for ID:", decoded.userId);
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      req.tokenData = decoded;
      next();
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError.message);
      console.error("Token verification stack:", tokenError.stack);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Authentication middleware error:", error.message);
    console.error("Full error stack:", error.stack);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};
export const requireVerification = (verificationType = "both") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { emailVerified, phoneVerified } = req.user;

    if (verificationType === "email" && !emailVerified) {
      return res.status(403).json({
        message: "Email verification required",
        requiresVerification: { email: true },
      });
    }

    if (verificationType === "phone" && !phoneVerified) {
      return res.status(403).json({
        message: "Phone verification required",
        requiresVerification: { phone: true },
      });
    }

    if (verificationType === "both" && (!emailVerified || !phoneVerified)) {
      return res.status(403).json({
        message: "Email and phone verification required",
        requiresVerification: {
          email: !emailVerified,
          phone: !phoneVerified,
        },
      });
    }

    next();
  };
};

export const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Admin auth header received:", authHeader ? "Bearer ***" : "None");

    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      console.log("No token provided in admin request for:", req.method, req.path);
      return res.status(401).json({ message: "Access token required" });
    }

    try {
      const decoded = enhancedAuthService.verifyAccessToken(token);
      console.log("Token decoded for admin:", decoded.userId, "role:", decoded.role);

      // Ensure auth service is connected before querying user
      if (!enhancedAuthService.users) {
        console.log("Auth service not connected, connecting...");
        await enhancedAuthService.connect();
      }

      const user = await enhancedAuthService.getUserById(decoded.userId);
      console.log("Admin user found:", user ? user.email : "No user", "role:", user ? user.role : "N/A");

      if (!user) {
        console.log("User not found in database for admin ID:", decoded.userId);
        return res.status(401).json({ message: "User not found" });
      }

      // Verify user is an admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        console.log("User is not an admin. Role:", user.role);
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      req.user = user;
      req.tokenData = decoded;
      next();
    } catch (tokenError) {
      console.error("Admin token verification failed:", tokenError.message);
      console.error("Token verification stack:", tokenError.stack);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Admin authentication middleware error:", error.message);
    console.error("Full error stack:", error.stack);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authenticateOrganizer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header received for organizer:", authHeader ? "Bearer ***" : "None");

    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      console.log("No token provided in organizer request for:", req.method, req.path);
      return res.status(401).json({ message: "Access token required" });
    }

    // Log the token (first 10 chars only for security)
    console.log("Token first 10 chars:", token.substring(0, 10) + "...");
    console.log("Token length:", token.length);

    console.log(
      "Verifying organizer token:",
      token.substring(0, 20) + "...",
      "for:",
      req.method,
      req.path,
    );

    try {
      console.log("Token before verification:", token);
      console.log("JWT_SECRET used for verification:", process.env.JWT_SECRET);
      try {
        // Manually try to decode the token without verification first
        const decoded_parts = token.split('.');
        if (decoded_parts.length === 3) {
          const payload = JSON.parse(Buffer.from(decoded_parts[1], 'base64').toString());
          console.log("Token payload (decoded manually):", payload);
        }
      } catch (err) {
        console.log("Error manually decoding token:", err.message);
      }

      const decoded = enhancedAuthService.verifyAccessToken(token);
      console.log("Token decoded successfully for organizer:", decoded.userId, "role:", decoded.role);

      // Ensure auth service is connected before querying user
      if (!enhancedAuthService.users) {
        console.log("Auth service not connected, connecting...");
        await enhancedAuthService.connect();
      }

      const user = await enhancedAuthService.getUserById(decoded.userId);
      console.log("Organizer found:", user ? user.email : "No user", "role:", user ? user.role : "N/A");

      if (!user) {
        console.log("User not found in database for organizer ID:", decoded.userId);
        return res.status(401).json({ message: "User not found" });
      }

      // Verify user is an organizer
      if (user.role !== 'organizer') {
        console.log("User is not an organizer. Role:", user.role);
        return res.status(403).json({ message: "Access denied. Organizer role required." });
      }

      req.user = user;
      req.tokenData = decoded;
      next();
    } catch (tokenError) {
      console.error("Organizer token verification failed:", tokenError.message);
      console.error("Token verification stack:", tokenError.stack);
      return res.status(401).json({
        message: "Invalid token",
        details: tokenError.message,
        path: req.path,
        method: req.method
      });
    }
  } catch (error) {
    console.error("Organizer authentication middleware error:", error.message);
    console.error("Full error stack:", error.stack);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const rateLimitByIP = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  const requestCounts = new Map();

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, data] of requestCounts.entries()) {
      data.requests = data.requests.filter(
        (timestamp) => timestamp > windowStart,
      );
      if (data.requests.length === 0) {
        requestCounts.delete(ip);
      }
    }

    // Check current IP
    if (!requestCounts.has(clientIP)) {
      requestCounts.set(clientIP, { requests: [] });
    }

    const ipData = requestCounts.get(clientIP);
    ipData.requests = ipData.requests.filter(
      (timestamp) => timestamp > windowStart,
    );

    if (ipData.requests.length >= maxRequests) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    ipData.requests.push(now);
    next();
  };
};
