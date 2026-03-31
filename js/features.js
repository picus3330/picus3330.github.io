/* ═══════════════════════════════════════════
   UvalyBet.cz — features.js
   Shop, Daily Rewards, Lucky Spin, Quiz,
   Achievements, Profile, Leaderboard
   ═══════════════════════════════════════════ */

// ═══ SHOP ═══
const SHOP_ITEMS = [
  { id:'xp_boost',   icon:'⚡', name:'XP Boost 2×',     desc:'Dvojnásobný XP na 1 hodinu',        price:2500 },
  { id:'vip_badge',  icon:'👑', name:'VIP Odznak',       desc:'Zlatý odznak u tvého jména',         price:5000 },
  { id:'lucky_charm',icon:'🍀', name:'Lucky Charm',      desc:'+5% šance na výhru',                 price:3000 },
  { id:'theme_neon', icon:'🌈', name:'Premium Neon+',    desc:'Vylepšené neonové téma s efekty',    price:4000 },
  { id:'gold_avatar',icon:'✨', name:'Zlatý Avatar',     desc:'Zlatý rámeček kolem avataru',        price:6000 },
  { id:'title_whale',icon:'🐋', name:'Titul: Whale',     desc:'Zobraz se jako "Whale" na profilu',  price:8000 },
  { id:'title_pro',  icon:'🏆', name:'Titul: Pro Hráč',  desc:'Zobraz se jako "Pro" na profilu',    price:5000 },
  { id:'streak_sh',  icon:'🛡️', name:'Streak Shield',    desc:'Ochrana denní série (1× použití)',   price:2000 },
  { id:'crypto_sig', icon:'📡', name:'Crypto Signály',   desc:'Zvýraznění trendů u kryptoměn',     price:3500 },
  { id:'extra_spin', icon:'🎰', name:'Extra Spin',       desc:'+1 lucky spin navíc denně',          price:1500 },
  { id:'emoji_pack', icon:'😎', name:'Emoji Pack',       desc:'Odemkni prémiové emoji v chatu',     price:1000 },
  { id:'daily_boost',icon:'📈', name:'Denní Boost',      desc:'Dvojnásobné denní odměny',           price:4500 }
];

function initShop() {
  const user = getUser();
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = SHOP_ITEMS.map(item => {
    const owned = user && user.inventory && user.inventory.includes(item.id);
    return `<div class="shop-item">
      <div class="shop-icon">${item.icon}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-desc">${item.desc}</div>
      <div class="shop-price">${fmtCZK(item.price)}</div>
      <button class="shop-buy" onclick="buyShopItem('${item.id}')" ${owned?'disabled':''}>${owned?'✓ Vlastníš':'Koupit'}</button>
    </div>`;
  }).join('');
}

function buyShopItem(id) {
  const user = getUser();
  if (!user) return;
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return;
  if (user.inventory && user.inventory.includes(id)) { toast('Už vlastníš tento předmět!', 'error'); return; }
  if (user.balance < item.price) { toast('Nedostatek prostředků!', 'error'); return; }
  addBalance(-item.price, `Obchod: ${item.name}`);
  if (!user.inventory) user.inventory = [];
  user.inventory.push(id);
  saveUser(user);
  toast(`${item.icon} ${item.name} zakoupeno!`, 'success');
  addXP(100);
  initShop();
}

// ═══ EARN PAGE ═══
function initEarn() {
  const el = document.getElementById('earnContent');
  el.innerHTML = renderDailyRewards() + renderLuckySpin() + renderQuiz();
}

// ── Daily Rewards ──
function renderDailyRewards() {
  const user = getUser(); if (!user) return '';
  const rewards = [200, 400, 600, 800, 1200, 2000, 5000];
  const hasBoost = user.inventory && user.inventory.includes('daily_boost');
  const today = new Date().toDateString();
  const lastClaim = user.daily.lastClaim ? new Date(user.daily.lastClaim).toDateString() : '';
  const claimedToday = lastClaim === today;
  const streak = user.daily.streak || 0;
  let html = `<div class="earn-card">
    <h3>📅 Denní Odměny</h3>
    <div class="daily-boxes">
      ${rewards.map((r, i) => {
        const claimed = i < streak && claimedToday ? true : i < streak;
        const isCurrent = i === (streak % 7);
        const amt = hasBoost ? r * 2 : r;
        return `<div class="daily-box ${claimed && i < streak ? 'claimed' : ''} ${isCurrent && !claimedToday ? 'current' : ''}">
          <span class="day-num">Den ${i+1}</span>
          <span class="day-amt">${fmtCZK(amt)}</span>
          ${claimed && i < streak ? '<span style="color:var(--grn)">✓</span>' : ''}
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:.8rem;color:var(--t3);margin-top:8px">Série: ${streak} dní ${hasBoost?'(2× boost!)':''}</div>
    <button class="daily-claim" onclick="claimDaily()" ${claimedToday?'disabled':''}>${claimedToday?'✓ Vyzvednuté':'Vyzvednout odměnu'}</button>
  </div>`;
  return html;
}

function claimDaily() {
  const user = getUser(); if (!user) return;
  const rewards = [200, 400, 600, 800, 1200, 2000, 5000];
  const hasBoost = user.inventory && user.inventory.includes('daily_boost');
  const today = new Date().toDateString();
  const lastClaim = user.daily.lastClaim ? new Date(user.daily.lastClaim).toDateString() : '';
  if (lastClaim === today) return;

  // Check streak continuity
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastClaim !== yesterday && lastClaim !== '') {
    // Check streak shield
    if (user.inventory && user.inventory.includes('streak_sh')) {
      user.inventory = user.inventory.filter(i => i !== 'streak_sh');
      toast('🛡️ Streak Shield použit!', 'info');
    } else {
      user.daily.streak = 0;
    }
  }
  const day = user.daily.streak % 7;
  let reward = rewards[day];
  if (hasBoost) reward *= 2;
  user.daily.streak++;
  user.daily.lastClaim = Date.now();
  saveUser(user);
  addBalance(reward, `Denní odměna (den ${day+1})`);
  toast(`📅 +${fmtCZK(reward)} — Den ${day+1}!`, 'success');
  addXP(30);
  initEarn();
}

// ── Lucky Spin ──
function renderLuckySpin() {
  const user = getUser(); if (!user) return '';
  const today = new Date().toDateString();
  const lastSpin = user.dailySpin ? new Date(user.dailySpin).toDateString() : '';
  const extraSpin = user.inventory && user.inventory.includes('extra_spin');
  const spunToday = lastSpin === today && !extraSpin;
  return `<div class="earn-card">
    <h3>🎡 Lucky Spin</h3>
    <div class="spin-container">
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0" id="spinSegs">
        ${['50','100','200','500','1000','200','100','5000'].map((v,i)=>`<div style="padding:10px 16px;background:var(--bg2);border-radius:var(--radius-sm);font-family:var(--font-mono);font-weight:700" id="sseg${i}">${fmtCZK(parseInt(v))}</div>`).join('')}
      </div>
      <button class="spin-btn" onclick="doLuckySpin()" ${spunToday?'disabled':''}>${spunToday?'Dnes již otočeno':'🎡 Otočit zdarma!'}</button>
    </div>
  </div>`;
}

function doLuckySpin() {
  const user = getUser(); if (!user) return;
  const prizes = [50, 100, 200, 500, 1000, 200, 100, 5000];
  const winner = Math.floor(Math.random() * prizes.length);
  let current = 0, rounds = 0;
  const maxRounds = prizes.length * 4 + winner;
  const iv = setInterval(() => {
    for (let i = 0; i < prizes.length; i++) {
      const el = document.getElementById('sseg'+i);
      if (el) {
        el.style.background = i === (current % prizes.length) ? 'rgba(var(--accR),var(--accG),var(--accB),.25)' : 'var(--bg2)';
        el.style.transform = i === (current % prizes.length) ? 'scale(1.1)' : 'scale(1)';
      }
    }
    current++;
    rounds++;
    if (rounds >= maxRounds) {
      clearInterval(iv);
      const prize = prizes[winner];
      user.dailySpin = Date.now();
      saveUser(user);
      addBalance(prize, `Lucky Spin — ${fmtCZK(prize)}`);
      toast(`🎡 Vyhrál/a jsi ${fmtCZK(prize)} v Lucky Spinu!`, 'success');
      addXP(25);
      setTimeout(() => initEarn(), 1000);
    }
  }, rounds > maxRounds - 8 ? 200 : 80);
}

// ── Quiz ──
const QUIZ_QUESTIONS = [
  { q:'Hlavní město Francie?', opts:['Paříž','Londýn','Berlín','Madrid'], correct:0, diff:'easy', reward:200 },
  { q:'Kolik planet má sluneční soustava?', opts:['7','8','9','10'], correct:1, diff:'easy', reward:200 },
  { q:'Kdo namaloval Monu Lisu?', opts:['Picasso','Da Vinci','Michelangelo','Rembrandt'], correct:1, diff:'easy', reward:200 },
  { q:'Nejdelší řeka světa?', opts:['Amazonka','Nil','Mississippi','Jang-c-ťiang'], correct:1, diff:'easy', reward:200 },
  { q:'Nejvyšší hora světa?', opts:['K2','Kangchenjunga','Mount Everest','Lhotse'], correct:2, diff:'easy', reward:200 },
  { q:'Kolik strun má standardní kytara?', opts:['4','5','6','7'], correct:2, diff:'easy', reward:200 },
  { q:'Chemická značka zlata?', opts:['Ag','Au','Fe','Cu'], correct:1, diff:'medium', reward:500 },
  { q:'Který prvek má atom. číslo 1?', opts:['Helium','Kyslík','Vodík','Uhlík'], correct:2, diff:'medium', reward:500 },
  { q:'Rok přistání na Měsíci?', opts:['1965','1967','1969','1971'], correct:2, diff:'medium', reward:500 },
  { q:'Kolik kostí má lidské tělo?', opts:['196','206','216','256'], correct:1, diff:'medium', reward:500 },
  { q:'Nejrychlejší zvíře na zemi?', opts:['Lev','Gepard','Jestřáb','Antilopa'], correct:1, diff:'medium', reward:500 },
  { q:'Kdo vynalezl žárovku?', opts:['Tesla','Edison','Bell','Watt'], correct:1, diff:'medium', reward:500 },
  { q:'Jaká je rychlost světla (km/s)?', opts:['150 000','300 000','450 000','600 000'], correct:1, diff:'hard', reward:1000 },
  { q:'Kolik chromozomů má člověk?', opts:['23','42','46','48'], correct:2, diff:'hard', reward:1000 },
  { q:'Který programovací jazyk vytvořil Guido van Rossum?', opts:['Java','C++','Python','Ruby'], correct:2, diff:'hard', reward:1000 },
  { q:'Planckova konstanta (přibližně)?', opts:['6.626×10⁻³⁴','3.14×10⁻²⁸','9.81×10⁻¹²','1.602×10⁻¹⁹'], correct:0, diff:'hard', reward:1000 },
  { q:'Kolik bitů je v jednom bajtu?', opts:['4','6','8','16'], correct:2, diff:'easy', reward:200 },
  { q:'Hlavní město Austrálie?', opts:['Sydney','Melbourne','Canberra','Brisbane'], correct:2, diff:'medium', reward:500 }
];

function renderQuiz() {
  const questions = [...QUIZ_QUESTIONS].sort(() => Math.random()-0.5).slice(0, 6);
  let html = `<div class="earn-card">
    <h3>🧠 Kvíz</h3>
    <div class="quiz-grid" id="quizGrid">
      ${questions.map((q, i) => `<div class="quiz-q" id="qq${i}">
        <div class="quiz-q-diff" style="color:${q.diff==='easy'?'var(--grn)':q.diff==='medium'?'var(--gld)':'var(--red)'}">
          ${q.diff==='easy'?'Lehká':q.diff==='medium'?'Střední':'Těžká'} — ${fmtCZK(q.reward)}
        </div>
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-opts">
          ${q.opts.map((o, j) => `<button class="quiz-opt" onclick="answerQuiz(${i},${j},${q.correct},${q.reward},this)">${o}</button>`).join('')}
        </div>
      </div>`).join('')}
    </div>
    <button class="bet-btn mt2" onclick="initEarn()" style="width:100%;padding:10px">🔄 Nové otázky</button>
  </div>`;
  return html;
}

function answerQuiz(qi, chosen, correct, reward, el) {
  const qEl = document.getElementById(`qq${qi}`);
  if (qEl.dataset.answered) return;
  qEl.dataset.answered = '1';
  const opts = qEl.querySelectorAll('.quiz-opt');
  opts.forEach((o, i) => {
    if (i === correct) o.classList.add('correct');
    if (i === chosen && i !== correct) o.classList.add('wrong');
    o.style.pointerEvents = 'none';
  });
  if (chosen === correct) {
    addBalance(reward, `Kvíz — správná odpověď`);
    toast(`🧠 Správně! +${fmtCZK(reward)}`, 'success');
    addXP(20);
  } else {
    toast('❌ Špatná odpověď!', 'error');
  }
}

// ═══ ACHIEVEMENTS ═══
const ACHIEVEMENTS = [
  { id:'first_win',  icon:'🏅', name:'První výhra',  desc:'Vyhraj svou první hru',       check: u => u.stats.wins >= 1,  max:1 },
  { id:'vet_10',     icon:'⭐', name:'Veterán',       desc:'Vyhraj 10 her',                check: u => u.stats.wins >= 10, max:10 },
  { id:'champ_50',   icon:'🏆', name:'Šampion',       desc:'Vyhraj 50 her',                check: u => u.stats.wins >= 50, max:50 },
  { id:'gambler_25', icon:'🎰', name:'Gambler',       desc:'Odehraj 25 her',               check: u => u.stats.played >= 25, max:25 },
  { id:'hardcore_100',icon:'💪', name:'Hardcore',      desc:'Odehraj 100 her',              check: u => u.stats.played >= 100, max:100 },
  { id:'rich_10k',   icon:'💰', name:'Boháč',         desc:'Vydělej celkem 10 000 CZK',    check: u => u.stats.earned >= 10000, max:10000 },
  { id:'mogul_100k', icon:'💎', name:'Magnát',        desc:'Vydělej celkem 100 000 CZK',   check: u => u.stats.earned >= 100000, max:100000 },
  { id:'lvl_5',      icon:'📊', name:'Level 5',       desc:'Dosáhni levelu 5',             check: u => u.level >= 5, max:5 },
  { id:'lvl_10',     icon:'📈', name:'Level 10',      desc:'Dosáhni levelu 10',            check: u => u.level >= 10, max:10 },
  { id:'lvl_20',     icon:'🚀', name:'Level 20',      desc:'Dosáhni levelu 20',            check: u => u.level >= 20, max:20 }
];

function checkAchievements() {
  const user = getUser(); if (!user) return;
  if (!user.achievements) user.achievements = [];
  ACHIEVEMENTS.forEach(a => {
    if (!user.achievements.includes(a.id) && a.check(user)) {
      user.achievements.push(a.id);
      toast(`🏆 Achievement odemčen: ${a.name}!`, 'success');
    }
  });
  saveUser(user);
}

function renderAchievements(user) {
  return `<div class="sec-header"><h2>🏆 Achievementy</h2></div>
    <div class="achiev-grid mb2">
      ${ACHIEVEMENTS.map(a => {
        const unlocked = user.achievements && user.achievements.includes(a.id);
        let progress = 0;
        if (a.id.startsWith('first_win') || a.id.startsWith('vet_') || a.id.startsWith('champ_')) progress = Math.min(user.stats.wins, a.max);
        else if (a.id.startsWith('gambler_') || a.id.startsWith('hardcore_')) progress = Math.min(user.stats.played, a.max);
        else if (a.id.startsWith('rich_') || a.id.startsWith('mogul_')) progress = Math.min(user.stats.earned, a.max);
        else if (a.id.startsWith('lvl_')) progress = Math.min(user.level, a.max);
        const pct = Math.min(100, (progress / a.max) * 100);
        return `<div class="achiev-item ${unlocked?'unlocked':''}">
          <div class="achiev-icon">${a.icon}</div>
          <div class="achiev-info">
            <div class="achiev-name">${a.name} ${unlocked?'✓':''}</div>
            <div class="achiev-desc">${a.desc}</div>
            <div class="achiev-bar"><div class="achiev-bar-fill" style="width:${pct}%"></div></div>
            <div style="font-size:.7rem;color:var(--t3);margin-top:2px">${progress.toLocaleString('cs-CZ')} / ${a.max.toLocaleString('cs-CZ')}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ═══ PROFILE ═══
function renderProfile() {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('profileContent');
  const xpNeeded = user.level * 500;
  const xpPct = Math.min(100, (user.xp / xpNeeded) * 100);
  const winRate = user.stats.played > 0 ? ((user.stats.wins / user.stats.played) * 100).toFixed(1) : '0.0';
  const joined = new Date(user.joinDate).toLocaleDateString('cs-CZ');

  let html = `
    <div class="profile-header">
      <div class="profile-avatar">${(CUR_USER || '?')[0].toUpperCase()}</div>
      <div>
        <div class="profile-name">${CUR_USER}</div>
        <div class="profile-level">Level ${user.level}</div>
        <div class="profile-joined">Členem od ${joined}</div>
        <div class="xp-bar mt1"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
        <div style="font-size:.75rem;color:var(--t3);margin-top:4px">${user.xp} / ${xpNeeded} XP</div>
      </div>
      <div style="margin-left:auto"><button class="bet-btn" onclick="logout()" style="color:var(--red)">🚪 Odhlásit</button></div>
    </div>

    <div class="stats-grid">
      <div class="stat-box"><div class="stat-val">${fmtCZK(user.balance)}</div><div class="stat-label">Balance</div></div>
      <div class="stat-box"><div class="stat-val">${user.stats.played}</div><div class="stat-label">Odehráno</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--grn)">${user.stats.wins}</div><div class="stat-label">Výhry</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--red)">${user.stats.losses}</div><div class="stat-label">Prohry</div></div>
      <div class="stat-box"><div class="stat-val">${winRate}%</div><div class="stat-label">Win Rate</div></div>
      <div class="stat-box"><div class="stat-val">${fmtCZK(user.stats.earned)}</div><div class="stat-label">Výdělek</div></div>
      <div class="stat-box"><div class="stat-val">${fmtCZK(user.stats.biggestWin)}</div><div class="stat-label">Největší výhra</div></div>
      <div class="stat-box"><div class="stat-val">Lvl ${user.level}</div><div class="stat-label">Level</div></div>
      <div class="stat-box"><div class="stat-val">${user.inventory ? user.inventory.length : 0}</div><div class="stat-label">Předměty</div></div>
      <div class="stat-box"><div class="stat-val">${fmtCZK(user.totalDeposited || 0)}</div><div class="stat-label">Depositováno</div></div>
    </div>

    ${renderAchievements(user)}

    <div class="sec-header"><h2>📋 Historie transakcí</h2></div>
    <div class="earn-card mb2">
      <div class="tx-list">
        ${(user.tx || []).map(tx => {
          const time = new Date(tx.time).toLocaleString('cs-CZ');
          return `<div class="tx-item">
            <div>
              <div class="tx-reason">${tx.reason}</div>
              <div class="tx-time">${time}</div>
            </div>
            <div class="tx-amount ${tx.amount>=0?'pos':'neg'}">${tx.amount>=0?'+':''}${fmtCZK(tx.amount)}</div>
          </div>`;
        }).join('') || '<div style="color:var(--t3);text-align:center;padding:20px">Žádné transakce</div>'}
      </div>
    </div>

    ${renderLeaderboard()}
  `;
  el.innerHTML = html;
}

// ═══ LEADERBOARD ═══
function renderLeaderboard() {
  const users = getUsers();
  const entries = Object.entries(users).map(([name, u]) => ({
    name, balance: u.balance, earned: u.stats ? u.stats.earned : 0
  }));
  entries.sort((a, b) => (b.balance + b.earned) - (a.balance + a.earned));
  const top10 = entries.slice(0, 10);
  return `<div class="sec-header"><h2>🏅 Žebříček hráčů</h2></div>
    <div class="earn-card">
      <table class="lb-table">
        <tr><th>#</th><th>Hráč</th><th>Balance</th><th>Vydělal</th></tr>
        ${top10.map((e, i) => `<tr ${e.name===CUR_USER?'style="background:rgba(var(--accR),var(--accG),var(--accB),.05)"':''}>
          <td>${i===0?'👑':i===1?'🥈':i===2?'🥉':i+1}</td>
          <td style="font-weight:600">${e.name} ${e.name===CUR_USER?'(ty)':''}</td>
          <td class="mono">${fmtCZK(e.balance)}</td>
          <td class="mono">${fmtCZK(e.earned)}</td>
        </tr>`).join('')}
      </table>
    </div>`;
}
