/* ═══════════════════════════════════════════════
   UvalyBet.cz — Trading Module (Stocks + Crypto)
   ═══════════════════════════════════════════════ */

// === STOCKS ===
const STK = [
  { s:'AAPL', n:'Apple', b:4250 }, { s:'MSFT', n:'Microsoft', b:9800 },
  { s:'TSLA', n:'Tesla', b:5100 }, { s:'NVDA', n:'NVIDIA', b:22400 },
  { s:'META', n:'Meta', b:12800 }, { s:'AMZN', n:'Amazon', b:4600 },
  { s:'NFLX', n:'Netflix', b:15200 }, { s:'CEZ', n:'ČEZ', b:1420 },
  { s:'AMD', n:'AMD', b:3800 }, { s:'GOOGL', n:'Alphabet', b:3560 },
  { s:'DIS', n:'Disney', b:2600 }, { s:'SPY', n:'S&P 500 ETF', b:13500 },
];

let sP = {}, sH = {};
STK.forEach(s => { sP[s.s] = s.b; sH[s.s] = [s.b]; });

function updStk() {
  STK.forEach(s => {
    sP[s.s] = Math.max(1, sP[s.s] + (Math.random() - 0.48) * s.b * 0.015);
    sH[s.s].push(sP[s.s]);
    if (sH[s.s].length > 50) sH[s.s].shift();
  });
  renderStocks();
}

function renderStocks() {
  const g = $('stGrid');
  if (!g || !U) return;

  g.innerHTML = STK.map(s => {
    const p = sP[s.s];
    const prev = sH[s.s].length > 1 ? sH[s.s][sH[s.s].length - 2] : p;
    const ch = p - prev, pct = ch / prev * 100, up = ch >= 0;
    return `<div class="stc2">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-weight:700;font-size:.92rem">${s.n}</span>
        <span style="font-family:var(--mo);font-size:.7rem;color:var(--t3);background:var(--bg3);padding:2px 5px;border-radius:3px">${s.s}</span>
      </div>
      <div style="font-family:var(--mo);font-size:1.3rem;font-weight:700;color:${up ? 'var(--grn)' : 'var(--red)'}">
        ${p >= 10000 ? Math.round(p).toLocaleString('cs-CZ') : p.toFixed(2).replace('.', ',')} CZK
      </div>
      <div style="font-size:.76rem;font-weight:600;color:${up ? 'var(--grn)' : 'var(--red)'}">
        ${up ? '▲' : '▼'} ${Math.abs(pct).toFixed(2)}%
      </div>
      <canvas id="ch_${s.s}" width="300" height="40" style="width:100%;height:40px;margin:6px 0"></canvas>
      <div class="sta3">
        <input type="number" class="sti2" id="q_${s.s}" value="1" min="1">
        <button class="stb3 stby2" onclick="stBuy('${s.s}')">Koupit</button>
        <button class="stb3 stsl2" onclick="stSell('${s.s}')">Prodat</button>
      </div>
    </div>`;
  }).join('');

  // Draw mini charts
  STK.forEach(s => {
    const cv = $('ch_' + s.s);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const h = sH[s.s], w = cv.width, ht = cv.height;
    ctx.clearRect(0, 0, w, ht);
    if (h.length < 2) return;
    const mn = Math.min(...h), mx = Math.max(...h), rg = mx - mn || 1;
    const up = h[h.length - 1] >= h[0];
    ctx.strokeStyle = up ? '#00e87b' : '#ff3355';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    h.forEach((v, i) => {
      const x = i / (h.length - 1) * w;
      const y = ht - (v - mn) / rg * ht;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  renderPf();
}

function stBuy(sym) {
  const q = +$('q_' + sym).value || 1;
  const cost = Math.round(sP[sym] * q);
  if (cost > U.balance) return toast('Nedostatek kreditu!', 'l');
  updBal(-cost, 'Koupeno ' + q + '× ' + sym);
  if (!U.portfolio[sym]) U.portfolio[sym] = { qty: 0, avg: 0 };
  const o = U.portfolio[sym];
  o.avg = ((o.avg * o.qty) + (sP[sym] * q)) / (o.qty + q);
  o.qty += q;
  addXP(5); saveU(); renderPf();
  toast('📈 Koupeno ' + q + '× ' + sym, 'w');
}

function stSell(sym) {
  if (!U.portfolio[sym] || !U.portfolio[sym].qty) return toast('Nemáš tuto akcii!', 'l');
  const q = Math.min(+$('q_' + sym).value || 1, U.portfolio[sym].qty);
  const rev = Math.round(sP[sym] * q);
  updBal(rev, 'Prodáno ' + q + '× ' + sym);
  U.portfolio[sym].qty -= q;
  if (U.portfolio[sym].qty <= 0) delete U.portfolio[sym];
  addXP(5); saveU(); renderPf();
  toast('📉 Prodáno ' + q + '× ' + sym, 'w');
}

function renderPf() {
  const el = $('pfList');
  if (!el || !U) return;
  const ks = Object.keys(U.portfolio || {}).filter(k => U.portfolio[k]?.qty > 0);
  if (!ks.length) { el.innerHTML = '<p style="color:var(--t3);font-size:.84rem">Zatím nemáš žádné akcie.</p>'; return; }
  let tv = 0;
  el.innerHTML = ks.map(sym => {
    const p = U.portfolio[sym], v = sP[sym] * p.qty, pr = v - (p.avg * p.qty);
    tv += v;
    return `<div class="pfr2">
      <div><strong>${sym}</strong> <span style="color:var(--t3);font-size:.76rem">×${p.qty}</span></div>
      <div style="text-align:right">
        <div style="font-family:var(--mo);font-weight:600">${Math.round(v).toLocaleString('cs-CZ')} CZK</div>
        <div style="font-size:.72rem;color:${pr >= 0 ? 'var(--grn)' : 'var(--red)'}">${pr >= 0 ? '+' : ''}${Math.round(pr).toLocaleString('cs-CZ')}</div>
      </div>
    </div>`;
  }).join('');
  el.innerHTML += `<div class="pfr2" style="border-top:1px solid var(--brd);padding-top:8px">
    <strong>Celková hodnota</strong>
    <span style="font-family:var(--mo);font-weight:700;color:var(--acc)">${Math.round(tv).toLocaleString('cs-CZ')} CZK</span>
  </div>`;
}

setInterval(updStk, 3000);

// === CRYPTO ===
const CRYPTO = [
  { s:'BTC', n:'Bitcoin', ic:'₿', b:2450000, cl:'#f7931a' },
  { s:'ETH', n:'Ethereum', ic:'Ξ', b:82000, cl:'#627eea' },
  { s:'SOL', n:'Solana', ic:'◎', b:4200, cl:'#00ffa3' },
  { s:'BNB', n:'BNB', ic:'◆', b:15800, cl:'#f3ba2f' },
  { s:'XRP', n:'Ripple', ic:'✕', b:14, cl:'#00aae4' },
  { s:'ADA', n:'Cardano', ic:'₳', b:12, cl:'#0033ad' },
  { s:'DOGE', n:'Dogecoin', ic:'Ð', b:4.2, cl:'#c2a633' },
  { s:'DOT', n:'Polkadot', ic:'●', b:180, cl:'#e6007a' },
  { s:'AVAX', n:'Avalanche', ic:'▲', b:920, cl:'#e84142' },
  { s:'MATIC', n:'Polygon', ic:'⬡', b:22, cl:'#8247e5' },
];

let cP = {}, cH = {};
CRYPTO.forEach(c => { cP[c.s] = c.b; cH[c.s] = [c.b]; });

setInterval(() => {
  CRYPTO.forEach(c => {
    cP[c.s] = Math.max(0.01, cP[c.s] + (Math.random() - 0.48) * c.b * 0.02);
    cH[c.s].push(cP[c.s]);
    if (cH[c.s].length > 50) cH[c.s].shift();
  });
  if (document.querySelector('#pgCrypto.on')) renderCrypto();
}, 3000);

function renderCrypto() {
  const g = $('crGrid');
  if (!g || !U) return;

  g.innerHTML = CRYPTO.map(c => {
    const p = cP[c.s];
    const prev = cH[c.s].length > 1 ? cH[c.s][cH[c.s].length - 2] : p;
    const ch = p - prev, pct = ch / prev * 100, up = ch >= 0;
    return `<div class="crc">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div class="cr-ic" style="background:${c.cl}">${c.ic}</div>
        <div style="flex:1">
          <div style="font-weight:700">${c.n}</div>
          <div style="font-size:.72rem;color:var(--t3)">${c.s}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--mo);font-weight:700;color:${up ? 'var(--grn)' : 'var(--red)'}">
            ${p >= 100 ? Math.round(p).toLocaleString('cs-CZ') : p.toFixed(2)} CZK
          </div>
          <div style="font-size:.72rem;color:${up ? 'var(--grn)' : 'var(--red)'}">${up ? '▲' : '▼'} ${Math.abs(pct).toFixed(2)}%</div>
        </div>
      </div>
      <div class="sta3">
        <input type="number" class="sti2" id="cq_${c.s}" value="1" min="1">
        <button class="stb3 stby2" onclick="cBuy('${c.s}')">Koupit</button>
        <button class="stb3 stsl2" onclick="cSell('${c.s}')">Prodat</button>
      </div>
    </div>`;
  }).join('');

  renderCPf();
}

function cBuy(sym) {
  const q = +$('cq_' + sym).value || 1;
  const cost = Math.round(cP[sym] * q);
  if (cost > U.balance) return toast('Nedostatek!', 'l');
  updBal(-cost, 'Koupeno ' + q + '× ' + sym);
  if (!U.cPortfolio[sym]) U.cPortfolio[sym] = { qty: 0, avg: 0 };
  const o = U.cPortfolio[sym];
  o.avg = ((o.avg * o.qty) + (cP[sym] * q)) / (o.qty + q);
  o.qty += q;
  addXP(8); saveU(); renderCPf();
  toast('₿ Koupeno ' + q + '× ' + sym, 'w');
}

function cSell(sym) {
  if (!U.cPortfolio[sym] || !U.cPortfolio[sym].qty) return toast('Nemáš!', 'l');
  const q = Math.min(+$('cq_' + sym).value || 1, U.cPortfolio[sym].qty);
  updBal(Math.round(cP[sym] * q), 'Prodáno ' + q + '× ' + sym);
  U.cPortfolio[sym].qty -= q;
  if (U.cPortfolio[sym].qty <= 0) delete U.cPortfolio[sym];
  saveU(); renderCPf();
  toast('₿ Prodáno ' + sym, 'w');
}

function renderCPf() {
  const el = $('cpfList');
  if (!el || !U) return;
  const ks = Object.keys(U.cPortfolio || {}).filter(k => U.cPortfolio[k]?.qty > 0);
  if (!ks.length) { el.innerHTML = '<p style="color:var(--t3);font-size:.84rem">Zatím žádné kryptoměny.</p>'; return; }
  el.innerHTML = ks.map(sym => {
    const p = U.cPortfolio[sym], v = cP[sym] * p.qty, pr = v - (p.avg * p.qty);
    return `<div class="pfr2">
      <div><strong>${sym}</strong> <span style="color:var(--t3);font-size:.76rem">×${p.qty}</span></div>
      <div style="text-align:right">
        <div style="font-family:var(--mo);font-weight:600;color:${pr >= 0 ? 'var(--grn)' : 'var(--red)'}">
          ${Math.round(v).toLocaleString('cs-CZ')} CZK
        </div>
      </div>
    </div>`;
  }).join('');
}
