const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = 'syaa-bot-secret-key-2024';
const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');

// Baca data akun
function readAccounts() {
  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { owners: [], users: [] };
  }
}

// Verifikasi password
function verifyPassword(inputPassword, storedHash) {
  return inputPassword === 'password123'; // Simplified for demo
}

// Generate JWT Token
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

// Verify JWT Token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware auth
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
  readAccounts,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticate
};