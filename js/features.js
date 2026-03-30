/* ═══════════════════════════════════════════════
   UvalyBet.cz — Features Module
   ═══════════════════════════════════════════════ */

// === SHOP ===
const SHOP = [
  { id:'xp2',     nm:'2× XP Boost',    ds:'Dvojnásobek XP na 1h.',        ic:'⚡', price:2000 },
  { id:'lucky',   nm:'Lucky Charm',     ds:'+5% šance na výhru (vizuální).',ic:'🍀', price:5000 },
  { id:'vip',     nm:'VIP Odznak',      ds:'Zlatý odznak u jména.',        ic:'👑', price:10000 },
  { id:'themes',  nm:'Prémiová témata', ds:'Odemkni všechna témata.',      ic:'🎨', price:3000 },
  { id:'avatar',  nm:'Zlatý avatar',    ds:'Luxusní rámeček.',             ic:'✨', price:8000 },
  { id:'daily3x', nm:'Denní 3× Boost',  ds:'Trojnásobek denní odměny.',   ic:'🎁', price:4000 },
  { id:'whale',   nm:'Titul: Whale',    ds:'Speciální titul.',             ic:'🐋', price:15000 },
  { id:'spin',    nm:'Extra Spin',      ds:'Další Lucky Spin dnes.',       ic:'🎡', price:1500 },
  { id:'signal',  nm:'Crypto Signály',  ds:'Simulované buy/sell signály.', ic:'📡', price:6000 },
  { id:'shield',  nm:'Streak Shield',   ds:'Ochrana denní série.',         ic:'🛡️', price:3500 },
  { id:'emoji',   nm:'Emoji Pack',      ds:'Extra emoji v chatu.',         ic:'😎', price:2500 },
  { id:'pro',     nm:'Titul: Pro',      ds:'Titul "Pro Gambler".',         ic:'🎰', price:7500 },
];

function renderShop() {
  const g = $('shGrid');
  if (!g || !U) return;
  g.innerHTML = SHOP.map(s => {
    const own = U.inventory.includes(s.id);
    return `<div class="shi">
      <div class="shi-img">${s.ic}</div>
      <div class="shi-info">
        <div style="font-weight:700;font-size:.88rem;margin-bottom:2px">${s.nm}</div>
        <div style="color:var(--t2);font-size:.72rem;margin-bottom:6px;line-height:1.3">${s.ds}</div>
        <div style="font-family:var(--mo);font-weight:700;color:var(--acc);font-size:.86rem;margin-bottom:6px">
          ${own ? '✅ Vlastníš' : s.price.toLocaleString('cs-CZ') + ' CZK'}
        </div>
        <button class="bp" style="width:100%;font-size:.78rem;padding:7px" ${own ? 'disabled' : ''} onclick="buyShop('${s.id}',${s.price})">
          ${own ? 'Vlastníš' : '🛒 Koupit'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function buyShop(id, price) {
  if (U.inventory.includes(id)) return;
  if (U.balance < price) return toast('Nedostatek kreditu!', 'l');
  updBal(-price, 'Obchod: ' + id);
  U.inventory.push(id);
  addXP(50);
  toast('🛒 Zakoupeno!', 'w');
  renderShop();
  saveU();
}

// === DAILY REWARDS ===
const DAILY_REWARDS = [200, 400, 600, 800, 1200, 2000, 5000];

function renderDaily() {
  if (!U) return;
  const g = $('dailyGrid');
  if (!g) return;
  const today = Math.floor(Date.now() / 86400000);
  const last = Math.floor((U.daily.lastClaim || 0) / 86400000);
  const claimed = last === today;

  g.innerHTML = DAILY_REWARDS.map((r, i) => {
    const isToday = i === Math.min(U.daily.streak, 6);
    const isDone = i < U.daily.streak;
    return `<div class="daily-b${isToday && !claimed ? ' today' : ''}${isDone ? ' claimed' : ''}">
      <div style="font-size:.6rem;color:var(--t3);font-weight:700;text-transform:uppercase">Den ${i+1}</div>
      <div style="font-size:1.1rem;margin:3px 0">${isDone ? '✅' : isToday ? '🎁' : '🔒'}</div>
      <div style="font-family:var(--mo);font-weight:700;color:var(--acc);font-size:.74rem">${r.toLocaleString('cs-CZ')}</div>
    </div>`;
  }).join('');

  const btn = $('dailyBtn');
  if (btn) {
    btn.disabled = claimed;
    btn.textContent = claimed ? '✅ Vyzvednutno' : '🎁 Vyzvednout odměnu';
  }
}

function claimDaily() {
  const today = Math.floor(Date.now() / 86400000);
  const last = Math.floor((U.daily.lastClaim || 0) / 86400000);
  if (today === last) return;

  if (last === today - 1) U.daily.streak = Math.min(U.daily.streak + 1, 6);
  else U.daily.streak = 0;

  const reward = DAILY_REWARDS[U.daily.streak];
  U.daily.lastClaim = Date.now();
  updBal(reward, 'Denní bonus Den ' + (U.daily.streak + 1));
  addXP(50);
  toast('🎁 +' + reward.toLocaleString('cs-CZ') + ' CZK!', 'w');
  renderDaily();
  saveU();
}

// === LUCKY SPIN ===
const SPIN_PRIZES = [500, 100, 1000, 200, 2500, 50, 5000, 300];

function lSpin() {
  const today = Math.floor(Date.now() / 86400000);
  if (U.dailySpin === today) return toast('Už jsi dnes točil! Přijď zítra.', 'l');

  U.dailySpin = today;
  const btn = $('lsBtn');
  if (btn) btn.disabled = true;

  const idx = Math.floor(Math.random() * SPIN_PRIZES.length);
  const wheel = $('lsW');
  const ang = 360 / SPIN_PRIZES.length;
  const cur = +(wheel?.dataset.rot || 0);
  const target = cur + 360 * 4 + (360 - idx * ang - ang / 2);

  if (wheel) {
    wheel.dataset.rot = target;
    wheel.style.transform = `rotate(${target}deg)`;
  }

  setTimeout(() => {
    const prize = SPIN_PRIZES[idx];
    const lsV = $('lsV');
    if (lsV) lsV.textContent = prize.toLocaleString('cs-CZ');
    updBal(prize, 'Lucky Spin');
    addXP(30);
    const lsR = $('lsR');
    if (lsR) lsR.innerHTML = `<div class="gr w" style="margin-top:12px">🎰 Výhra ${prize.toLocaleString('cs-CZ')} CZK!</div>`;
    saveU();
  }, 3700);
}

// === QUIZ ===
const QUESTIONS = [
  { q:'Kolik je 15 × 7?',               o:['95','105','110','115'],               c:1, r:200 },
  { q:'Hlavní město Japonska?',          o:['Peking','Soul','Tokio','Bangkok'],    c:2, r:200 },
  { q:'Kolik planet má sl. soustava?',   o:['7','8','9','10'],                     c:1, r:200 },
  { q:'Chemický symbol zlata?',          o:['Ag','Fe','Au','Cu'],                  c:2, r:500 },
  { q:'Kolik kostí má dospělý člověk?',  o:['186','206','226','246'],              c:1, r:500 },
  { q:'Rok pádu Berlínské zdi?',         o:['1987','1989','1991','1993'],          c:1, r:500 },
  { q:'Rychlost světla v km/s?',         o:['150 000','300 000','450 000','600 000'],c:1, r:1000 },
  { q:'Kolik je log₂(1024)?',            o:['8','9','10','12'],                    c:2, r:1000 },
  { q:'Prvek se symbolem W?',            o:['Vanad','Wolfram','Xenon','Zinek'],    c:1, r:1200 },
  { q:'Nejdelší řeka světa?',            o:['Amazonka','Nil','Jang-c-Ťiang','Mississippi'],c:1, r:200 },
  { q:'Kolik bitů je v bajtu?',          o:['4','6','8','16'],                     c:2, r:250 },
  { q:'Nejtvrdší přírodní nerost?',       o:['Safír','Rubín','Diamant','Korund'],  c:2, r:450 },
  { q:'Kdo namaloval Guernici?',          o:['Dalí','Monet','Picasso','Van Gogh'], c:2, r:1000 },
  { q:'Hlavní město Bhútánu?',           o:['Kathmandu','Thimphu','Dháka','Colombo'],c:1, r:1200 },
  { q:'Kolik strun má klasická kytara?', o:['4','5','6','8'],                     c:2, r:200 },
  { q:'Teorie relativity — kdo?',        o:['Newton','Einstein','Hawking','Bohr'], c:1, r:400 },
];

let activeQuestions = [];

function genQs() {
  activeQuestions = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 6);
  const el = $('earnList');
  if (!el) return;

  el.innerHTML = activeQuestions.map((q, qi) => {
    const diff = q.r <= 250 ? 'Lehká' : q.r <= 500 ? 'Střední' : 'Těžká';
    const diffColor = q.r <= 250 ? 'var(--grn)' : q.r <= 500 ? 'var(--gld)' : 'var(--red)';
    return `<div class="ec2" id="eq${qi}">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;align-items:center">
        <span style="font-weight:700;font-size:.9rem">${q.q}</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:.62rem;font-weight:700;color:${diffColor};background:rgba(255,255,255,.05);padding:2px 6px;border-radius:50px">${diff}</span>
          <span style="font-family:var(--mo);font-weight:700;color:var(--acc);font-size:.84rem">+${q.r}</span>
        </div>
      </div>
      ${q.o.map((o, oi) => `<button class="eopt2" onclick="answerQuiz(${qi},${oi})">${o}</button>`).join('')}
    </div>`;
  }).join('');
}

function answerQuiz(qi, oi) {
  const q = activeQuestions[qi];
  const btns = document.querySelectorAll(`#eq${qi} .eopt2`);
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === q.c) b.classList.add('ok');
    if (i === oi && i !== q.c) b.classList.add('no');
  });

  if (oi === q.c) {
    updBal(q.r, 'Kvíz správná odpověď');
    addXP(20);
    toast('✅ +' + q.r + ' CZK!', 'w');
  } else {
    toast('❌ Špatná odpověď!', 'l');
  }
  if (typeof checkAch === 'function') checkAch();
  saveU();
}
// Make global
window.answerQuiz = answerQuiz;

// === ACHIEVEMENTS ===
const ACHIEVEMENTS = [
  { id:'first_win',  nm:'První výhra',   ic:'🏆', t:1,      k:'wins' },
  { id:'win10',      nm:'Veterán',       ic:'⭐', t:10,     k:'wins' },
  { id:'win50',      nm:'Šampion',       ic:'👑', t:50,     k:'wins' },
  { id:'play25',     nm:'Gambler',       ic:'🎲', t:25,     k:'played' },
  { id:'play100',    nm:'Hardcore',      ic:'🔥', t:100,    k:'played' },
  { id:'earn10k',    nm:'Boháč',         ic:'💰', t:10000,  k:'earned' },
  { id:'earn100k',   nm:'Magnát',        ic:'🏦', t:100000, k:'earned' },
  { id:'lv5',        nm:'Level 5',       ic:'📈', t:5,      k:'_lv' },
  { id:'lv10',       nm:'Level 10',      ic:'🎯', t:10,     k:'_lv' },
  { id:'lv20',       nm:'Level 20',      ic:'💎', t:20,     k:'_lv' },
];

function checkAch() {
  if (!U) return;
  ACHIEVEMENTS.forEach(a => {
    const v = a.k === '_lv' ? U.level : (U.stats[a.k] || 0);
    if (v >= a.t && !U.achievements[a.id]) {
      U.achievements[a.id] = true;
      toast('🏅 Achievement: ' + a.nm + '!', 'w');
    }
  });
}

function renderAch() {
  const g = $('achG');
  if (!g || !U) return;
  g.innerHTML = ACHIEVEMENTS.map(a => {
    const v = a.k === '_lv' ? U.level : (U.stats[a.k] || 0);
    const done = U.achievements[a.id];
    const pct = Math.min(v / a.t * 100, 100);
    return `<div class="ach2${done ? ' done' : ''}">
      <div class="ach-ic2">${a.ic}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:.84rem">${a.nm}</div>
        <div class="ach-bar"><div class="ach-fill2" style="width:${pct}%"></div></div>
        <div style="font-size:.64rem;color:var(--t3);margin-top:2px">${Math.min(v, a.t)} / ${a.t}${done ? ' ✅' : ''}</div>
      </div>
    </div>`;
  }).join('');
}

// === LEADERBOARD ===
function renderLB() {
  const el = $('lbList');
  if (!el) return;
  const us = LS('ub_users') || {};
  const rows = Object.entries(us)
    .map(([n, d]) => ({ n, b: (d.balance || 0) + (d.stats?.earned || 0) }))
    .sort((a, b) => b.b - a.b)
    .slice(0, 10);

  el.innerHTML = rows.length ? rows.map((r, i) =>
    `<div style="display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.03);gap:10px">
      <span style="font-family:var(--mo);font-weight:700;width:24px;text-align:center;color:${i === 0 ? 'var(--gld)' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--t3)'}">${i + 1}</span>
      <span style="flex:1;font-weight:600;font-size:.88rem">${r.n}${r.n === U?.name ? ' (ty)' : ''}</span>
      <span style="font-family:var(--mo);font-weight:700;color:var(--acc);font-size:.86rem">${r.b.toLocaleString('cs-CZ')}</span>
    </div>`
  ).join('') : '<p style="color:var(--t3);padding:12px;text-align:center">Žádní hráči</p>';
}

// === PROFILE ===
function renderProfile() {
  if (!U) return;
  const av = $('profAv');
  const nm = $('profNm');
  const sub = $('profSub');
  if (av) av.textContent = U.name[0].toUpperCase();
  if (nm) nm.textContent = U.name;
  if (sub) sub.textContent = 'Level ' + U.level + ' · Členem od ' + new Date(U.joinDate || Date.now()).toLocaleDateString('cs-CZ');

  const wr = U.stats.wins + U.stats.losses > 0 ? Math.round(U.stats.wins / (U.stats.wins + U.stats.losses) * 100) : 0;

  const sg = $('statG');
  if (sg) {
    sg.innerHTML = [
      { v: U.balance.toLocaleString('cs-CZ'), l:'Zůstatek (CZK)' },
      { v: U.stats.played || 0, l:'Her odehráno' },
      { v: U.stats.wins || 0, l:'Výher' },
      { v: U.stats.losses || 0, l:'Proher' },
      { v: wr + '%', l:'Win Rate' },
      { v: (U.stats.earned || 0).toLocaleString('cs-CZ'), l:'Celk. výdělek' },
      { v: (U.stats.biggestWin || 0).toLocaleString('cs-CZ'), l:'Největší výhra' },
      { v: 'LV ' + U.level, l:'Level' },
      { v: U.inventory.length, l:'Předmětů' },
      { v: (U.totalDeposited || 0).toLocaleString('cs-CZ'), l:'Depositováno' },
    ].map(s => `<div class="stat-b"><div class="stat-v">${s.v}</div><div class="stat-l">${s.l}</div></div>`).join('');
  }

  renderAch();

  const txEl = $('txList');
  if (txEl) {
    txEl.innerHTML = U.tx.length ? U.tx.slice(0, 25).map(t =>
      `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:.8rem">
        <div>
          <span style="font-weight:600">${t.reason || 'Transakce'}</span>
          <div style="font-size:.66rem;color:var(--t3)">${new Date(t.time).toLocaleString('cs-CZ')}</div>
        </div>
        <span style="font-family:var(--mo);font-weight:700;color:${t.amt >= 0 ? 'var(--grn)' : 'var(--red)'}">
          ${t.amt >= 0 ? '+' : ''}${t.amt.toLocaleString('cs-CZ')} CZK
        </span>
      </div>`
    ).join('') : '<p style="color:var(--t3);font-size:.84rem">Žádné transakce.</p>';
  }
}

// === CHATBOT ===
function sendCh() {
  const inp = $('chI');
  if (!inp) return;
  const msg = inp.value.trim();
  if (!msg) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'chm us';
  msgEl.textContent = msg;
  $('chMs').appendChild(msgEl);
  inp.value = '';

  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'chm bt';
    reply.textContent = botReply(msg);
    $('chMs').appendChild(reply);
    $('chMs').scrollTop = 99999;
  }, 400 + Math.random() * 400);
}

function botReply(msg) {
  const l = msg.toLowerCase();
  if (l.includes('ahoj') || l.includes('hi') || l.includes('čau') || l.includes('hey')) return 'Ahoj! 👋 Jak ti můžu pomoct?';
  if (l.includes('zůstat') || l.includes('kolik') || l.includes('balance')) return `Tvůj zůstatek: ${U.balance.toLocaleString('cs-CZ')} CZK, Level ${U.level}`;
  if (l.includes('theme') || l.includes('tém') || l.includes('barv')) return '🎨 5 témat: Neon, Midnight, Sunset, Arctic (světlý!), Gold VIP. Přepni v menu!';
  if (l.includes('slot') || l.includes('automat')) return '🎰 Automaty: 5 válců, 3+ stejné = výhra. 5 stejných = 50× sázka!';
  if (l.includes('crash')) return '📈 Crash: Multiplikátor roste, vyber včas před crashem!';
  if (l.includes('mine') || l.includes('miny')) return '💣 Miny: 25 polí, 5 min. +0.25× za každé bezpečné pole.';
  if (l.includes('crypto') || l.includes('krypto') || l.includes('bitcoin')) return '₿ 10 kryptoměn! BTC, ETH, SOL... Ceny se mění každé 3 sekundy.';
  if (l.includes('obchod') || l.includes('shop')) return '🛒 V obchodě: boosty, odznaky, tituly, emoji pack a další za CZK!';
  if (l.includes('deposit') || l.includes('dobít') || l.includes('pení')) return '💳 Klikni + u zůstatku → Apple Pay, Google Pay, Crypto, Karta!';
  if (l.includes('tip') || l.includes('strateg')) return '💡 Tipy: Crash cashout ~1.5×, Miny max 4 pole, krypto kup při poklesu!';
  if (l.includes('stat') || l.includes('skóre')) return `📊 Statistiky: ${U.stats.wins}W / ${U.stats.losses}L (${U.stats.wins + U.stats.losses > 0 ? Math.round(U.stats.wins / (U.stats.wins + U.stats.losses) * 100) : 0}% WR)`;
  if (l.includes('help') || l.includes('pomoc') || l.includes('nápověd')) return 'Ptej se na: hry (slots, crash, miny...), akcie, crypto, obchod, témata, deposit, strategie, statistiky!';
  if (l.includes('díky') || l.includes('děkuj') || l.includes('thx')) return 'Rádo se stalo! 😊 Ptej se kdykoli.';
  if (l.includes('blackjack') || l.includes('bj')) return '🃏 Blackjack: Dostaň se co nejblíž k 21, ale nepřetáhni! Eso = 1 nebo 11.';
  if (l.includes('rulet')) return '🎡 Ruleta: Barva 2×, zelená (0) 35×, rozsah 2×.';
  if (l.includes('věž') || l.includes('tower')) return '🏗️ Věže: 3 sloupce, 1 past na patro. +0.4× za každé patro.';
  if (l.includes('limbo')) return '🎪 Limbo: Nastav cílový multiplikátor. Čím vyšší cíl, tím menší šance ale vyšší výhra!';
  if (l.includes('daily') || l.includes('denní')) return '🎁 Denní odměna: 200–5000 CZK, roste se sérií. Plus Lucky Spin zdarma!';
  if (l.includes('achieve') || l.includes('odzná')) return '🏅 Achievementy: odemykáš hraním. 10 achievementů od "První výhra" po "Level 20"!';
  return '🤔 Tomu úplně nerozumím. Zkus napsat "help" pro přehled témat!';
}
