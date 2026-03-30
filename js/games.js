/* ═══════════════════════════════════════════════
   UvalyBet.cz — Games Module
   ═══════════════════════════════════════════════ */

const GAMES = [
  { id:'slots',     nm:'Automaty',    ds:'5 válců, 3+ stejné = jackpot!',      ic:'🎰', vs:'vis-s',  tg:'Populární', tc:'tp', cat:'popular' },
  { id:'roulette',  nm:'Ruleta',      ds:'Evropská ruleta 0–36.',              ic:'🎡', vs:'vis-ro', tg:'Klasika',   tc:'tc', cat:'classic' },
  { id:'blackjack', nm:'Blackjack',   ds:'Poraz dealera — blíž k 21!',         ic:'🃏', vs:'vis-bj', tg:'Populární', tc:'tp', cat:'popular' },
  { id:'crash',     nm:'Crash',       ds:'Multiplikátor roste — vyber včas!',  ic:'📈', vs:'vis-cr', tg:'Hot',       tc:'th', cat:'hot' },
  { id:'mines',     nm:'Miny',        ds:'25 polí, 5 min — vyhni se jim!',     ic:'💣', vs:'vis-mi', tg:'Hot',       tc:'th', cat:'hot' },
  { id:'dice',      nm:'Kostky',      ds:'Hoď a hádej pod/nad.',               ic:'🎲', vs:'vis-di', tg:'Nové',      tc:'tn', cat:'new' },
  { id:'wheel',     nm:'Kolo štěstí', ds:'Zatočte kolem osudu!',              ic:'🎯', vs:'vis-wh', tg:'Klasika',   tc:'tc', cat:'classic' },
  { id:'coinflip',  nm:'Coin Flip',   ds:'Orel nebo panna — 50/50.',          ic:'🪙', vs:'vis-cf', tg:'Nové',      tc:'tn', cat:'new' },
  { id:'hilo',      nm:'Hi-Lo',       ds:'Bude karta vyšší nebo nižší?',      ic:'⬆️', vs:'vis-hi', tg:'Nové',      tc:'tn', cat:'new' },
  { id:'keno',      nm:'Keno',        ds:'Vyber 1–10 čísel, los 10.',          ic:'🔢', vs:'vis-ke', tg:'Klasika',   tc:'tc', cat:'classic' },
  { id:'plinko',    nm:'Plinko',      ds:'Pusť míček — kam dopadne?',         ic:'⚪', vs:'vis-pl', tg:'Hot',       tc:'th', cat:'hot' },
  { id:'scratch',   nm:'Stírací los', ds:'Odhal 9 polí — 3+ stejné!',         ic:'🎟️', vs:'vis-sc', tg:'Nové',      tc:'tn', cat:'new' },
  { id:'baccarat',  nm:'Baccarat',    ds:'Hráč vs Bankéř — kdo víc?',         ic:'🎴', vs:'vis-ba', tg:'VIP',       tc:'tv', cat:'popular' },
  { id:'limbo',     nm:'Limbo',       ds:'Nastav cílový multiplikátor!',       ic:'🎪', vs:'vis-lk', tg:'Hot',       tc:'th', cat:'hot' },
  { id:'towers',    nm:'Věže',        ds:'Stoupej patrem — vyhni se pasti!',  ic:'🏗️', vs:'vis-tw', tg:'Nové',      tc:'tn', cat:'new' },
];

let curFilter = 'all';

function renderGames() {
  if (!U) return;
  const search = ($('searchG')?.value || '').toLowerCase();
  const grid = $('gGrid');
  if (!grid) return;

  const filtered = GAMES.filter(x => {
    if (curFilter === 'fav') return U.favs.includes(x.id);
    if (curFilter !== 'all' && x.cat !== curFilter) return false;
    if (search && !x.nm.toLowerCase().includes(search) && !x.ds.toLowerCase().includes(search)) return false;
    return true;
  });

  grid.innerHTML = filtered.length ? filtered.map(x =>
    `<div class="gc" onclick="launchGame('${x.id}')">
      <button class="gc-fav${U.favs.includes(x.id) ? ' on' : ''}" onclick="event.stopPropagation();togFav('${x.id}',this)">${U.favs.includes(x.id) ? '❤️' : '🤍'}</button>
      <div class="gc-vis ${x.vs}">${x.ic}</div>
      <div class="gc-info">
        <div class="gc-nm">${x.nm}</div>
        <div class="gc-ds">${x.ds}</div>
        <div class="gc-mt">
          <span class="gc-tg ${x.tc}">${x.tg}</span>
          <button class="gc-pl" onclick="event.stopPropagation();launchGame('${x.id}')">Hrát</button>
        </div>
      </div>
    </div>`
  ).join('') : '<p style="color:var(--t3);padding:20px;text-align:center">Žádné hry nenalezeny.</p>';
}

function filterG() { renderGames(); }

function setF(f, btn) {
  curFilter = f;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderGames();
}

function togFav(id, el) {
  if (U.favs.includes(id)) {
    U.favs = U.favs.filter(x => x !== id);
    el.classList.remove('on'); el.textContent = '🤍';
  } else {
    U.favs.push(id);
    el.classList.add('on'); el.textContent = '❤️';
  }
  saveU();
  if (curFilter === 'fav') renderGames();
}

function launchGame(id) {
  const g = GAMES.find(x => x.id === id);
  const fn = window['gm_' + id];
  if (!fn) {
    openM(g.ic + ' ' + g.nm, b => { b.innerHTML = '<p style="color:var(--t2);text-align:center;padding:20px">Tato hra bude brzy k dispozici!</p>'; });
    return;
  }
  openM(g.ic + ' ' + g.nm, b => fn(b));
  U.stats.played++;
  addXP(5);
  if (typeof checkAch === 'function') checkAch();
  saveU();
}

// Helper for bet validation
function getBet(elId, min = 10) {
  const v = +$(elId).value || min;
  if (v > U.balance) { toast('Nedostatek kreditu!', 'l'); return 0; }
  if (v < min) { toast('Min. sázka ' + min + ' CZK', 'l'); return 0; }
  return v;
}

function recordWin(amount, game) {
  U.stats.wins++;
  if (!U.stats.gamesWon[game]) U.stats.gamesWon[game] = 0;
  U.stats.gamesWon[game]++;
  if (amount > U.stats.biggestWin) U.stats.biggestWin = amount;
}

// ============================
// GAME: SLOTS
// ============================
function gm_slots(B) {
  const SYM = ['🍒','🍋','🍊','🍇','⭐','💎','7️⃣','🔔'];
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label>
        <input type="number" class="bi" id="slB" value="100" min="10">
        <button class="bb" onclick="$('slB').value=Math.min(U.balance,+$('slB').value*2)">2×</button>
        <button class="bb" onclick="$('slB').value=Math.max(10,Math.floor(+$('slB').value/2))">½</button>
      </div>
      <button class="bp" id="slS" onclick="slGo()">🎰 Zatočit</button>
    </div>
    <div class="slr">${[0,1,2,3,4].map(i => `<div class="sr" id="sr${i}">${SYM[i]}</div>`).join('')}</div>
    <div id="slR"></div>`;

  window.slGo = function() {
    const b = getBet('slB'); if (!b) return;
    updBal(-b, 'Slots sázka');
    const reels = [0,1,2,3,4].map(i => $('sr'+i));
    reels.forEach(r => { r.classList.remove('dn'); r.classList.add('sp'); });
    $('slS').disabled = true;
    const res = Array.from({length:5}, () => SYM[Math.floor(Math.random()*SYM.length)]);

    reels.forEach((r, i) => {
      setTimeout(() => { r.classList.remove('sp'); r.classList.add('dn'); r.textContent = res[i]; }, 300 + i * 220);
    });

    setTimeout(() => {
      $('slS').disabled = false;
      const cnt = {}; res.forEach(s => cnt[s] = (cnt[s]||0)+1);
      const mx = Math.max(...Object.values(cnt));
      let w = 0;
      if (mx === 5) w = b * 50;
      else if (mx === 4) w = b * 10;
      else if (mx === 3) w = b * 3;

      if (w > 0) {
        updBal(w, 'Slots výhra ' + mx + '×');
        recordWin(w, 'slots');
        addXP(mx * 10);
        $('slR').innerHTML = `<div class="gr w">🎉 Výhra ${w.toLocaleString('cs-CZ')} CZK! (${mx}× match)</div>`;
      } else {
        U.stats.losses++;
        $('slR').innerHTML = `<div class="gr l">Žádná výhra — zkus znovu!</div>`;
      }
      if (typeof checkAch === 'function') checkAch();
      saveU();
    }, 300 + 4*220 + 120);
  };
}

// ============================
// GAME: ROULETTE
// ============================
function gm_roulette(B) {
  let sel = null;
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="roB" value="100" min="10"></div>
      <button class="bp" id="roS" onclick="roGo()">🎡 Zatočit</button>
    </div>
    <div style="text-align:center">
      <div class="rw2" id="roW"><span id="roN">0</span></div>
      <div class="rb2">
        <button class="rbtn2" onclick="roSel(this,'red')">🔴 Červená</button>
        <button class="rbtn2" onclick="roSel(this,'green')">🟢 Zelená (0)</button>
        <button class="rbtn2" onclick="roSel(this,'black')">⚫ Černá</button>
        <button class="rbtn2" onclick="roSel(this,'1-18')">1 – 18</button>
        <button class="rbtn2" onclick="roSel(this,'19-36')">19 – 36</button>
        <button class="rbtn2" onclick="roSel(this,'even')">Sudá</button>
      </div>
    </div>
    <div id="roR"></div>`;

  window.roSel = function(el, t) {
    document.querySelectorAll('.rbtn2').forEach(b => b.classList.remove('sel'));
    el.classList.add('sel');
    sel = t;
  };

  window.roGo = function() {
    if (!sel) return toast('Nejdřív vyber sázku!', '');
    const b = getBet('roB'); if (!b) return;
    updBal(-b, 'Ruleta sázka');
    $('roS').disabled = true;
    $('roW').classList.add('sp');

    const r = Math.floor(Math.random() * 37);
    const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const isR = reds.includes(r), isG = r === 0;
    const colName = isG ? '🟢' : isR ? '🔴' : '⚫';

    setTimeout(() => {
      $('roW').classList.remove('sp');
      $('roN').textContent = r;
      $('roS').disabled = false;

      let w = 0;
      if (sel === 'red' && isR) w = b * 2;
      else if (sel === 'black' && !isR && !isG) w = b * 2;
      else if (sel === 'green' && isG) w = b * 35;
      else if (sel === '1-18' && r >= 1 && r <= 18) w = b * 2;
      else if (sel === '19-36' && r >= 19) w = b * 2;
      else if (sel === 'even' && r > 0 && r % 2 === 0) w = b * 2;

      if (w > 0) {
        updBal(w, 'Ruleta výhra');
        recordWin(w, 'roulette');
        addXP(15);
        $('roR').innerHTML = `<div class="gr w">${colName} ${r} — Výhra +${w.toLocaleString('cs-CZ')} CZK!</div>`;
      } else {
        U.stats.losses++;
        $('roR').innerHTML = `<div class="gr l">${colName} ${r} — Prohra</div>`;
      }
      if (typeof checkAch === 'function') checkAch();
      saveU();
    }, 2600);
  };
}

// ============================
// GAME: BLACKJACK
// ============================
function gm_blackjack(B) {
  const SU = ['♠','♥','♦','♣'], RK = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  let dk, pH, dH, act;

  function nD() {
    const d = []; SU.forEach(s => RK.forEach(r => d.push({r,s})));
    for (let i = d.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [d[i],d[j]] = [d[j],d[i]]; }
    return d;
  }
  function vl(h) {
    let v = 0, a = 0;
    h.forEach(c => { if ('JQK'.includes(c.r[0]) && c.r !== '10') v += 10; else if (c.r === 'A') { v += 11; a++; } else v += +c.r; });
    while (v > 21 && a > 0) { v -= 10; a--; }
    return v;
  }
  function rc(c, hid) {
    if (hid) return `<span style="display:inline-block;width:46px;height:66px;background:var(--bg4);border-radius:5px;vertical-align:middle;margin:2px"></span>`;
    const red = c.s === '♥' || c.s === '♦';
    return `<span style="display:inline-block;width:46px;height:66px;background:#fff;border-radius:5px;text-align:center;line-height:66px;font-size:.85rem;font-weight:700;color:${red ? '#e53e3e' : '#1a1a1a'};box-shadow:0 2px 8px rgba(0,0,0,.12);margin:2px">${c.r}${c.s}</span>`;
  }
  function rnd(sh) {
    $('bjP').innerHTML = pH.map(c => rc(c)).join('');
    $('bjPS').textContent = vl(pH);
    if (sh) { $('bjD').innerHTML = dH.map(c => rc(c)).join(''); $('bjDS').textContent = vl(dH); }
    else { $('bjD').innerHTML = rc(dH[0]) + rc(null, true); $('bjDS').textContent = '?'; }
  }

  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="bjB" value="200" min="10"></div>
      <button class="bp" id="bjDl" onclick="bjDeal()">🃏 Rozdat</button>
    </div>
    <div style="text-align:center;margin:16px 0">
      <div style="font-size:.68rem;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Dealer</div>
      <div id="bjD" style="min-height:66px"></div>
      <div id="bjDS" style="font-family:var(--mo);font-weight:700;color:var(--acc);margin:4px 0">—</div>
      <div style="font-size:.68rem;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px">Ty</div>
      <div id="bjP" style="min-height:66px"></div>
      <div id="bjPS" style="font-family:var(--mo);font-weight:700;color:var(--acc);margin:4px 0">—</div>
      <div id="bjA" style="display:none;margin-top:10px">
        <button class="bp" onclick="bjH()">Hit</button>
        <button class="bs2" onclick="bjSt()" style="margin-left:6px">Stand</button>
      </div>
    </div>
    <div id="bjR"></div>`;

  window.bjDeal = function() {
    const b = getBet('bjB'); if (!b) return;
    updBal(-b, 'Blackjack sázka'); window._bjB = b;
    dk = nD(); pH = [dk.pop(), dk.pop()]; dH = [dk.pop(), dk.pop()]; act = true;
    $('bjA').style.display = 'block'; $('bjDl').disabled = true; $('bjR').innerHTML = '';
    rnd(false);
    if (vl(pH) === 21) bjSt();
  };
  window.bjH = function() { if (!act) return; pH.push(dk.pop()); rnd(false); if (vl(pH) > 21) bjEnd(); };
  window.bjSt = function() { if (!act) return; act = false; while (vl(dH) < 17) dH.push(dk.pop()); bjEnd(); };

  function bjEnd() {
    act = false; rnd(true);
    $('bjA').style.display = 'none'; $('bjDl').disabled = false;
    const pv = vl(pH), dv = vl(dH), b = window._bjB;
    let msg = '', w = 0;
    if (pv > 21) msg = 'Přetáhls!';
    else if (dv > 21) { msg = 'Dealer přetáhl!'; w = b * 2; }
    else if (pv > dv) { msg = pv + ' vs ' + dv + ' — Výhra!'; w = b * 2; }
    else if (pv === dv) { msg = 'Remíza!'; w = b; }
    else msg = pv + ' vs ' + dv + ' — Prohra';

    if (w > b) { updBal(w, 'BJ výhra'); recordWin(w, 'blackjack'); addXP(20); }
    else if (w === b) { updBal(w, 'BJ remíza'); }
    else { U.stats.losses++; }

    $('bjR').innerHTML = `<div class="gr ${w > 0 ? 'w' : 'l'}">${msg}${w > b ? ' +' + w.toLocaleString('cs-CZ') + ' CZK' : ''}</div>`;
    if (typeof checkAch === 'function') checkAch();
    saveU();
  }
}

// ============================
// GAME: CRASH
// ============================
function gm_crash(B) {
  let iv, ml, dead, out;
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="crB" value="100" min="10"></div>
      <button class="bp" id="crS" onclick="crStart()">▶ Start</button>
      <button class="bs2" id="crC" onclick="crCash()" style="display:none">💰 Vybrat</button>
    </div>
    <div class="cmu2" id="crM">1.00×</div>
    <div class="cbar2"><div class="cfill2" id="crF" style="width:0%"></div></div>
    <div id="crR"></div>`;

  window.crStart = function() {
    const b = getBet('crB'); if (!b) return;
    updBal(-b, 'Crash sázka'); window._crB = b;
    ml = 1; dead = false; out = false;
    $('crS').style.display = 'none'; $('crC').style.display = 'inline-flex';
    $('crR').innerHTML = ''; $('crM').className = 'cmu2'; $('crF').className = 'cfill2'; $('crF').style.width = '0%';
    const cp = 1 + Math.random() * Math.random() * 18;

    iv = setInterval(() => {
      ml += 0.02 + (ml - 1) * 0.004;
      $('crM').textContent = ml.toFixed(2) + '×';
      $('crF').style.width = Math.min((ml - 1) / cp * 100, 100) + '%';
      if (ml >= cp && !out) {
        clearInterval(iv); dead = true;
        $('crM').className = 'cmu2 dd'; $('crF').className = 'cfill2 dd';
        U.stats.losses++;
        $('crS').style.display = 'inline-flex'; $('crC').style.display = 'none';
        $('crR').innerHTML = `<div class="gr l">💥 Crash na ${ml.toFixed(2)}×!</div>`;
        if (typeof checkAch === 'function') checkAch(); saveU();
      }
    }, 50);
  };

  window.crCash = function() {
    if (dead || out) return; out = true; clearInterval(iv);
    const w = Math.floor(window._crB * ml);
    updBal(w, 'Crash výhra ' + ml.toFixed(2) + '×');
    recordWin(w, 'crash'); addXP(Math.floor(ml * 10));
    $('crS').style.display = 'inline-flex'; $('crC').style.display = 'none';
    $('crR').innerHTML = `<div class="gr w">💰 Vybráno na ${ml.toFixed(2)}× — +${w.toLocaleString('cs-CZ')} CZK!</div>`;
    if (typeof checkAch === 'function') checkAch(); saveU();
  };
}

// ============================
// GAME: MINES
// ============================
function gm_mines(B) {
  const SZ = 25, MC = 5;
  let mines, rev, over, safe;

  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="mnB" value="100" min="10"></div>
      <button class="bp" id="mnS" onclick="mnStart()">💣 Start</button>
      <button class="bs2" id="mnC" onclick="mnCash()" style="display:none">💰 Vybrat</button>
      <span id="mnM" style="font-family:var(--mo);color:var(--acc);font-weight:700"></span>
    </div>
    <div class="mng2" id="mnG"></div>
    <div id="mnR"></div>`;

  function renderMines() {
    const g = $('mnG'); g.innerHTML = '';
    for (let i = 0; i < SZ; i++) {
      const c = document.createElement('div');
      c.className = 'mnc2';
      if (rev.has(i)) {
        c.classList.add('rv');
        c.classList.add(mines.has(i) ? 'bm' : 'sf');
        c.textContent = mines.has(i) ? '💣' : '💎';
      }
      c.onclick = () => {
        if (over || rev.has(i)) return;
        rev.add(i);
        if (mines.has(i)) {
          over = true; mines.forEach(m => rev.add(m)); renderMines();
          U.stats.losses++;
          $('mnS').style.display = 'inline-flex'; $('mnC').style.display = 'none';
          $('mnR').innerHTML = `<div class="gr l">💣 Bomba! Konec hry.</div>`;
          if (typeof checkAch === 'function') checkAch(); saveU();
        } else {
          safe++;
          $('mnM').textContent = (1 + safe * 0.25).toFixed(2) + '×';
          renderMines();
        }
      };
      g.appendChild(c);
    }
  }

  window.mnStart = function() {
    const b = getBet('mnB'); if (!b) return;
    updBal(-b, 'Miny sázka'); window._mnB = b;
    mines = new Set(); while (mines.size < MC) mines.add(Math.floor(Math.random() * SZ));
    rev = new Set(); over = false; safe = 0;
    $('mnS').style.display = 'none'; $('mnC').style.display = 'inline-flex';
    $('mnR').innerHTML = ''; $('mnM').textContent = '1.00×';
    renderMines();
  };

  window.mnCash = function() {
    if (over) return; over = true;
    const m = 1 + safe * 0.25, w = Math.floor(window._mnB * m);
    updBal(w, 'Miny výhra ' + m.toFixed(2) + '×');
    recordWin(w, 'mines'); addXP(safe * 5);
    mines.forEach(m => rev.add(m)); renderMines();
    $('mnS').style.display = 'inline-flex'; $('mnC').style.display = 'none';
    $('mnR').innerHTML = `<div class="gr w">💰 ${m.toFixed(2)}× — +${w.toLocaleString('cs-CZ')} CZK!</div>`;
    if (typeof checkAch === 'function') checkAch(); saveU();
  };
}

// ============================
// GAME: DICE
// ============================
function gm_dice(B) {
  let tgt = 50;
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="diB" value="100" min="10"></div>
      <button class="bp" onclick="diGo()">🎲 Hodit</button>
    </div>
    <div style="text-align:center">
      <div class="df3" id="diF">🎲</div>
      <div style="max-width:320px;margin:0 auto">
        <input type="range" class="dsl2" id="diS" min="5" max="95" value="50" oninput="diUpd(this.value)" style="background:linear-gradient(to right,var(--grn) 50%,var(--red) 50%)">
        <div style="display:flex;justify-content:space-between;color:var(--t2);font-size:.76rem;margin-top:4px">
          <span>Pod <span id="diT">50</span></span>
          <span style="color:var(--acc)"><span id="diM">1.96</span>×</span>
          <span>Šance: <span id="diC">50</span>%</span>
        </div>
      </div>
    </div>
    <div id="diRs"></div>`;

  window.diUpd = function(v) {
    tgt = +v;
    $('diT').textContent = tgt; $('diC').textContent = tgt;
    $('diM').textContent = (98 / tgt).toFixed(2);
    $('diS').style.background = `linear-gradient(to right, var(--grn) ${tgt}%, var(--red) ${tgt}%)`;
  };

  window.diGo = function() {
    const b = getBet('diB'); if (!b) return;
    updBal(-b, 'Kostky sázka');
    const f = $('diF'); f.classList.add('rl');
    setTimeout(() => {
      f.classList.remove('rl');
      const r = Math.floor(Math.random() * 100) + 1;
      f.textContent = r;
      const mult = +(98 / tgt).toFixed(2);
      if (r < tgt) {
        const w = Math.floor(b * mult);
        updBal(w, 'Kostky výhra'); recordWin(w, 'dice'); addXP(10);
        $('diRs').innerHTML = `<div class="gr w">🎯 Padlo ${r} (pod ${tgt}) — +${w.toLocaleString('cs-CZ')} CZK!</div>`;
      } else {
        U.stats.losses++;
        $('diRs').innerHTML = `<div class="gr l">Padlo ${r} (nad ${tgt}) — Prohra</div>`;
      }
      if (typeof checkAch === 'function') checkAch(); saveU();
    }, 500);
  };
}

// ============================
// GAME: WHEEL OF FORTUNE
// ============================
function gm_wheel(B) {
  const segs = [{l:'0×',m:0},{l:'1.5×',m:1.5},{l:'2×',m:2},{l:'0.5×',m:.5},{l:'3×',m:3},{l:'5×',m:5},{l:'0×',m:0},{l:'1×',m:1}];
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="whB" value="100" min="10"></div>
      <button class="bp" id="whSp" onclick="whGo()">🎯 Zatočit</button>
    </div>
    <div style="text-align:center;font-family:var(--mo);font-size:3rem;font-weight:700;margin:20px 0;color:var(--acc)" id="whV">?</div>
    <div id="whR"></div>`;

  window.whGo = function() {
    const b = getBet('whB'); if (!b) return;
    updBal(-b, 'Kolo sázka'); $('whSp').disabled = true;
    let ct = 0;
    const iv = setInterval(() => {
      $('whV').textContent = segs[Math.floor(Math.random() * segs.length)].l;
      ct++;
      if (ct > 22) {
        clearInterval(iv); $('whSp').disabled = false;
        const s = segs[Math.floor(Math.random() * segs.length)];
        const w = Math.floor(b * s.m);
        $('whV').textContent = s.l;
        if (w > 0) updBal(w, 'Kolo výhra');
        if (s.m > 1) { recordWin(w, 'wheel'); addXP(10); }
        else if (s.m < 1) U.stats.losses++;
        $('whR').innerHTML = `<div class="gr ${s.m >= 1 ? 'w' : 'l'}">${w > 0 ? '+' + w.toLocaleString('cs-CZ') + ' CZK' : 'Prohra'}</div>`;
        if (typeof checkAch === 'function') checkAch(); saveU();
      }
    }, 90);
  };
}

// ============================
// GAME: COIN FLIP
// ============================
function gm_coinflip(B) {
  let ch = null;
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="cfB" value="100" min="10"></div>
      <button class="bp" onclick="cfGo()">🪙 Hodit</button>
    </div>
    <div style="text-align:center;margin:14px 0">
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
        <button class="bs2" id="cfO" onclick="cfCh('o')">🦅 Orel</button>
        <button class="bs2" id="cfP" onclick="cfCh('p')">👑 Panna</button>
      </div>
      <div id="cfC" style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#ffd700,#ffaa00);margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:900;color:#5a4000">?</div>
    </div>
    <div id="cfR"></div>`;

  window.cfCh = function(c) {
    ch = c;
    $('cfO').style.borderColor = c === 'o' ? 'var(--acc)' : 'var(--brd)';
    $('cfP').style.borderColor = c === 'p' ? 'var(--acc)' : 'var(--brd)';
  };

  window.cfGo = function() {
    if (!ch) return toast('Vyber stranu!', '');
    const b = getBet('cfB'); if (!b) return;
    updBal(-b, 'Coin sázka');
    $('cfC').style.animation = 'coinAn .15s linear 10';
    setTimeout(() => {
      $('cfC').style.animation = 'none';
      const r = Math.random() < 0.5 ? 'o' : 'p';
      $('cfC').textContent = r === 'o' ? '🦅' : '👑';
      if (r === ch) {
        const w = b * 2;
        updBal(w, 'Coin výhra'); recordWin(w, 'coinflip'); addXP(8);
        $('cfR').innerHTML = `<div class="gr w">🎉 +${w.toLocaleString('cs-CZ')} CZK!</div>`;
      } else {
        U.stats.losses++;
        $('cfR').innerHTML = `<div class="gr l">${r === 'o' ? 'Orel' : 'Panna'} — Prohra</div>`;
      }
      if (typeof checkAch === 'function') checkAch(); saveU();
    }, 1500);
  };
}

// ============================
// GAME: HI-LO
// ============================
function gm_hilo(B) {
  const RK = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const SU = ['♠','♥','♦','♣'];
  const VM = {A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13};
  let cur, str;
  function rC() { return { r: RK[Math.floor(Math.random()*13)], s: SU[Math.floor(Math.random()*4)] }; }

  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="hlB" value="100" min="10"></div>
      <button class="bp" id="hlS" onclick="hlStart()">▶ Start</button>
      <button class="bs2" id="hlC" onclick="hlCash()" style="display:none">💰 Vybrat</button>
      <span id="hlSt" style="font-family:var(--mo);color:var(--acc);font-weight:700"></span>
    </div>
    <div style="text-align:center">
      <div id="hlCd" style="width:80px;height:115px;background:#fff;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:700;color:#1a1a1a;box-shadow:0 3px 12px rgba(0,0,0,.15);margin:14px">?</div>
      <div id="hlBt" style="display:none">
        <button class="bp" onclick="hlG('hi')">⬆️ Vyšší</button>
        <button class="bs2" onclick="hlG('lo')" style="margin-left:6px">⬇️ Nižší</button>
      </div>
    </div>
    <div id="hlR"></div>`;

  window.hlStart = function() {
    const b = getBet('hlB'); if (!b) return;
    updBal(-b, 'Hi-Lo sázka'); window._hlB = b;
    cur = rC(); str = 0;
    const cd = $('hlCd');
    cd.style.color = (cur.s === '♥' || cur.s === '♦') ? '#e53e3e' : '#1a1a1a';
    cd.textContent = cur.r + cur.s;
    $('hlBt').style.display = 'block'; $('hlS').style.display = 'none'; $('hlC').style.display = 'inline-flex';
    $('hlR').innerHTML = ''; $('hlSt').textContent = '';
  };

  window.hlG = function(d) {
    const nc = rC();
    const ok = (d === 'hi' && VM[nc.r] >= VM[cur.r]) || (d === 'lo' && VM[nc.r] <= VM[cur.r]);
    cur = nc;
    const cd = $('hlCd');
    cd.style.color = (cur.s === '♥' || cur.s === '♦') ? '#e53e3e' : '#1a1a1a';
    cd.textContent = cur.r + cur.s;
    if (ok) {
      str++;
      $('hlSt').textContent = str + ' správně (' + (1 + str * 0.5).toFixed(1) + '×)';
    } else {
      $('hlBt').style.display = 'none'; $('hlS').style.display = 'inline-flex'; $('hlC').style.display = 'none';
      U.stats.losses++;
      $('hlR').innerHTML = `<div class="gr l">Špatně! Série: ${str}</div>`;
      if (typeof checkAch === 'function') checkAch(); saveU();
    }
  };

  window.hlCash = function() {
    const m = 1 + str * 0.5, w = Math.floor(window._hlB * m);
    updBal(w, 'Hi-Lo výhra ' + str + ' série');
    recordWin(w, 'hilo'); addXP(str * 8);
    $('hlBt').style.display = 'none'; $('hlS').style.display = 'inline-flex'; $('hlC').style.display = 'none';
    $('hlR').innerHTML = `<div class="gr w">💰 ${str}× série! +${w.toLocaleString('cs-CZ')} CZK</div>`;
    if (typeof checkAch === 'function') checkAch(); saveU();
  };
}

// ============================
// GAME: KENO
// ============================
function gm_keno(B) {
  let sel = new Set(), act = false;
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="keB" value="50" min="10"></div>
      <button class="bp" id="keD" onclick="keGo()">🔢 Losovat</button>
      <span id="keI" style="color:var(--t2);font-size:.76rem">0/10</span>
    </div>
    <div class="mng2" id="keG" style="grid-template-columns:repeat(8,1fr);max-width:380px"></div>
    <div id="keR"></div>`;

  const g = $('keG');
  for (let i = 1; i <= 40; i++) {
    const el = document.createElement('div');
    el.className = 'mnc2';
    el.style.fontSize = '.78rem'; el.style.fontFamily = 'var(--mo)';
    el.textContent = i;
    el.onclick = () => {
      if (act) return;
      if (sel.has(i)) { sel.delete(i); el.style.borderColor = ''; el.style.color = ''; el.style.background = ''; }
      else if (sel.size < 10) { sel.add(i); el.style.borderColor = 'var(--acc)'; el.style.color = 'var(--acc)'; el.style.background = 'rgba(var(--accR),var(--accG),var(--accB),.08)'; }
      $('keI').textContent = sel.size + '/10';
    };
    g.appendChild(el);
  }

  window.keGo = function() {
    if (!sel.size) return toast('Vyber alespoň jedno číslo!', '');
    const b = getBet('keB'); if (!b) return;
    updBal(-b, 'Keno sázka'); act = true; $('keD').disabled = true;
    let drawn = new Set(); while (drawn.size < 10) drawn.add(Math.floor(Math.random() * 40) + 1);
    const nums = [...drawn]; let idx = 0;

    const iv = setInterval(() => {
      if (idx >= nums.length) {
        clearInterval(iv);
        const hits = [...sel].filter(n => drawn.has(n)).length;
        const ms = [0, .5, 1, 2, 4, 8, 15, 30, 60, 100, 200];
        const m = ms[hits] || 0, w = Math.floor(b * m);
        if (w > 0) { updBal(w, 'Keno výhra ' + hits + ' tref'); recordWin(w, 'keno'); addXP(hits * 8); }
        else U.stats.losses++;
        $('keR').innerHTML = `<div class="gr ${w > 0 ? 'w' : 'l'}">${hits} trefených — ${w > 0 ? '+' + w.toLocaleString('cs-CZ') + ' CZK (' + m + '×)' : 'Prohra'}</div>`;
        act = false; $('keD').disabled = false;
        if (typeof checkAch === 'function') checkAch(); saveU();
        setTimeout(() => {
          sel.clear();
          document.querySelectorAll('#keG .mnc2').forEach(e => { e.style.borderColor = ''; e.style.color = ''; e.style.background = ''; });
          $('keI').textContent = '0/10';
        }, 3000);
        return;
      }
      const n = nums[idx];
      const cells = document.querySelectorAll('#keG .mnc2');
      const el = cells[n - 1];
      if (sel.has(n)) { el.style.borderColor = 'var(--grn)'; el.style.color = 'var(--grn)'; el.style.background = 'rgba(0,230,120,.08)'; }
      else { el.style.borderColor = 'var(--blu)'; el.style.color = 'var(--blu)'; }
      idx++;
    }, 140);
  };
}

// ============================
// GAME: PLINKO
// ============================
function gm_plinko(B) {
  const sl = [10, 3, 1.5, 1, .5, .3, .5, 1, 1.5, 3, 10];
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="plB" value="50" min="10"></div>
      <button class="bp" onclick="plGo()">⚪ Pustit míček</button>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--brd);border-radius:var(--r);padding:14px;max-width:340px;margin:0 auto;text-align:center">
      <div style="font-size:2.2rem;margin-bottom:8px">⚪</div>
      <div style="display:flex;gap:2px;justify-content:center" id="plSl">
        ${sl.map(s => `<div style="flex:1;padding:5px 2px;border-radius:4px;font-family:var(--mo);font-size:.6rem;font-weight:700;background:var(--bg4);color:var(--t2);transition:all .15s">${s}×</div>`).join('')}
      </div>
    </div>
    <div id="plR" style="margin-top:12px"></div>`;

  window.plGo = function() {
    const b = getBet('plB'); if (!b) return;
    updBal(-b, 'Plinko sázka');
    let pos = 5;
    for (let i = 0; i < 10; i++) pos += (Math.random() < 0.5 ? -1 : 1);
    pos = Math.max(0, Math.min(sl.length - 1, Math.round(pos)));
    const els = document.querySelectorAll('#plSl > div');
    let ct = 0;
    const iv = setInterval(() => {
      els.forEach(s => { s.style.transform = ''; s.style.color = 'var(--t2)'; });
      if (ct < 16) { els[Math.floor(Math.random() * sl.length)].style.transform = 'scale(1.2)'; ct++; }
      else {
        clearInterval(iv);
        els[pos].style.transform = 'scale(1.3)'; els[pos].style.color = 'var(--acc)';
        const m = sl[pos], w = Math.floor(b * m);
        if (w > 0) updBal(w, 'Plinko výhra');
        if (m >= 1) { recordWin(w, 'plinko'); addXP(8); } else U.stats.losses++;
        $('plR').innerHTML = `<div class="gr ${m >= 1 ? 'w' : 'l'}">⚪ ${m}× — ${w > 0 ? '+' + w.toLocaleString('cs-CZ') + ' CZK' : 'Prohra'}</div>`;
        if (typeof checkAch === 'function') checkAch(); saveU();
        setTimeout(() => { els[pos].style.transform = ''; els[pos].style.color = 'var(--t2)'; }, 2000);
      }
    }, 75);
  };
}

// ============================
// GAME: SCRATCH CARD
// ============================
function gm_scratch(B) {
  const P = ['🍒','🍋','⭐','💎','7️⃣','🔔','🍀','💰'];
  let cells, revC, bet;
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="scB" value="100" min="10"></div>
      <button class="bp" onclick="scGo()">🎟️ Nový los</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;max-width:240px;margin:12px auto" id="scG"></div>
    <div id="scR"></div>`;

  window.scGo = function() {
    bet = getBet('scB'); if (!bet) return;
    updBal(-bet, 'Stírací los'); revC = 0; $('scR').innerHTML = '';
    cells = [];
    const j = Math.random();
    if (j < 0.1) cells = Array(9).fill(P[Math.floor(Math.random() * P.length)]);
    else if (j < 0.35) {
      const s = P[Math.floor(Math.random() * P.length)];
      cells = [s, s, s];
      for (let i = 3; i < 9; i++) cells.push(P[Math.floor(Math.random() * P.length)]);
      cells.sort(() => Math.random() - 0.5);
    } else {
      for (let i = 0; i < 9; i++) cells.push(P[Math.floor(Math.random() * P.length)]);
    }

    const g = $('scG'); g.innerHTML = '';
    cells.forEach((s, i) => {
      const el = document.createElement('div');
      el.style.cssText = 'height:70px;background:var(--bg4);border:1px solid var(--brd);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;transition:all .25s;color:var(--t3);font-weight:700';
      el.textContent = '?';
      el.onclick = () => {
        if (el.dataset.r) return;
        el.dataset.r = 1; el.textContent = cells[i];
        el.style.background = 'var(--bg2)'; el.style.borderColor = 'var(--acc)'; el.style.color = 'var(--t1)';
        revC++;
        if (revC === 9) {
          const cnt = {}; cells.forEach(s => cnt[s] = (cnt[s] || 0) + 1);
          const mx = Math.max(...Object.values(cnt));
          let w = 0;
          if (mx >= 6) w = bet * 25; else if (mx >= 5) w = bet * 10; else if (mx >= 4) w = bet * 5; else if (mx >= 3) w = bet * 2;
          if (w > 0) { updBal(w, 'Stírací los výhra'); recordWin(w, 'scratch'); addXP(mx * 8); }
          else U.stats.losses++;
          $('scR').innerHTML = `<div class="gr ${w > 0 ? 'w' : 'l'}">${w > 0 ? '🎉 ' + mx + '× match! +' + w.toLocaleString('cs-CZ') + ' CZK' : 'Žádná výherní kombinace'}</div>`;
          if (typeof checkAch === 'function') checkAch(); saveU();
        }
      };
      g.appendChild(el);
    });
  };
}

// ============================
// GAME: BACCARAT
// ============================
function gm_baccarat(B) {
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="baB" value="200" min="10"></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin:14px 0">
      <button class="bp" onclick="baGo('p')">👤 Hráč (2×)</button>
      <button class="bs2" onclick="baGo('t')">🤝 Remíza (8×)</button>
      <button class="bp" style="background:var(--red)" onclick="baGo('b')">🏦 Bankéř (1.95×)</button>
    </div>
    <div id="baR"></div>`;

  window.baGo = function(bet) {
    const b = getBet('baB'); if (!b) return;
    updBal(-b, 'Baccarat sázka');
    const pS = Math.floor(Math.random() * 10), bS = Math.floor(Math.random() * 10);
    let r = pS > bS ? 'p' : bS > pS ? 'b' : 't';
    let w = 0;
    if (bet === r) { w = r === 'p' ? b * 2 : r === 'b' ? Math.floor(b * 1.95) : b * 8; }
    if (w > 0) { updBal(w, 'Baccarat výhra'); recordWin(w, 'baccarat'); addXP(15); }
    else U.stats.losses++;
    $('baR').innerHTML = `<div style="text-align:center;margin:12px 0">
      <div style="margin-bottom:6px;font-size:1.1rem">Hráč: <strong>${pS}</strong> vs Bankéř: <strong>${bS}</strong></div>
      <div class="gr ${w > 0 ? 'w' : 'l'}">${r === 'p' ? 'Hráč vyhrál' : r === 'b' ? 'Bankéř vyhrál' : 'Remíza'} — ${w > 0 ? '+' + w.toLocaleString('cs-CZ') + ' CZK' : 'Prohra'}</div>
    </div>`;
    if (typeof checkAch === 'function') checkAch(); saveU();
  };
}

// ============================
// GAME: LIMBO
// ============================
function gm_limbo(B) {
  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="lmB" value="100" min="10"></div>
      <div class="bg"><label>Cíl ×</label><input type="number" class="bi" id="lmT" value="2" min="1.01" step=".01" style="width:65px"></div>
      <button class="bp" onclick="lmGo()">🎪 Hrát</button>
    </div>
    <div style="text-align:center;font-family:var(--mo);font-size:3.2rem;font-weight:700;margin:18px 0" id="lmV">?</div>
    <div id="lmR"></div>`;

  window.lmGo = function() {
    const b = getBet('lmB'); if (!b) return;
    const t = +$('lmT').value || 2;
    updBal(-b, 'Limbo sázka');
    const r = 1 / (1 - Math.random() * 0.99);
    $('lmV').textContent = r.toFixed(2) + '×';
    $('lmV').style.color = r >= t ? 'var(--grn)' : 'var(--red)';
    if (r >= t) {
      const w = Math.floor(b * t);
      updBal(w, 'Limbo výhra ' + t + '×'); recordWin(w, 'limbo'); addXP(Math.floor(t * 5));
      $('lmR').innerHTML = `<div class="gr w">${r.toFixed(2)}× ≥ ${t}× — +${w.toLocaleString('cs-CZ')} CZK!</div>`;
    } else {
      U.stats.losses++;
      $('lmR').innerHTML = `<div class="gr l">${r.toFixed(2)}× < ${t}× — Prohra</div>`;
    }
    if (typeof checkAch === 'function') checkAch(); saveU();
  };
}

// ============================
// GAME: TOWERS
// ============================
function gm_towers(B) {
  let floor = 0, over = false;
  const COLS = 3;
  let traps = [];

  B.innerHTML = `
    <div class="gc2">
      <div class="bg"><label>Sázka</label><input type="number" class="bi" id="twB" value="100" min="10"></div>
      <button class="bp" id="twS" onclick="twStart()">🏗️ Start</button>
      <button class="bs2" id="twC" onclick="twCash()" style="display:none">💰 Vybrat</button>
      <span id="twM" style="font-family:var(--mo);color:var(--acc);font-weight:700"></span>
    </div>
    <div id="twG" style="max-width:240px;margin:0 auto"></div>
    <div id="twR"></div>`;

  function renderTowers() {
    const g = $('twG'); g.innerHTML = '';
    for (let f = Math.min(floor + 3, 9); f >= 0; f--) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:4px;margin-bottom:4px';
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('button');
        cell.style.cssText = 'flex:1;padding:10px;border-radius:5px;border:1px solid var(--brd);background:var(--bg3);font-size:.9rem;transition:all .2s';
        if (f < floor) {
          cell.textContent = traps[f].has(c) ? '💀' : '✅';
          cell.disabled = true; cell.style.opacity = '.35';
        } else if (f === floor) {
          cell.textContent = '?';
          cell.onclick = () => {
            if (over) return;
            if (traps[f].has(c)) {
              over = true; cell.textContent = '💀';
              U.stats.losses++;
              $('twS').style.display = 'inline-flex'; $('twC').style.display = 'none';
              $('twR').innerHTML = `<div class="gr l">💀 Past na patře ${f + 1}!</div>`;
              if (typeof checkAch === 'function') checkAch(); saveU();
            } else {
              cell.textContent = '✅';
              floor++;
              $('twM').textContent = (1 + floor * 0.4).toFixed(2) + '×';
              setTimeout(renderTowers, 200);
            }
          };
        } else {
          cell.textContent = '·'; cell.disabled = true; cell.style.opacity = '.2';
        }
        row.appendChild(cell);
      }
      g.appendChild(row);
    }
  }

  window.twStart = function() {
    const b = getBet('twB'); if (!b) return;
    updBal(-b, 'Věže sázka'); window._twB = b;
    floor = 0; over = false; traps = [];
    for (let i = 0; i < 10; i++) {
      const t = new Set(); t.add(Math.floor(Math.random() * COLS)); traps.push(t);
    }
    $('twS').style.display = 'none'; $('twC').style.display = 'inline-flex';
    $('twR').innerHTML = ''; $('twM').textContent = '1.00×';
    renderTowers();
  };

  window.twCash = function() {
    if (over) return; over = true;
    const m = 1 + floor * 0.4, w = Math.floor(window._twB * m);
    updBal(w, 'Věže výhra patro ' + floor);
    recordWin(w, 'towers'); addXP(floor * 8);
    $('twS').style.display = 'inline-flex'; $('twC').style.display = 'none';
    $('twR').innerHTML = `<div class="gr w">💰 Patro ${floor}! +${w.toLocaleString('cs-CZ')} CZK (${m.toFixed(2)}×)</div>`;
    if (typeof checkAch === 'function') checkAch(); saveU();
  };
}
