/* ═══════════════════════════════════════════
   UvalyBet.cz — app.js (Core Module)
   Auth, Navigation, Balance, XP, Themes,
   Particles, Checkout, Toast, Ticker
   ═══════════════════════════════════════════ */

// ── Globals ──
let CUR_USER = null;
const LS_USERS = 'ub_users';
const LS_CUR = 'ub_cur';

// ── Helpers ──
function getUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) || {}; } catch { return {}; }
}
function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }
function getUser() {
  if (!CUR_USER) return null;
  const u = getUsers();
  return u[CUR_USER] || null;
}
function saveUser(data) {
  if (!CUR_USER) return;
  const u = getUsers();
  u[CUR_USER] = data;
  saveUsers(u);
}
function fmtCZK(n) { return Math.floor(n).toLocaleString('cs-CZ') + ' CZK'; }

// ── Auth ──
function authTab(tab) {
  document.getElementById('authLogin').classList.toggle('hidden', tab !== 'login');
  document.getElementById('authRegister').classList.toggle('hidden', tab !== 'register');
  document.querySelectorAll('.auth-tabs button').forEach((b, i) => {
    b.classList.toggle('act', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('authErr').textContent = '';
}

function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const err = document.getElementById('authErr');
  if (name.length < 2) { err.textContent = 'Jméno musí mít alespoň 2 znaky'; return; }
  if (pass.length < 4) { err.textContent = 'Heslo musí mít alespoň 4 znaky'; return; }
  if (pass !== pass2) { err.textContent = 'Hesla se neshodují'; return; }
  const users = getUsers();
  if (users[name]) { err.textContent = 'Uživatel již existuje'; return; }
  users[name] = createProfile(name, pass);
  saveUsers(users);
  loginAs(name);
}

function doLogin() {
  const name = document.getElementById('loginName').value.trim();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('authErr');
  const users = getUsers();
  if (!users[name]) { err.textContent = 'Uživatel nenalezen'; return; }
  if (users[name].pass !== pass) { err.textContent = 'Špatné heslo'; return; }
  loginAs(name);
}

function createProfile(name, pass) {
  return {
    pass, balance: 10000,
    portfolio: {}, cPortfolio: {},
    stats: { wins: 0, losses: 0, played: 0, earned: 0, spent: 0, biggestWin: 0, gamesWon: {} },
    xp: 0, level: 1, joinDate: Date.now(),
    daily: { streak: 0, lastClaim: 0 },
    dailySpin: 0, favs: [],
    tx: [], achievements: [],
    inventory: [], theme: 'neon', totalDeposited: 0
  };
}

function loginAs(name) {
  CUR_USER = name;
  localStorage.setItem(LS_CUR, name);
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('topbar').style.display = '';
  document.getElementById('tickerWrap').style.display = '';
  document.getElementById('mainContent').style.display = '';
  document.getElementById('mobileNav').style.display = '';
  document.getElementById('chatToggle').style.display = '';
  updateBalance();
  const user = getUser();
  applyTheme(user.theme || 'neon');
  if (typeof initGamesGrid === 'function') initGamesGrid();
  if (typeof initStocks === 'function') initStocks();
  if (typeof initCrypto === 'function') initCrypto();
  if (typeof initShop === 'function') initShop();
  if (typeof initEarn === 'function') initEarn();
  if (typeof renderProfile === 'function') renderProfile();
  initTicker();
  initParticles();
}

function logout() {
  CUR_USER = null;
  localStorage.removeItem(LS_CUR);
  location.reload();
}

// Auto-login
(function autoLogin() {
  const saved = localStorage.getItem(LS_CUR);
  if (saved && getUsers()[saved]) {
    loginAs(saved);
  }
})();

// ── Navigation ──
function goPage(id) {
  const map = { games: 'pgGames', stocks: 'pgStocks', crypto: 'pgCrypto', shop: 'pgShop', earn: 'pgEarn', profile: 'pgProfile' };
  document.querySelectorAll('.pg').forEach(p => { p.classList.remove('on'); });
  const target = document.getElementById(map[id]);
  if (target) {
    setTimeout(() => target.classList.add('on'), 20);
  }
  // Update nav active
  const names = ['games','stocks','crypto','shop','earn','profile'];
  document.querySelectorAll('#navBtns button').forEach((b, i) => b.classList.toggle('act', names[i] === id));
  document.querySelectorAll('#mobileNav button').forEach((b, i) => b.classList.toggle('act', names[i] === id));
  document.querySelector('.topbar').classList.remove('mob-open');
  // Refresh dynamic pages
  if (id === 'profile' && typeof renderProfile === 'function') renderProfile();
  if (id === 'earn' && typeof initEarn === 'function') initEarn();
  if (id === 'stocks' && typeof renderStockPortfolio === 'function') renderStockPortfolio();
  if (id === 'crypto' && typeof renderCryptoPortfolio === 'function') renderCryptoPortfolio();
}

// ── Balance ──
function updateBalance() {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('balDisplay');
  el.textContent = fmtCZK(user.balance);
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

function addBalance(amount, reason) {
  const user = getUser();
  if (!user) return;
  user.balance += amount;
  if (amount > 0) user.stats.earned += amount;
  if (amount < 0) user.stats.spent += Math.abs(amount);
  user.tx.unshift({ amount, reason, time: Date.now() });
  if (user.tx.length > 25) user.tx.pop();
  saveUser(user);
  updateBalance();
}

// ── XP System ──
function addXP(amount) {
  const user = getUser();
  if (!user) return;
  user.xp += amount;
  const needed = user.level * 500;
  while (user.xp >= needed) {
    user.xp -= user.level * 500;
    user.level++;
    toast(`🎉 Level Up! Jsi teď level ${user.level}!`, 'success');
  }
  saveUser(user);
  if (typeof checkAchievements === 'function') checkAchievements();
}

// ── Toast ──
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// ── Modal System ──
function openModal(id) {
  document.getElementById(id).classList.add('on');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('on');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.on').forEach(m => m.classList.remove('on'));
    const cp = document.getElementById('chatPanel');
    if (cp.classList.contains('on')) cp.classList.remove('on');
  }
});
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('on'); });
});

// ── Themes ──
const THEMES = {
  neon:    { name: 'Neon', desc: 'Zelený accent, tmavé pozadí', color: '#00ff88',
             vars: { '--acc':'#00ff88','--accR':'0','--accG':'255','--accB':'136','--acc2':'#00b4d8','--bg0':'#04060b','--bg1':'#0a0f18','--bg2':'#111923','--bg3':'#1a2332','--bg4':'#243044','--t1':'#ffffff','--t2':'#a0aec0','--t3':'#5a6a80' }},
  midnight:{ name: 'Midnight', desc: 'Fialový accent, temná noc', color: '#a78bfa',
             vars: { '--acc':'#a78bfa','--accR':'167','--accG':'139','--accB':'250','--acc2':'#818cf8','--bg0':'#0c0a1a','--bg1':'#13102a','--bg2':'#1c1838','--bg3':'#262148','--bg4':'#332d5c','--t1':'#ffffff','--t2':'#a0a0c0','--t3':'#6a6a8a' }},
  sunset:  { name: 'Sunset', desc: 'Červený/oranžový accent', color: '#ff6b6b',
             vars: { '--acc':'#ff6b6b','--accR':'255','--accG':'107','--accB':'107','--acc2':'#ffa502','--bg0':'#1a0a0a','--bg1':'#241010','--bg2':'#2e1818','--bg3':'#3a2222','--bg4':'#4a3030','--t1':'#ffffff','--t2':'#c0a0a0','--t3':'#806a6a' }},
  arctic:  { name: 'Arctic', desc: 'Světlý motiv, modrý accent', color: '#0066ff',
             vars: { '--acc':'#0066ff','--accR':'0','--accG':'102','--accB':'255','--acc2':'#00b4d8','--bg0':'#e8ecf2','--bg1':'#f0f3f8','--bg2':'#ffffff','--bg3':'#dce2ea','--bg4':'#c8d0dc','--t1':'#0a0f18','--t2':'#4a5568','--t3':'#8a95a5' }},
  gold:    { name: 'Gold VIP', desc: 'Zlatý luxus', color: '#ffd700',
             vars: { '--acc':'#ffd700','--accR':'255','--accG':'215','--accB':'0','--acc2':'#ffaa00','--bg0':'#0d0b00','--bg1':'#161200','--bg2':'#201a05','--bg3':'#2a2210','--bg4':'#3a3020','--t1':'#fff8e0','--t2':'#c0a860','--t3':'#806a30' }}
};

function applyTheme(id) {
  const theme = THEMES[id];
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

function openThemeModal() {
  const user = getUser();
  const current = user ? user.theme : 'neon';
  let html = '<div class="theme-grid">';
  Object.entries(THEMES).forEach(([id, t]) => {
    html += `<div class="theme-option ${id === current ? 'sel' : ''}" onclick="setTheme('${id}')">
      <div class="theme-swatch" style="background:${t.color}"></div>
      <div><div class="theme-name">${t.name}</div><div class="theme-desc">${t.desc}</div></div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('themeBody').innerHTML = html;
  openModal('themeModal');
}

function setTheme(id) {
  applyTheme(id);
  const user = getUser();
  if (user) { user.theme = id; saveUser(user); }
  closeModal('themeModal');
  toast(`Téma změněno na ${THEMES[id].name}`, 'info');
  // Re-init particles with new color
  initParticles();
}

// ── Particles ──
let particlesRAF = null;
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (particlesRAF) cancelAnimationFrame(particlesRAF);
  const style = getComputedStyle(document.documentElement);
  const r = parseInt(style.getPropertyValue('--accR')) || 0;
  const g = parseInt(style.getPropertyValue('--accG')) || 255;
  const b = parseInt(style.getPropertyValue('--accB')) || 136;
  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
    size: Math.random() * 2 + 1, alpha: Math.random() * .3 + .05
  }));
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
      ctx.fill();
    });
    particlesRAF = requestAnimationFrame(animate);
  }
  animate();
}
window.addEventListener('resize', () => {
  const c = document.getElementById('particles');
  c.width = window.innerWidth; c.height = window.innerHeight;
});

// ── Ticker ──
function initTicker() {
  const names = ['xKral420','NovaGamer','DarkLord','CzechMaster','LuckyKid','ProHrac','VIPshark','CryptoKing','MegaBet','StakeGuru','DiamondH','NeonWolf','AceHigh','BigWin99','Royal_CZ'];
  const games = ['Automaty','Crash','Blackjack','Ruleta','Miny','Kostky','Coin Flip','Hi-Lo','Keno','Plinko','Limbo','Věže','Baccarat','Kolo štěstí','Stírací los'];
  let items = '';
  for (let i = 0; i < 30; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const game = games[Math.floor(Math.random() * games.length)];
    const win = Math.floor(Math.random() * 49000 + 1000);
    items += `<span>🎉 <span class="tw">${name}</span> vyhrál/a ${fmtCZK(win)} v ${game}</span>`;
  }
  document.getElementById('tickerTrack').innerHTML = items + items;
}

// ── Checkout ──
function openCheckout() {
  const amounts = [1000, 2500, 5000, 10000, 25000, 50000];
  const methods = [
    { id: 'apple', icon: '🍎', name: 'Apple Pay', desc: 'Rychlá platba' },
    { id: 'google', icon: '🔵', name: 'Google Pay', desc: 'Bezpečná platba' },
    { id: 'crypto', icon: '₿', name: 'Crypto', desc: 'BTC, ETH, SOL' },
    { id: 'card', icon: '💳', name: 'Karta', desc: 'Visa/Mastercard' }
  ];
  let html = `<div id="checkoutForm">
    <div class="checkout-amounts">
      ${amounts.map((a, i) => `<div class="checkout-amt ${i === 2 ? 'sel' : ''}" onclick="selCheckoutAmt(this,${a})" data-amt="${a}">${fmtCZK(a)}</div>`).join('')}
    </div>
    <div class="auth-field">
      <label>Vlastní částka</label>
      <input type="number" id="checkoutCustom" placeholder="Nebo zadej vlastní částku" oninput="customCheckoutAmt()">
    </div>
    <div class="checkout-methods">
      ${methods.map((m, i) => `<div class="checkout-method ${i === 0 ? 'sel' : ''}" onclick="selCheckoutMethod(this,'${m.name}')" data-method="${m.id}">
        <div class="checkout-method-icon">${m.icon}</div>
        <div><div style="font-weight:700">${m.name}</div><div style="font-size:.75rem;color:var(--t3)">${m.desc}</div></div>
      </div>`).join('')}
    </div>
    <div class="checkout-total" id="checkoutTotal">${fmtCZK(5000)}</div>
    <button class="checkout-pay" id="checkoutPayBtn" onclick="processCheckout()">Zaplatit přes Apple Pay</button>
  </div>
  <div class="checkout-processing hidden" id="checkoutProcessing">
    <div class="spinner"></div>
    <div style="color:var(--t2)">Zpracovávám platbu...</div>
  </div>
  <div class="checkout-success hidden" id="checkoutSuccess">
    <div class="checkmark">✓</div>
    <div style="font-size:1.2rem;font-weight:700;margin-bottom:8px">Platba úspěšná!</div>
    <div style="color:var(--t2)" id="checkoutSuccessAmt"></div>
  </div>`;
  document.getElementById('checkoutBody').innerHTML = html;
  window._checkoutAmt = 5000;
  window._checkoutMethod = 'Apple Pay';
  openModal('checkoutModal');
}

function selCheckoutAmt(el, amt) {
  document.querySelectorAll('.checkout-amt').forEach(a => a.classList.remove('sel'));
  el.classList.add('sel');
  window._checkoutAmt = amt;
  document.getElementById('checkoutCustom').value = '';
  document.getElementById('checkoutTotal').textContent = fmtCZK(amt);
}
function customCheckoutAmt() {
  const v = parseInt(document.getElementById('checkoutCustom').value) || 0;
  if (v > 0) {
    document.querySelectorAll('.checkout-amt').forEach(a => a.classList.remove('sel'));
    window._checkoutAmt = v;
    document.getElementById('checkoutTotal').textContent = fmtCZK(v);
  }
}
function selCheckoutMethod(el, name) {
  document.querySelectorAll('.checkout-method').forEach(m => m.classList.remove('sel'));
  el.classList.add('sel');
  window._checkoutMethod = name;
  document.getElementById('checkoutPayBtn').textContent = `Zaplatit přes ${name}`;
}
function processCheckout() {
  const amt = window._checkoutAmt;
  if (!amt || amt <= 0) return;
  document.getElementById('checkoutForm').classList.add('hidden');
  document.getElementById('checkoutProcessing').classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('checkoutProcessing').classList.add('hidden');
    document.getElementById('checkoutSuccess').classList.remove('hidden');
    document.getElementById('checkoutSuccessAmt').textContent = `${fmtCZK(amt)} přidáno na účet!`;
    const user = getUser();
    user.totalDeposited += amt;
    saveUser(user);
    addBalance(amt, `Deposit (${window._checkoutMethod})`);
    toast(`+${fmtCZK(amt)} přidáno!`, 'success');
  }, 2000);
}

// ── Chat ──
function toggleChat() {
  document.getElementById('chatPanel').classList.toggle('on');
}
function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const container = document.getElementById('chatMessages');
  container.innerHTML += `<div class="chat-bubble user">${escHtml(msg)}</div>`;
  const reply = chatReply(msg.toLowerCase());
  setTimeout(() => {
    container.innerHTML += `<div class="chat-bubble bot">${reply}</div>`;
    container.scrollTop = container.scrollHeight;
  }, 500);
  container.scrollTop = container.scrollHeight;
}
function chatReply(msg) {
  if (msg.match(/ahoj|hey|hi|čau|zdar|nazdar/)) return 'Ahoj! 👋 Jak ti mohu pomoci?';
  if (msg.match(/hry|hra|game/)) return 'Máme 15 her! 🎮 Automaty, Crash, Blackjack, Miny a další. Přejdi do sekce Hry a vyzkoušej!';
  if (msg.match(/akci|stock/)) return 'Obchoduj s 12 akciemi jako AAPL, TSLA nebo NVDA! 📊 Ceny se mění každé 3 sekundy.';
  if (msg.match(/crypto|krypto|bitcoin/)) return 'Máme 10 kryptoměn včetně BTC, ETH a SOL! ₿ Vyšší volatilita = vyšší zisky (i ztráty)!';
  if (msg.match(/obchod|shop|koup/)) return 'V obchodě najdeš XP boosty, VIP odznaky a další! 🛒';
  if (msg.match(/téma|theme|barv/)) return 'Máme 5 témat! Neon, Midnight, Sunset, Arctic a Gold VIP. Klikni na 🎨 v horní liště.';
  if (msg.match(/deposit|vklad|nabí/)) return 'Klikni na + v horní liště a zvol částku. Je to demo — žádné reálné peníze! 💰';
  if (msg.match(/tip|rada|strate/)) return 'Tipy: 1) Začni s malými sázkami 2) Vyzkoušej Crash a cashoutni včas 3) Denní odměny jsou zdarma! 🎯';
  if (msg.match(/stat|výsl/)) return `Tvůj balance: ${fmtCZK(getUser()?.balance || 0)}. Podívej se na profil pro detailní statistiky!`;
  if (msg.match(/help|pomoc|nápov/)) return 'Mohu ti poradit s: hry, akcie, crypto, obchod, témata, deposit, tipy, statistiky. Na co se chceš zeptat? 🤔';
  return 'Hmm, tomu úplně nerozumím. Zkus se zeptat na: hry, akcie, crypto, obchod, témata, deposit, tipy nebo help! 🤖';
}
function escHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}
