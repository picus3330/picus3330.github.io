/* ═══════════════════════════════════════════
   UvalyBet.cz — games.js (15 Her)
   ═══════════════════════════════════════════ */

const GAMES=[
  {id:'slots',icon:'🎰',name:'Automaty',desc:'5 válců, velké výhry'},
  {id:'roulette',icon:'🎯',name:'Ruleta',desc:'Evropská klasika'},
  {id:'blackjack',icon:'🃏',name:'Blackjack',desc:'Poraz dealera'},
  {id:'crash',icon:'📈',name:'Crash',desc:'Cashoutni včas!'},
  {id:'mines',icon:'💣',name:'Miny',desc:'5×5 grid, vyhni se'},
  {id:'dice',icon:'🎲',name:'Kostky',desc:'Nastav cíl a hoď'},
  {id:'wheel',icon:'🎡',name:'Kolo štěstí',desc:'Toč a vyhraj'},
  {id:'coinflip',icon:'🪙',name:'Coin Flip',desc:'Orel nebo panna'},
  {id:'hilo',icon:'🔼',name:'Hi-Lo',desc:'Vyšší nebo nižší'},
  {id:'keno',icon:'🔢',name:'Keno',desc:'Vyber čísla a losuj'},
  {id:'plinko',icon:'⚡',name:'Plinko',desc:'Sleduj kam padne'},
  {id:'scratch',icon:'🎟️',name:'Stírací los',desc:'Odhal 3 stejné'},
  {id:'baccarat',icon:'👔',name:'Baccarat',desc:'Hráč vs Bankéř'},
  {id:'limbo',icon:'🚀',name:'Limbo',desc:'Překonáš multiplikátor?'},
  {id:'towers',icon:'🏗️',name:'Věže',desc:'Stoupej nahoru'}
];

function initGamesGrid(){
  const u=getUser(),grid=document.getElementById('gamesGrid');
  grid.innerHTML=GAMES.map(g=>{
    const fav=u&&u.favs&&u.favs.includes(g.id);
    return`<div class="glass-card game-card" onclick="openGame('${g.id}')">
      <span class="gc-fav ${fav?'on':''}" onclick="event.stopPropagation();togFav('${g.id}',this)">★</span>
      <div class="gc-icon">${g.icon}</div>
      <div class="gc-name">${g.name}</div>
      <div class="gc-desc">${g.desc}</div>
    </div>`;
  }).join('');
}
function togFav(id,el){
  const u=getUser();if(!u)return;if(!u.favs)u.favs=[];
  const i=u.favs.indexOf(id);
  if(i>=0){u.favs.splice(i,1);el.classList.remove('on')}
  else{u.favs.push(id);el.classList.add('on')}
  saveUser(u);
}
function openGame(id){
  const g=GAMES.find(x=>x.id===id);if(!g)return;
  document.getElementById('gmTitle').textContent=g.icon+' '+g.name;
  const b=document.getElementById('gmBody');
  const fn=window['gm_'+id];
  if(typeof fn==='function')fn(b);else b.innerHTML='<p style="color:var(--t3)">Načítání...</p>';
  openModal('gameModal');
}

// ── Helpers ──
function betH(d=100){
  return`<div class="bet-section"><div class="bet-label">Sázka</div><div class="bet-row">
    <input type="number" class="bet-input" id="gmBet" value="${d}" min="1">
    <button class="bet-btn" onclick="document.getElementById('gmBet').value=Math.max(1,Math.floor(document.getElementById('gmBet').value/2))">½</button>
    <button class="bet-btn" onclick="document.getElementById('gmBet').value=Math.floor(document.getElementById('gmBet').value*2)">2×</button>
    <button class="bet-btn" onclick="document.getElementById('gmBet').value=getUser().balance">MAX</button>
  </div></div>`;
}
function gBet(){return Math.max(1,parseInt(document.getElementById('gmBet').value)||0)}
function chkBal(b){const u=getUser();if(!u||u.balance<b){toast('Nedostatek prostředků!','error');return false}return true}
function recGame(won,amt){
  const u=getUser();if(!u)return;u.stats.played++;
  if(won){u.stats.wins++;if(amt>u.stats.biggestWin)u.stats.biggestWin=amt}
  else u.stats.losses++;
  saveUser(u);addXP(won?50:15);
  if(typeof checkAchievements==='function')checkAchievements();
}

// ═══ 1. SLOTS ═══
function gm_slots(b){
  const S=['🍒','🍋','🔔','⭐','💎','7️⃣','🍀','👑'];
  b.innerHTML=betH()+`<div class="slots-reels" id="sR">${'<div class="slots-reel">?</div>'.repeat(5)}</div>
    <button class="play-btn" id="sBtn" onclick="gm_slots_go()">Zatočit</button><div id="sRes"></div>`;
  window._sS=S;
}
function gm_slots_go(){
  const bet=gBet();if(!chkBal(bet))return;
  const btn=document.getElementById('sBtn');btn.disabled=true;
  addBal(-bet,'Automaty');
  const S=window._sS,reels=document.querySelectorAll('.slots-reel');
  const res=Array.from({length:5},()=>S[Math.floor(Math.random()*S.length)]);
  let sp=0;const iv=setInterval(()=>{
    reels.forEach(r=>r.textContent=S[Math.floor(Math.random()*S.length)]);sp++;
    if(sp>16){clearInterval(iv);
      reels.forEach((r,i)=>r.textContent=res[i]);
      const cnt={};res.forEach(s=>cnt[s]=(cnt[s]||0)+1);
      const mx=Math.max(...Object.values(cnt));
      let mul=0;if(mx>=3)mul=3;if(mx>=4)mul=10;if(mx>=5)mul=50;
      const ws=Object.keys(cnt).find(k=>cnt[k]===mx);
      reels.forEach((r,i)=>{r.classList.toggle('hit',res[i]===ws&&mx>=3)});
      const el=document.getElementById('sRes');
      if(mul>0){const w=bet*mul;addBal(w,'Automaty '+mul+'×');el.innerHTML=`<div class="gm-result win">🎉 ${mx}× ${ws} — ${fmtCZK(w)}</div>`;recGame(true,w)}
      else{el.innerHTML=`<div class="gm-result lose">Žádná výhra</div>`;recGame(false,0)}
      btn.disabled=false;
    }
  },75);
}

// ═══ 2. ROULETTE ═══
function gm_roulette(b){
  b.innerHTML=betH()+`<div class="rl-bets" id="rlB">
    <button class="sel" onclick="selRl(this,'red')" style="color:var(--red)">🔴 Červená</button>
    <button onclick="selRl(this,'black')">⚫ Černá</button>
    <button onclick="selRl(this,'even')">Sudá</button>
    <button onclick="selRl(this,'odd')">Lichá</button>
    <button onclick="selRl(this,'1-18')">1–18</button>
    <button onclick="selRl(this,'19-36')">19–36</button>
  </div><div class="rl-wheel" id="rlW">?</div>
  <button class="play-btn" id="rlBtn" onclick="gm_rl_go()">Zatočit</button><div id="rlRes"></div>`;
  window._rlT='red';
}
function selRl(el,t){document.querySelectorAll('#rlB button').forEach(b=>b.classList.remove('sel'));el.classList.add('sel');window._rlT=t}
function gm_rl_go(){
  const bet=gBet();if(!chkBal(bet))return;
  document.getElementById('rlBtn').disabled=true;addBal(-bet,'Ruleta');
  const num=Math.floor(Math.random()*37),reds=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],isR=reds.includes(num);
  const w=document.getElementById('rlW');
  w.style.transition='none';w.style.transform='rotate(0deg)';void w.offsetWidth;
  w.style.transition='transform 2.8s cubic-bezier(.17,.67,.05,.99)';
  w.style.transform=`rotate(${720+num*10}deg)`;
  let sp=0;const iv=setInterval(()=>{
    w.textContent=Math.floor(Math.random()*37);sp++;
    if(sp>32){clearInterval(iv);
      w.textContent=num;w.style.color=num===0?'var(--grn)':isR?'var(--red)':'var(--t1)';
      const bt=window._rlT;let won=false;
      if(num>0){
        if(bt==='red')won=isR;else if(bt==='black')won=!isR;
        else if(bt==='even')won=num%2===0;else if(bt==='odd')won=num%2===1;
        else if(bt==='1-18')won=num<=18;else if(bt==='19-36')won=num>=19;
      }
      const r=document.getElementById('rlRes');
      if(won){addBal(bet*2,'Ruleta výhra');r.innerHTML=`<div class="gm-result win">🎉 ${num} — ${fmtCZK(bet*2)}</div>`;recGame(true,bet*2)}
      else{r.innerHTML=`<div class="gm-result lose">${num} — Prohra</div>`;recGame(false,0)}
      document.getElementById('rlBtn').disabled=false;
    }
  },80);
}

// ═══ 3. BLACKJACK ═══
function gm_blackjack(b){
  b.innerHTML=betH()+`<button class="play-btn" id="bjD" onclick="gm_bj_deal()">Rozdat karty</button>
    <div id="bjG" class="hidden">
      <div class="mb1" style="font-size:.75rem;color:var(--t3)">Dealer <span id="bjDS"></span></div>
      <div class="bj-hand" id="bjDH"></div>
      <div class="mb1 mt2" style="font-size:.75rem;color:var(--t3)">Ty <span id="bjPS"></span></div>
      <div class="bj-hand" id="bjPH"></div>
      <div class="bj-actions" id="bjA">
        <button style="background:var(--blu);color:#fff" onclick="gm_bj_hit()">Hit</button>
        <button style="background:var(--red);color:#fff" onclick="gm_bj_stand()">Stand</button>
      </div>
    </div><div id="bjR"></div>`;
}
function bjC(){const su=['♠','♥','♦','♣'],vs=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],s=su[Math.floor(Math.random()*4)],v=vs[Math.floor(Math.random()*13)];return{s,v,n:v==='A'?11:['J','Q','K'].includes(v)?10:parseInt(v),red:s==='♥'||s==='♦',str:v+s}}
function bjS(h){let s=h.reduce((a,c)=>a+c.n,0),ac=h.filter(c=>c.v==='A').length;while(s>21&&ac>0){s-=10;ac--}return s}
function bjR(){const g=window._bj;
  document.getElementById('bjDH').innerHTML=g.dc.map((c,i)=>(i===1&&!g.rev)?'<div class="bj-card face-down">?</div>':`<div class="bj-card ${c.red?'red':''}">${c.str}</div>`).join('');
  document.getElementById('bjPH').innerHTML=g.pc.map(c=>`<div class="bj-card ${c.red?'red':''}">${c.str}</div>`).join('');
  document.getElementById('bjDS').textContent=g.rev?'('+bjS(g.dc)+')':'('+g.dc[0].n+')';
  document.getElementById('bjPS').textContent='('+bjS(g.pc)+')';
}
function gm_bj_deal(){const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Blackjack');
  window._bj={bet,pc:[bjC(),bjC()],dc:[bjC(),bjC()],rev:false,done:false};
  document.getElementById('bjD').classList.add('hidden');document.getElementById('bjG').classList.remove('hidden');
  document.getElementById('bjA').classList.remove('hidden');document.getElementById('bjR').innerHTML='';bjR();
  if(bjS(window._bj.pc)===21)gm_bj_end();
}
function gm_bj_hit(){const g=window._bj;if(!g||g.done)return;g.pc.push(bjC());bjR();if(bjS(g.pc)>=21)gm_bj_end()}
function gm_bj_stand(){gm_bj_end()}
function gm_bj_end(){const g=window._bj;if(!g||g.done)return;g.done=true;g.rev=true;
  document.getElementById('bjA').classList.add('hidden');
  while(bjS(g.dc)<17)g.dc.push(bjC());bjR();
  const ps=bjS(g.pc),ds=bjS(g.dc),r=document.getElementById('bjR');let msg,won=false;
  if(ps>21){msg='Bust!'}
  else if(ds>21){msg='Dealer bust! +'+fmtCZK(g.bet*2);addBal(g.bet*2,'Blackjack výhra');won=true}
  else if(ps>ds){msg=ps+' vs '+ds+' — +'+fmtCZK(g.bet*2);addBal(g.bet*2,'Blackjack výhra');won=true}
  else if(ps===ds){msg='Remíza';addBal(g.bet,'Blackjack remíza')}
  else{msg=ps+' vs '+ds+' — Prohra'}
  r.innerHTML=`<div class="gm-result ${won?'win':'lose'}">${msg}</div>`;recGame(won,won?g.bet*2:0);
  document.getElementById('bjD').classList.remove('hidden');document.getElementById('bjD').textContent='Hrát znovu';
}

// ═══ 4. CRASH ═══
function gm_crash(b){
  b.innerHTML=betH()+`<div class="crash-screen">
    <div class="crash-num" id="crN">1.00×</div>
    <div class="crash-progress"><div class="crash-progress-fill" id="crB" style="width:0"></div></div>
  </div>
  <button class="play-btn" id="crS" onclick="gm_cr_start()">Start</button>
  <button class="play-btn hidden" id="crC" onclick="gm_cr_cash()" style="background:var(--gld);color:#000">Cashout</button>
  <div id="crR"></div>`;
}
function gm_cr_start(){
  const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Crash');
  document.getElementById('crS').classList.add('hidden');document.getElementById('crC').classList.remove('hidden');document.getElementById('crR').innerHTML='';
  const cp=1+Math.random()*Math.random()*10;let m=1;
  const el=document.getElementById('crN'),bar=document.getElementById('crB');
  el.classList.remove('bust');el.style.color='var(--grn)';bar.style.background='var(--grn)';
  window._cr={bet,cp,on:true};
  const iv=setInterval(()=>{
    if(!window._cr.on){clearInterval(iv);return}
    m+=.02;el.textContent=m.toFixed(2)+'×';bar.style.width=Math.min(100,(m/cp)*100)+'%';
    if(m>=cp){clearInterval(iv);window._cr.on=false;
      el.textContent=cp.toFixed(2)+'×';el.classList.add('bust');el.style.color='var(--red)';bar.style.background='var(--red)';
      document.getElementById('crC').classList.add('hidden');document.getElementById('crS').classList.remove('hidden');
      document.getElementById('crR').innerHTML=`<div class="gm-result lose">💥 Crash ${cp.toFixed(2)}×</div>`;recGame(false,0);
    }
  },50);
}
function gm_cr_cash(){
  if(!window._cr||!window._cr.on)return;window._cr.on=false;
  const m=parseFloat(document.getElementById('crN').textContent),w=Math.floor(window._cr.bet*m);
  addBal(w,'Crash '+m.toFixed(2)+'×');
  document.getElementById('crC').classList.add('hidden');document.getElementById('crS').classList.remove('hidden');
  document.getElementById('crR').innerHTML=`<div class="gm-result win">🎉 ${m.toFixed(2)}× — ${fmtCZK(w)}</div>`;recGame(true,w);
}

// ═══ 5. MINES ═══
function gm_mines(b){
  b.innerHTML=betH()+`<div class="mines-grid" id="mG"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
      <span class="mono" style="font-size:.85rem;color:var(--t2)" id="mM">1.00×</span>
      <button class="bet-btn hidden" id="mC" onclick="gm_m_cash()">Cashout</button>
    </div>
    <button class="play-btn mt1" id="mS" onclick="gm_m_start()">Začít</button><div id="mR"></div>`;
}
function gm_m_start(){
  const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Miny');
  document.getElementById('mS').classList.add('hidden');document.getElementById('mC').classList.remove('hidden');document.getElementById('mR').innerHTML='';
  const mines=new Set();while(mines.size<5)mines.add(Math.floor(Math.random()*25));
  window._mn={bet,mines,rev:new Set(),mul:1,on:true};
  document.getElementById('mG').innerHTML=Array.from({length:25},(_,i)=>`<div class="mines-cell" data-i="${i}" onclick="gm_m_click(${i})"></div>`).join('');
  document.getElementById('mM').textContent='1.00×';
}
function gm_m_click(i){
  const g=window._mn;if(!g||!g.on||g.rev.has(i))return;g.rev.add(i);
  const c=document.querySelector(`.mines-cell[data-i="${i}"]`);
  if(g.mines.has(i)){c.classList.add('boom');c.textContent='💣';g.on=false;
    g.mines.forEach(m=>{const x=document.querySelector(`.mines-cell[data-i="${m}"]`);x.classList.add('boom');x.textContent='💣'});
    document.getElementById('mC').classList.add('hidden');document.getElementById('mS').classList.remove('hidden');document.getElementById('mS').textContent='Hrát znovu';
    document.getElementById('mR').innerHTML=`<div class="gm-result lose">💥 Boom!</div>`;recGame(false,0);
  }else{c.classList.add('safe');c.textContent='💎';g.mul+=.25;document.getElementById('mM').textContent=g.mul.toFixed(2)+'×'}
}
function gm_m_cash(){
  const g=window._mn;if(!g||!g.on)return;g.on=false;
  const w=Math.floor(g.bet*g.mul);addBal(w,'Miny '+g.mul.toFixed(2)+'×');
  document.getElementById('mC').classList.add('hidden');document.getElementById('mS').classList.remove('hidden');document.getElementById('mS').textContent='Hrát znovu';
  document.getElementById('mR').innerHTML=`<div class="gm-result win">🎉 ${g.mul.toFixed(2)}× — ${fmtCZK(w)}</div>`;recGame(true,w);
}

// ═══ 6. DICE ═══
function gm_dice(b){
  b.innerHTML=betH()+`<div class="bet-section"><div class="bet-label">Cíl</div>
    <input type="range" class="dice-slider" id="dS" min="5" max="95" value="50" oninput="dUpd()">
    <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:.82rem;color:var(--t2);margin-top:6px">
      <span>Cíl: <span id="dT">50</span></span><span>Multi: <span id="dMul">1.96×</span></span>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
      <button class="bet-btn" id="dU" onclick="window._dM='under';dUpd()" style="color:var(--acc)">Pod ↓</button>
      <button class="bet-btn" id="dO" onclick="window._dM='over';dUpd()">Nad ↑</button>
    </div></div>
  <button class="play-btn" onclick="gm_dice_go()">Hodit</button>
  <div class="dice-num" id="dN"></div><div id="dR"></div>`;
  window._dM='under';dUpd();
}
function dUpd(){
  const t=parseInt(document.getElementById('dS').value),m=window._dM||'under';
  document.getElementById('dT').textContent=t;
  const ch=m==='under'?t:(100-t),mul=ch>0?(98/ch):0;
  document.getElementById('dMul').textContent=mul.toFixed(2)+'×';
  document.getElementById('dU').style.color=m==='under'?'var(--acc)':'var(--t2)';
  document.getElementById('dO').style.color=m==='over'?'var(--acc)':'var(--t2)';
}
function gm_dice_go(){
  const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Kostky');
  const t=parseInt(document.getElementById('dS').value),m=window._dM||'under',ch=m==='under'?t:(100-t),mul=98/ch;
  const roll=(Math.random()*100).toFixed(2);
  document.getElementById('dN').textContent=roll;
  const won=m==='under'?parseFloat(roll)<t:parseFloat(roll)>t;
  document.getElementById('dN').style.color=won?'var(--grn)':'var(--red)';
  if(won){const w=Math.floor(bet*mul);addBal(w,'Kostky '+mul.toFixed(2)+'×');document.getElementById('dR').innerHTML=`<div class="gm-result win">🎉 ${fmtCZK(w)}</div>`;recGame(true,w)}
  else{document.getElementById('dR').innerHTML=`<div class="gm-result lose">Prohra</div>`;recGame(false,0)}
}

// ═══ 7. WHEEL ═══
function gm_wheel(b){
  const sg=['0×','0.5×','1×','1.5×','2×','0×','3×','5×'];
  b.innerHTML=betH()+`<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:16px 0" id="wSeg">
    ${sg.map((s,i)=>`<div style="padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:8px;font-family:var(--font-mono);font-weight:600;font-size:.82rem;transition:all .15s" id="ws${i}">${s}</div>`).join('')}
  </div><button class="play-btn" id="wBtn" onclick="gm_w_go()">Zatočit</button><div id="wR"></div>`;
  window._wS=sg;
}
function gm_w_go(){
  const bet=gBet();if(!chkBal(bet))return;document.getElementById('wBtn').disabled=true;addBal(-bet,'Kolo');
  const sg=window._wS,win=Math.floor(Math.random()*sg.length);
  let cur=0,rnd=0;const mx=sg.length*4+win;
  const iv=setInterval(()=>{
    for(let i=0;i<sg.length;i++){const e=document.getElementById('ws'+i);
      e.style.background=i===(cur%sg.length)?'rgba(var(--accR),var(--accG),var(--accB),.12)':'rgba(255,255,255,.03)';
      e.style.color=i===(cur%sg.length)?'var(--acc)':'var(--t1)';
      e.style.transform=i===(cur%sg.length)?'scale(1.08)':'scale(1)';
    }cur++;rnd++;
    if(rnd>=mx){clearInterval(iv);
      const mul=parseFloat(sg[win]),r=document.getElementById('wR');
      if(mul>0){const w=Math.floor(bet*mul);addBal(w,'Kolo '+sg[win]);r.innerHTML=`<div class="gm-result ${mul>=1?'win':'lose'}">${sg[win]} — ${fmtCZK(w)}</div>`;recGame(mul>=1,w)}
      else{r.innerHTML=`<div class="gm-result lose">0× — Prohra</div>`;recGame(false,0)}
      document.getElementById('wBtn').disabled=false;
    }
  },rnd>mx-8?180:70);
}

// ═══ 8. COIN FLIP ═══
function gm_coinflip(b){
  b.innerHTML=betH()+`<div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px">
    <button class="bet-btn" id="cfH" onclick="window._cf='heads';document.getElementById('cfH').style.color='var(--acc)';document.getElementById('cfT').style.color='var(--t2)'" style="color:var(--acc);padding:12px 24px;font-size:.92rem">👑 Orel</button>
    <button class="bet-btn" id="cfT" onclick="window._cf='tails';document.getElementById('cfT').style.color='var(--acc)';document.getElementById('cfH').style.color='var(--t2)'" style="padding:12px 24px;font-size:.92rem">🌙 Panna</button>
  </div><div class="coin" id="cfC">?</div>
  <button class="play-btn" onclick="gm_cf_go()">Hodit mincí</button><div id="cfR"></div>`;
  window._cf='heads';
}
function gm_cf_go(){
  const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Coin Flip');
  const res=Math.random()<.5?'heads':'tails',c=document.getElementById('cfC');
  c.classList.add('flip');
  setTimeout(()=>{c.classList.remove('flip');c.textContent=res==='heads'?'👑':'🌙';
    const won=window._cf===res;
    if(won){addBal(bet*2,'Coin Flip');document.getElementById('cfR').innerHTML=`<div class="gm-result win">🎉 ${fmtCZK(bet*2)}</div>`;recGame(true,bet*2)}
    else{document.getElementById('cfR').innerHTML=`<div class="gm-result lose">Prohra</div>`;recGame(false,0)}
  },650);
}

// ═══ 9. HI-LO ═══
function gm_hilo(b){
  b.innerHTML=betH()+`<button class="play-btn mb2" id="hlS" onclick="gm_hl_start()">Začít</button>
    <div id="hlG" class="hidden"><div class="tc mono mb1" id="hlM" style="font-size:1.1rem;color:var(--acc)">1.00×</div>
    <div class="hilo-card" id="hlC">?</div>
    <div style="display:flex;gap:10px;justify-content:center;margin:14px 0" id="hlA">
      <button class="bet-btn" style="background:rgba(0,230,118,.08);color:var(--grn);padding:12px 28px" onclick="gm_hl_guess('hi')">↑ Vyšší</button>
      <button class="bet-btn" style="background:rgba(255,64,96,.08);color:var(--red);padding:12px 28px" onclick="gm_hl_guess('lo')">↓ Nižší</button>
    </div>
    <button class="bet-btn mt1" id="hlCO" onclick="gm_hl_cash()" style="width:100%;padding:10px">Cashout</button>
    </div><div id="hlR"></div>`;
}
function hlV(){const vs=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],su=['♠','♥','♦','♣'],vi=Math.floor(Math.random()*13),s=su[Math.floor(Math.random()*4)];return{str:vs[vi]+s,n:vi+1,red:s==='♥'||s==='♦'}}
function gm_hl_start(){const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Hi-Lo');
  document.getElementById('hlS').classList.add('hidden');document.getElementById('hlG').classList.remove('hidden');document.getElementById('hlR').innerHTML='';
  const c=hlV();window._hl={bet,cur:c,mul:1,on:true};
  document.getElementById('hlC').textContent=c.str;document.getElementById('hlC').className='hilo-card'+(c.red?' red':'');document.getElementById('hlM').textContent='1.00×';
}
function gm_hl_guess(d){const g=window._hl;if(!g||!g.on)return;const nx=hlV();
  const won=(d==='hi'&&nx.n>=g.cur.n)||(d==='lo'&&nx.n<=g.cur.n);
  g.cur=nx;document.getElementById('hlC').textContent=nx.str;document.getElementById('hlC').className='hilo-card'+(nx.red?' red':'');
  if(won){g.mul+=.5;document.getElementById('hlM').textContent=g.mul.toFixed(2)+'×'}
  else{g.on=false;document.getElementById('hlG').classList.add('hidden');document.getElementById('hlS').classList.remove('hidden');document.getElementById('hlS').textContent='Hrát znovu';
    document.getElementById('hlR').innerHTML=`<div class="gm-result lose">Špatný tip!</div>`;recGame(false,0)}
}
function gm_hl_cash(){const g=window._hl;if(!g||!g.on)return;g.on=false;const w=Math.floor(g.bet*g.mul);addBal(w,'Hi-Lo '+g.mul.toFixed(2)+'×');
  document.getElementById('hlG').classList.add('hidden');document.getElementById('hlS').classList.remove('hidden');document.getElementById('hlS').textContent='Hrát znovu';
  document.getElementById('hlR').innerHTML=`<div class="gm-result win">🎉 ${g.mul.toFixed(2)}× — ${fmtCZK(w)}</div>`;recGame(true,w)}

// ═══ 10. KENO ═══
function gm_keno(b){
  b.innerHTML=betH()+`<div style="font-size:.78rem;color:var(--t3);margin-bottom:8px">Vyber 1–10 čísel</div>
    <div class="keno-grid" id="kG">${Array.from({length:40},(_,i)=>`<div class="keno-num" onclick="gm_k_pick(${i+1},this)">${i+1}</div>`).join('')}</div>
    <div class="tc mono mt1 mb1" style="font-size:.82rem;color:var(--t2)">Vybráno: <span id="kC">0</span>/10</div>
    <button class="play-btn" onclick="gm_k_draw()">Losovat</button><div id="kR"></div>`;
  window._kP=new Set();
}
function gm_k_pick(n,el){const s=window._kP;if(s.has(n)){s.delete(n);el.classList.remove('picked')}else if(s.size<10){s.add(n);el.classList.add('picked')}document.getElementById('kC').textContent=s.size}
function gm_k_draw(){
  const pk=window._kP;if(pk.size<1){toast('Vyber číslo!','error');return}
  const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Keno');
  const drawn=new Set();while(drawn.size<10)drawn.add(Math.floor(Math.random()*40)+1);
  document.querySelectorAll('.keno-num').forEach(el=>{const n=parseInt(el.textContent);el.classList.remove('hit','miss');if(drawn.has(n)&&pk.has(n))el.classList.add('hit');else if(drawn.has(n))el.classList.add('miss')});
  const hits=[...pk].filter(n=>drawn.has(n)).length;
  const muls={0:0,1:.5,2:1,3:2,4:5,5:10,6:25,7:50,8:100,9:250,10:500};
  const mul=muls[Math.min(hits,10)]||0;
  if(mul>0){const w=Math.floor(bet*mul);addBal(w,'Keno '+hits+' tref');document.getElementById('kR').innerHTML=`<div class="gm-result win">🎉 ${hits} tref — ${fmtCZK(w)}</div>`;recGame(true,w)}
  else{document.getElementById('kR').innerHTML=`<div class="gm-result lose">${hits} tref — Prohra</div>`;recGame(false,0)}
  window._kP=new Set();
}

// ═══ 11. PLINKO ═══
function gm_plinko(b){
  const ml=['0.3×','0.5×','1×','1.5×','2×','3×','2×','1.5×','1×','0.5×','0.3×'];
  b.innerHTML=betH()+`<div class="tc"><div style="font-size:2.5rem;margin:16px 0" id="pB">⚡</div>
    <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">${ml.map((m,i)=>`<div style="padding:6px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:8px;font-family:var(--font-mono);font-size:.78rem;font-weight:600;transition:all .15s" id="ps${i}">${m}</div>`).join('')}</div></div>
    <button class="play-btn mt2" onclick="gm_pl_go()">Hodit</button><div id="pR"></div>`;
  window._pM=ml;
}
function gm_pl_go(){
  const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Plinko');
  const ml=window._pM;let pos=5;for(let i=0;i<10;i++)pos+=Math.random()<.5?-.5:.5;
  const slot=Math.max(0,Math.min(10,Math.round(pos)));
  let st=0;const iv=setInterval(()=>{document.getElementById('pB').textContent=['⚡','💫','✨','⭐'][st%4];st++;
    if(st>12){clearInterval(iv);document.getElementById('pB').textContent='⚡';
      for(let i=0;i<ml.length;i++)document.getElementById('ps'+i).style.background=i===slot?'rgba(var(--accR),var(--accG),var(--accB),.12)':'rgba(255,255,255,.03)';
      const mul=parseFloat(ml[slot]),w=Math.floor(bet*mul);
      if(w>0){addBal(w,'Plinko '+ml[slot]);document.getElementById('pR').innerHTML=`<div class="gm-result ${mul>=1?'win':'lose'}">${ml[slot]} — ${fmtCZK(w)}</div>`;recGame(mul>=1,w)}
      else{document.getElementById('pR').innerHTML=`<div class="gm-result lose">0×</div>`;recGame(false,0)}
    }
  },100);
}

// ═══ 12. SCRATCH ═══
function gm_scratch(b){
  b.innerHTML=betH()+`<button class="play-btn mb2" id="scS" onclick="gm_sc_start()">Nový los</button>
    <div class="scratch-grid" id="scG"></div><div id="scR"></div>`;
}
function gm_sc_start(){const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Stírací los');document.getElementById('scR').innerHTML='';
  const sy=['🍒','💎','⭐','7️⃣','🍀','👑'],gr=Array.from({length:9},()=>sy[Math.floor(Math.random()*sy.length)]);
  window._sc={bet,gr,rv:new Set(),done:false};
  document.getElementById('scG').innerHTML=gr.map((_,i)=>`<div class="scratch-cell" onclick="gm_sc_rev(${i})" data-i="${i}">❓</div>`).join('');
}
function gm_sc_rev(i){const g=window._sc;if(!g||g.done||g.rv.has(i))return;g.rv.add(i);
  const c=document.querySelector(`.scratch-cell[data-i="${i}"]`);c.textContent=g.gr[i];c.classList.add('rev');
  if(g.rv.size===9){g.done=true;const cnt={};g.gr.forEach(s=>cnt[s]=(cnt[s]||0)+1);const mx=Math.max(...Object.values(cnt)),ws=Object.keys(cnt).find(k=>cnt[k]===mx);
    let mul=0;if(mx>=3)mul=2;if(mx>=4)mul=5;if(mx>=5)mul=15;
    if(mul>0){g.gr.forEach((s,j)=>{if(s===ws)document.querySelector(`.scratch-cell[data-i="${j}"]`).classList.add('won')});
      const w=Math.floor(g.bet*mul);addBal(w,'Stírací los '+mx+'×');document.getElementById('scR').innerHTML=`<div class="gm-result win">🎉 ${mx}× ${ws} — ${fmtCZK(w)}</div>`;recGame(true,w)}
    else{document.getElementById('scR').innerHTML=`<div class="gm-result lose">Žádná trojice</div>`;recGame(false,0)}
  }
}

// ═══ 13. BACCARAT ═══
function gm_baccarat(b){
  b.innerHTML=betH()+`<div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
    <button class="bet-btn" id="baP" onclick="window._baB='player';baUpd()" style="padding:12px 20px;color:var(--acc)">Hráč 2×</button>
    <button class="bet-btn" id="baT" onclick="window._baB='tie';baUpd()" style="padding:12px 20px">Remíza 8×</button>
    <button class="bet-btn" id="baB" onclick="window._baB='banker';baUpd()" style="padding:12px 20px">Bankéř 1.95×</button>
  </div><button class="play-btn" onclick="gm_ba_go()">Hrát</button><div id="baH" class="mt2"></div><div id="baR"></div>`;
  window._baB='player';baUpd();
}
function baUpd(){const b=window._baB;const m={player:'baP',tie:'baT',banker:'baB'};Object.entries(m).forEach(([k,id])=>{const e=document.getElementById(id);e.style.color=k===b?'var(--acc)':'var(--t2)';e.style.background=k===b?'rgba(var(--accR),var(--accG),var(--accB),.08)':'rgba(255,255,255,.03)'})}
function gm_ba_go(){const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Baccarat');
  const cd=()=>Math.floor(Math.random()*13)+1,vl=c=>c>=10?0:c;
  const pc=[cd(),cd()],bc=[cd(),cd()];
  let ps=(vl(pc[0])+vl(pc[1]))%10,bs=(vl(bc[0])+vl(bc[1]))%10;
  if(ps<=5){pc.push(cd());ps=pc.reduce((a,c)=>a+vl(c),0)%10}
  if(bs<=5){bc.push(cd());bs=bc.reduce((a,c)=>a+vl(c),0)%10}
  document.getElementById('baH').innerHTML=`<div class="tc mb1"><span style="color:var(--t3)">Hráč:</span> <span class="mono" style="font-size:1.2rem;font-weight:700">${ps}</span></div>
    <div class="tc"><span style="color:var(--t3)">Bankéř:</span> <span class="mono" style="font-size:1.2rem;font-weight:700">${bs}</span></div>`;
  const winner=ps>bs?'player':bs>ps?'banker':'tie';const b=window._baB;const muls={player:2,banker:1.95,tie:8};
  if(b===winner){const w=Math.floor(bet*muls[b]);addBal(w,'Baccarat');document.getElementById('baR').innerHTML=`<div class="gm-result win">🎉 ${fmtCZK(w)}</div>`;recGame(true,w)}
  else{document.getElementById('baR').innerHTML=`<div class="gm-result lose">Prohra</div>`;recGame(false,0)}
}

// ═══ 14. LIMBO ═══
function gm_limbo(b){
  b.innerHTML=betH()+`<div class="bet-section"><div class="bet-label">Cílový multiplikátor</div>
    <input type="number" class="bet-input" id="lT" value="2" min="1.01" step="0.1"></div>
    <button class="play-btn" onclick="gm_lm_go()">Hrát</button>
    <div class="tc mt2"><div class="mono" style="font-size:2.8rem;font-weight:700" id="lN">?</div></div><div id="lR"></div>`;
}
function gm_lm_go(){const bet=gBet();if(!chkBal(bet))return;const t=parseFloat(document.getElementById('lT').value)||2;
  if(t<1.01){toast('Min. 1.01×','error');return}addBal(-bet,'Limbo');
  const res=1/(1-Math.random()*.99);document.getElementById('lN').textContent=res.toFixed(2)+'×';
  const won=res>=t;document.getElementById('lN').style.color=won?'var(--grn)':'var(--red)';
  if(won){const w=Math.floor(bet*t);addBal(w,'Limbo '+t+'×');document.getElementById('lR').innerHTML=`<div class="gm-result win">🎉 ${fmtCZK(w)}</div>`;recGame(true,w)}
  else{document.getElementById('lR').innerHTML=`<div class="gm-result lose">${res.toFixed(2)}× < ${t}×</div>`;recGame(false,0)}
}

// ═══ 15. TOWERS ═══
function gm_towers(b){
  b.innerHTML=betH()+`<button class="play-btn mb2" id="twS" onclick="gm_tw_start()">Začít</button>
    <div class="towers-grid" id="twG"></div>
    <div style="display:flex;justify-content:space-between;margin-top:8px">
      <span class="mono" style="font-size:.85rem;color:var(--t2)" id="twM">1.00×</span>
      <button class="bet-btn hidden" id="twC" onclick="gm_tw_cash()">Cashout</button>
    </div><div id="twR"></div>`;
}
function gm_tw_start(){const bet=gBet();if(!chkBal(bet))return;addBal(-bet,'Věže');
  document.getElementById('twS').classList.add('hidden');document.getElementById('twC').classList.remove('hidden');document.getElementById('twR').innerHTML='';
  const fl=8,traps=Array.from({length:fl},()=>Math.floor(Math.random()*3));
  window._tw={bet,traps,floor:0,mul:1,on:true,fl};
  let h='';for(let f=fl-1;f>=0;f--){h+=`<div class="towers-row" id="tr${f}">`;for(let c=0;c<3;c++)h+=`<div class="towers-cell" onclick="gm_tw_click(${f},${c})" data-f="${f}" data-c="${c}"></div>`;h+='</div>'}
  document.getElementById('twG').innerHTML=h;document.getElementById('twM').textContent='1.00×';
  for(let f=1;f<fl;f++)document.getElementById('tr'+f).style.opacity='.35';
}
function gm_tw_click(f,c){const g=window._tw;if(!g||!g.on||f!==g.floor)return;
  const cell=document.querySelector(`.towers-cell[data-f="${f}"][data-c="${c}"]`);
  if(g.traps[f]===c){cell.classList.add('trap');cell.textContent='💀';g.on=false;
    g.traps.forEach((t,fi)=>{const x=document.querySelector(`.towers-cell[data-f="${fi}"][data-c="${t}"]`);x.classList.add('trap');x.textContent='💀'});
    document.getElementById('twC').classList.add('hidden');document.getElementById('twS').classList.remove('hidden');document.getElementById('twS').textContent='Hrát znovu';
    document.getElementById('twR').innerHTML=`<div class="gm-result lose">💀 Past!</div>`;recGame(false,0);
  }else{cell.classList.add('safe');cell.textContent='✅';g.floor++;g.mul+=.4;document.getElementById('twM').textContent=g.mul.toFixed(2)+'×';
    if(g.floor<g.fl)document.getElementById('tr'+g.floor).style.opacity='1';
    if(g.floor>=g.fl)gm_tw_cash();
  }
}
function gm_tw_cash(){const g=window._tw;if(!g||!g.on)return;g.on=false;const w=Math.floor(g.bet*g.mul);addBal(w,'Věže '+g.mul.toFixed(2)+'×');
  document.getElementById('twC').classList.add('hidden');document.getElementById('twS').classList.remove('hidden');document.getElementById('twS').textContent='Hrát znovu';
  document.getElementById('twR').innerHTML=`<div class="gm-result win">🎉 ${g.mul.toFixed(2)}× — ${fmtCZK(w)}</div>`;recGame(true,w)}
