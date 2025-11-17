const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'syaa-bot-secret-key-2024';

// In-memory storage untuk demo (ganti dengan database di production)
const accounts = {
  owners: [
    { id: 1, username: 'owner1', password: 'password123', role: 'owner' },
    { id: 2, username: 'owner2', password: 'password123', role: 'owner' }
  ],
  users: [
    { id: 3, username: 'user1', password: 'password123', role: 'user' },
    { id: 4, username: 'user2', password: 'password123', role: 'user' }
  ]
};

let tokens = []; // In-memory tokens storage

function verifyPassword(inputPassword, storedPassword) {
  return inputPassword === storedPassword; // Simplified for demo
}

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = decoded;
  next();
}

module.exports = {
  accounts,
  tokens,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticate
};
