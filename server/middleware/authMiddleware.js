import { enhancedAuthService } from '../authServiceEnhanced.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'Access token required' });
    }

    console.log('Verifying token:', token.substring(0, 20) + '...');
    const decoded = enhancedAuthService.verifyAccessToken(token);
    console.log('Token decoded successfully for user:', decoded.userId);

    const user = await enhancedAuthService.getUserById(decoded.userId);
    console.log('User found:', user ? user.email : 'No user');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.tokenData = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

export const requireVerification = (verificationType = 'both') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { emailVerified, phoneVerified } = req.user;

    if (verificationType === 'email' && !emailVerified) {
      return res.status(403).json({ 
        message: 'Email verification required',
        requiresVerification: { email: true }
      });
    }

    if (verificationType === 'phone' && !phoneVerified) {
      return res.status(403).json({ 
        message: 'Phone verification required',
        requiresVerification: { phone: true }
      });
    }

    if (verificationType === 'both' && (!emailVerified || !phoneVerified)) {
      return res.status(403).json({ 
        message: 'Email and phone verification required',
        requiresVerification: { 
          email: !emailVerified,
          phone: !phoneVerified
        }
      });
    }

    next();
  };
};

export const rateLimitByIP = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  const requestCounts = new Map();

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, data] of requestCounts.entries()) {
      data.requests = data.requests.filter(timestamp => timestamp > windowStart);
      if (data.requests.length === 0) {
        requestCounts.delete(ip);
      }
    }

    // Check current IP
    if (!requestCounts.has(clientIP)) {
      requestCounts.set(clientIP, { requests: [] });
    }

    const ipData = requestCounts.get(clientIP);
    ipData.requests = ipData.requests.filter(timestamp => timestamp > windowStart);

    if (ipData.requests.length >= maxRequests) {
      return res.status(429).json({ 
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    ipData.requests.push(now);
    next();
  };
};