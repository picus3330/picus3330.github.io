/* ═══════════════════════════════════════════
   UvalyBet.cz — app.js (Core)
   ═══════════════════════════════════════════ */

let CUR=null;
const LS_U='ub_users',LS_C='ub_cur';

// ── Storage ──
function getUsers(){try{return JSON.parse(localStorage.getItem(LS_U))||{}}catch{return{}}}
function saveUsers(u){localStorage.setItem(LS_U,JSON.stringify(u))}
function getUser(){if(!CUR)return null;return getUsers()[CUR]||null}
function saveUser(d){if(!CUR)return;const u=getUsers();u[CUR]=d;saveUsers(u)}
function fmtCZK(n){return Math.floor(n).toLocaleString('cs-CZ')+' CZK'}

// ── Auth ──
function authTab(t){
  document.getElementById('authLogin').classList.toggle('hidden',t!=='login');
  document.getElementById('authReg').classList.toggle('hidden',t!=='register');
  document.querySelectorAll('.auth-tabs button').forEach((b,i)=>b.classList.toggle('act',(i===0&&t==='login')||(i===1&&t==='register')));
  document.getElementById('authErr').textContent='';
}
function doRegister(){
  const n=document.getElementById('regName').value.trim(),p=document.getElementById('regPass').value,p2=document.getElementById('regPass2').value,e=document.getElementById('authErr');
  if(n.length<2){e.textContent='Min. 2 znaky';return}
  if(p.length<4){e.textContent='Min. 4 znaky heslo';return}
  if(p!==p2){e.textContent='Hesla se neshodují';return}
  const users=getUsers();
  if(users[n]){e.textContent='Uživatel existuje';return}
  users[n]=mkProfile(n,p);saveUsers(users);loginAs(n);
}
function doLogin(){
  const n=document.getElementById('loginName').value.trim(),p=document.getElementById('loginPass').value,e=document.getElementById('authErr');
  const users=getUsers();
  if(!users[n]){e.textContent='Uživatel nenalezen';return}
  if(users[n].pass!==p){e.textContent='Špatné heslo';return}
  loginAs(n);
}
function mkProfile(n,p){
  return{pass:p,balance:10000,portfolio:{},cPortfolio:{},
    stats:{wins:0,losses:0,played:0,earned:0,spent:0,biggestWin:0},
    xp:0,level:1,joinDate:Date.now(),
    daily:{streak:0,lastClaim:0},dailySpin:0,favs:[],
    tx:[],achievements:[],inventory:[],theme:'neon',totalDeposited:0}
}
function loginAs(n){
  CUR=n;localStorage.setItem(LS_C,n);
  document.getElementById('auth').classList.add('out');
  ['topbar','ticker','main','mobNav','chatFab'].forEach(id=>document.getElementById(id).style.display='');
  updateBal();
  const u=getUser();applyTheme(u.theme||'neon');
  if(typeof initGamesGrid==='function')initGamesGrid();
  if(typeof initSports==='function')initSports();
  if(typeof initStocks==='function')initStocks();
  if(typeof initCrypto==='function')initCrypto();
  if(typeof initShop==='function')initShop();
  if(typeof initEarn==='function')initEarn();
  if(typeof renderProfile==='function')renderProfile();
  initTicker();initParticles();
}
function logout(){CUR=null;localStorage.removeItem(LS_C);location.reload()}

// Auto-login
(function(){const s=localStorage.getItem(LS_C);if(s&&getUsers()[s])loginAs(s)})();

// ── Navigation ──
const PAGE_MAP={games:'pgGames',sports:'pgSports',stocks:'pgStocks',crypto:'pgCrypto',shop:'pgShop',earn:'pgEarn',profile:'pgProfile'};
const PAGE_NAMES=Object.keys(PAGE_MAP);
function goPage(id){
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));
  const t=document.getElementById(PAGE_MAP[id]);
  if(t)setTimeout(()=>t.classList.add('on'),15);
  document.querySelectorAll('#nav button').forEach((b,i)=>b.classList.toggle('act',PAGE_NAMES[i]===id));
  document.querySelectorAll('.mob-nav button').forEach((b,i)=>{
    const mobNames=['games','sports','stocks','crypto','earn','profile'];
    b.classList.toggle('act',mobNames[i]===id);
  });
  document.querySelector('.topbar').classList.remove('mob-open');
  if(id==='profile'&&typeof renderProfile==='function')renderProfile();
  if(id==='earn'&&typeof initEarn==='function')initEarn();
  if(id==='stocks'&&typeof renderStockPF==='function')renderStockPF();
  if(id==='crypto'&&typeof renderCryptoPF==='function')renderCryptoPF();
  if(id==='sports'&&typeof renderBetslip==='function')renderBetslip();
}

// ── Balance ──
function updateBal(){
  const u=getUser();if(!u)return;
  const el=document.getElementById('bal');
  el.textContent=fmtCZK(u.balance);
  el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');
}
function addBal(amt,reason){
  const u=getUser();if(!u)return;
  u.balance+=amt;
  if(amt>0)u.stats.earned+=amt;
  if(amt<0)u.stats.spent+=Math.abs(amt);
  u.tx.unshift({amount:amt,reason,time:Date.now()});
  if(u.tx.length>25)u.tx.pop();
  saveUser(u);updateBal();
}

// ── XP ──
function addXP(amt){
  const u=getUser();if(!u)return;
  u.xp+=amt;const needed=u.level*500;
  while(u.xp>=needed){u.xp-=u.level*500;u.level++;toast('🎉 Level '+u.level+'!','success')}
  saveUser(u);
  if(typeof checkAchievements==='function')checkAchievements();
}

// ── Toast ──
function toast(msg,type='info'){
  const c=document.getElementById('toasts'),t=document.createElement('div');
  t.className='toast '+type;t.textContent=msg;c.appendChild(t);
  setTimeout(()=>t.remove(),4200);
}

// ── Modal ──
function openModal(id){document.getElementById(id).classList.add('on')}
function closeModal(id){document.getElementById(id).classList.remove('on')}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-bg.on').forEach(m=>m.classList.remove('on'));
    document.getElementById('chatBox').classList.remove('on');
  }
});
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('on')}));

// ── Themes ──
const THEMES={
  neon:{name:'Neon',desc:'Zelený accent, tmavé pozadí',color:'#00ff88',
    v:{'--acc':'#00ff88','--accR':'0','--accG':'255','--accB':'136','--acc2':'#00b4d8','--bg0':'#050508','--bg1':'#0a0a10','--bg2':'#101018','--bg3':'#18182a','--bg4':'#22223a','--t1':'#f0f0f5','--t2':'#8888a0','--t3':'#55556a'}},
  midnight:{name:'Midnight',desc:'Fialový accent, noční atmosféra',color:'#a78bfa',
    v:{'--acc':'#a78bfa','--accR':'167','--accG':'139','--accB':'250','--acc2':'#818cf8','--bg0':'#08061a','--bg1':'#0e0c22','--bg2':'#15122e','--bg3':'#1e1a3c','--bg4':'#2a254e','--t1':'#f0f0f5','--t2':'#9090b0','--t3':'#60608a'}},
  sunset:{name:'Sunset',desc:'Červený accent, teplé tóny',color:'#ff4060',
    v:{'--acc':'#ff4060','--accR':'255','--accG':'64','--accB':'96','--acc2':'#ff8a00','--bg0':'#0a0506','--bg1':'#120a0c','--bg2':'#1a1014','--bg3':'#24181e','--bg4':'#30222a','--t1':'#f5f0f0','--t2':'#a08888','--t3':'#6a5555'}},
  arctic:{name:'Arctic',desc:'Světlý motiv, modrý accent',color:'#0066ff',
    v:{'--acc':'#0066ff','--accR':'0','--accG':'102','--accB':'255','--acc2':'#00b4d8','--bg0':'#eaecf2','--bg1':'#f2f4f8','--bg2':'#ffffff','--bg3':'#dde2ea','--bg4':'#c8d0dc','--t1':'#0a0f18','--t2':'#4a5568','--t3':'#8a95a5',
    '--glass-bg':'rgba(255,255,255,.5)','--glass-border':'rgba(0,0,0,.06)','--glass-highlight':'rgba(255,255,255,.8)'}},
  gold:{name:'Gold VIP',desc:'Zlatý luxus',color:'#ffcc00',
    v:{'--acc':'#ffcc00','--accR':'255','--accG':'204','--accB':'0','--acc2':'#ff8a00','--bg0':'#080700','--bg1':'#100e02','--bg2':'#1a1606','--bg3':'#241e0e','--bg4':'#302818','--t1':'#fff8e0','--t2':'#b0a060','--t3':'#706830'}}
};
function applyTheme(id){
  const t=THEMES[id];if(!t)return;
  const r=document.documentElement;
  Object.entries(t.v).forEach(([k,v])=>r.style.setProperty(k,v));
}
function openThemeModal(){
  const u=getUser(),cur=u?u.theme:'neon';
  let h='<div class="theme-grid">';
  Object.entries(THEMES).forEach(([id,t])=>{
    h+=`<div class="theme-opt glass-card ${id===cur?'sel':''}" onclick="setTheme('${id}')">
      <div class="theme-swatch" style="background:${t.color}"></div>
      <div><div class="theme-nm">${t.name}</div><div class="theme-dsc">${t.desc}</div></div>
    </div>`;
  });
  h+='</div>';
  document.getElementById('themeBody').innerHTML=h;
  openModal('themeModal');
}
function setTheme(id){
  applyTheme(id);const u=getUser();
  if(u){u.theme=id;saveUser(u)}
  closeModal('themeModal');toast('Téma: '+THEMES[id].name,'info');
  initParticles();
}

// ── Particles ──
let pRAF=null;
function initParticles(){
  const c=document.getElementById('particles'),ctx=c.getContext('2d');
  c.width=innerWidth;c.height=innerHeight;
  if(pRAF)cancelAnimationFrame(pRAF);
  const s=getComputedStyle(document.documentElement);
  const r=parseInt(s.getPropertyValue('--accR'))||0,g=parseInt(s.getPropertyValue('--accG'))||255,b=parseInt(s.getPropertyValue('--accB'))||136;
  const pts=Array.from({length:30},()=>({
    x:Math.random()*c.width,y:Math.random()*c.height,
    vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,
    sz:Math.random()*1.5+.5,a:Math.random()*.2+.03
  }));
  function draw(){
    ctx.clearRect(0,0,c.width,c.height);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;
      if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${p.a})`;ctx.fill();
    });
    pRAF=requestAnimationFrame(draw);
  }
  draw();
}
addEventListener('resize',()=>{const c=document.getElementById('particles');c.width=innerWidth;c.height=innerHeight});

// ── Ticker ──
function initTicker(){
  const names=['xKral420','NovaGamer','DarkLord','CzechMaster','LuckyKid','ProHrac','VIPshark','CryptoKing','MegaBet','StakeGuru','DiamondH','NeonWolf'];
  const games=['Automaty','Crash','Blackjack','Ruleta','Miny','Coin Flip','Hi-Lo','Keno','Plinko','Limbo','Věže','Baccarat','Sport'];
  let items='';
  for(let i=0;i<25;i++){
    const n=names[Math.floor(Math.random()*names.length)];
    const g=games[Math.floor(Math.random()*games.length)];
    const w=Math.floor(Math.random()*49000+1000);
    items+=`<span>🎉 <span class="tw">${n}</span> vyhrál ${fmtCZK(w)} v ${g}</span>`;
  }
  document.getElementById('tickerTrack').innerHTML=items+items;
}

// ── Checkout ──
function openCheckout(){
  const amounts=[1000,2500,5000,10000,25000,50000];
  const methods=[
    {id:'apple',icon:'',name:'Apple Pay',desc:'Rychlá platba'},
    {id:'google',icon:'G',name:'Google Pay',desc:'Bezpečná platba'},
    {id:'crypto',icon:'₿',name:'Crypto',desc:'BTC, ETH, SOL'},
    {id:'card',icon:'💳',name:'Karta',desc:'Visa / Mastercard'}
  ];
  let h=`<div id="coForm">
    <div class="co-amounts">${amounts.map((a,i)=>`<div class="co-amt ${i===2?'sel':''}" onclick="selCoAmt(this,${a})">${fmtCZK(a)}</div>`).join('')}</div>
    <div class="field"><label>Vlastní částka</label><input type="number" id="coCustom" placeholder="Zadej částku" oninput="coCustom()"></div>
    <div class="co-methods">${methods.map((m,i)=>`<div class="co-method ${i===0?'sel':''}" onclick="selCoMethod(this,'${m.name}')">
      <div class="co-method-icon">${m.icon}</div><div><div style="font-weight:600;font-size:.85rem">${m.name}</div><div style="font-size:.72rem;color:var(--t3)">${m.desc}</div></div>
    </div>`).join('')}</div>
    <div class="co-total" id="coTotal">${fmtCZK(5000)}</div>
    <button class="btn-primary" id="coPayBtn" onclick="processCo()">Zaplatit přes Apple Pay</button>
  </div>
  <div class="co-processing hidden" id="coProc"><div class="co-spinner"></div><div style="color:var(--t2);font-size:.88rem">Zpracovávám...</div></div>
  <div class="co-success hidden" id="coSucc"><div class="co-check">✓</div><div style="font-size:1.1rem;font-weight:700;margin-bottom:6px">Úspěch!</div><div style="color:var(--t2);font-size:.88rem" id="coSuccAmt"></div></div>`;
  document.getElementById('coBody').innerHTML=h;
  window._coAmt=5000;window._coMethod='Apple Pay';
  openModal('coModal');
}
function selCoAmt(el,a){document.querySelectorAll('.co-amt').forEach(x=>x.classList.remove('sel'));el.classList.add('sel');window._coAmt=a;document.getElementById('coCustom').value='';document.getElementById('coTotal').textContent=fmtCZK(a)}
function coCustom(){const v=parseInt(document.getElementById('coCustom').value)||0;if(v>0){document.querySelectorAll('.co-amt').forEach(x=>x.classList.remove('sel'));window._coAmt=v;document.getElementById('coTotal').textContent=fmtCZK(v)}}
function selCoMethod(el,n){document.querySelectorAll('.co-method').forEach(x=>x.classList.remove('sel'));el.classList.add('sel');window._coMethod=n;document.getElementById('coPayBtn').textContent='Zaplatit přes '+n}
function processCo(){
  const a=window._coAmt;if(!a||a<=0)return;
  document.getElementById('coForm').classList.add('hidden');
  document.getElementById('coProc').classList.remove('hidden');
  setTimeout(()=>{
    document.getElementById('coProc').classList.add('hidden');
    document.getElementById('coSucc').classList.remove('hidden');
    document.getElementById('coSuccAmt').textContent=fmtCZK(a)+' přidáno';
    const u=getUser();u.totalDeposited+=a;saveUser(u);
    addBal(a,'Deposit ('+window._coMethod+')');
    toast('+'+fmtCZK(a),'success');
  },2000);
}

// ── Chat ──
function toggleChat(){document.getElementById('chatBox').classList.toggle('on')}
function sendChat(){
  const inp=document.getElementById('chatInp'),msg=inp.value.trim();if(!msg)return;inp.value='';
  const c=document.getElementById('chatMsgs');
  c.innerHTML+=`<div class="chat-bub user">${escH(msg)}</div>`;
  const reply=chatReply(msg.toLowerCase());
  setTimeout(()=>{c.innerHTML+=`<div class="chat-bub bot">${reply}</div>`;c.scrollTop=c.scrollHeight},400);
  c.scrollTop=c.scrollHeight;
}
function chatReply(m){
  if(m.match(/ahoj|hey|hi|čau|zdar/))return'Ahoj! 👋 Jak pomůžu?';
  if(m.match(/hry|hra|game/))return'Máme 15 her! Automaty, Crash, Blackjack a další. 🎮';
  if(m.match(/sport|fotbal|basket/))return'Sázky na sport! Fotbal, basket, tenis — podívej se do sekce Sport. ⚽';
  if(m.match(/akci|stock/))return'12 akcií s live cenami každé 3s. 📊';
  if(m.match(/crypto|krypto|bitcoin/))return'10 kryptoměn včetně BTC, ETH, SOL! ₿';
  if(m.match(/obchod|shop/))return'XP boosty, VIP odznaky a další v obchodě. 🛒';
  if(m.match(/téma|theme/))return'5 témat! Klikni na 🎨 nahoře.';
  if(m.match(/deposit|vklad/))return'Klikni na Deposit v topbaru. Je to demo! 💰';
  if(m.match(/tip|rada/))return'Tip: Začni malými sázkami, vyzkoušej Crash! 🎯';
  if(m.match(/stat/))return'Balance: '+fmtCZK(getUser()?.balance||0)+'. Detaily na profilu!';
  if(m.match(/help|pomoc/))return'Ptej se na: hry, sport, akcie, crypto, obchod, témata, tipy 🤔';
  return'Zkus: hry, sport, akcie, crypto, obchod, témata, help 🤖';
}
function escH(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
