// api/login.js
const fs = require('fs');
const path = require('path');
const { sign } = require('./auth');

const ACC_PATH = path.join(__dirname, 'data', 'accounts.json');

function readAccounts(){
  try{
    const txt = fs.readFileSync(ACC_PATH, 'utf8');
    return JSON.parse(txt);
  }catch(e){
    return [];
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if(req.method === 'OPTIONS'){ res.status(200).send('ok'); return; }

  if(req.method !== 'POST'){
    res.status(405).json({ success:false, message:'Method not allowed' });
    return;
  }

  let body = req.body;
  // In Vercel, req.body may be parsed already; else parse
  if(!body){
    try { body = JSON.parse(await new Promise(r=>{ let s=''; req.on('data',c=>s+=c); req.on('end',()=>r(s)); })); }catch(e){}
  }

  const username = (body && body.username) || '';
  const password = (body && body.password) || '';
  if(!username || !password){
    res.status(400).json({ success:false, message:'Username & password required' });
    return;
  }

  const accounts = readAccounts();
  const user = accounts.find(a => a.username === username && a.password === password);
  if(!user){
    res.status(401).json({ success:false, message:'Invalid username or password' });
    return;
  }

  // create token
  const token = sign({ username: user.username, role: user.role });
  res.status(200).json({ success:true, token, user: { username: user.username, role: user.role } });
};
