/* ═══════════════════════════════════════════
   UvalyBet.cz — games.js (All 15 Games)
   ═══════════════════════════════════════════ */

const GAMES = [
  { id:'slots',    icon:'🎰', name:'Automaty',    desc:'5 válců, velké výhry!' },
  { id:'roulette', icon:'🎡', name:'Ruleta',      desc:'Klasická evropská ruleta' },
  { id:'blackjack',icon:'🃏', name:'Blackjack',   desc:'Poraz dealera na 21!' },
  { id:'crash',    icon:'📈', name:'Crash',       desc:'Cashoutni než to crashne!' },
  { id:'mines',    icon:'💣', name:'Miny',        desc:'Vyhni se 5 minám v 5×5 gridu' },
  { id:'dice',     icon:'🎲', name:'Kostky',      desc:'Nastav cíl a hoď kostkou' },
  { id:'wheel',    icon:'🎡', name:'Kolo štěstí', desc:'Toč kolem a vyhraj!' },
  { id:'coinflip', icon:'🪙', name:'Coin Flip',   desc:'Orel nebo panna — 2× sázka' },
  { id:'hilo',     icon:'🔼', name:'Hi-Lo',       desc:'Hádej vyšší nebo nižší kartu' },
  { id:'keno',     icon:'🔢', name:'Keno',        desc:'Vyber čísla a losuj!' },
  { id:'plinko',   icon:'⚡', name:'Plinko',      desc:'Hoď míček a sleduj kam padne' },
  { id:'scratch',  icon:'🎟️', name:'Stírací los', desc:'Odhal 3 stejné symboly!' },
  { id:'baccarat', icon:'👔', name:'Baccarat',    desc:'Hráč vs Bankéř' },
  { id:'limbo',    icon:'🚀', name:'Limbo',       desc:'Překonáš cílový multiplikátor?' },
  { id:'towers',   icon:'🏗️', name:'Věže',        desc:'Stoupej nahoru — vyhni se pasti!' }
];

function initGamesGrid() {
  const user = getUser();
  const grid = document.getElementById('gamesGrid');
  grid.innerHTML = GAMES.map(g => {
    const fav = user && user.favs && user.favs.includes(g.id);
    return `<div class="card" onclick="openGame('${g.id}')">
      <span class="card-fav ${fav?'on':''}" onclick="event.stopPropagation();toggleFav('${g.id}',this)">★</span>
      <div class="card-icon">${g.icon}</div>
      <div class="card-name">${g.name}</div>
      <div class="card-desc">${g.desc}</div>
    </div>`;
  }).join('');
}

function toggleFav(id, el) {
  const user = getUser();
  if (!user) return;
  if (!user.favs) user.favs = [];
  const i = user.favs.indexOf(id);
  if (i >= 0) { user.favs.splice(i, 1); el.classList.remove('on'); }
  else { user.favs.push(id); el.classList.add('on'); }
  saveUser(user);
}

function openGame(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return;
  document.getElementById('gameModalTitle').textContent = `${g.icon} ${g.name}`;
  const body = document.getElementById('gameModalBody');
  const fn = window['gm_' + id];
  if (typeof fn === 'function') fn(body);
  else body.innerHTML = '<p style="color:var(--t3)">Hra se načítá...</p>';
  openModal('gameModal');
}

// ── Helpers ──
function betHTML(defaultBet = 100) {
  return `<div class="bet-row">
    <input type="number" class="bet-input" id="gmBet" value="${defaultBet}" min="1">
    <button class="bet-btn" onclick="document.getElementById('gmBet').value=Math.max(1,Math.floor(document.getElementById('gmBet').value/2))">½</button>
    <button class="bet-btn" onclick="document.getElementById('gmBet').value=Math.floor(document.getElementById('gmBet').value*2)">2×</button>
  </div>`;
}
function getBet() { return Math.max(1, parseInt(document.getElementById('gmBet').value) || 0); }
function checkBal(bet) {
  const user = getUser();
  if (!user || user.balance < bet) { toast('Nedostatek prostředků!', 'error'); return false; }
  return true;
}
function recordGame(won, amount) {
  const user = getUser();
  if (!user) return;
  user.stats.played++;
  if (won) { user.stats.wins++; if (amount > user.stats.biggestWin) user.stats.biggestWin = amount; }
  else user.stats.losses++;
  saveUser(user);
  addXP(won ? 50 : 15);
  if (typeof checkAchievements === 'function') checkAchievements();
}

// ═══ 1. AUTOMATY (Slots) ═══
function gm_slots(body) {
  const syms = ['🍒','🍋','🔔','⭐','💎','7️⃣','🍀','👑'];
  body.innerHTML = betHTML(100) + `
    <div class="slots-reels" id="slotsReels">${'<div class="slots-reel">❓</div>'.repeat(5)}</div>
    <button class="play-btn" id="slotsBtn" onclick="gm_slots_spin()">🎰 Zatočit</button>
    <div id="slotsResult"></div>`;
  window._slotSyms = syms;
}
function gm_slots_spin() {
  const bet = getBet(); if (!checkBal(bet)) return;
  const btn = document.getElementById('slotsBtn'); btn.disabled = true;
  addBalance(-bet, 'Automaty — sázka');
  const syms = window._slotSyms;
  const reels = document.querySelectorAll('.slots-reel');
  const results = Array.from({length:5}, () => syms[Math.floor(Math.random()*syms.length)]);
  // Spinning animation
  let spins = 0;
  const iv = setInterval(() => {
    reels.forEach(r => r.textContent = syms[Math.floor(Math.random()*syms.length)]);
    spins++;
    if (spins > 15) {
      clearInterval(iv);
      reels.forEach((r,i) => r.textContent = results[i]);
      // Count matches
      const counts = {};
      results.forEach(s => counts[s] = (counts[s]||0) + 1);
      const maxCount = Math.max(...Object.values(counts));
      let multi = 0;
      if (maxCount >= 3) multi = 3;
      if (maxCount >= 4) multi = 10;
      if (maxCount >= 5) multi = 50;
      // Highlight winning reels
      const winSym = Object.keys(counts).find(k => counts[k] === maxCount);
      reels.forEach((r,i) => { if (results[i] === winSym && maxCount >= 3) r.classList.add('win-reel'); else r.classList.remove('win-reel'); });
      const res = document.getElementById('slotsResult');
      if (multi > 0) {
        const win = bet * multi;
        addBalance(win, `Automaty — výhra ${multi}×`);
        res.innerHTML = `<div class="game-result win">🎉 ${maxCount}× ${winSym} — Výhra ${fmtCZK(win)}!</div>`;
        recordGame(true, win);
      } else {
        res.innerHTML = `<div class="game-result lose">Žádná výhra — zkus znovu!</div>`;
        recordGame(false, 0);
      }
      btn.disabled = false;
    }
  }, 80);
}

// ═══ 2. RULETA ═══
function gm_roulette(body) {
  body.innerHTML = betHTML(100) + `
    <div class="roulette-bets" id="rlBets">
      <button onclick="selRlBet(this,'red')" class="sel" data-bet="red" style="color:#ff4757">🔴 Červená</button>
      <button onclick="selRlBet(this,'black')" data-bet="black">⚫ Černá</button>
      <button onclick="selRlBet(this,'even')" data-bet="even">Sudá</button>
      <button onclick="selRlBet(this,'odd')" data-bet="odd">Lichá</button>
      <button onclick="selRlBet(this,'1-18')" data-bet="1-18">1–18</button>
      <button onclick="selRlBet(this,'19-36')" data-bet="19-36">19–36</button>
    </div>
    <div class="roulette-wheel" id="rlWheel">?</div>
    <button class="play-btn" id="rlBtn" onclick="gm_roulette_spin()">🎡 Zatočit</button>
    <div id="rlResult"></div>`;
  window._rlBetType = 'red';
}
function selRlBet(el, type) {
  document.querySelectorAll('#rlBets button').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  window._rlBetType = type;
}
function gm_roulette_spin() {
  const bet = getBet(); if (!checkBal(bet)) return;
  document.getElementById('rlBtn').disabled = true;
  addBalance(-bet, 'Ruleta — sázka');
  const num = Math.floor(Math.random() * 37); // 0-36
  const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const isRed = reds.includes(num);
  const wheel = document.getElementById('rlWheel');
  wheel.style.transition = 'none';
  wheel.style.transform = 'rotate(0deg)';
  void wheel.offsetWidth;
  wheel.style.transition = 'transform 2.6s cubic-bezier(.17,.67,.12,.99)';
  wheel.style.transform = `rotate(${720 + num * 10}deg)`;
  // Spinning number animation
  let spins = 0;
  const iv = setInterval(() => {
    wheel.textContent = Math.floor(Math.random() * 37);
    spins++;
    if (spins > 30) {
      clearInterval(iv);
      wheel.textContent = num;
      wheel.style.color = num === 0 ? 'var(--grn)' : isRed ? 'var(--red)' : 'var(--t1)';
      // Check win
      const bt = window._rlBetType;
      let won = false;
      if (num === 0) won = false;
      else if (bt === 'red') won = isRed;
      else if (bt === 'black') won = !isRed;
      else if (bt === 'even') won = num % 2 === 0;
      else if (bt === 'odd') won = num % 2 === 1;
      else if (bt === '1-18') won = num >= 1 && num <= 18;
      else if (bt === '19-36') won = num >= 19 && num <= 36;
      const res = document.getElementById('rlResult');
      if (won) {
        addBalance(bet * 2, 'Ruleta — výhra');
        res.innerHTML = `<div class="game-result win">🎉 Číslo ${num} ${isRed?'🔴':'⚫'} — Výhra ${fmtCZK(bet*2)}!</div>`;
        recordGame(true, bet * 2);
      } else {
        res.innerHTML = `<div class="game-result lose">Číslo ${num} ${num===0?'🟢':isRed?'🔴':'⚫'} — Prohra!</div>`;
        recordGame(false, 0);
      }
      document.getElementById('rlBtn').disabled = false;
    }
  }, 80);
}

// ═══ 3. BLACKJACK ═══
function gm_blackjack(body) {
  body.innerHTML = betHTML(100) + `
    <button class="play-btn" id="bjDeal" onclick="gm_bj_deal()">🃏 Rozdat karty</button>
    <div id="bjGame" class="hidden">
      <div class="mb1" style="color:var(--t3);font-size:.8rem">Dealer <span id="bjDealerScore"></span></div>
      <div class="bj-hand" id="bjDealerHand"></div>
      <div class="mb1 mt2" style="color:var(--t3);font-size:.8rem">Ty <span id="bjPlayerScore"></span></div>
      <div class="bj-hand" id="bjPlayerHand"></div>
      <div class="bj-actions" id="bjActions">
        <button class="bj-hit" onclick="gm_bj_hit()">Hit</button>
        <button class="bj-stand" onclick="gm_bj_stand()">Stand</button>
      </div>
    </div>
    <div id="bjResult"></div>`;
}
function bjCard() {
  const suits = ['♠','♥','♦','♣'];
  const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const suit = suits[Math.floor(Math.random()*4)];
  const val = vals[Math.floor(Math.random()*13)];
  const num = val === 'A' ? 11 : ['J','Q','K'].includes(val) ? 10 : parseInt(val);
  const red = suit === '♥' || suit === '♦';
  return { suit, val, num, red, str: val + suit };
}
function bjScore(hand) {
  let sum = hand.reduce((a,c) => a + c.num, 0);
  let aces = hand.filter(c => c.val === 'A').length;
  while (sum > 21 && aces > 0) { sum -= 10; aces--; }
  return sum;
}
function bjRender() {
  const g = window._bj;
  document.getElementById('bjDealerHand').innerHTML = g.dealerCards.map((c,i) =>
    (i===1 && !g.revealed) ? '<div class="bj-card" style="background:var(--bg3);color:var(--t3)">?</div>' :
    `<div class="bj-card ${c.red?'red':''}">${c.str}</div>`
  ).join('');
  document.getElementById('bjPlayerHand').innerHTML = g.playerCards.map(c =>
    `<div class="bj-card ${c.red?'red':''}">${c.str}</div>`
  ).join('');
  document.getElementById('bjDealerScore').textContent = g.revealed ? `(${bjScore(g.dealerCards)})` : `(${g.dealerCards[0].num})`;
  document.getElementById('bjPlayerScore').textContent = `(${bjScore(g.playerCards)})`;
}
function gm_bj_deal() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Blackjack — sázka');
  window._bj = {
    bet, playerCards: [bjCard(), bjCard()],
    dealerCards: [bjCard(), bjCard()], revealed: false, done: false
  };
  document.getElementById('bjDeal').classList.add('hidden');
  document.getElementById('bjGame').classList.remove('hidden');
  document.getElementById('bjActions').classList.remove('hidden');
  document.getElementById('bjResult').innerHTML = '';
  bjRender();
  if (bjScore(window._bj.playerCards) === 21) gm_bj_end();
}
function gm_bj_hit() {
  const g = window._bj; if (!g || g.done) return;
  g.playerCards.push(bjCard());
  bjRender();
  if (bjScore(g.playerCards) >= 21) gm_bj_end();
}
function gm_bj_stand() { gm_bj_end(); }
function gm_bj_end() {
  const g = window._bj; if (!g || g.done) return;
  g.done = true; g.revealed = true;
  document.getElementById('bjActions').classList.add('hidden');
  // Dealer draws
  while (bjScore(g.dealerCards) < 17) g.dealerCards.push(bjCard());
  bjRender();
  const ps = bjScore(g.playerCards), ds = bjScore(g.dealerCards);
  const res = document.getElementById('bjResult');
  let msg;
  if (ps > 21) { msg = 'Bust! Prohra.'; recordGame(false, 0); }
  else if (ds > 21) { msg = `Dealer bust! Výhra ${fmtCZK(g.bet*2)}!`; addBalance(g.bet*2, 'Blackjack — výhra'); recordGame(true, g.bet*2); }
  else if (ps > ds) { msg = `${ps} vs ${ds} — Výhra ${fmtCZK(g.bet*2)}!`; addBalance(g.bet*2, 'Blackjack — výhra'); recordGame(true, g.bet*2); }
  else if (ps === ds) { msg = 'Remíza! Sázka vrácena.'; addBalance(g.bet, 'Blackjack — remíza'); recordGame(false, 0); }
  else { msg = `${ps} vs ${ds} — Prohra!`; recordGame(false, 0); }
  const won = ps <= 21 && (ds > 21 || ps > ds);
  res.innerHTML = `<div class="game-result ${won?'win':'lose'}">${won?'🎉':'😞'} ${msg}</div>`;
  document.getElementById('bjDeal').classList.remove('hidden');
  document.getElementById('bjDeal').textContent = '🃏 Hrát znovu';
}

// ═══ 4. CRASH ═══
function gm_crash(body) {
  body.innerHTML = betHTML(100) + `
    <div class="crash-display">
      <div class="crash-multi" id="crashMulti">1.00×</div>
      <div class="crash-bar"><div class="crash-bar-fill" id="crashBar" style="width:0"></div></div>
    </div>
    <button class="play-btn" id="crashStart" onclick="gm_crash_start()">🚀 Start</button>
    <button class="play-btn hidden" id="crashCashout" onclick="gm_crash_cashout()" style="background:var(--gld);color:#000">💰 Cashout</button>
    <div id="crashResult"></div>`;
}
function gm_crash_start() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Crash — sázka');
  document.getElementById('crashStart').classList.add('hidden');
  document.getElementById('crashCashout').classList.remove('hidden');
  document.getElementById('crashResult').innerHTML = '';
  const crashPoint = 1 + Math.random() * Math.random() * 10;
  let multi = 1.00;
  const el = document.getElementById('crashMulti');
  const bar = document.getElementById('crashBar');
  el.classList.remove('crashed');
  el.style.color = 'var(--grn)';
  window._crash = { bet, crashPoint, active: true };
  const iv = setInterval(() => {
    if (!window._crash.active) { clearInterval(iv); return; }
    multi += 0.02;
    el.textContent = multi.toFixed(2) + '×';
    bar.style.width = Math.min(100, (multi / crashPoint) * 100) + '%';
    if (multi >= crashPoint) {
      clearInterval(iv);
      window._crash.active = false;
      el.textContent = crashPoint.toFixed(2) + '×';
      el.classList.add('crashed');
      el.style.color = 'var(--red)';
      bar.style.background = 'var(--red)';
      document.getElementById('crashCashout').classList.add('hidden');
      document.getElementById('crashStart').classList.remove('hidden');
      document.getElementById('crashResult').innerHTML = `<div class="game-result lose">💥 Crash na ${crashPoint.toFixed(2)}×!</div>`;
      recordGame(false, 0);
    }
  }, 50);
}
function gm_crash_cashout() {
  if (!window._crash || !window._crash.active) return;
  window._crash.active = false;
  const el = document.getElementById('crashMulti');
  const multi = parseFloat(el.textContent);
  const win = Math.floor(window._crash.bet * multi);
  addBalance(win, `Crash — cashout ${multi.toFixed(2)}×`);
  document.getElementById('crashCashout').classList.add('hidden');
  document.getElementById('crashStart').classList.remove('hidden');
  document.getElementById('crashResult').innerHTML = `<div class="game-result win">🎉 Cashout na ${multi.toFixed(2)}× — Výhra ${fmtCZK(win)}!</div>`;
  recordGame(true, win);
}

// ═══ 5. MINY ═══
function gm_mines(body) {
  body.innerHTML = betHTML(100) + `
    <div class="mines-grid" id="minesGrid"></div>
    <div class="flex gap1 between mt1">
      <span class="mono" style="font-size:.85rem;color:var(--t2)" id="minesMul">1.00×</span>
      <button class="bet-btn hidden" id="minesCashout" onclick="gm_mines_cashout()">💰 Cashout</button>
    </div>
    <button class="play-btn mt1" id="minesStart" onclick="gm_mines_start()">💣 Začít hru</button>
    <div id="minesResult"></div>`;
}
function gm_mines_start() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Miny — sázka');
  document.getElementById('minesStart').classList.add('hidden');
  document.getElementById('minesCashout').classList.remove('hidden');
  document.getElementById('minesResult').innerHTML = '';
  const mines = new Set();
  while (mines.size < 5) mines.add(Math.floor(Math.random() * 25));
  window._mines = { bet, mines, revealed: new Set(), multi: 1.00, active: true };
  const grid = document.getElementById('minesGrid');
  grid.innerHTML = Array.from({length:25}, (_, i) =>
    `<div class="mines-cell" data-i="${i}" onclick="gm_mines_click(${i})"></div>`
  ).join('');
  document.getElementById('minesMul').textContent = '1.00×';
}
function gm_mines_click(i) {
  const g = window._mines; if (!g || !g.active) return;
  if (g.revealed.has(i)) return;
  g.revealed.add(i);
  const cell = document.querySelector(`.mines-cell[data-i="${i}"]`);
  if (g.mines.has(i)) {
    cell.classList.add('mine'); cell.textContent = '💣';
    g.active = false;
    // Reveal all
    g.mines.forEach(m => {
      const c = document.querySelector(`.mines-cell[data-i="${m}"]`);
      c.classList.add('mine'); c.textContent = '💣';
    });
    document.getElementById('minesCashout').classList.add('hidden');
    document.getElementById('minesStart').classList.remove('hidden');
    document.getElementById('minesStart').textContent = '💣 Hrát znovu';
    document.getElementById('minesResult').innerHTML = `<div class="game-result lose">💥 Boom! Prohra!</div>`;
    recordGame(false, 0);
  } else {
    cell.classList.add('safe'); cell.textContent = '💎';
    g.multi += 0.25;
    document.getElementById('minesMul').textContent = g.multi.toFixed(2) + '×';
  }
}
function gm_mines_cashout() {
  const g = window._mines; if (!g || !g.active) return;
  g.active = false;
  const win = Math.floor(g.bet * g.multi);
  addBalance(win, `Miny — cashout ${g.multi.toFixed(2)}×`);
  document.getElementById('minesCashout').classList.add('hidden');
  document.getElementById('minesStart').classList.remove('hidden');
  document.getElementById('minesStart').textContent = '💣 Hrát znovu';
  document.getElementById('minesResult').innerHTML = `<div class="game-result win">🎉 Cashout ${g.multi.toFixed(2)}× — ${fmtCZK(win)}!</div>`;
  recordGame(true, win);
}

// ═══ 6. KOSTKY (Dice) ═══
function gm_dice(body) {
  body.innerHTML = betHTML(100) + `
    <div class="dice-slider-wrap">
      <input type="range" class="dice-slider" id="diceSlider" min="5" max="95" value="50" oninput="gm_dice_update()">
      <div class="dice-info">
        <span>Cíl: <span id="diceTarget">50</span></span>
        <span>Multi: <span id="diceMul">1.96×</span></span>
      </div>
    </div>
    <div class="flex gap1 mb2" style="justify-content:center">
      <button class="bet-btn" id="diceUnder" onclick="window._diceMode='under';gm_dice_update()" style="background:rgba(var(--accR),var(--accG),var(--accB),.15);color:var(--acc)">Pod ↓</button>
      <button class="bet-btn" id="diceOver" onclick="window._diceMode='over';gm_dice_update()">Nad ↑</button>
    </div>
    <button class="play-btn" onclick="gm_dice_roll()">🎲 Hodit</button>
    <div class="dice-result-num" id="diceNum"></div>
    <div id="diceResult"></div>`;
  window._diceMode = 'under';
  gm_dice_update();
}
function gm_dice_update() {
  const t = parseInt(document.getElementById('diceSlider').value);
  document.getElementById('diceTarget').textContent = t;
  const mode = window._diceMode || 'under';
  const chance = mode === 'under' ? t : (100 - t);
  const multi = chance > 0 ? (98 / chance) : 0;
  document.getElementById('diceMul').textContent = multi.toFixed(2) + '×';
  document.getElementById('diceUnder').style.background = mode === 'under' ? 'rgba(var(--accR),var(--accG),var(--accB),.15)' : 'var(--bg3)';
  document.getElementById('diceUnder').style.color = mode === 'under' ? 'var(--acc)' : 'var(--t2)';
  document.getElementById('diceOver').style.background = mode === 'over' ? 'rgba(var(--accR),var(--accG),var(--accB),.15)' : 'var(--bg3)';
  document.getElementById('diceOver').style.color = mode === 'over' ? 'var(--acc)' : 'var(--t2)';
}
function gm_dice_roll() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Kostky — sázka');
  const t = parseInt(document.getElementById('diceSlider').value);
  const mode = window._diceMode || 'under';
  const chance = mode === 'under' ? t : (100 - t);
  const multi = 98 / chance;
  const roll = (Math.random() * 100).toFixed(2);
  document.getElementById('diceNum').textContent = roll;
  const won = mode === 'under' ? parseFloat(roll) < t : parseFloat(roll) > t;
  const res = document.getElementById('diceResult');
  if (won) {
    const win = Math.floor(bet * multi);
    addBalance(win, `Kostky — výhra ${multi.toFixed(2)}×`);
    res.innerHTML = `<div class="game-result win">🎉 ${roll} ${mode==='under'?'<':'>'} ${t} — Výhra ${fmtCZK(win)}!</div>`;
    recordGame(true, win);
  } else {
    res.innerHTML = `<div class="game-result lose">${roll} — Prohra!</div>`;
    recordGame(false, 0);
  }
  document.getElementById('diceNum').style.color = won ? 'var(--grn)' : 'var(--red)';
}

// ═══ 7. KOLO ŠTĚSTÍ (Wheel) ═══
function gm_wheel(body) {
  const segs = ['0×','0.5×','1×','1.5×','2×','0×','3×','5×'];
  body.innerHTML = betHTML(100) + `
    <div class="wheel-container">
      <div id="wheelSegs" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0">
        ${segs.map((s,i) => `<div style="padding:8px 14px;background:var(--bg2);border-radius:var(--radius-sm);font-family:var(--font-mono);font-weight:600;font-size:.85rem" id="wseg${i}">${s}</div>`).join('')}
      </div>
      <div style="font-size:3rem;margin:16px 0" id="wheelDisplay">🎡</div>
    </div>
    <button class="play-btn" id="wheelBtn" onclick="gm_wheel_spin()">🎡 Zatočit</button>
    <div id="wheelResult"></div>`;
  window._wheelSegs = segs;
}
function gm_wheel_spin() {
  const bet = getBet(); if (!checkBal(bet)) return;
  const btn = document.getElementById('wheelBtn'); btn.disabled = true;
  addBalance(-bet, 'Kolo štěstí — sázka');
  const segs = window._wheelSegs;
  const winner = Math.floor(Math.random() * segs.length);
  let current = 0, speed = 50, rounds = 0;
  const maxRounds = segs.length * 4 + winner;
  const iv = setInterval(() => {
    for (let i = 0; i < segs.length; i++) {
      const el = document.getElementById('wseg' + i);
      el.style.background = i === (current % segs.length) ? 'rgba(var(--accR),var(--accG),var(--accB),.2)' : 'var(--bg2)';
      el.style.color = i === (current % segs.length) ? 'var(--acc)' : 'var(--t1)';
    }
    current++;
    rounds++;
    if (rounds > maxRounds - 10) speed += 20;
    if (rounds >= maxRounds) {
      clearInterval(iv);
      const mul = parseFloat(segs[winner]);
      const res = document.getElementById('wheelResult');
      if (mul > 0) {
        const win = Math.floor(bet * mul);
        addBalance(win, `Kolo štěstí — ${segs[winner]}`);
        res.innerHTML = `<div class="game-result win">🎉 ${segs[winner]} — Výhra ${fmtCZK(win)}!</div>`;
        recordGame(true, win);
      } else {
        res.innerHTML = `<div class="game-result lose">0× — Prohra!</div>`;
        recordGame(false, 0);
      }
      btn.disabled = false;
    }
  }, speed);
}

// ═══ 8. COIN FLIP ═══
function gm_coinflip(body) {
  body.innerHTML = betHTML(100) + `
    <div class="flex gap2 mb2" style="justify-content:center">
      <button class="bet-btn" id="cfHeads" onclick="window._cfChoice='heads';document.getElementById('cfHeads').style.color='var(--acc)';document.getElementById('cfTails').style.color='var(--t2)'" style="color:var(--acc);font-size:1rem;padding:12px 24px">👑 Orel</button>
      <button class="bet-btn" id="cfTails" onclick="window._cfChoice='tails';document.getElementById('cfTails').style.color='var(--acc)';document.getElementById('cfHeads').style.color='var(--t2)'" style="font-size:1rem;padding:12px 24px">🌙 Panna</button>
    </div>
    <div class="coin" id="cfCoin">?</div>
    <button class="play-btn" onclick="gm_coinflip_go()">🪙 Hodit mincí</button>
    <div id="cfResult"></div>`;
  window._cfChoice = 'heads';
}
function gm_coinflip_go() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Coin Flip — sázka');
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const coin = document.getElementById('cfCoin');
  coin.classList.add('flipping');
  setTimeout(() => {
    coin.classList.remove('flipping');
    coin.textContent = result === 'heads' ? '👑' : '🌙';
    const won = window._cfChoice === result;
    const res = document.getElementById('cfResult');
    if (won) {
      addBalance(bet * 2, 'Coin Flip — výhra');
      res.innerHTML = `<div class="game-result win">🎉 ${result==='heads'?'Orel':'Panna'} — Výhra ${fmtCZK(bet*2)}!</div>`;
      recordGame(true, bet * 2);
    } else {
      res.innerHTML = `<div class="game-result lose">${result==='heads'?'Orel':'Panna'} — Prohra!</div>`;
      recordGame(false, 0);
    }
  }, 600);
}

// ═══ 9. HI-LO ═══
function gm_hilo(body) {
  body.innerHTML = betHTML(100) + `
    <button class="play-btn mb2" id="hiloStart" onclick="gm_hilo_start()">🔼 Začít hru</button>
    <div id="hiloGame" class="hidden">
      <div class="tc mono mb1" id="hiloMulti" style="font-size:1.2rem;color:var(--acc)">1.00×</div>
      <div class="hilo-card" id="hiloCard">?</div>
      <div class="hilo-btns" id="hiloActions">
        <button style="background:var(--grn)" onclick="gm_hilo_guess('hi')">↑ Vyšší</button>
        <button style="background:var(--red)" onclick="gm_hilo_guess('lo')">↓ Nižší</button>
      </div>
      <button class="bet-btn mt1" id="hiloCashout" onclick="gm_hilo_cashout()" style="width:100%;padding:10px">💰 Cashout</button>
    </div>
    <div id="hiloResult"></div>`;
}
function hiloVal() {
  const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const suits = ['♠','♥','♦','♣'];
  const vi = Math.floor(Math.random()*13);
  const s = suits[Math.floor(Math.random()*4)];
  return { str: vals[vi]+s, num: vi+1, red: s==='♥'||s==='♦' };
}
function gm_hilo_start() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Hi-Lo — sázka');
  document.getElementById('hiloStart').classList.add('hidden');
  document.getElementById('hiloGame').classList.remove('hidden');
  document.getElementById('hiloResult').innerHTML = '';
  const card = hiloVal();
  window._hilo = { bet, currentCard: card, multi: 1.00, active: true };
  document.getElementById('hiloCard').textContent = card.str;
  document.getElementById('hiloCard').className = `hilo-card ${card.red?'red':''}`;
  document.getElementById('hiloMulti').textContent = '1.00×';
}
function gm_hilo_guess(dir) {
  const g = window._hilo; if (!g || !g.active) return;
  const next = hiloVal();
  const won = (dir === 'hi' && next.num >= g.currentCard.num) || (dir === 'lo' && next.num <= g.currentCard.num);
  g.currentCard = next;
  document.getElementById('hiloCard').textContent = next.str;
  document.getElementById('hiloCard').className = `hilo-card ${next.red?'red':''}`;
  if (won) {
    g.multi += 0.5;
    document.getElementById('hiloMulti').textContent = g.multi.toFixed(2) + '×';
  } else {
    g.active = false;
    document.getElementById('hiloGame').classList.add('hidden');
    document.getElementById('hiloStart').classList.remove('hidden');
    document.getElementById('hiloStart').textContent = '🔼 Hrát znovu';
    document.getElementById('hiloResult').innerHTML = `<div class="game-result lose">💥 Špatný tip! Prohra!</div>`;
    recordGame(false, 0);
  }
}
function gm_hilo_cashout() {
  const g = window._hilo; if (!g || !g.active) return;
  g.active = false;
  const win = Math.floor(g.bet * g.multi);
  addBalance(win, `Hi-Lo — cashout ${g.multi.toFixed(2)}×`);
  document.getElementById('hiloGame').classList.add('hidden');
  document.getElementById('hiloStart').classList.remove('hidden');
  document.getElementById('hiloStart').textContent = '🔼 Hrát znovu';
  document.getElementById('hiloResult').innerHTML = `<div class="game-result win">🎉 Cashout ${g.multi.toFixed(2)}× — ${fmtCZK(win)}!</div>`;
  recordGame(true, win);
}

// ═══ 10. KENO ═══
function gm_keno(body) {
  body.innerHTML = betHTML(100) + `
    <div style="font-size:.8rem;color:var(--t3);margin-bottom:8px">Vyber 1–10 čísel, pak losuj!</div>
    <div class="keno-grid" id="kenoGrid">
      ${Array.from({length:40},(_,i)=>`<div class="keno-num" onclick="gm_keno_pick(${i+1},this)">${i+1}</div>`).join('')}
    </div>
    <div class="tc mono mt1 mb1" style="font-size:.85rem;color:var(--t2)">Vybráno: <span id="kenoCount">0</span>/10</div>
    <button class="play-btn" onclick="gm_keno_draw()">🔢 Losovat</button>
    <div id="kenoResult"></div>`;
  window._kenoPicked = new Set();
}
function gm_keno_pick(n, el) {
  const s = window._kenoPicked;
  if (s.has(n)) { s.delete(n); el.classList.remove('picked'); }
  else if (s.size < 10) { s.add(n); el.classList.add('picked'); }
  document.getElementById('kenoCount').textContent = s.size;
}
function gm_keno_draw() {
  const picked = window._kenoPicked;
  if (picked.size < 1) { toast('Vyber alespoň 1 číslo!', 'error'); return; }
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Keno — sázka');
  // Draw 10 numbers
  const drawn = new Set();
  while (drawn.size < 10) drawn.add(Math.floor(Math.random()*40)+1);
  // Show results
  document.querySelectorAll('.keno-num').forEach(el => {
    const n = parseInt(el.textContent);
    el.classList.remove('hit','miss');
    if (drawn.has(n) && picked.has(n)) el.classList.add('hit');
    else if (drawn.has(n)) el.classList.add('miss');
  });
  const hits = [...picked].filter(n => drawn.has(n)).length;
  const muls = {0:0, 1:0.5, 2:1, 3:2, 4:5, 5:10, 6:25, 7:50, 8:100, 9:250, 10:500};
  const mul = muls[Math.min(hits, 10)] || 0;
  const res = document.getElementById('kenoResult');
  if (mul > 0) {
    const win = Math.floor(bet * mul);
    addBalance(win, `Keno — ${hits} tref, ${mul}×`);
    res.innerHTML = `<div class="game-result win">🎉 ${hits} tref z ${picked.size} — Výhra ${fmtCZK(win)}!</div>`;
    recordGame(true, win);
  } else {
    res.innerHTML = `<div class="game-result lose">${hits} tref — Prohra!</div>`;
    recordGame(false, 0);
  }
  window._kenoPicked = new Set();
}

// ═══ 11. PLINKO ═══
function gm_plinko(body) {
  const muls = ['0.3×','0.5×','1×','1.5×','2×','3×','2×','1.5×','1×','0.5×','0.3×'];
  body.innerHTML = betHTML(100) + `
    <div class="plinko-display">
      <div style="font-size:3rem;margin:16px 0" id="plinkoBall">⚡</div>
      <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">
        ${muls.map((m,i)=>`<div style="padding:6px 10px;background:var(--bg2);border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:.8rem;font-weight:600" id="pseg${i}">${m}</div>`).join('')}
      </div>
    </div>
    <button class="play-btn mt1" onclick="gm_plinko_drop()">⚡ Hodit</button>
    <div id="plinkoResult"></div>`;
  window._plinkoMuls = muls;
}
function gm_plinko_drop() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Plinko — sázka');
  const muls = window._plinkoMuls;
  // Random walk
  let pos = 5; // middle
  for (let i = 0; i < 10; i++) pos += Math.random() < 0.5 ? -0.5 : 0.5;
  const slot = Math.max(0, Math.min(10, Math.round(pos)));
  // Animate
  let step = 0;
  const ball = document.getElementById('plinkoBall');
  const iv = setInterval(() => {
    ball.textContent = ['⚡','💫','✨','⭐'][step % 4];
    step++;
    if (step > 12) {
      clearInterval(iv);
      ball.textContent = '⚡';
      // Highlight slot
      for (let i = 0; i < muls.length; i++) {
        document.getElementById('pseg'+i).style.background = i === slot ? 'rgba(var(--accR),var(--accG),var(--accB),.2)' : 'var(--bg2)';
      }
      const mul = parseFloat(muls[slot]);
      const win = Math.floor(bet * mul);
      const res = document.getElementById('plinkoResult');
      if (win > 0) {
        addBalance(win, `Plinko — ${muls[slot]}`);
        res.innerHTML = `<div class="game-result ${mul>=1?'win':'lose'}">Slot ${muls[slot]} — ${mul>=1?'Výhra':'Zpět'} ${fmtCZK(win)}</div>`;
        recordGame(mul >= 1, win);
      } else {
        res.innerHTML = `<div class="game-result lose">0× — Prohra!</div>`;
        recordGame(false, 0);
      }
    }
  }, 100);
}

// ═══ 12. STÍRACÍ LOS ═══
function gm_scratch(body) {
  body.innerHTML = betHTML(100) + `
    <button class="play-btn mb2" id="scratchStart" onclick="gm_scratch_start()">🎟️ Nový los</button>
    <div class="scratch-grid" id="scratchGrid"></div>
    <div id="scratchResult"></div>`;
}
function gm_scratch_start() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Stírací los — sázka');
  document.getElementById('scratchResult').innerHTML = '';
  const syms = ['🍒','💎','⭐','7️⃣','🍀','👑'];
  const grid = Array.from({length:9}, () => syms[Math.floor(Math.random()*syms.length)]);
  window._scratch = { bet, grid, revealed: new Set(), done: false };
  const gridEl = document.getElementById('scratchGrid');
  gridEl.innerHTML = grid.map((s, i) =>
    `<div class="scratch-cell" onclick="gm_scratch_reveal(${i})" data-i="${i}">❓</div>`
  ).join('');
}
function gm_scratch_reveal(i) {
  const g = window._scratch; if (!g || g.done) return;
  if (g.revealed.has(i)) return;
  g.revealed.add(i);
  const cell = document.querySelector(`.scratch-cell[data-i="${i}"]`);
  cell.textContent = g.grid[i];
  cell.classList.add('revealed');
  if (g.revealed.size === 9) {
    g.done = true;
    // Count symbols
    const counts = {};
    g.grid.forEach(s => counts[s] = (counts[s]||0) + 1);
    const maxCount = Math.max(...Object.values(counts));
    const winSym = Object.keys(counts).find(k => counts[k] === maxCount);
    let mul = 0;
    if (maxCount >= 3) mul = 2;
    if (maxCount >= 4) mul = 5;
    if (maxCount >= 5) mul = 15;
    // Highlight winning cells
    if (mul > 0) {
      g.grid.forEach((s, j) => { if (s === winSym) document.querySelector(`.scratch-cell[data-i="${j}"]`).classList.add('won'); });
    }
    const res = document.getElementById('scratchResult');
    if (mul > 0) {
      const win = Math.floor(g.bet * mul);
      addBalance(win, `Stírací los — ${maxCount}× ${winSym}`);
      res.innerHTML = `<div class="game-result win">🎉 ${maxCount}× ${winSym} — Výhra ${fmtCZK(win)}!</div>`;
      recordGame(true, win);
    } else {
      res.innerHTML = `<div class="game-result lose">Žádná trojice — Prohra!</div>`;
      recordGame(false, 0);
    }
  }
}

// ═══ 13. BACCARAT ═══
function gm_baccarat(body) {
  body.innerHTML = betHTML(100) + `
    <div class="flex gap1 mb2" style="justify-content:center">
      <button class="bet-btn" id="bacP" onclick="window._bacBet='player';gm_bac_upd()" style="padding:12px 20px;color:var(--acc)">👤 Hráč (2×)</button>
      <button class="bet-btn" id="bacT" onclick="window._bacBet='tie';gm_bac_upd()" style="padding:12px 20px">🤝 Remíza (8×)</button>
      <button class="bet-btn" id="bacB" onclick="window._bacBet='banker';gm_bac_upd()" style="padding:12px 20px">🏦 Bankéř (1.95×)</button>
    </div>
    <button class="play-btn" onclick="gm_bac_play()">👔 Hrát</button>
    <div id="bacHands" class="mt2"></div>
    <div id="bacResult"></div>`;
  window._bacBet = 'player';
  gm_bac_upd();
}
function gm_bac_upd() {
  const b = window._bacBet;
  ['bacP','bacT','bacB'].forEach(id => {
    const el = document.getElementById(id);
    el.style.color = el.id === 'bac' + b[0].toUpperCase() ? 'var(--acc)' : 'var(--t2)';
    el.style.background = el.id === 'bac' + b[0].toUpperCase() ? 'rgba(var(--accR),var(--accG),var(--accB),.15)' : 'var(--bg3)';
  });
  // Fix: map bet to button id
  const map = {player:'bacP',tie:'bacT',banker:'bacB'};
  Object.entries(map).forEach(([k,id])=>{
    const el = document.getElementById(id);
    el.style.color = k === b ? 'var(--acc)' : 'var(--t2)';
    el.style.background = k === b ? 'rgba(var(--accR),var(--accG),var(--accB),.15)' : 'var(--bg3)';
  });
}
function gm_bac_play() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Baccarat — sázka');
  const card = () => Math.floor(Math.random() * 13) + 1;
  const val = c => c >= 10 ? 0 : c;
  const pCards = [card(), card()], bCards = [card(), card()];
  let pScore = (val(pCards[0]) + val(pCards[1])) % 10;
  let bScore = (val(bCards[0]) + val(bCards[1])) % 10;
  // Simple 3rd card rules
  if (pScore <= 5) { pCards.push(card()); pScore = pCards.reduce((a,c)=>a+val(c),0)%10; }
  if (bScore <= 5) { bCards.push(card()); bScore = bCards.reduce((a,c)=>a+val(c),0)%10; }
  const hands = document.getElementById('bacHands');
  hands.innerHTML = `<div class="tc mb1"><span style="color:var(--t3)">Hráč:</span> <span class="mono" style="font-size:1.2rem;font-weight:700">${pScore}</span></div>
    <div class="tc"><span style="color:var(--t3)">Bankéř:</span> <span class="mono" style="font-size:1.2rem;font-weight:700">${bScore}</span></div>`;
  let winner = pScore > bScore ? 'player' : bScore > pScore ? 'banker' : 'tie';
  const b = window._bacBet;
  const muls = { player: 2, banker: 1.95, tie: 8 };
  const res = document.getElementById('bacResult');
  if (b === winner) {
    const win = Math.floor(bet * muls[b]);
    addBalance(win, `Baccarat — výhra (${winner})`);
    res.innerHTML = `<div class="game-result win">🎉 ${winner==='player'?'Hráč':winner==='banker'?'Bankéř':'Remíza'} vyhrál — ${fmtCZK(win)}!</div>`;
    recordGame(true, win);
  } else {
    res.innerHTML = `<div class="game-result lose">${winner==='player'?'Hráč':winner==='banker'?'Bankéř':'Remíza'} vyhrál — Prohra!</div>`;
    recordGame(false, 0);
  }
}

// ═══ 14. LIMBO ═══
function gm_limbo(body) {
  body.innerHTML = betHTML(100) + `
    <div class="auth-field">
      <label>Cílový multiplikátor</label>
      <input type="number" class="bet-input" id="limboTarget" value="2" min="1.01" step="0.1">
    </div>
    <button class="play-btn" onclick="gm_limbo_go()">🚀 Hrát</button>
    <div class="tc mt2">
      <div class="mono" style="font-size:2.5rem;font-weight:700" id="limboNum">?</div>
    </div>
    <div id="limboResult"></div>`;
}
function gm_limbo_go() {
  const bet = getBet(); if (!checkBal(bet)) return;
  const target = parseFloat(document.getElementById('limboTarget').value) || 2;
  if (target < 1.01) { toast('Minimum je 1.01×', 'error'); return; }
  addBalance(-bet, 'Limbo — sázka');
  const result = 1 / (1 - Math.random() * 0.99);
  const el = document.getElementById('limboNum');
  el.textContent = result.toFixed(2) + '×';
  const won = result >= target;
  el.style.color = won ? 'var(--grn)' : 'var(--red)';
  const res = document.getElementById('limboResult');
  if (won) {
    const win = Math.floor(bet * target);
    addBalance(win, `Limbo — ${target}×`);
    res.innerHTML = `<div class="game-result win">🎉 ${result.toFixed(2)}× ≥ ${target}× — Výhra ${fmtCZK(win)}!</div>`;
    recordGame(true, win);
  } else {
    res.innerHTML = `<div class="game-result lose">${result.toFixed(2)}× < ${target}× — Prohra!</div>`;
    recordGame(false, 0);
  }
}

// ═══ 15. VĚŽE (Towers) ═══
function gm_towers(body) {
  body.innerHTML = betHTML(100) + `
    <button class="play-btn mb2" id="towersStart" onclick="gm_towers_start()">🏗️ Začít</button>
    <div class="towers-grid" id="towersGrid"></div>
    <div class="flex between mt1">
      <span class="mono" style="font-size:.85rem;color:var(--t2)" id="towersMul">1.00×</span>
      <button class="bet-btn hidden" id="towersCashout" onclick="gm_towers_cashout()">💰 Cashout</button>
    </div>
    <div id="towersResult"></div>`;
}
function gm_towers_start() {
  const bet = getBet(); if (!checkBal(bet)) return;
  addBalance(-bet, 'Věže — sázka');
  document.getElementById('towersStart').classList.add('hidden');
  document.getElementById('towersCashout').classList.remove('hidden');
  document.getElementById('towersResult').innerHTML = '';
  const floors = 8;
  const traps = Array.from({length: floors}, () => Math.floor(Math.random()*3));
  window._towers = { bet, traps, floor: 0, multi: 1.00, active: true, floors };
  const grid = document.getElementById('towersGrid');
  let html = '';
  for (let f = floors-1; f >= 0; f--) {
    html += `<div class="towers-row" id="trow${f}">`;
    for (let c = 0; c < 3; c++) {
      html += `<div class="towers-cell" onclick="gm_towers_click(${f},${c})" data-f="${f}" data-c="${c}"></div>`;
    }
    html += '</div>';
  }
  grid.innerHTML = html;
  document.getElementById('towersMul').textContent = '1.00×';
  // Dim floors above current
  for (let f = 1; f < floors; f++) {
    document.getElementById('trow'+f).style.opacity = '.4';
  }
}
function gm_towers_click(f, c) {
  const g = window._towers; if (!g || !g.active) return;
  if (f !== g.floor) return;
  const cell = document.querySelector(`.towers-cell[data-f="${f}"][data-c="${c}"]`);
  if (g.traps[f] === c) {
    cell.classList.add('trap'); cell.textContent = '💀';
    g.active = false;
    // Reveal all traps
    g.traps.forEach((t, fi) => {
      document.querySelector(`.towers-cell[data-f="${fi}"][data-c="${t}"]`).classList.add('trap');
      document.querySelector(`.towers-cell[data-f="${fi}"][data-c="${t}"]`).textContent = '💀';
    });
    document.getElementById('towersCashout').classList.add('hidden');
    document.getElementById('towersStart').classList.remove('hidden');
    document.getElementById('towersStart').textContent = '🏗️ Hrát znovu';
    document.getElementById('towersResult').innerHTML = `<div class="game-result lose">💀 Past! Prohra!</div>`;
    recordGame(false, 0);
  } else {
    cell.classList.add('safe'); cell.textContent = '✅';
    g.floor++;
    g.multi += 0.4;
    document.getElementById('towersMul').textContent = g.multi.toFixed(2) + '×';
    if (g.floor < g.floors) {
      document.getElementById('trow'+g.floor).style.opacity = '1';
    }
    if (g.floor >= g.floors) gm_towers_cashout();
  }
}
function gm_towers_cashout() {
  const g = window._towers; if (!g || !g.active) return;
  g.active = false;
  const win = Math.floor(g.bet * g.multi);
  addBalance(win, `Věže — cashout ${g.multi.toFixed(2)}×`);
  document.getElementById('towersCashout').classList.add('hidden');
  document.getElementById('towersStart').classList.remove('hidden');
  document.getElementById('towersStart').textContent = '🏗️ Hrát znovu';
  document.getElementById('towersResult').innerHTML = `<div class="game-result win">🎉 ${g.multi.toFixed(2)}× — ${fmtCZK(win)}!</div>`;
  recordGame(true, win);
}
