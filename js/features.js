/* ═══════════════════════════════════════════
   UvalyBet.cz — features.js
   Sports, Shop, Earn, Achievements, Profile
   ═══════════════════════════════════════════ */

// ═══ SPORTS BETTING ═══
const SPORTS_MATCHES=[
  {id:1,league:'Premier League',home:'Arsenal',away:'Chelsea',hIcon:'🔴',aIcon:'🔵',time:'20:45',live:true,score:'2 : 1',odds:{h:1.85,d:3.40,a:4.20}},
  {id:2,league:'Champions League',home:'Real Madrid',away:'Bayern',hIcon:'⚪',aIcon:'🔴',time:'21:00',live:true,score:'1 : 1',odds:{h:2.10,d:3.20,a:3.50}},
  {id:3,league:'La Liga',home:'Barcelona',away:'Atletico',hIcon:'🔵',aIcon:'🔴',time:'Zítra 18:30',live:false,score:null,odds:{h:1.65,d:3.80,a:5.00}},
  {id:4,league:'Serie A',home:'AC Milan',away:'Inter',hIcon:'🔴',aIcon:'⚫',time:'Zítra 20:45',live:false,score:null,odds:{h:2.50,d:3.10,a:2.90}},
  {id:5,league:'NBA',home:'Lakers',away:'Warriors',hIcon:'💜',aIcon:'💛',time:'02:00',live:false,score:null,odds:{h:1.90,d:null,a:1.95}},
  {id:6,league:'NBA',home:'Celtics',away:'Bucks',hIcon:'🟢',aIcon:'🦌',time:'Zítra 01:30',live:false,score:null,odds:{h:1.75,d:null,a:2.15}},
  {id:7,league:'Bundesliga',home:'Dortmund',away:'Leverkusen',hIcon:'🟡',aIcon:'🔴',time:'Sobota 15:30',live:false,score:null,odds:{h:2.30,d:3.40,a:3.00}},
  {id:8,league:'Ligue 1',home:'PSG',away:'Marseille',hIcon:'🔵',aIcon:'⚪',time:'Neděle 20:45',live:false,score:null,odds:{h:1.45,d:4.50,a:6.50}},
  {id:9,league:'Tenis — ATP',home:'Sinner',away:'Djokovic',hIcon:'🇮🇹',aIcon:'🇷🇸',time:'Pondělí 14:00',live:false,score:null,odds:{h:1.80,d:null,a:2.05}},
  {id:10,league:'Tenis — WTA',home:'Šwiateková',away:'Gauffová',hIcon:'🇵🇱',aIcon:'🇺🇸',time:'Úterý 16:00',live:false,score:null,odds:{h:1.55,d:null,a:2.45}},
];

let betSlip=[];

function initSports(){
  const grid=document.getElementById('sportsGrid');
  grid.innerHTML=SPORTS_MATCHES.map(m=>{
    const isNBA=m.league.includes('NBA')||m.league.includes('Tenis');
    return`<div class="glass-card sport-card">
      <div class="match-header">
        <div class="match-league">${m.league}</div>
        ${m.live?'<div class="match-live">LIVE</div>':'<div style="font-size:.72rem;color:var(--t3)">${m.time}</div>'}
      </div>
      ${m.score?`<div class="match-score">${m.score}</div>`:'<div class="match-time">${m.time}</div>'}
      <div class="match-teams">
        <div class="team"><div class="team-icon">${m.hIcon}</div><div class="team-name">${m.home}</div></div>
        <div class="match-vs">VS</div>
        <div class="team"><div class="team-icon">${m.aIcon}</div><div class="team-name">${m.away}</div></div>
      </div>
      <div class="odds-row">
        <div class="odd-btn" onclick="addToBetslip(${m.id},'1','${m.home}',${m.odds.h})" id="ob_${m.id}_h">
          <div class="odd-label">1</div><div class="odd-val">${m.odds.h.toFixed(2)}</div>
        </div>
        ${m.odds.d?`<div class="odd-btn" onclick="addToBetslip(${m.id},'X','Remíza',${m.odds.d})" id="ob_${m.id}_d">
          <div class="odd-label">X</div><div class="odd-val">${m.odds.d.toFixed(2)}</div>
        </div>`:''}
        <div class="odd-btn" onclick="addToBetslip(${m.id},'2','${m.away}',${m.odds.a})" id="ob_${m.id}_a">
          <div class="odd-label">2</div><div class="odd-val">${m.odds.a.toFixed(2)}</div>
        </div>
      </div>
    </div>`;
  }).join('');
  renderBetslip();
}

function addToBetslip(matchId,pick,name,odd){
  const existing=betSlip.findIndex(b=>b.matchId===matchId);
  if(existing>=0)betSlip.splice(existing,1);
  const match=SPORTS_MATCHES.find(m=>m.id===matchId);
  betSlip.push({matchId,pick,name,odd,teams:match.home+' vs '+match.away});
  // Highlight selected
  ['h','d','a'].forEach(t=>{const el=document.getElementById('ob_'+matchId+'_'+t);if(el)el.classList.remove('sel')});
  const selMap={'1':'h','X':'d','2':'a'};
  const selEl=document.getElementById('ob_'+matchId+'_'+selMap[pick]);
  if(selEl)selEl.classList.add('sel');
  renderBetslip();
  toast('Přidáno na tiket: '+name,'info');
}

function renderBetslip(){
  const el=document.getElementById('betslip');
  if(betSlip.length===0){el.innerHTML='';return}
  const totalOdd=betSlip.reduce((a,b)=>a*b.odd,1);
  el.innerHTML=`<div class="glass-card betslip-card">
    <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:14px;letter-spacing:-.02em">Tiket (${betSlip.length})</h3>
    ${betSlip.map((b,i)=>`<div class="betslip-item">
      <div><div class="betslip-teams">${b.teams}</div><div class="betslip-pick">${b.pick} — ${b.name} @ ${b.odd.toFixed(2)}</div></div>
      <span class="betslip-remove" onclick="removeBet(${i})">✕</span>
    </div>`).join('')}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.04)">
      <span style="font-size:.8rem;color:var(--t3)">Celkový kurz</span>
      <span class="mono" style="font-weight:700;color:var(--acc)">${totalOdd.toFixed(2)}</span>
    </div>
    <div class="bet-section mt2"><div class="bet-label">Sázka</div>
      <input type="number" class="bet-input" id="sportBet" value="500" min="1" style="width:100%">
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-size:.82rem;color:var(--t2)">Potenciální výhra</span>
      <span class="mono" style="font-weight:700;color:var(--grn)" id="sportWin">${fmtCZK(Math.floor(500*totalOdd))}</span>
    </div>
    <button class="btn-primary" onclick="placeSportBet()">Vsadit</button>
  </div>`;
  // Update potential win on input
  const inp=document.getElementById('sportBet');
  if(inp)inp.oninput=()=>{
    const v=parseInt(inp.value)||0;
    document.getElementById('sportWin').textContent=fmtCZK(Math.floor(v*totalOdd));
  };
}

function removeBet(i){
  const b=betSlip[i];
  if(b){
    ['h','d','a'].forEach(t=>{const el=document.getElementById('ob_'+b.matchId+'_'+t);if(el)el.classList.remove('sel')});
  }
  betSlip.splice(i,1);renderBetslip();
}

function placeSportBet(){
  const bet=parseInt(document.getElementById('sportBet').value)||0;
  if(bet<=0){toast('Zadej sázku!','error');return}
  if(!chkBal(bet))return;
  addBal(-bet,'Sport sázka');
  const totalOdd=betSlip.reduce((a,b)=>a*b.odd,1);
  // Simulate result — each pick has ~45% chance of winning
  let allWon=true;
  betSlip.forEach(b=>{if(Math.random()>.45)allWon=false});
  if(allWon){
    const win=Math.floor(bet*totalOdd);
    addBal(win,'Sport výhra');toast('🎉 Tiket vyhrál! +'+fmtCZK(win),'success');
    recGame(true,win);
  }else{
    toast('Tiket nevyhrál','error');recGame(false,0);
  }
  // Clear
  betSlip.forEach(b=>{['h','d','a'].forEach(t=>{const el=document.getElementById('ob_'+b.matchId+'_'+t);if(el)el.classList.remove('sel')})});
  betSlip=[];renderBetslip();
}

// ═══ SHOP ═══
const SHOP=[
  {id:'xp_boost',icon:'⚡',name:'XP Boost 2×',desc:'Dvojnásobný XP na hodinu',price:2500},
  {id:'vip_badge',icon:'👑',name:'VIP Odznak',desc:'Zlatý odznak u jména',price:5000},
  {id:'lucky_charm',icon:'🍀',name:'Lucky Charm',desc:'+5% šance na výhru',price:3000},
  {id:'theme_neon',icon:'🌈',name:'Premium Neon+',desc:'Vylepšené neonové téma',price:4000},
  {id:'gold_avatar',icon:'✨',name:'Zlatý Avatar',desc:'Zlatý rámeček avataru',price:6000},
  {id:'title_whale',icon:'🐋',name:'Titul: Whale',desc:'Zobraz se jako Whale',price:8000},
  {id:'title_pro',icon:'🏆',name:'Titul: Pro',desc:'Zobraz se jako Pro',price:5000},
  {id:'streak_sh',icon:'🛡️',name:'Streak Shield',desc:'Ochrana denní série',price:2000},
  {id:'crypto_sig',icon:'📡',name:'Crypto Signály',desc:'Zvýraznění trendů',price:3500},
  {id:'extra_spin',icon:'🎰',name:'Extra Spin',desc:'+1 spin denně',price:1500},
  {id:'emoji_pack',icon:'😎',name:'Emoji Pack',desc:'Prémiové emoji v chatu',price:1000},
  {id:'daily_boost',icon:'📈',name:'Denní Boost',desc:'2× denní odměny',price:4500}
];

function initShop(){
  const u=getUser();
  document.getElementById('shopGrid').innerHTML=SHOP.map(it=>{
    const owned=u&&u.inventory&&u.inventory.includes(it.id);
    return`<div class="glass-card shop-item">
      <div class="shop-icon">${it.icon}</div>
      <div class="shop-name">${it.name}</div>
      <div class="shop-desc">${it.desc}</div>
      <div class="shop-price">${fmtCZK(it.price)}</div>
      <button class="shop-buy" onclick="buyShop('${it.id}')" ${owned?'disabled':''}>${owned?'✓ Vlastníš':'Koupit'}</button>
    </div>`;
  }).join('');
}
function buyShop(id){
  const u=getUser();if(!u)return;const it=SHOP.find(i=>i.id===id);if(!it)return;
  if(u.inventory&&u.inventory.includes(id)){toast('Již vlastníš!','error');return}
  if(u.balance<it.price){toast('Nedostatek!','error');return}
  addBal(-it.price,'Obchod: '+it.name);
  if(!u.inventory)u.inventory=[];u.inventory.push(id);saveUser(u);
  toast(it.icon+' '+it.name+' zakoupeno!','success');addXP(100);initShop();
}

// ═══ EARN ═══
function initEarn(){document.getElementById('earnContent').innerHTML=renderDaily()+renderSpin()+renderQuiz()}

function renderDaily(){
  const u=getUser();if(!u)return'';
  const rw=[200,400,600,800,1200,2000,5000],boost=u.inventory&&u.inventory.includes('daily_boost');
  const today=new Date().toDateString(),last=u.daily.lastClaim?new Date(u.daily.lastClaim).toDateString():'';
  const claimed=last===today,streak=u.daily.streak||0;
  return`<div class="glass-card earn-block"><h3>📅 Denní odměny</h3>
    <div class="daily-boxes">${rw.map((r,i)=>{
      const amt=boost?r*2:r;
      return`<div class="daily-box ${i<streak?'claimed':''} ${i===(streak%7)&&!claimed?'now':''}">
        <span class="d-num">Den ${i+1}</span><span class="d-amt">${fmtCZK(amt)}</span>
        ${i<streak?'<span style="color:var(--grn);font-size:.7rem">✓</span>':''}
      </div>`}).join('')}</div>
    <div style="font-size:.75rem;color:var(--t3);margin-top:8px">Série: ${streak} dní ${boost?'(2× boost)':''}</div>
    <button class="daily-claim" onclick="claimDaily()" ${claimed?'disabled':''}>${claimed?'✓ Vyzvednuté':'Vyzvednout'}</button>
  </div>`;
}
function claimDaily(){
  const u=getUser();if(!u)return;
  const rw=[200,400,600,800,1200,2000,5000],boost=u.inventory&&u.inventory.includes('daily_boost');
  const today=new Date().toDateString(),last=u.daily.lastClaim?new Date(u.daily.lastClaim).toDateString():'';
  if(last===today)return;
  const yesterday=new Date(Date.now()-86400000).toDateString();
  if(last!==yesterday&&last!==''){
    if(u.inventory&&u.inventory.includes('streak_sh')){u.inventory=u.inventory.filter(i=>i!=='streak_sh');toast('🛡️ Shield použit!','info')}
    else u.daily.streak=0;
  }
  const day=u.daily.streak%7;let rwd=rw[day];if(boost)rwd*=2;
  u.daily.streak++;u.daily.lastClaim=Date.now();saveUser(u);
  addBal(rwd,'Denní odměna (den '+(day+1)+')');toast('📅 +'+fmtCZK(rwd),'success');addXP(30);initEarn();
}

function renderSpin(){
  const u=getUser();if(!u)return'';
  const today=new Date().toDateString(),last=u.dailySpin?new Date(u.dailySpin).toDateString():'';
  const extra=u.inventory&&u.inventory.includes('extra_spin');
  const spun=last===today&&!extra;
  return`<div class="glass-card earn-block"><h3>🎡 Lucky Spin</h3>
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0" id="spinSegs">
      ${['50','100','200','500','1 000','200','100','5 000'].map((v,i)=>`<div style="padding:10px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:8px;font-family:var(--font-mono);font-weight:700;font-size:.82rem;transition:all .15s" id="ss${i}">${v} CZK</div>`).join('')}
    </div>
    <div class="tc"><button class="daily-claim" onclick="doSpin()" ${spun?'disabled':''}>${spun?'Dnes otočeno':'Otočit zdarma!'}</button></div>
  </div>`;
}
function doSpin(){
  const u=getUser();if(!u)return;
  const prizes=[50,100,200,500,1000,200,100,5000],win=Math.floor(Math.random()*prizes.length);
  let cur=0,rnd=0;const mx=prizes.length*4+win;
  const iv=setInterval(()=>{
    for(let i=0;i<prizes.length;i++){const e=document.getElementById('ss'+i);if(e){
      e.style.background=i===(cur%prizes.length)?'rgba(var(--accR),var(--accG),var(--accB),.15)':'rgba(255,255,255,.03)';
      e.style.transform=i===(cur%prizes.length)?'scale(1.08)':'scale(1)';
    }}cur++;rnd++;
    if(rnd>=mx){clearInterval(iv);const prize=prizes[win];
      u.dailySpin=Date.now();saveUser(u);
      addBal(prize,'Lucky Spin');toast('🎡 +'+fmtCZK(prize),'success');addXP(25);
      setTimeout(()=>initEarn(),800);
    }
  },rnd>mx-8?180:70);
}

const QUIZ=[
  {q:'Hlavní město Francie?',opts:['Paříž','Londýn','Berlín','Madrid'],c:0,d:'easy',r:200},
  {q:'Kolik planet má sluneční soustava?',opts:['7','8','9','10'],c:1,d:'easy',r:200},
  {q:'Kdo namaloval Monu Lisu?',opts:['Picasso','Da Vinci','Michelangelo','Rembrandt'],c:1,d:'easy',r:200},
  {q:'Nejdelší řeka světa?',opts:['Amazonka','Nil','Mississippi','Jang-c-ťiang'],c:1,d:'easy',r:200},
  {q:'Nejvyšší hora světa?',opts:['K2','Kangchenjunga','Everest','Lhotse'],c:2,d:'easy',r:200},
  {q:'Kolik strun má kytara?',opts:['4','5','6','7'],c:2,d:'easy',r:200},
  {q:'Chemická značka zlata?',opts:['Ag','Au','Fe','Cu'],c:1,d:'medium',r:500},
  {q:'Prvek s atom. číslem 1?',opts:['Helium','Kyslík','Vodík','Uhlík'],c:2,d:'medium',r:500},
  {q:'Rok přistání na Měsíci?',opts:['1965','1967','1969','1971'],c:2,d:'medium',r:500},
  {q:'Kolik kostí má člověk?',opts:['196','206','216','256'],c:1,d:'medium',r:500},
  {q:'Nejrychlejší zvíře?',opts:['Lev','Gepard','Jestřáb','Antilopa'],c:1,d:'medium',r:500},
  {q:'Kdo vynalezl žárovku?',opts:['Tesla','Edison','Bell','Watt'],c:1,d:'medium',r:500},
  {q:'Rychlost světla (km/s)?',opts:['150 000','300 000','450 000','600 000'],c:1,d:'hard',r:1000},
  {q:'Kolik chromozomů má člověk?',opts:['23','42','46','48'],c:2,d:'hard',r:1000},
  {q:'Kdo vytvořil Python?',opts:['Java','C++','Python','Ruby'],c:2,d:'hard',r:1000},
  {q:'Bitů v bajtu?',opts:['4','6','8','16'],c:2,d:'easy',r:200},
  {q:'Hlavní město Austrálie?',opts:['Sydney','Melbourne','Canberra','Brisbane'],c:2,d:'medium',r:500},
  {q:'Planckova konstanta?',opts:['6.626×10⁻³⁴','3.14×10⁻²⁸','9.81×10⁻¹²','1.602×10⁻¹⁹'],c:0,d:'hard',r:1000}
];

function renderQuiz(){
  const qs=[...QUIZ].sort(()=>Math.random()-.5).slice(0,6);
  return`<div class="glass-card earn-block"><h3>🧠 Kvíz</h3>
    <div class="quiz-grid">${qs.map((q,i)=>`<div class="quiz-q" id="qq${i}">
      <div class="quiz-diff" style="color:${q.d==='easy'?'var(--grn)':q.d==='medium'?'var(--gld)':'var(--red)'}">
        ${q.d==='easy'?'Lehká':q.d==='medium'?'Střední':'Těžká'} · ${fmtCZK(q.r)}</div>
      <div class="quiz-text">${q.q}</div>
      <div class="quiz-opts">${q.opts.map((o,j)=>`<button class="quiz-opt" onclick="ansQ(${i},${j},${q.c},${q.r})">${o}</button>`).join('')}</div>
    </div>`).join('')}</div>
    <button class="bet-btn mt2" onclick="initEarn()" style="width:100%;padding:10px">Nové otázky</button>
  </div>`;
}
function ansQ(qi,ch,co,rw){
  const qe=document.getElementById('qq'+qi);if(qe.dataset.done)return;qe.dataset.done='1';
  qe.querySelectorAll('.quiz-opt').forEach((o,i)=>{if(i===co)o.classList.add('ok');if(i===ch&&i!==co)o.classList.add('no');o.style.pointerEvents='none'});
  if(ch===co){addBal(rw,'Kvíz');toast('🧠 +'+fmtCZK(rw),'success');addXP(20)}else toast('❌ Špatně','error');
}

// ═══ ACHIEVEMENTS ═══
const ACHIEV=[
  {id:'first_win',icon:'🏅',name:'První výhra',desc:'Vyhraj 1 hru',ck:u=>u.stats.wins>=1,mx:1},
  {id:'vet_10',icon:'⭐',name:'Veterán',desc:'Vyhraj 10 her',ck:u=>u.stats.wins>=10,mx:10},
  {id:'champ_50',icon:'🏆',name:'Šampion',desc:'Vyhraj 50 her',ck:u=>u.stats.wins>=50,mx:50},
  {id:'gambler',icon:'🎰',name:'Gambler',desc:'Odehraj 25 her',ck:u=>u.stats.played>=25,mx:25},
  {id:'hardcore',icon:'💪',name:'Hardcore',desc:'Odehraj 100 her',ck:u=>u.stats.played>=100,mx:100},
  {id:'rich',icon:'💰',name:'Boháč',desc:'Vydělej 10k',ck:u=>u.stats.earned>=10000,mx:10000},
  {id:'mogul',icon:'💎',name:'Magnát',desc:'Vydělej 100k',ck:u=>u.stats.earned>=100000,mx:100000},
  {id:'lvl5',icon:'📊',name:'Level 5',desc:'Dosáhni lvl 5',ck:u=>u.level>=5,mx:5},
  {id:'lvl10',icon:'📈',name:'Level 10',desc:'Dosáhni lvl 10',ck:u=>u.level>=10,mx:10},
  {id:'lvl20',icon:'🚀',name:'Level 20',desc:'Dosáhni lvl 20',ck:u=>u.level>=20,mx:20}
];

function checkAchievements(){
  const u=getUser();if(!u)return;if(!u.achievements)u.achievements=[];
  ACHIEV.forEach(a=>{if(!u.achievements.includes(a.id)&&a.ck(u)){u.achievements.push(a.id);toast('🏆 '+a.name+'!','success')}});
  saveUser(u);
}

function renderAchiev(u){
  return`<div class="sec-head mt3"><h2>Achievementy</h2></div>
    <div class="achiev-grid mb2">${ACHIEV.map(a=>{
      const done=u.achievements&&u.achievements.includes(a.id);
      let prog=0;
      if(a.id.includes('win')||a.id.includes('vet')||a.id.includes('champ'))prog=Math.min(u.stats.wins,a.mx);
      else if(a.id.includes('gambler')||a.id.includes('hardcore'))prog=Math.min(u.stats.played,a.mx);
      else if(a.id.includes('rich')||a.id.includes('mogul'))prog=Math.min(u.stats.earned,a.mx);
      else if(a.id.includes('lvl'))prog=Math.min(u.level,a.mx);
      return`<div class="achiev-item ${done?'done':''}">
        <div class="achiev-icon">${a.icon}</div>
        <div class="achiev-info"><div class="achiev-nm">${a.name} ${done?'✓':''}</div><div class="achiev-desc">${a.desc}</div>
          <div class="achiev-bar"><div class="achiev-bar-fill" style="width:${Math.min(100,(prog/a.mx)*100)}%"></div></div>
          <div style="font-size:.65rem;color:var(--t3);margin-top:2px">${prog.toLocaleString('cs-CZ')} / ${a.mx.toLocaleString('cs-CZ')}</div>
        </div></div>`;
    }).join('')}</div>`;
}

// ═══ PROFILE ═══
function renderProfile(){
  const u=getUser();if(!u)return;
  const el=document.getElementById('profileContent');
  const xpN=u.level*500,xpP=Math.min(100,(u.xp/xpN)*100);
  const wr=u.stats.played>0?((u.stats.wins/u.stats.played)*100).toFixed(1):'0.0';
  const joined=new Date(u.joinDate).toLocaleDateString('cs-CZ');
  el.innerHTML=`
    <div class="glass-card profile-head">
      <div class="profile-avatar">${(CUR||'?')[0].toUpperCase()}</div>
      <div style="flex:1"><div class="profile-name">${CUR}</div><div class="profile-level">Level ${u.level}</div><div class="profile-joined">Členem od ${joined}</div>
        <div class="xp-bar mt1"><div class="xp-bar-fill" style="width:${xpP}%"></div></div>
        <div style="font-size:.7rem;color:var(--t3);margin-top:3px">${u.xp} / ${xpN} XP</div>
      </div>
      <button class="bet-btn" onclick="logout()" style="color:var(--red)">Odhlásit</button>
    </div>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-val">${fmtCZK(u.balance)}</div><div class="stat-lbl">Balance</div></div>
      <div class="stat-box"><div class="stat-val">${u.stats.played}</div><div class="stat-lbl">Odehráno</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--grn)">${u.stats.wins}</div><div class="stat-lbl">Výhry</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--red)">${u.stats.losses}</div><div class="stat-lbl">Prohry</div></div>
      <div class="stat-box"><div class="stat-val">${wr}%</div><div class="stat-lbl">Win Rate</div></div>
      <div class="stat-box"><div class="stat-val">${fmtCZK(u.stats.earned)}</div><div class="stat-lbl">Výdělek</div></div>
      <div class="stat-box"><div class="stat-val">${fmtCZK(u.stats.biggestWin)}</div><div class="stat-lbl">Největší výhra</div></div>
      <div class="stat-box"><div class="stat-val">Lvl ${u.level}</div><div class="stat-lbl">Level</div></div>
      <div class="stat-box"><div class="stat-val">${u.inventory?u.inventory.length:0}</div><div class="stat-lbl">Předměty</div></div>
      <div class="stat-box"><div class="stat-val">${fmtCZK(u.totalDeposited||0)}</div><div class="stat-lbl">Deposit</div></div>
    </div>
    ${renderAchiev(u)}
    <div class="sec-head mt3"><h2>Transakce</h2></div>
    <div class="glass-card mb2" style="padding:16px">
      <div class="tx-list">${(u.tx||[]).map(tx=>{
        const t=new Date(tx.time).toLocaleString('cs-CZ');
        return`<div class="tx-item"><div><div class="tx-reason">${tx.reason}</div><div class="tx-time">${t}</div></div>
          <div class="tx-amt ${tx.amount>=0?'pos':'neg'}">${tx.amount>=0?'+':''}${fmtCZK(tx.amount)}</div></div>`
      }).join('')||'<div class="tc" style="color:var(--t3);padding:20px">Žádné transakce</div>'}</div>
    </div>
    ${renderLB()}`;
}

function renderLB(){
  const users=getUsers();
  const entries=Object.entries(users).map(([n,u])=>({name:n,bal:u.balance,earned:u.stats?u.stats.earned:0}));
  entries.sort((a,b)=>(b.bal+b.earned)-(a.bal+a.earned));
  return`<div class="sec-head mt3"><h2>Žebříček</h2></div>
    <div class="glass-card" style="padding:16px"><table class="lb-table">
      <tr><th>#</th><th>Hráč</th><th>Balance</th><th>Vydělal</th></tr>
      ${entries.slice(0,10).map((e,i)=>`<tr ${e.name===CUR?'style="background:rgba(var(--accR),var(--accG),var(--accB),.03)"':''}>
        <td>${i===0?'👑':i===1?'🥈':i===2?'🥉':i+1}</td>
        <td style="font-weight:600">${e.name} ${e.name===CUR?'(ty)':''}</td>
        <td class="mono">${fmtCZK(e.bal)}</td><td class="mono">${fmtCZK(e.earned)}</td>
      </tr>`).join('')}
    </table></div>`;
}

// helper used by sports
function chkBal(b){const u=getUser();if(!u||u.balance<b){toast('Nedostatek!','error');return false}return true}
function recGame(won,amt){
  const u=getUser();if(!u)return;u.stats.played++;
  if(won){u.stats.wins++;if(amt>u.stats.biggestWin)u.stats.biggestWin=amt}else u.stats.losses++;
  saveUser(u);addXP(won?50:15);if(typeof checkAchievements==='function')checkAchievements();
}
