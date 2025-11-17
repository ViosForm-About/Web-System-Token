// api/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'zYxIk6dZQJaBa0U8JGaSPLFFTDejo1xN';

module.exports = {
  sign(payload, opts = {}) {
    return jwt.sign(payload, JWT_SECRET, Object.assign({ expiresIn: '6h' }, opts));
  },
  verify(token) {
    try {
      const p = jwt.verify(token, JWT_SECRET);
      return { ok: true, payload: p };
    } catch (err) {
      return { ok: false, error: err };
    }
  },
  middleware(req) {
    // expects Bearer token in Authorization
    const h = req.headers && req.headers.authorization;
    if(!h) return { ok: false, code:401, message: 'Missing authorization header' };
    const parts = h.split(' ');
    if(parts.length !== 2 || parts[0] !== 'Bearer') return { ok:false, code:401, message: 'Bad authorization header' };
    const token = parts[1];
    const v = this.verify(token);
    if(!v.ok) return { ok:false, code:401, message:'Invalid token' };
    return { ok:true, payload: v.payload };
  }
};
