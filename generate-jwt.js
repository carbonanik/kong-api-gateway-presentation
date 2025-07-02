const jwt = require('jsonwebtoken');

// JWT credentials from kong.yaml
const key = "test-key";
const secret = "test-secret";

// Create JWT payload
const payload = {
  iss: key,  // issuer (must match the key)
  iat: Math.floor(Date.now() / 1000),  // issued at
  exp: Math.floor(Date.now() / 1000) + (60 * 60)  // expires in 1 hour
};

// Generate JWT token
const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

console.log('JWT Token:');
console.log(token);
console.log('\nUse this token in your requests:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8000/customer/register`); 