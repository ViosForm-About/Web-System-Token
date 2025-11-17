const { authenticate } = require('./auth');
const fs = require('fs');
const path = require('path');

const DATABASE_FILE = path.join(process.cwd(), 'data', 'database.json');

// Baca tokens dari file
function readTokens() {
  try {
    const data = fs.readFileSync(DATABASE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Tulis tokens ke file
function writeTokens(tokens) {
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(tokens, null, 2));
    return true;
  } catch (error) {
    console.error('Write tokens error:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  // Authenticate user
  authenticate(req, res, () => {
    try {
      const { method } = req;
      let tokens = readTokens();

      // GET - Ambil semua tokens
      if (method === 'GET') {
        return res.status(200).json({
          success: true,
          tokens: tokens
        });
      }

      // POST - Tambah token baru
      if (method === 'POST') {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({
            success: false,
            message: 'Token tidak boleh kosong'
          });
        }

        const newToken = {
          id: tokens.length > 0 ? Math.max(...tokens.map(t => t.id)) + 1 : 1,
          token: token,
          createdBy: req.user.username,
          createdAt: new Date().toISOString(),
          createdByRole: req.user.role
        };

        tokens.push(newToken);

        if (writeTokens(tokens)) {
          return res.status(201).json({
            success: true,
            message: 'Token berhasil ditambahkan',
            token: newToken
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan token'
          });
        }
      }

      // DELETE - Hapus token
      if (method === 'DELETE') {
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID token diperlukan'
          });
        }

        const tokenId = parseInt(id);
        const initialLength = tokens.length;
        tokens = tokens.filter(t => t.id !== tokenId);

        if (tokens.length < initialLength) {
          if (writeTokens(tokens)) {
            return res.status(200).json({
              success: true,
              message: 'Token berhasil dihapus'
            });
          } else {
            return res.status(500).json({
              success: false,
              message: 'Gagal menghapus token'
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'Token tidak ditemukan'
          });
        }
      }

      // Method not allowed
      return res.status(405).json({
        success: false,
        message: 'Method tidak diizinkan'
      });

    } catch (error) {
      console.error('Tokens API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  });
};