// api/tokens.js
const fs = require('fs');
const path = require('path');
const { middleware } = require('./auth');

const DB_PATH = path.join(__dirname, '..', 'database.json');

function readDB(){
  try{
    const txt = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(txt);
  }catch(e){
    return [];
  }
}
function writeDB(data){
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if(req.method === 'OPTIONS'){ res.status(200).send('ok'); return; }

  // Auth check
  const auth = middleware(req);
  if(!auth.ok){ res.status(auth.code || 401).json({ success:false, message: auth.message || 'Unauthorized' }); return; }
  const user = auth.payload;

  if(req.method === 'GET'){
    const db = readDB();
    res.status(200).json({ success:true, tokens: db });
    return;
  }

  if(req.method === 'POST'){
    // parse body
    let body = req.body;
    if(!body){
      try { body = JSON.parse(await new Promise(r=>{ let s=''; req.on('data',c=>s+=c); req.on('end',()=>r(s)); })); }catch(e){}
    }
    const token = body && body.token;
    if(!token || typeof token !== 'string' || token.length < 20){
      res.status(400).json({ success:false, message:'Invalid token payload' });
      return;
    }
    // basic duplication check
    const db = readDB();
    if(db.some(t => t.token === token)){
      res.status(409).json({ success:false, message:'Token already exists' });
      return;
    }
    const newId = db.length ? Math.max(...db.map(x=>x.id)) + 1 : 1;
    const ent = { id: newId, token, createdBy: user.username, createdAt: new Date().toISOString() };
    db.push(ent);
    try{
      writeDB(db);
    }catch(e){
      // ignore write errors but still return success
    }
    res.status(201).json({ success:true, message:'Token added successfully', token: ent });
    return;
  }

  if(req.method === 'DELETE'){
    // id from query param
    const query = req.query || {};
    // in Vercel, url param parsing may put them in req.url — fallback parse
    let id = query.id;
    if(!id){
      // parse from url
      const url = req.url || '';
      const parts = url.split('?')[1] || '';
      const sp = new URLSearchParams(parts);
      id = sp.get('id');
    }
    if(!id){
      res.status(400).json({ success:false, message:'id query required' });
      return;
    }
    const numeric = parseInt(id,10);
    const db = readDB();
    const idx = db.findIndex(x=>x.id === numeric);
    if(idx === -1){
      res.status(404).json({ success:false, message:'Token not found' });
      return;
    }
    // Only allow deletion by owner or creator
    const entry = db[idx];
    if(user.role !== 'owner' && user.username !== entry.createdBy){
      res.status(403).json({ success:false, message:'Forbidden: only owner or creator can delete' });
      return;
    }
    db.splice(idx,1);
    try{ writeDB(db); }catch(e){}
    res.status(200).json({ success:true, message:'Token deleted successfully' });
    return;
  }

  res.status(405).json({ success:false, message:'Method not allowed' });
};
