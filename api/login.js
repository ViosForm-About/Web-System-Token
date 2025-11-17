const { readAccounts, verifyPassword, generateToken } = require('./auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username dan password harus diisi' 
      });
    }

    const accounts = readAccounts();
    
    // Cari user di owners atau users
    let user = accounts.owners.find(acc => acc.username === username);
    if (!user) {
      user = accounts.users.find(acc => acc.username === username);
    }
    
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }

    const token = generateToken(user);
    
    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
};