/* ═══════════════════════════════════════════
   UvalyBet.cz — trading.js
   Stocks (12) + Crypto (10)
   ═══════════════════════════════════════════ */

// ── Stock Data ──
const STOCKS = [
  { sym:'AAPL',  name:'Apple',     base:178 },
  { sym:'MSFT',  name:'Microsoft', base:415 },
  { sym:'TSLA',  name:'Tesla',     base:245 },
  { sym:'NVDA',  name:'NVIDIA',    base:880 },
  { sym:'META',  name:'Meta',      base:510 },
  { sym:'AMZN',  name:'Amazon',    base:185 },
  { sym:'NFLX',  name:'Netflix',   base:620 },
  { sym:'CEZ',   name:'ČEZ',       base:1050 },
  { sym:'AMD',   name:'AMD',       base:165 },
  { sym:'GOOGL', name:'Alphabet',  base:155 },
  { sym:'DIS',   name:'Disney',    base:112 },
  { sym:'SPY',   name:'S&P 500 ETF', base:520 }
];

// ── Crypto Data ──
const CRYPTOS = [
  { sym:'BTC',   name:'Bitcoin',   base:67500, icon:'🟠', color:'#f7931a' },
  { sym:'ETH',   name:'Ethereum',  base:3550,  icon:'🔷', color:'#627eea' },
  { sym:'SOL',   name:'Solana',    base:148,   icon:'🟣', color:'#9945ff' },
  { sym:'BNB',   name:'BNB',       base:605,   icon:'🟡', color:'#f3ba2f' },
  { sym:'XRP',   name:'XRP',       base:0.62,  icon:'⚪', color:'#00aae4' },
  { sym:'ADA',   name:'Cardano',   base:0.45,  icon:'🔵', color:'#0033ad' },
  { sym:'DOGE',  name:'Dogecoin',  base:0.165, icon:'🐕', color:'#c2a633' },
  { sym:'DOT',   name:'Polkadot',  base:7.2,   icon:'🔴', color:'#e6007a' },
  { sym:'AVAX',  name:'Avalanche', base:36,    icon:'🔺', color:'#e84142' },
  { sym:'MATIC', name:'Polygon',   base:0.72,  icon:'🟪', color:'#8247e5' }
];

// Price history
let stockPrices = {};
let cryptoPrices = {};
let stockHistory = {};
let cryptoHistory = {};
let tradingInterval = null;

function initStocks() {
  STOCKS.forEach(s => {
    stockPrices[s.sym] = s.base;
    stockHistory[s.sym] = Array.from({length:50}, () => s.base + (Math.random()-0.5)*s.base*0.03);
  });
  renderStocks();
  startPriceUpdates();
}

function initCrypto() {
  CRYPTOS.forEach(c => {
    cryptoPrices[c.sym] = c.base;
    cryptoHistory[c.sym] = Array.from({length:50}, () => c.base + (Math.random()-0.5)*c.base*0.04);
  });
  renderCrypto();
}

function startPriceUpdates() {
  if (tradingInterval) clearInterval(tradingInterval);
  tradingInterval = setInterval(() => {
    // Update stock prices
    STOCKS.forEach(s => {
      const change = (Math.random() - 0.5) * 0.03;
      stockPrices[s.sym] *= (1 + change);
      stockHistory[s.sym].push(stockPrices[s.sym]);
      if (stockHistory[s.sym].length > 50) stockHistory[s.sym].shift();
    });
    // Update crypto prices (more volatile)
    CRYPTOS.forEach(c => {
      const change = (Math.random() - 0.5) * 0.04;
      cryptoPrices[c.sym] *= (1 + change);
      cryptoHistory[c.sym].push(cryptoPrices[c.sym]);
      if (cryptoHistory[c.sym].length > 50) cryptoHistory[c.sym].shift();
    });
    // Re-render if visible
    if (document.getElementById('pgStocks').classList.contains('on')) {
      updateStockPrices();
      renderStockPortfolio();
    }
    if (document.getElementById('pgCrypto').classList.contains('on')) {
      updateCryptoPrices();
      renderCryptoPortfolio();
    }
  }, 3000);
}

// ── Stocks Rendering ──
function renderStocks() {
  const grid = document.getElementById('stocksGrid');
  grid.innerHTML = STOCKS.map(s => {
    const price = stockPrices[s.sym];
    const hist = stockHistory[s.sym];
    const prevPrice = hist.length > 1 ? hist[hist.length - 2] : price;
    const pctChange = ((price - prevPrice) / prevPrice * 100);
    return `<div class="stock-card" id="sc_${s.sym}">
      <div class="stock-head">
        <div>
          <div class="stock-symbol">${s.sym}</div>
          <div style="font-size:.75rem;color:var(--t3)">${s.name}</div>
        </div>
        <div style="text-align:right">
          <div class="stock-price" id="sp_${s.sym}">$${price.toFixed(2)}</div>
          <div class="stock-change ${pctChange>=0?'up':'dn'}" id="sch_${s.sym}">${pctChange>=0?'+':''}${pctChange.toFixed(2)}%</div>
        </div>
      </div>
      <div class="stock-chart"><canvas id="chart_${s.sym}" height="50"></canvas></div>
      <div class="stock-actions">
        <input type="number" value="1" min="1" id="sqty_${s.sym}" placeholder="Ks">
        <button class="btn-buy" onclick="buyStock('${s.sym}')">Koupit</button>
        <button class="btn-sell" onclick="sellStock('${s.sym}')">Prodat</button>
      </div>
    </div>`;
  }).join('');
  STOCKS.forEach(s => drawMiniChart(`chart_${s.sym}`, stockHistory[s.sym]));
}

function updateStockPrices() {
  STOCKS.forEach(s => {
    const price = stockPrices[s.sym];
    const hist = stockHistory[s.sym];
    const firstPrice = hist[0] || price;
    const pctChange = ((price - firstPrice) / firstPrice * 100);
    const pEl = document.getElementById(`sp_${s.sym}`);
    const cEl = document.getElementById(`sch_${s.sym}`);
    if (pEl) pEl.textContent = `$${price.toFixed(2)}`;
    if (cEl) {
      cEl.textContent = `${pctChange>=0?'+':''}${pctChange.toFixed(2)}%`;
      cEl.className = `stock-change ${pctChange>=0?'up':'dn'}`;
    }
    drawMiniChart(`chart_${s.sym}`, hist);
  });
}

function buyStock(sym) {
  const qty = parseInt(document.getElementById(`sqty_${sym}`).value) || 1;
  const price = stockPrices[sym];
  const cost = Math.floor(price * qty * 25); // Convert USD to CZK approx
  const user = getUser();
  if (!user || user.balance < cost) { toast('Nedostatek prostředků!', 'error'); return; }
  addBalance(-cost, `Koupě ${qty}× ${sym}`);
  if (!user.portfolio) user.portfolio = {};
  if (!user.portfolio[sym]) user.portfolio[sym] = { qty: 0, avgPrice: 0 };
  const p = user.portfolio[sym];
  const totalCost = p.avgPrice * p.qty + price * qty;
  p.qty += qty;
  p.avgPrice = totalCost / p.qty;
  saveUser(user);
  toast(`Koupeno ${qty}× ${sym} za ${fmtCZK(cost)}`, 'success');
  renderStockPortfolio();
}

function sellStock(sym) {
  const user = getUser();
  if (!user || !user.portfolio || !user.portfolio[sym] || user.portfolio[sym].qty <= 0) {
    toast('Nemáš žádné akcie k prodeji!', 'error'); return;
  }
  const qty = Math.min(parseInt(document.getElementById(`sqty_${sym}`).value) || 1, user.portfolio[sym].qty);
  const price = stockPrices[sym];
  const revenue = Math.floor(price * qty * 25);
  addBalance(revenue, `Prodej ${qty}× ${sym}`);
  user.portfolio[sym].qty -= qty;
  if (user.portfolio[sym].qty <= 0) delete user.portfolio[sym];
  saveUser(user);
  toast(`Prodáno ${qty}× ${sym} za ${fmtCZK(revenue)}`, 'success');
  renderStockPortfolio();
}

function renderStockPortfolio() {
  const user = getUser();
  const el = document.getElementById('stockPortfolio');
  if (!user || !user.portfolio || Object.keys(user.portfolio).length === 0) {
    el.innerHTML = '<div class="mt3" style="color:var(--t3);text-align:center">Zatím nemáš žádné akcie v portfoliu.</div>';
    return;
  }
  let html = '<h3>📁 Tvoje Portfolio</h3><table class="portfolio-table"><tr><th>Symbol</th><th>Ks</th><th>Avg. cena</th><th>Aktuální</th><th>P&L</th></tr>';
  Object.entries(user.portfolio).forEach(([sym, p]) => {
    const curPrice = stockPrices[sym] || 0;
    const pnl = (curPrice - p.avgPrice) * p.qty;
    const pnlCZK = Math.floor(pnl * 25);
    html += `<tr>
      <td class="mono" style="font-weight:700">${sym}</td>
      <td>${p.qty}</td>
      <td class="mono">$${p.avgPrice.toFixed(2)}</td>
      <td class="mono">$${curPrice.toFixed(2)}</td>
      <td class="${pnlCZK>=0?'pnl-pos':'pnl-neg'}">${pnlCZK>=0?'+':''}${fmtCZK(pnlCZK)}</td>
    </tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

// ── Crypto Rendering ──
function renderCrypto() {
  const grid = document.getElementById('cryptoGrid');
  grid.innerHTML = CRYPTOS.map(c => {
    const price = cryptoPrices[c.sym];
    const hist = cryptoHistory[c.sym];
    const firstPrice = hist[0] || price;
    const pctChange = ((price - firstPrice) / firstPrice * 100);
    return `<div class="crypto-card" id="cc_${c.sym}">
      <div class="stock-head">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.5rem">${c.icon}</span>
          <div>
            <div class="stock-symbol">${c.sym}</div>
            <div style="font-size:.75rem;color:var(--t3)">${c.name}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div class="stock-price" id="cp_${c.sym}">$${price < 1 ? price.toFixed(4) : price.toFixed(2)}</div>
          <div class="stock-change ${pctChange>=0?'up':'dn'}" id="cch_${c.sym}">${pctChange>=0?'+':''}${pctChange.toFixed(2)}%</div>
        </div>
      </div>
      <div class="stock-chart"><canvas id="cchart_${c.sym}" height="50"></canvas></div>
      <div class="stock-actions">
        <input type="number" value="1" min="0.01" step="0.01" id="cqty_${c.sym}" placeholder="Ks">
        <button class="btn-buy" onclick="buyCrypto('${c.sym}')">Koupit</button>
        <button class="btn-sell" onclick="sellCrypto('${c.sym}')">Prodat</button>
      </div>
    </div>`;
  }).join('');
  CRYPTOS.forEach(c => drawMiniChart(`cchart_${c.sym}`, cryptoHistory[c.sym], c.color));
}

function updateCryptoPrices() {
  CRYPTOS.forEach(c => {
    const price = cryptoPrices[c.sym];
    const hist = cryptoHistory[c.sym];
    const firstPrice = hist[0] || price;
    const pctChange = ((price - firstPrice) / firstPrice * 100);
    const pEl = document.getElementById(`cp_${c.sym}`);
    const cEl = document.getElementById(`cch_${c.sym}`);
    if (pEl) pEl.textContent = `$${price < 1 ? price.toFixed(4) : price.toFixed(2)}`;
    if (cEl) {
      cEl.textContent = `${pctChange>=0?'+':''}${pctChange.toFixed(2)}%`;
      cEl.className = `stock-change ${pctChange>=0?'up':'dn'}`;
    }
    drawMiniChart(`cchart_${c.sym}`, hist, c.color);
  });
}

function buyCrypto(sym) {
  const qty = parseFloat(document.getElementById(`cqty_${sym}`).value) || 1;
  const price = cryptoPrices[sym];
  const cost = Math.floor(price * qty * 25);
  const user = getUser();
  if (!user || user.balance < cost) { toast('Nedostatek prostředků!', 'error'); return; }
  addBalance(-cost, `Koupě ${qty}× ${sym}`);
  if (!user.cPortfolio) user.cPortfolio = {};
  if (!user.cPortfolio[sym]) user.cPortfolio[sym] = { qty: 0, avgPrice: 0 };
  const p = user.cPortfolio[sym];
  const totalCost = p.avgPrice * p.qty + price * qty;
  p.qty += qty;
  p.avgPrice = totalCost / p.qty;
  saveUser(user);
  toast(`Koupeno ${qty}× ${sym} za ${fmtCZK(cost)}`, 'success');
  renderCryptoPortfolio();
}

function sellCrypto(sym) {
  const user = getUser();
  if (!user || !user.cPortfolio || !user.cPortfolio[sym] || user.cPortfolio[sym].qty <= 0) {
    toast('Nemáš žádné coiny k prodeji!', 'error'); return;
  }
  const qty = Math.min(parseFloat(document.getElementById(`cqty_${sym}`).value) || 1, user.cPortfolio[sym].qty);
  const price = cryptoPrices[sym];
  const revenue = Math.floor(price * qty * 25);
  addBalance(revenue, `Prodej ${qty}× ${sym}`);
  user.cPortfolio[sym].qty -= qty;
  if (user.cPortfolio[sym].qty <= 0) delete user.cPortfolio[sym];
  saveUser(user);
  toast(`Prodáno ${qty}× ${sym} za ${fmtCZK(revenue)}`, 'success');
  renderCryptoPortfolio();
}

function renderCryptoPortfolio() {
  const user = getUser();
  const el = document.getElementById('cryptoPortfolio');
  if (!user || !user.cPortfolio || Object.keys(user.cPortfolio).length === 0) {
    el.innerHTML = '<div class="mt3" style="color:var(--t3);text-align:center">Zatím nemáš žádné kryptoměny.</div>';
    return;
  }
  let html = '<h3>₿ Tvoje Crypto Portfolio</h3><table class="portfolio-table"><tr><th>Coin</th><th>Ks</th><th>Avg. cena</th><th>Aktuální</th><th>P&L</th></tr>';
  Object.entries(user.cPortfolio).forEach(([sym, p]) => {
    const curPrice = cryptoPrices[sym] || 0;
    const pnl = (curPrice - p.avgPrice) * p.qty;
    const pnlCZK = Math.floor(pnl * 25);
    html += `<tr>
      <td class="mono" style="font-weight:700">${sym}</td>
      <td>${p.qty < 1 ? p.qty.toFixed(4) : p.qty}</td>
      <td class="mono">$${p.avgPrice < 1 ? p.avgPrice.toFixed(4) : p.avgPrice.toFixed(2)}</td>
      <td class="mono">$${curPrice < 1 ? curPrice.toFixed(4) : curPrice.toFixed(2)}</td>
      <td class="${pnlCZK>=0?'pnl-pos':'pnl-neg'}">${pnlCZK>=0?'+':''}${fmtCZK(pnlCZK)}</td>
    </tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

// ── Mini Chart Drawing ──
function drawMiniChart(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.parentElement.clientWidth;
  canvas.width = w; canvas.height = 50;
  ctx.clearRect(0, 0, w, 50);
  if (data.length < 2) return;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const isUp = data[data.length-1] >= data[0];
  const strokeColor = color || (isUp ? getComputedStyle(document.documentElement).getPropertyValue('--grn').trim() || '#00e676' : getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#ff4757');
  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  data.forEach((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = 50 - ((d - min) / range) * 45 - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, 50);
  grad.addColorStop(0, strokeColor + '30');
  grad.addColorStop(1, strokeColor + '00');
  ctx.lineTo(w, 50); ctx.lineTo(0, 50); ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}
