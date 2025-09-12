// auth-middleware-test.js
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const port = 5050;

// Constants
const JWT_SECRET = 'farhanSecretkey';

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  try {
    console.log('Authenticating token:', token.substring(0, 15) + '...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    req.user = {
      _id: decoded.userId,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message
    });
  }
}

// Test routes
app.get('/api/public', (req, res) => {
  res.json({ message: 'Public API - No auth needed' });
});

app.get('/api/private', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Private API - Auth successful!',
    userId: req.user._id,
    role: req.user.role
  });
});

// Generate a test token with the same format
app.get('/api/generate-token', (req, res) => {
  const userId = '686755e9b68de751e63904ad';
  const role = 'organizer';
  
  const token = jwt.sign({ userId, role, type: 'access' }, JWT_SECRET);
  
  res.json({
    message: 'Token generated successfully',
    token,
    testEndpoint: `curl -H "Authorization: Bearer ${token}" http://localhost:${port}/api/private`
  });
});

// Start server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log(`Generate a test token: http://localhost:${port}/api/generate-token`);
  console.log(`Test protected endpoint: http://localhost:${port}/api/private (with Authorization header)`);
});
