/* ═══════════════════════════════════════════════
   UvalyBet.cz — Core Application
   ═══════════════════════════════════════════════ */

// === UTILITIES ===
const LS = k => JSON.parse(localStorage.getItem(k) || 'null');
const SS = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const $ = id => document.getElementById(id);
let U = null; // Current user

// === THEMES ===
const THEMES = [
  { id:'neon', nm:'Neon', dots:['#04060b','#00ff88','#0a84ff'],
    vars:{'--bg0':'#04060b','--bg1':'#0a0e18','--bg2':'#0f1422','--bg3':'#161c2e','--bg4':'#1e2640','--acc':'#00ff88','--acc2':'#00cc6a','--accR':'0','--accG':'255','--accB':'136','--red':'#ff2d55','--grn':'#00ff88','--gld':'#ffd60a','--blu':'#0a84ff','--pur':'#bf5af2','--t1':'#f5f5fa','--t2':'#8e8ea0','--t3':'#48485a','--brd':'#1a1f30'}},
  { id:'midnight', nm:'Midnight', dots:['#0c0a1a','#a78bfa','#60a5fa'],
    vars:{'--bg0':'#0c0a1a','--bg1':'#12102a','--bg2':'#1a1636','--bg3':'#241e48','--bg4':'#2e285a','--acc':'#a78bfa','--acc2':'#8b5cf6','--accR':'167','--accG':'139','--accB':'250','--red':'#f43f5e','--grn':'#34d399','--gld':'#fbbf24','--blu':'#60a5fa','--pur':'#a78bfa','--t1':'#f1f0ff','--t2':'#9896b0','--t3':'#5a5872','--brd':'#2a2540'}},
  { id:'sunset', nm:'Sunset', dots:['#1a0a0a','#ff6b6b','#ffa502'],
    vars:{'--bg0':'#1a0a0a','--bg1':'#241010','--bg2':'#2e1616','--bg3':'#3a1e1e','--bg4':'#482828','--acc':'#ff6b6b','--acc2':'#ee5a24','--accR':'255','--accG':'107','--accB':'107','--red':'#ff4757','--grn':'#2ed573','--gld':'#ffa502','--blu':'#3742fa','--pur':'#a55eea','--t1':'#fff5f5','--t2':'#b08888','--t3':'#6a4444','--brd':'#3a2020'}},
  { id:'arctic', nm:'Arctic ☀️', dots:['#e8ecf2','#0066ff','#0bc5ea'],
    vars:{'--bg0':'#e8ecf2','--bg1':'#dde3ec','--bg2':'#d0d8e4','--bg3':'#c2ccdc','--bg4':'#b4c0d4','--acc':'#0066ff','--acc2':'#0052cc','--accR':'0','--accG':'102','--accB':'255','--red':'#e53e3e','--grn':'#38a169','--gld':'#d69e2e','--blu':'#0066ff','--pur':'#805ad5','--t1':'#1a202c','--t2':'#4a5568','--t3':'#a0aec0','--brd':'#bcc5d3'}},
  { id:'gold', nm:'Gold VIP', dots:['#0d0b00','#ffd700','#ff8c42'],
    vars:{'--bg0':'#0d0b00','--bg1':'#1a1500','--bg2':'#262000','--bg3':'#332b00','--bg4':'#403500','--acc':'#ffd700','--acc2':'#ccac00','--accR':'255','--accG':'215','--accB':'0','--red':'#ff3355','--grn':'#00e87b','--gld':'#ffd700','--blu':'#3d8bff','--pur':'#a855f7','--t1':'#fff8e1','--t2':'#b8a060','--t3':'#6a5a30','--brd':'#3d3200'}}
];

function setTheme(id) {
  const th = THEMES.find(t => t.id === id);
  if (!th) return;
  const r = document.documentElement;
  Object.entries(th.vars).forEach(([k, v]) => r.style.setProperty(k, v));
  if (U) { U.theme = id; saveU(); }
  document.querySelectorAll('.tho').forEach(o => o.classList.toggle('sel', o.dataset.id === id));
  toast('🎨 Téma: ' + th.nm, 'w');
}

function renderThemes() {
  const g = $('thGrid');
  if (!g) return;
  g.innerHTML = THEMES.map(t =>
    `<div class="tho ${U && U.theme === t.id ? 'sel' : ''}" data-id="${t.id}" onclick="setTheme('${t.id}')">
      <div class="th-dots">${t.dots.map(c => `<div class="th-dot" style="background:${c}"></div>`).join('')}</div>
      <div style="font-weight:700;font-size:.82rem">${t.nm}</div>
    </div>`
  ).join('');
}

// === PARTICLES ===
let particlesOn = true;
const pCv = $('particles');
const pCx = pCv ? pCv.getContext('2d') : null;
let pts = [];

function initParticles() {
  if (!pCv) return;
  pCv.width = innerWidth;
  pCv.height = innerHeight;
  pts = [];
  for (let i = 0; i < 25; i++) {
    pts.push({
      x: Math.random() * pCv.width,
      y: Math.random() * pCv.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.4,
      o: Math.random() * 0.08 + 0.02
    });
  }
}

function drawParticles() {
  if (!pCv || !pCx) return requestAnimationFrame(drawParticles);
  pCx.clearRect(0, 0, pCv.width, pCv.height);
  if (particlesOn) {
    const s = getComputedStyle(document.documentElement);
    const r = s.getPropertyValue('--accR').trim() || '0';
    const g = s.getPropertyValue('--accG').trim() || '255';
    const b = s.getPropertyValue('--accB').trim() || '136';
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = pCv.width;
      if (p.x > pCv.width) p.x = 0;
      if (p.y < 0) p.y = pCv.height;
      if (p.y > pCv.height) p.y = 0;
      pCx.beginPath();
      pCx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCx.fillStyle = `rgba(${r},${g},${b},${p.o})`;
      pCx.fill();
    });
  }
  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', () => {
  if (pCv) { pCv.width = innerWidth; pCv.height = innerHeight; }
});
initParticles();
drawParticles();

// === AUTH ===
function swAuth(m) {
  $('aL').style.display = m === 'login' ? 'block' : 'none';
  $('aR').style.display = m === 'reg' ? 'block' : 'none';
  document.querySelectorAll('.atab').forEach((t, i) => t.classList.toggle('on', m === 'login' ? i === 0 : i === 1));
  $('aErr').textContent = '';
}

function doReg() {
  const u = $('rU').value.trim(), p = $('rP').value, p2 = $('rP2').value, e = $('aErr');
  if (u.length < 2) return e.textContent = 'Jméno min. 2 znaky';
  if (p.length < 4) return e.textContent = 'Heslo min. 4 znaky';
  if (p !== p2) return e.textContent = 'Hesla se neshodují';
  const us = LS('ub_users') || {};
  if (us[u]) return e.textContent = 'Uživatel existuje';
  us[u] = {
    pass: p, balance: 10000, portfolio: {}, cPortfolio: {},
    stats: { wins: 0, losses: 0, played: 0, earned: 0, spent: 0, biggestWin: 0, gamesWon: {} },
    xp: 0, level: 1, joinDate: Date.now(),
    daily: { streak: 0, lastClaim: 0 }, dailySpin: 0,
    favs: [], tx: [], achievements: {}, inventory: [], theme: 'neon',
    totalDeposited: 0
  };
  SS('ub_users', us);
  SS('ub_cur', u);
  loginAs(u);
}

function doLogin() {
  const u = $('lU').value.trim(), p = $('lP').value, e = $('aErr');
  const us = LS('ub_users') || {};
  if (!us[u]) return e.textContent = 'Uživatel neexistuje';
  if (us[u].pass !== p) return e.textContent = 'Špatné heslo';
  SS('ub_cur', u);
  loginAs(u);
}

function loginAs(n) {
  const us = LS('ub_users') || {};
  U = { name: n, ...us[n] };
  // Ensure all fields exist (migration for old accounts)
  if (!U.stats) U.stats = { wins: 0, losses: 0, played: 0, earned: 0, spent: 0, biggestWin: 0, gamesWon: {} };
  if (!U.stats.biggestWin) U.stats.biggestWin = 0;
  if (!U.stats.gamesWon) U.stats.gamesWon = {};
  if (!U.tx) U.tx = [];
  if (!U.favs) U.favs = [];
  if (!U.achievements) U.achievements = {};
  if (!U.inventory) U.inventory = [];
  if (!U.cPortfolio) U.cPortfolio = {};
  if (!U.portfolio) U.portfolio = {};
  if (!U.daily) U.daily = { streak: 0, lastClaim: 0 };
  if (!U.dailySpin) U.dailySpin = 0;
  if (!U.theme) U.theme = 'neon';
  if (!U.totalDeposited) U.totalDeposited = 0;

  setTheme(U.theme);
  renderThemes();

  $('auth').classList.add('h');
  $('topbar').classList.remove('h');
  $('bU').textContent = n[0].toUpperCase();
  $('mU').textContent = n;

  updBal();
  updXP();

  // Initialize all subsystems
  if (typeof renderGames === 'function') renderGames();
  if (typeof renderDaily === 'function') renderDaily();
  if (typeof genQs === 'function') genQs();
  if (typeof renderAch === 'function') renderAch();
  if (typeof renderShop === 'function') renderShop();
  if (typeof renderLB === 'function') renderLB();

  setTimeout(() => {
    if (typeof renderStocks === 'function') renderStocks();
    if (typeof renderCrypto === 'function') renderCrypto();
  }, 100);

  toast('👋 Vítej, ' + n + '!', 'w');
}

function doLogout() {
  saveU();
  U = null;
  SS('ub_cur', null);
  $('auth').classList.remove('h');
  $('topbar').classList.add('h');
  toggleUM(true);
}

function saveU() {
  if (!U) return;
  const us = LS('ub_users') || {};
  const s = {};
  for (const k in U) if (k !== 'name') s[k] = U[k];
  s.pass = us[U.name]?.pass || '';
  us[U.name] = s;
  SS('ub_users', us);
}

// Auto-login
(function() {
  const c = LS('ub_cur');
  if (c) {
    const us = LS('ub_users') || {};
    if (us[c]) loginAs(c);
  }
})();

// === BALANCE & XP ===
function updBal(amt, reason) {
  if (amt !== undefined) {
    U.balance += amt;
    if (U.balance < 0) U.balance = 0;
    if (amt > 0) {
      U.stats.earned += amt;
      if (amt > U.stats.biggestWin) U.stats.biggestWin = amt;
    }
    if (amt < 0) U.stats.spent += Math.abs(amt);
    U.tx.unshift({ amt, reason: reason || '', time: Date.now() });
    if (U.tx.length > 60) U.tx.pop();
  }
  const el = $('balD');
  if (el) {
    el.textContent = U.balance.toLocaleString('cs-CZ');
    el.classList.remove('fl');
    void el.offsetWidth;
    el.classList.add('fl');
  }
  saveU();
}

function addXP(x) {
  U.xp += x;
  while (U.xp >= U.level * 500) {
    U.xp -= U.level * 500;
    U.level++;
    toast('🎉 Level UP! LV ' + U.level, 'w');
  }
  updXP();
  saveU();
}

function updXP() {
  const lvl = $('xpLvl');
  const fill = $('xpFill');
  if (lvl) lvl.textContent = 'LV ' + U.level;
  if (fill) fill.style.width = (U.xp / (U.level * 500) * 100) + '%';
}

// === TOAST ===
function toast(m, t) {
  const el = $('toast');
  if (!el) return;
  el.textContent = m;
  el.className = 'tst sh' + (t === 'w' ? ' tw' : t === 'l' ? ' tl' : '');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => el.className = 'tst', 3000);
}

// === NAVIGATION ===
const pgMap = { home:'pgHome', stocks:'pgStocks', crypto:'pgCrypto', shop:'pgShop', earn:'pgEarn', profile:'pgProfile' };

function nav(id, btn) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  const target = $(pgMap[id]);
  if (target) target.classList.add('on');
  document.querySelectorAll('.tbn button').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  scrollTo(0, 0);
  if (id === 'profile' && typeof renderProfile === 'function') renderProfile();
  if (id === 'crypto' && typeof renderCrypto === 'function') renderCrypto();
}

function toggleUM(fc) {
  const m = $('uMenu');
  if (m) m.classList[fc ? 'remove' : 'toggle']('open');
}

function openThemes() {
  renderThemes();
  $('thOv').classList.add('open');
}

function closeM() { $('mOv').classList.remove('open'); }

function openM(title, fn) {
  $('mT').textContent = title;
  $('mB').innerHTML = '';
  fn($('mB'));
  $('mOv').classList.add('open');
}

// Global listeners
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeM();
    const thOv = $('thOv'); if (thOv) thOv.classList.remove('open');
    closeCk();
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('#uMenu') && !e.target.closest('#bU')) {
    const m = $('uMenu'); if (m) m.classList.remove('open');
  }
});

$('mOv')?.addEventListener('click', function(e) { if (e.target === this) closeM(); });

// === CHECKOUT ===
let ckAmt = 5000, ckPay = 'apple';

function openCk() {
  $('ckOv').classList.add('open');
  $('ckBody').style.display = 'block';
  $('ckProc').style.display = 'none';
  $('ckOk').style.display = 'none';
}

function closeCk() { const ov = $('ckOv'); if (ov) ov.classList.remove('open'); }

function selA(el, v) {
  ckAmt = v;
  document.querySelectorAll('.ck-amt').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  const cust = $('ckCust'); if (cust) cust.value = '';
  updCk();
}

function selP(el, p) {
  ckPay = p;
  document.querySelectorAll('.pay-m').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  updCk();
}

function updCk() {
  const cust = $('ckCust');
  const a = (cust && cust.value) ? +cust.value : ckAmt;
  const total = $('ckTotal');
  if (total) total.textContent = a.toLocaleString('cs-CZ') + ' CZK';
  const lbl = { apple: ' Pay', google: 'G Pay', crypto: '₿ Crypto', card: 'Zaplatit' };
  const btn = $('ckBtn');
  if (btn) btn.textContent = (lbl[ckPay] || 'Zaplatit') + ' · ' + a.toLocaleString('cs-CZ') + ' CZK';
}

function procCk() {
  const cust = $('ckCust');
  const a = (cust && cust.value) ? +cust.value : ckAmt;
  if (a < 100) return toast('Min 100 CZK', 'l');
  $('ckBody').style.display = 'none';
  $('ckProc').style.display = 'block';

  setTimeout(() => {
    $('ckProc').style.display = 'none';
    $('ckOk').style.display = 'block';
    $('ckOkAmt').textContent = '+' + a.toLocaleString('cs-CZ') + ' CZK';
    updBal(a, 'Deposit (' + ckPay + ')');
    U.totalDeposited += a;
    addXP(Math.floor(a / 100));
    saveU();
  }, 2000);
}

// Bind custom amount input
const ckCustEl = $('ckCust');
if (ckCustEl) ckCustEl.addEventListener('input', updCk);

// === TICKER ===
function initTicker() {
  const el = $('ticker');
  if (!el) return;
  const names = ['Hráč007','LuckyCZ','VIPKarel','Boss888','DarkLord','JanaK','Šťastný42','MirekPro'];
  const games = ['Automaty','Crash','Miny','Blackjack','Kolo','Baccarat','Limbo','Věže','Ruleta','Dice'];
  let html = '';
  for (let i = 0; i < 24; i++) {
    const n = names[Math.floor(Math.random() * names.length)];
    const g = games[Math.floor(Math.random() * games.length)];
    const a = (Math.floor(Math.random() * 80) + 1) * 100;
    html += `<div class="tki">🏆 ${n} <span class="tkw">${a.toLocaleString('cs-CZ')}</span> v ${g}</div>`;
  }
  el.innerHTML = html + html;
}
initTicker();
