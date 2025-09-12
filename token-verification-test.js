// Token Verification Test Script
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'farhanSecretkey';
const FALLBACK_SECRET = 'farhanSecretkey';

// Test tokens
// This is the token you get from the API
const token = process.argv[2] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODY3NTVlOWI2OGRlNzUxZTYzOTA0YWQiLCJyb2xlIjoib3JnYW5pemVyIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NzU3MTQwM30.wSfrH3PFbcjpS2W0xKEBGbCfwNskJuj1keSEQLKdiI4';

console.log('===========================================================');
console.log('TOKEN VERIFICATION TEST');
console.log('===========================================================');
console.log('JWT_SECRET from .env:', JWT_SECRET);
console.log('FALLBACK_SECRET:', FALLBACK_SECRET);
console.log('Token to verify:', token);
console.log('===========================================================');

// Try with the primary secret
try {
  console.log('\nTrying with PRIMARY JWT_SECRET...');
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ SUCCESS! Token verified with PRIMARY key');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ FAILED with PRIMARY key:', error.message);
}

// Try with the fallback secret
try {
  console.log('\nTrying with FALLBACK_SECRET...');
  const decoded = jwt.verify(token, FALLBACK_SECRET);
  console.log('✅ SUCCESS! Token verified with FALLBACK key');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ FAILED with FALLBACK key:', error.message);
}

// Basic token parsing (without verification)
try {
  console.log('\nDecoding token WITHOUT verification...');
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    console.log('❌ INVALID token format - not a JWT (should have 3 parts)');
  } else {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('Token header:', header);
    console.log('Token payload:', payload);
    
    // Check required fields
    if (!payload.userId) console.log('❌ MISSING userId in payload');
    if (!payload.role) console.log('❌ MISSING role in payload');
    if (payload.role !== 'organizer') console.log('⚠️ WARNING: role is not "organizer"');
  }
} catch (error) {
  console.log('❌ ERROR parsing token:', error.message);
}

console.log('\n===========================================================');
console.log('TEST COMPLETE');
console.log('===========================================================');
