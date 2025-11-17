// script.js - shared frontend functions for login & dashboard
window.syaa_api = async function(path, opts = {}) {
  const token = localStorage.getItem('syaa_jwt');
  const headers = opts.headers || {};
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, Object.assign({ credentials: 'same-origin', headers }, opts));
  if(res.status === 401){
    // unauthorized -> redirect to login
    localStorage.removeItem('syaa_jwt');
    localStorage.removeItem('syaa_user');
    location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(()=> ({}));
  if(!res.ok) {
    throw new Error((data && data.message) || 'API Error');
  }
  return data;
};

// format token: show only half (first half) and mask rest with dots, but keep length parity
window.syaa_maskToken = function(tok) {
  if(!tok) return '';
  const len = tok.length;
  const half = Math.ceil(len/2);
  const left = tok.slice(0, half);
  const masked = '•'.repeat(len - half);
  return left + masked;
};

// For dashboard to load tokens & update UI
window.syaa_loadTokens = async function(){
  const term = document.getElementById('term');
  const tbody = document.getElementById('tokenBody');
  term.textContent = 'Loading tokens...';
  tbody.innerHTML = '';
  try{
    const data = await window.syaa_api('/api/tokens');
    const tokens = data.tokens || [];
    if(tokens.length === 0){
      term.textContent = '[No tokens found]';
      return;
    }
    term.textContent = '';
    tokens.forEach((t, idx) => {
      const line = document.createElement('div');
      line.textContent = `[${idx+1}] id:${t.id} createdBy:${t.createdBy} @ ${new Date(t.createdAt).toLocaleString()}`;
      term.appendChild(line);

      const tr = document.createElement('tr');
      const tdNo = document.createElement('td'); tdNo.textContent = idx+1;
      const tdTok = document.createElement('td');
      tdTok.className = 'token-cell';
      tdTok.textContent = window.syaa_maskToken(t.token);
      const tdAct = document.createElement('td');
      tdAct.className = 'row-actions';

      const btnDel = document.createElement('button');
      btnDel.className = 'btn danger';
      btnDel.textContent = 'Delete';
      btnDel.addEventListener('click', async ()=>{
        if(!confirm('Delete token id='+t.id+' ?')) return;
        try{
          await window.syaa_api('/api/tokens?id='+t.id, { method:'DELETE' });
          await window.syaa_loadTokens();
        }catch(err){
          alert(err.message || 'Gagal menghapus token');
        }
      });

      tdAct.appendChild(btnDel);
      tr.appendChild(tdNo); tr.appendChild(tdTok); tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
  }catch(err){
    term.textContent = 'Gagal load tokens: ' + (err.message || '');
  }
};

// Add token function used by modal
window.syaa_addToken = async function(tokenStr){
  // basic validation: contain ':' and length > 20
  if(typeof tokenStr !== 'string' || tokenStr.length < 20 || !tokenStr.includes(':')) {
    throw new Error('Format token tidak valid');
  }
  await window.syaa_api('/api/tokens', {
    method:'POST',
    body: JSON.stringify({ token: tokenStr })
  });
  await window.syaa_loadTokens();
};
