/* ═══════════════════════════════════════════
   UvalyBet.cz — trading.js
   Stocks (12) + Crypto (10)
   ═══════════════════════════════════════════ */

const STOCKS=[
  {sym:'AAPL',name:'Apple',base:178},{sym:'MSFT',name:'Microsoft',base:415},
  {sym:'TSLA',name:'Tesla',base:245},{sym:'NVDA',name:'NVIDIA',base:880},
  {sym:'META',name:'Meta',base:510},{sym:'AMZN',name:'Amazon',base:185},
  {sym:'NFLX',name:'Netflix',base:620},{sym:'CEZ',name:'ČEZ',base:1050},
  {sym:'AMD',name:'AMD',base:165},{sym:'GOOGL',name:'Alphabet',base:155},
  {sym:'DIS',name:'Disney',base:112},{sym:'SPY',name:'S&P 500 ETF',base:520}
];
const CRYPTOS=[
  {sym:'BTC',name:'Bitcoin',base:67500,icon:'🟠',clr:'#f7931a'},
  {sym:'ETH',name:'Ethereum',base:3550,icon:'🔷',clr:'#627eea'},
  {sym:'SOL',name:'Solana',base:148,icon:'🟣',clr:'#9945ff'},
  {sym:'BNB',name:'BNB',base:605,icon:'🟡',clr:'#f3ba2f'},
  {sym:'XRP',name:'XRP',base:0.62,icon:'⚪',clr:'#00aae4'},
  {sym:'ADA',name:'Cardano',base:0.45,icon:'🔵',clr:'#0033ad'},
  {sym:'DOGE',name:'Dogecoin',base:0.165,icon:'🐕',clr:'#c2a633'},
  {sym:'DOT',name:'Polkadot',base:7.2,icon:'🔴',clr:'#e6007a'},
  {sym:'AVAX',name:'Avalanche',base:36,icon:'🔺',clr:'#e84142'},
  {sym:'MATIC',name:'Polygon',base:0.72,icon:'🟪',clr:'#8247e5'}
];

let sP={},cP={},sH={},cH={},tIV=null;

function initStocks(){
  STOCKS.forEach(s=>{sP[s.sym]=s.base;sH[s.sym]=Array.from({length:50},()=>s.base+(Math.random()-.5)*s.base*.03)});
  renderStocks();startPriceLoop();
}
function initCrypto(){
  CRYPTOS.forEach(c=>{cP[c.sym]=c.base;cH[c.sym]=Array.from({length:50},()=>c.base+(Math.random()-.5)*c.base*.04)});
  renderCrypto();
}
function startPriceLoop(){
  if(tIV)clearInterval(tIV);
  tIV=setInterval(()=>{
    STOCKS.forEach(s=>{sP[s.sym]*=(1+(Math.random()-.5)*.03);sH[s.sym].push(sP[s.sym]);if(sH[s.sym].length>50)sH[s.sym].shift()});
    CRYPTOS.forEach(c=>{cP[c.sym]*=(1+(Math.random()-.5)*.04);cH[c.sym].push(cP[c.sym]);if(cH[c.sym].length>50)cH[c.sym].shift()});
    if(document.getElementById('pgStocks').classList.contains('on')){updStockPrices();renderStockPF()}
    if(document.getElementById('pgCrypto').classList.contains('on')){updCryptoPrices();renderCryptoPF()}
  },3000);
}

function renderStocks(){
  document.getElementById('stocksGrid').innerHTML=STOCKS.map(s=>{
    const p=sP[s.sym],h=sH[s.sym],fp=h[0]||p,pct=((p-fp)/fp*100);
    return`<div class="glass-card stock-card" id="sc_${s.sym}">
      <div class="stock-head"><div><div class="stock-sym">${s.sym}</div><div class="stock-name">${s.name}</div></div>
      <div style="text-align:right"><div class="stock-price" id="sp_${s.sym}">$${p.toFixed(2)}</div>
      <div class="stock-chg ${pct>=0?'up':'dn'}" id="sch_${s.sym}">${pct>=0?'+':''}${pct.toFixed(2)}%</div></div></div>
      <div class="stock-chart"><canvas id="ch_${s.sym}" height="48"></canvas></div>
      <div class="stock-actions"><input type="number" value="1" min="1" id="sq_${s.sym}" placeholder="Ks">
        <button class="btn-buy" onclick="buyS('${s.sym}')">Koupit</button>
        <button class="btn-sell" onclick="sellS('${s.sym}')">Prodat</button></div></div>`;
  }).join('');
  STOCKS.forEach(s=>miniChart('ch_'+s.sym,sH[s.sym]));
}
function updStockPrices(){
  STOCKS.forEach(s=>{const p=sP[s.sym],h=sH[s.sym],fp=h[0]||p,pct=((p-fp)/fp*100);
    const pe=document.getElementById('sp_'+s.sym),ce=document.getElementById('sch_'+s.sym);
    if(pe)pe.textContent='$'+p.toFixed(2);
    if(ce){ce.textContent=(pct>=0?'+':'')+pct.toFixed(2)+'%';ce.className='stock-chg '+(pct>=0?'up':'dn')}
    miniChart('ch_'+s.sym,h);
  });
}
function buyS(sym){
  const qty=parseInt(document.getElementById('sq_'+sym).value)||1,p=sP[sym],cost=Math.floor(p*qty*25);
  const u=getUser();if(!u||u.balance<cost){toast('Nedostatek!','error');return}
  addBal(-cost,'Koupě '+qty+'× '+sym);
  if(!u.portfolio)u.portfolio={};if(!u.portfolio[sym])u.portfolio[sym]={qty:0,avgPrice:0};
  const pf=u.portfolio[sym],tc=pf.avgPrice*pf.qty+p*qty;pf.qty+=qty;pf.avgPrice=tc/pf.qty;
  saveUser(u);toast('Koupeno '+qty+'× '+sym,'success');renderStockPF();
}
function sellS(sym){
  const u=getUser();if(!u||!u.portfolio||!u.portfolio[sym]||u.portfolio[sym].qty<=0){toast('Žádné akcie!','error');return}
  const qty=Math.min(parseInt(document.getElementById('sq_'+sym).value)||1,u.portfolio[sym].qty);
  const rev=Math.floor(sP[sym]*qty*25);addBal(rev,'Prodej '+qty+'× '+sym);
  u.portfolio[sym].qty-=qty;if(u.portfolio[sym].qty<=0)delete u.portfolio[sym];
  saveUser(u);toast('Prodáno '+qty+'× '+sym,'success');renderStockPF();
}
function renderStockPF(){
  const u=getUser(),el=document.getElementById('stockPF');
  if(!u||!u.portfolio||!Object.keys(u.portfolio).length){el.innerHTML='<div class="mt3 tc" style="color:var(--t3)">Prázdné portfolio</div>';return}
  let h='<h3>Tvoje portfolio</h3><table class="pf-table"><tr><th>Symbol</th><th>Ks</th><th>Avg</th><th>Nyní</th><th>P&L</th></tr>';
  Object.entries(u.portfolio).forEach(([sym,pf])=>{const cp=sP[sym]||0,pnl=Math.floor((cp-pf.avgPrice)*pf.qty*25);
    h+=`<tr><td class="mono" style="font-weight:700">${sym}</td><td>${pf.qty}</td><td class="mono">$${pf.avgPrice.toFixed(2)}</td><td class="mono">$${cp.toFixed(2)}</td><td class="${pnl>=0?'pnl-pos':'pnl-neg'}">${pnl>=0?'+':''}${fmtCZK(pnl)}</td></tr>`});
  h+='</table>';el.innerHTML=h;
}

function renderCrypto(){
  document.getElementById('cryptoGrid').innerHTML=CRYPTOS.map(c=>{
    const p=cP[c.sym],h=cH[c.sym],fp=h[0]||p,pct=((p-fp)/fp*100);
    return`<div class="glass-card crypto-card" id="cc_${c.sym}">
      <div class="stock-head"><div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:1.3rem">${c.icon}</span>
        <div><div class="stock-sym">${c.sym}</div><div class="stock-name">${c.name}</div></div></div>
      <div style="text-align:right"><div class="stock-price" id="cp_${c.sym}">$${p<1?p.toFixed(4):p.toFixed(2)}</div>
      <div class="stock-chg ${pct>=0?'up':'dn'}" id="cch_${c.sym}">${pct>=0?'+':''}${pct.toFixed(2)}%</div></div></div>
      <div class="stock-chart"><canvas id="cch${c.sym}" height="48"></canvas></div>
      <div class="stock-actions"><input type="number" value="1" min="0.01" step="0.01" id="cq_${c.sym}" placeholder="Ks">
        <button class="btn-buy" onclick="buyC('${c.sym}')">Koupit</button>
        <button class="btn-sell" onclick="sellC('${c.sym}')">Prodat</button></div></div>`;
  }).join('');
  CRYPTOS.forEach(c=>miniChart('cch'+c.sym,cH[c.sym],c.clr));
}
function updCryptoPrices(){
  CRYPTOS.forEach(c=>{const p=cP[c.sym],h=cH[c.sym],fp=h[0]||p,pct=((p-fp)/fp*100);
    const pe=document.getElementById('cp_'+c.sym),ce=document.getElementById('cch_'+c.sym);
    if(pe)pe.textContent='$'+(p<1?p.toFixed(4):p.toFixed(2));
    if(ce){ce.textContent=(pct>=0?'+':'')+pct.toFixed(2)+'%';ce.className='stock-chg '+(pct>=0?'up':'dn')}
    miniChart('cch'+c.sym,h,c.clr);
  });
}
function buyC(sym){
  const qty=parseFloat(document.getElementById('cq_'+sym).value)||1,p=cP[sym],cost=Math.floor(p*qty*25);
  const u=getUser();if(!u||u.balance<cost){toast('Nedostatek!','error');return}
  addBal(-cost,'Koupě '+qty+'× '+sym);
  if(!u.cPortfolio)u.cPortfolio={};if(!u.cPortfolio[sym])u.cPortfolio[sym]={qty:0,avgPrice:0};
  const pf=u.cPortfolio[sym],tc=pf.avgPrice*pf.qty+p*qty;pf.qty+=qty;pf.avgPrice=tc/pf.qty;
  saveUser(u);toast('Koupeno '+qty+'× '+sym,'success');renderCryptoPF();
}
function sellC(sym){
  const u=getUser();if(!u||!u.cPortfolio||!u.cPortfolio[sym]||u.cPortfolio[sym].qty<=0){toast('Žádné coiny!','error');return}
  const qty=Math.min(parseFloat(document.getElementById('cq_'+sym).value)||1,u.cPortfolio[sym].qty);
  const rev=Math.floor(cP[sym]*qty*25);addBal(rev,'Prodej '+qty+'× '+sym);
  u.cPortfolio[sym].qty-=qty;if(u.cPortfolio[sym].qty<=0)delete u.cPortfolio[sym];
  saveUser(u);toast('Prodáno','success');renderCryptoPF();
}
function renderCryptoPF(){
  const u=getUser(),el=document.getElementById('cryptoPF');
  if(!u||!u.cPortfolio||!Object.keys(u.cPortfolio).length){el.innerHTML='<div class="mt3 tc" style="color:var(--t3)">Prázdné portfolio</div>';return}
  let h='<h3>Crypto portfolio</h3><table class="pf-table"><tr><th>Coin</th><th>Ks</th><th>Avg</th><th>Nyní</th><th>P&L</th></tr>';
  Object.entries(u.cPortfolio).forEach(([sym,pf])=>{const cp=cP[sym]||0,pnl=Math.floor((cp-pf.avgPrice)*pf.qty*25);
    h+=`<tr><td class="mono" style="font-weight:700">${sym}</td><td>${pf.qty<1?pf.qty.toFixed(4):pf.qty}</td><td class="mono">$${pf.avgPrice<1?pf.avgPrice.toFixed(4):pf.avgPrice.toFixed(2)}</td><td class="mono">$${cp<1?cp.toFixed(4):cp.toFixed(2)}</td><td class="${pnl>=0?'pnl-pos':'pnl-neg'}">${pnl>=0?'+':''}${fmtCZK(pnl)}</td></tr>`});
  h+='</table>';el.innerHTML=h;
}

function miniChart(id,data,color){
  const cv=document.getElementById(id);if(!cv)return;const ctx=cv.getContext('2d');
  const w=cv.parentElement.clientWidth;cv.width=w;cv.height=48;
  ctx.clearRect(0,0,w,48);if(data.length<2)return;
  const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
  const up=data[data.length-1]>=data[0];
  const sc=color||(up?'#00e676':'#ff4060');
  ctx.beginPath();ctx.strokeStyle=sc;ctx.lineWidth=1.5;
  data.forEach((d,i)=>{const x=(i/(data.length-1))*w,y=48-((d-mn)/rng)*43-2;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});
  ctx.stroke();
  const gd=ctx.createLinearGradient(0,0,0,48);gd.addColorStop(0,sc+'25');gd.addColorStop(1,sc+'00');
  ctx.lineTo(w,48);ctx.lineTo(0,48);ctx.closePath();ctx.fillStyle=gd;ctx.fill();
}
