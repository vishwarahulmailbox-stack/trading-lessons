/* Trader's Notebook : diagram and chart engine (plain SVG, no libraries) */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const COL={up:'var(--up)',down:'var(--down)',acc:'var(--accent)',blue:'var(--blue)',pur:'var(--purple)',teal:'var(--teal)',ink:'var(--ink)',ink2:'var(--ink2)',mut:'var(--muted)',line:'var(--line)',panel:'var(--panel)',panel2:'var(--panel2)',bg:'var(--bg)'};
const c=k=>COL[k]||k;
const STY={fill:1,stroke:1,opacity:1,'fill-opacity':1,'stroke-opacity':1};
function S(tag,a,parent){const e=document.createElementNS(NS,tag);if(a)for(const k in a){const v=a[k];if(v==null)continue;if(k==='text'){e.textContent=v;continue;}if(STY[k])e.style.setProperty(k,(k==='fill'||k==='stroke')?c(v):v);else e.setAttribute(k,v);}if(parent)parent.appendChild(e);return e;}
function H(tag,a,parent,html){const e=document.createElement(tag);if(a)for(const k in a){if(k==='class')e.className=a[k];else e.setAttribute(k,a[k]);}if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e;}
function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function walk(closes,seed,o){o=o||{};const r=rng(seed||7);let prev=o.open!=null?o.open:closes[0];const wk=o.wick!=null?o.wick:2;return closes.map(cl=>{const op=prev;const hi=Math.max(op,cl)+r()*wk+0.2;const lo=Math.min(op,cl)-r()*wk-0.2;prev=cl;return[op,hi,lo,cl];});}
function svgBox(host,w,h,label){return S('svg',{viewBox:`0 0 ${w} ${h}`,class:'dg',role:'img','aria-label':label||'diagram'},host);}
function tlines(parent,x,y,lines,o){o=o||{};const t=S('text',{x,y,'text-anchor':o.anchor||'middle',fill:o.color||'ink2',class:'lbl'+(o.cls?' '+o.cls:'')},parent);lines.forEach((ln,k)=>S('tspan',{x,dy:k?(o.lh||17):0,text:ln},t));return t;}
let uid=0;

class Plot{
  constructor(host,o){o=o||{};this.w=o.w||720;this.h=o.h||340;this.pad=Object.assign({l:14,r:14,t:20,b:20},o.pad||{});this.n=o.n||20;this.min=o.min!=null?o.min:0;this.max=o.max!=null?o.max:100;this.stepNow=null;this.id='p'+(++uid);this.markers={};
    this.svg=S('svg',{viewBox:`0 0 ${this.w} ${this.h}`,class:'dg',role:'img','aria-label':o.label||'chart'});
    this.defs=S('defs',null,this.svg);
    if(o.grid!==false)this.grid();
    host.appendChild(this.svg);}
  get iw(){return this.w-this.pad.l-this.pad.r}
  get ih(){return this.h-this.pad.t-this.pad.b}
  x(i){return this.pad.l+(i+0.5)*this.iw/this.n}
  y(p){return this.pad.t+(this.max-p)/(this.max-this.min)*this.ih}
  step(k){this.stepNow=k;return this;}
  add(tag,a){const e=S(tag,a,this.svg);if(this.stepNow!=null){e.setAttribute('data-step',this.stepNow);e.classList.add('stp');}return e;}
  grid(){const g=S('g',{class:'grid'},this.svg);for(let k=0;k<=4;k++){const y=this.pad.t+k*this.ih/4;S('line',{x1:this.pad.l,x2:this.w-this.pad.r,y1:y,y2:y},g);}}
  marker(col){if(this.markers[col])return this.markers[col];const id=this.id+'m'+Object.keys(this.markers).length;const m=S('marker',{id,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},this.defs);S('path',{d:'M0,0 L10,5 L0,10 z',fill:col},m);this.markers[col]=id;return id;}
  candle(i,o,h,l,cl,opt){opt=opt||{};const up=cl>=o;const col=opt.color||(up?'up':'down');const g=this.add('g',{class:opt.ghost?'ghost':null});const x=this.x(i);const bw=opt.bw||Math.max(3,this.iw/this.n*0.6);
    S('line',{x1:x,x2:x,y1:this.y(h),y2:this.y(l),stroke:col,'stroke-width':1.6},g);
    const top=this.y(Math.max(o,cl)),bot=this.y(Math.min(o,cl));
    S('rect',{x:x-bw/2,y:top,width:bw,height:Math.max(1.6,bot-top),fill:opt.hollow?'panel':col,stroke:col,'stroke-width':1.3,rx:1.5},g);return g;}
  candles(arr,start,fn){start=start||0;return arr.map((d,k)=>this.candle(start+k,d[0],d[1],d[2],d[3],fn?fn(k):null));}
  line(pts,o){o=o||{};const d=pts.map((p,k)=>(k?'L':'M')+this.x(p[0]).toFixed(1)+','+this.y(p[1]).toFixed(1)).join(' ');const col=c(o.color||'ink2');
    const e=this.add('path',{d,fill:'none',stroke:col,'stroke-width':o.width||2.4,'stroke-linejoin':'round','stroke-linecap':'round','stroke-dasharray':o.dash||null,class:o.draw?'draw':null,'marker-end':o.arrow?`url(#${this.marker(col)})`:null});
    if(o.draw)e.style.setProperty('--dly',(o.delay||0)+'s');return e;}
  hline(p,o){o=o||{};const x1=o.from!=null?this.x(o.from):this.pad.l,x2=o.to!=null?this.x(o.to):this.w-this.pad.r;const g=this.add('g',null);const col=o.color||'mut';
    S('line',{x1,x2,y1:this.y(p),y2:this.y(p),stroke:col,'stroke-width':o.width||1.4,'stroke-dasharray':o.dash===false?null:(o.dash||'5 4')},g);
    if(o.label){const right=o.side!=='left';S('text',{x:right?x2-4:x1+4,y:this.y(p)+(o.below?15:-6),'text-anchor':right?'end':'start',fill:col,class:'lbl sm b',text:o.label},g);}return g;}
  vline(i,o){o=o||{};return this.add('line',{x1:this.x(i),x2:this.x(i),y1:this.pad.t,y2:this.h-this.pad.b,stroke:o.color||'mut','stroke-width':1.2,'stroke-dasharray':o.dash||'4 4'});}
  box(i1,i2,p1,p2,o){o=o||{};const g=this.add('g',null);const x1=this.x(i1),x2=this.x(i2),y1=this.y(Math.max(p1,p2)),y2=this.y(Math.min(p1,p2));const col=o.color||'blue';
    S('rect',{x:x1,y:y1,width:Math.max(1,x2-x1),height:Math.max(1,y2-y1),fill:col,'fill-opacity':o.alpha!=null?o.alpha:0.14,stroke:col,'stroke-opacity':o.noStroke?0:0.75,'stroke-width':1.2,'stroke-dasharray':o.dash||null,rx:3},g);
    if(o.label){const pos=o.pos||'tl';const r=pos.indexOf('r')>-1,b=pos.indexOf('b')>-1;S('text',{x:r?x2-6:x1+6,y:pos.indexOf('a')>-1?y1-7:pos.indexOf('u')>-1?y2+16:b?y2-7:y1+15,'text-anchor':r?'end':'start',fill:col,class:'lbl sm b',text:o.label},g);}return g;}
  text(i,p,str,o){o=o||{};return this.add('text',{x:this.x(i)+(o.dx||0),y:this.y(p)+(o.dy||0),'text-anchor':o.anchor||'middle',fill:o.color||'ink2',class:'lbl'+(o.size?' '+o.size:'')+(o.bold?' b':''),text:str});}
  arrow(i1,p1,i2,p2,o){o=o||{};const col=c(o.color||'acc');return this.add('line',{x1:this.x(i1),y1:this.y(p1),x2:this.x(i2),y2:this.y(p2),stroke:col,'stroke-width':o.width||2,'stroke-dasharray':o.dash||null,'marker-end':`url(#${this.marker(col)})`});}
  dot(i,p,o){o=o||{};return this.add('circle',{cx:this.x(i)+(o.dx||0),cy:this.y(p),r:o.r||4.5,fill:o.color||'acc',stroke:o.stroke||null,'stroke-width':o.stroke?2:null});}
  badge(i,p,str,o){o=o||{};const g=this.add('g',null);const x=this.x(i)+(o.dx||0),y=this.y(p)+(o.dy||0);S('circle',{cx:x,cy:y,r:12,fill:o.color||'acc'},g);S('text',{x,y:y+4.5,'text-anchor':'middle',class:'lbl sm b',fill:'bg',text:str},g);return g;}
  money(i,p,o){o=o||{};return this.add('text',{x:this.x(i)+(o.dx||0),y:this.y(p)+4,'text-anchor':'middle',fill:o.color||'acc',class:'lbl b'+(o.small?' sm':''),text:o.t||'$'});}
}

function mini(host,title,desc,o){const d=H('div',{class:'mini'},host);if(title)H('div',{class:'mt'},d,title);const p=new Plot(d,o);if(desc)H('div',{class:'md'},d,desc);return p;}
function grid(host,cols){return H('div',{class:'mini-grid c'+cols},host);}

function stepper(host,plot,caps){const bar=H('div',{class:'stepper'},host);const prev=H('button',{class:'btn ghost sm'},bar,'◀ Back');const cap=H('div',{class:'step-cap'},bar);const next=H('button',{class:'btn sm'},bar,'Next ▶');const all=H('button',{class:'btn ghost sm'},bar,'Show all');
  let k=1;const N=caps.length;const svgs=Array.isArray(plot)?plot.map(p=>p.svg):[plot.svg];
  function show(){svgs.forEach(s=>s.querySelectorAll('.stp').forEach(e=>e.classList.toggle('hid',+e.getAttribute('data-step')>k)));cap.innerHTML=`<b>STEP ${k}/${N}</b>${caps[k-1]}`;prev.disabled=k<=1;next.disabled=k>=N;}
  prev.onclick=()=>{if(k>1){k--;show();}};next.onclick=()=>{if(k<N){k++;show();}};all.onclick=()=>{k=N;show();};show();}

function checklist(host,items,okMsg,noMsg){const ul=H('ul',{class:'check'},host);const out=H('div',{class:'readout bad'},host);const st=items.map(()=>false);
  items.forEach((t,k)=>{const li=H('li',null,ul,`<span class="bx">✓</span><span>${t}</span>`);li.onclick=()=>{st[k]=!st[k];li.classList.toggle('on',st[k]);upd();};});
  function upd(){const n=st.filter(Boolean).length;out.className='readout '+(n===items.length?'good':n?'mid':'bad');out.innerHTML=n===items.length?okMsg:`<b>${n}/${items.length} ticked.</b> ${noMsg}`;}upd();}

const DG={};

/* ---------- PRICE MOVEMENT ---------- */
DG['hero']=host=>{const r=rng(42);let v=50;const cl=[];for(let k=0;k<64;k++){const tr=k<18?1.2:k<30?-1.5:k<40?0.15:1.6;v+=tr+(r()-.5)*5;cl.push(v);}const d=walk(cl,3,{open:50,wick:2.2});let mn=Infinity,mx=-Infinity;d.forEach(x=>{mn=Math.min(mn,x[2]);mx=Math.max(mx,x[1]);});
  const p=new Plot(host,{n:64,h:200,min:mn-4,max:mx+4,grid:false,label:'Animated price chart',pad:{l:4,r:4,t:8,b:8}});
  p.box(29.5,40.5,d.slice(30,41).reduce((a,x)=>Math.min(a,x[2]),99),d.slice(30,41).reduce((a,x)=>Math.max(a,x[1]),0),{color:'blue',label:'Balance',alpha:.1});
  p.candles(d);};

DG['tug']=host=>{host.innerHTML=`<div class="ctrl"><label>Drag to shift the balance between buyers and sellers <input type="range" min="0" max="100" value="50"></label></div>
<div class="tug-bar"><div class="b">BUYERS</div><div class="s">SELLERS</div></div><div class="tug-out"><div class="arrow">↔</div><div class="readout" style="flex:1;margin:0"></div></div>`;
  const inp=host.querySelector('input'),b=host.querySelector('.b'),s=host.querySelector('.s'),ar=host.querySelector('.arrow'),out=host.querySelector('.readout');
  function upd(){const v=+inp.value;b.style.flex=v;s.style.flex=100-v;b.textContent='BUYERS '+v+'%';s.textContent='SELLERS '+(100-v)+'%';
    if(Math.abs(v-50)<=6){ar.textContent='↔';ar.style.color='var(--muted)';ar.style.transform='none';out.className='readout mid';out.innerHTML='<b>Balance.</b> Buyers and sellers agree on value. Price drifts sideways in a range (consolidation). Volume is matched, so there is no reason to travel far.';}
    else if(v>50){ar.textContent='↑';ar.style.color='var(--up)';ar.style.transform=`scale(${1+(v-50)/45})`;out.className='readout good';out.innerHTML=`<b>Imbalance: Demand &gt; Supply.</b> There are more buy orders than sell orders at this price, so buyers must pay higher prices to find sellers. Price expands <span class="up">upward</span> until it finds enough sell orders to balance again.`;}
    else{ar.textContent='↓';ar.style.color='var(--down)';ar.style.transform=`scale(${1+(50-v)/45})`;out.className='readout bad';out.innerHTML=`<b>Imbalance: Supply &gt; Demand.</b> Sellers outnumber buyers, so sellers must accept lower prices to get filled. Price expands <span class="down">downward</span> until enough buyers appear.`;}}
  inp.oninput=upd;upd();};

DG['market-cycle']=host=>{const s=svgBox(host,720,300,'Balance and imbalance cycle');const d=S('defs',null,s);const m=S('marker',{id:'mc-a',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:8,markerHeight:8,orient:'auto'},d);S('path',{d:'M0,0L10,5L0,10z',fill:'acc'},m);
  S('rect',{x:30,y:95,width:230,height:110,rx:18,fill:'blue','fill-opacity':.14,stroke:'blue','stroke-width':2},s);
  tlines(s,145,135,['BALANCE','Efficient market','buyers ≈ sellers'],{cls:'b',color:'blue',lh:22});
  S('rect',{x:460,y:95,width:230,height:110,rx:18,fill:'acc','fill-opacity':.14,stroke:'acc','stroke-width':2},s);
  tlines(s,575,130,['IMBALANCE','Demand > Supply  ↑','Supply > Demand  ↓'],{cls:'b',color:'acc',lh:22});
  S('path',{d:'M250,95 Q360,10 470,95',fill:'none',stroke:'acc','stroke-width':2.4,'marker-end':'url(#mc-a)'},s);
  tlines(s,360,28,['Liquidity (fuel) arrives:','one side overwhelms the other'],{cls:'sm'});
  S('path',{d:'M470,205 Q360,290 250,205',fill:'none',stroke:'acc','stroke-width':2.4,'marker-end':'url(#mc-a)','stroke-dasharray':'7 5'},s);
  tlines(s,360,262,['Price travels to find the other side,','then rests: "look for balance"'],{cls:'sm'});};

DG['balance-imbalance']=host=>{const p=new Plot(host,{n:40,h:320,label:'Balance and imbalance'});
  p.box(-0.4,7.4,19,30,{color:'blue',label:'BALANCE',pos:'al'});p.box(11.6,22.4,65,77,{color:'blue',label:'BALANCE',pos:'al'});p.box(26.6,34.4,8,20,{color:'blue',label:'BALANCE',pos:'al'});
  const pts=[[0,22],[1,27],[2,21],[3,27],[4,21],[5,28],[6,22],[7,26],[9,48],[11,72],[12,68],[13,74],[14,67],[15,75],[16,68],[17,74],[18,67],[19,75],[20,68],[21,73],[22,68],[24,45],[26,14],[27,18],[28,11],[29,18],[30,11],[31,18],[32,11],[33,18],[34,12],[36,40],[38,70],[39,82]];
  p.line(pts,{draw:1});
  p.line([[7,26],[9,48],[11,72]],{color:'acc',width:4});p.line([[22,68],[24,45],[26,14]],{color:'acc',width:4});p.line([[34,12],[36,40],[38,70],[39,82]],{color:'acc',width:4,arrow:1});
  p.text(9,46,'IMBALANCE',{color:'acc',bold:1,anchor:'start',dx:14,size:'sm'});p.text(24,44,'IMBALANCE',{color:'acc',bold:1,anchor:'start',dx:14,size:'sm'});p.text(36,40,'IMBALANCE',{color:'acc',bold:1,anchor:'end',dx:-12,size:'sm'});};

DG['four-stages']=host=>{const p=new Plot(host,{n:36,h:330,label:'Four stages of price'});
  p.box(12.6,23.4,44,56,{color:'pur',alpha:.08,noStroke:1});
  p.line([[0,8],[6,70]],{color:'acc',width:3.4,draw:1});
  p.line([[6,70],[7,63],[8,67],[9,58],[10,62],[11,52],[12,56],[13,47]],{color:'blue',width:3,draw:1,delay:.7});
  p.line([[13,47],[14,53],[15,46],[16,53],[17,46],[18,53],[19,46],[20,53],[21,46],[22,52],[23,48]],{color:'pur',width:3,draw:1,delay:1.4});
  p.line([[23,48],[27,62],[31,80],[34,92]],{color:'up',width:2.6,dash:'7 6',arrow:1});
  p.line([[23,48],[27,34],[31,18],[34,6]],{color:'down',width:2.6,dash:'7 6',arrow:1});
  p.badge(1.6,40,'1',{color:'acc'});p.text(2.2,32,'Expansion',{color:'acc',bold:1,anchor:'start',dx:16});
  p.badge(9.5,74,'2',{color:'blue'});p.text(10.2,74,'Pullback',{color:'blue',bold:1,anchor:'start',dx:14,dy:4});
  p.badge(15,62,'3',{color:'pur'});p.text(15.6,62,'Consolidation (balance)',{color:'pur',bold:1,anchor:'start',dx:14,dy:4});
  p.badge(23,38,'4',{color:'acc'});p.text(23.6,38,'Decision',{color:'acc',bold:1,anchor:'start',dx:14,dy:4});
  p.text(33.5,82,'Continuation',{color:'up',bold:1,anchor:'end',dx:-6});p.text(33.5,16,'Reversal',{color:'down',bold:1,anchor:'end',dx:-6});};

/* ---------- FOREX BASICS ---------- */
DG['pair']=host=>{host.innerHTML=`<div class="pair"><div class="pair-top"><span class="base">EUR</span><span class="slash">/</span><span class="quote">USD</span><span class="eq">=</span><span class="px">1.353<b>6</b><small>1</small></span></div>
<div class="pair-lbl"><span><b class="blue">Base currency</b><br><small>the "thing" you are buying or selling (always 1 unit)</small></span><span><b class="pur">Quote currency</b><br><small>the "money" you pay it with</small></span><span><b class="acc">Price</b><br><small>1 EUR costs 1.35361 USD. The underlined digit is the pip, the small one a pipette.</small></span></div></div>`;};

DG['pnl']=host=>{host.innerHTML=`<div class="ctrl"><div class="seg"><button class="buy on">BUY EUR/USD</button><button class="sell">SELL EUR/USD</button></div>
<label>Move the market (pips) <b class="mv">0</b><input type="range" min="-150" max="150" value="0" step="5"></label></div><div class="stat-row"><div class="stat"><small>Entry</small><b>1.35361</b></div><div class="stat"><small>Price now</small><b class="now">1.35361</b></div><div class="stat"><small>Result</small><b class="res">0 pips</b></div><div class="stat"><small>On 1 standard lot</small><b class="usd">$0</b></div></div><div class="readout"></div>`;
  let dir=1;const bb=host.querySelector('.buy'),sb=host.querySelector('.sell'),inp=host.querySelector('input');
  bb.onclick=()=>{dir=1;bb.classList.add('on');sb.classList.remove('on');upd();};sb.onclick=()=>{dir=-1;sb.classList.add('on');bb.classList.remove('on');upd();};
  function upd(){const mv=+inp.value;const res=dir*mv;host.querySelector('.mv').textContent=(mv>0?'+':'')+mv;host.querySelector('.now').textContent=(1.35361+mv*0.0001).toFixed(5);
    const r=host.querySelector('.res');r.textContent=(res>0?'+':'')+res+' pips';r.style.color=res>0?'var(--up)':res<0?'var(--down)':'';const u=host.querySelector('.usd');u.textContent=(res<0?'-$':'$')+Math.abs(res*10).toLocaleString();u.style.color=r.style.color;
    const o=host.querySelector('.readout');const what=mv>0?'EUR got <b class="up">stronger</b> (or USD got weaker): it now takes more dollars to buy one euro.':mv<0?'EUR got <b class="down">weaker</b> (or USD got stronger): one euro now buys fewer dollars.':'Price has not moved yet. Drag the slider.';
    o.className='readout '+(res>0?'good':res<0?'bad':'');o.innerHTML=what+(mv?` Because you <b>${dir>0?'bought':'sold'}</b>, you are <b>${res>0?'in profit':'in loss'}</b>.`:'');}
  inp.oninput=upd;upd();};

DG['three-ms']=host=>{const s=svgBox(host,720,330,'The three Ms');
  [[290,140,'blue','METHOD','your edge: rules','for entry and exit'],[430,140,'up','MONEY','risk per trade,','position size'],[360,235,'pur','MINDSET','discipline,','patience, emotions']].forEach(([x,y,col,t,a,b])=>{S('circle',{cx:x,cy:y,r:105,fill:col,'fill-opacity':.15,stroke:col,'stroke-width':2},s);});
  tlines(s,225,110,['METHOD','your edge: rules','for entry & exit'],{color:'blue',cls:'b',lh:18});
  tlines(s,495,110,['MONEY MGMT','risk per trade,','position size'],{color:'up',cls:'b',lh:18});
  tlines(s,360,280,['MINDSET','discipline, patience,','emotional control'],{color:'pur',cls:'b',lh:18});
  tlines(s,360,172,['CONSISTENT','TRADER'],{color:'acc',cls:'b sm',lh:16});};

DG['styles']=host=>{const s=svgBox(host,720,270,'Target pips by trading style');const L=160,R=700;const lx=v=>L+Math.log10(v)/3*(R-L);
  [1,10,100,1000].forEach(v=>{S('line',{x1:lx(v),x2:lx(v),y1:20,y2:225,stroke:'line','stroke-dasharray':'3 5'},s);S('text',{x:lx(v),y:248,'text-anchor':v===1000?'end':'middle',class:'lbl sm',fill:'mut',text:v+(v===1000?'+ pips':' pips')},s);});
  [['Scalping','1M / 5M',5,30,'acc'],['Intraday','5M / 15M',10,100,'blue'],['Swing','15M / 1H to 4H',50,300,'pur'],['Position','4H / D / W',300,1000,'up']].forEach((r,k)=>{const y=34+k*50;
    S('text',{x:10,y:y+12,class:'lbl b',fill:'ink',text:r[0]},s);S('text',{x:10,y:y+29,class:'lbl sm',fill:'mut',text:r[1]},s);
    const b=S('rect',{x:lx(r[2]),y,width:lx(r[3])-lx(r[2]),height:30,rx:8,fill:r[4],'fill-opacity':.8},s);
    S('text',{x:lx(r[2])+10,y:y+20,class:'lbl sm b',fill:'bg',text:r[2]+(r[3]>=1000?'+':' to '+r[3])+' pips'},s);});};

DG['style-finder']=host=>{const Q=[['How much screen time can you give on a normal day?',['Several focused hours','1 to 2 hours','Less than 1 hour, maybe a daily check'],[0,1,2]],
  ['How do you feel holding a trade overnight or for days?',['I hate it, I want to be flat','Fine for a day or so','Comfortable for days or weeks'],[0,1,2]],
  ['Which describes you better?',['Fast decisions, loves action','Patient planner with a day job','Very patient, big picture thinker'],[0,1,2]]];
  const ans=[null,null,null];let h='';Q.forEach((q,i)=>{h+=`<div class="qq"><div class="qt">${i+1}. ${q[0]}</div><div class="opts">`+q[1].map((o,j)=>`<button data-q="${i}" data-a="${j}">${o}</button>`).join('')+'</div></div>';});
  host.innerHTML=h+'<div class="readout">Answer the three questions to see which style fits your schedule, goals and personality.</div>';
  host.querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=+b.dataset.q;ans[i]=+b.dataset.a;host.querySelectorAll(`button[data-q="${i}"]`).forEach(x=>x.classList.toggle('right',x===b));
    if(ans.every(a=>a!=null)){const sc=ans.reduce((a,b)=>a+b,0);const out=host.querySelector('.readout');out.className='readout good';
      out.innerHTML=sc<=1?'<b>Scalping or intraday.</b> You have time and like action. Start with intraday (5M/15M) before scalping: scalping punishes small mistakes and spreads eat into tiny targets.':sc<=3?'<b>Intraday or swing.</b> One focused session (London or New York) per day fits you. Use 15M to 1H to 4H charts and aim for 10 to 300 pips.':sc<=5?'<b>Swing trading.</b> Check charts once or twice a day, plan on 4H, execute on 15M, hold for days. Fits well around a job.':'<b>Position trading.</b> Daily and weekly charts, few trades, big targets. Needs patience and wider stops (so smaller position size).';}});};

/* ---------- MINDSET ---------- */
DG['conviction']=host=>{const s=svgBox(host,720,330,'Conviction loop');const d=S('defs',null,s);const m=S('marker',{id:'cv-a',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:8,markerHeight:8,orient:'auto'},d);S('path',{d:'M0,0L10,5L0,10z',fill:'acc'},m);
  const N=[[360,52,'CONVICTION','I believe in my process','blue'],[600,165,'CONFIDENCE','I act without hesitating','up'],[360,278,'COMPETENCE','my skill grows with reps','pur'],[120,165,'CONSISTENCY','same process, every trade','acc']];
  N.forEach(n=>{S('rect',{x:n[0]-120,y:n[1]-34,width:240,height:68,rx:16,fill:n[4],'fill-opacity':.14,stroke:n[4],'stroke-width':2},s);tlines(s,n[0],n[1]-4,[n[2],n[3]],{color:n[4],cls:'b',lh:20});});
  [['M470,62 Q585,70 600,128'],['M600,202 Q585,265 470,272'],['M250,272 Q135,265 120,202'],['M120,128 Q135,70 250,62']].forEach(p=>S('path',{d:p[0],fill:'none',stroke:'acc','stroke-width':2.4,'marker-end':'url(#cv-a)'},s));
  tlines(s,360,160,['Built with DATA','(your journal),','not affirmations'],{color:'ink2',cls:'sm',lh:18});};

/* ---------- MARKET STRUCTURE ---------- */
DG['pyramid']=host=>{const s=svgBox(host,720,370,'Trading pyramid');const out=H('div',{class:'readout'},host,'<b>Tap a layer.</b> Each level rests on the one below it. Skip a level and everything above it wobbles.');
  const L=[['$  PROFIT','acc','The result, never the focus. Profit is the by-product of doing every layer below correctly, again and again.','risk-management.html'],
    ['PSYCHOLOGY','pur','Discipline, patience, following rules after a loss. Without this, even a perfect method gets abandoned at the worst moment.','mindset.html'],
    ['ENTRIES & EXITS','blue','Exactly where you get in (POI, confirmation) and where you get out (stop loss, take profit at liquidity).','when-not-to-trade.html'],
    ['LIQUIDITY','teal','Where the stop orders sit. It explains WHY price moves to certain levels: it is hunting fuel.','liquidity.html'],
    ['SUPPLY & DEMAND','down','Zones where big orders were placed and imbalances were created. These are your areas of interest.','supply-demand.html'],
    ['MARKET STRUCTURE','up','The foundation: trend direction, highs and lows, breaks of structure. Everything starts here.','market-structure.html']];
  const top=18,bot=355,hh=(bot-top)/6;const hw=y=>(y-top)/(bot-top)*330;
  L.forEach((l,k)=>{const y1=top+k*hh,y2=y1+hh-3;const g=S('g',{style:'cursor:pointer'},s);
    S('polygon',{points:`${360-hw(y1)},${y1} ${360+hw(y1)},${y1} ${360+hw(y2)},${y2} ${360-hw(y2)},${y2}`,fill:l[1],'fill-opacity':.22,stroke:l[1],'stroke-width':1.6},g);
    S('text',{x:360,y:(y1+y2)/2+5,'text-anchor':'middle',class:'lbl b'+(k===0?' sm':''),fill:k===0?'acc':'ink',text:k===0?'$':l[0]},g);
    g.onclick=()=>{s.querySelectorAll('polygon').forEach(p=>p.style.fillOpacity=.22);g.querySelector('polygon').style.fillOpacity=.5;out.className='readout mid';out.innerHTML=`<b>${l[0]}.</b> ${l[2]} <a href="${l[3]}">Go to lesson →</a>`;};});
  S('text',{x:690,y:30,'text-anchor':'end',class:'lbl sm',fill:'mut',text:'built last'},s);S('text',{x:690,y:350,'text-anchor':'end',class:'lbl sm',fill:'mut',text:'learn first'},s);};

DG['trends']=host=>{const g=grid(host,3);
  const up=mini(g,'1. Uptrend','Higher highs (HH) and higher lows (HL). Buyers in control.',{n:12,w:320,h:230,label:'Uptrend'});
  const pu=[[0,12],[2,35],[3,26],[5,52],[6,40],[8,68],[9,56],[11,86]];up.line(pu,{color:'up',draw:1});
  [[2,35,'HH'],[5,52,'HH'],[8,68,'HH'],[11,86,'HH']].forEach(a=>up.text(a[0],a[1],a[2],{dy:-9,color:'up',size:'sm',bold:1}));[[3,26,'HL'],[6,40,'HL'],[9,56,'HL']].forEach(a=>up.text(a[0],a[1],a[2],{dy:17,color:'blue',size:'sm',bold:1}));
  const dn=mini(g,'2. Downtrend','Lower highs (LH) and lower lows (LL). Sellers in control.',{n:12,w:320,h:230,label:'Downtrend'});
  dn.line(pu.map(q=>[q[0],100-q[1]]),{color:'down',draw:1});[[2,65,'LL'],[5,48,'LL'],[8,32,'LL'],[11,14,'LL']].forEach(a=>dn.text(a[0],a[1],a[2],{dy:17,color:'down',size:'sm',bold:1}));[[3,74,'LH'],[6,60,'LH'],[9,44,'LH']].forEach(a=>dn.text(a[0],a[1],a[2],{dy:-9,color:'blue',size:'sm',bold:1}));
  const rg=mini(g,'3. Consolidation','Sideways. Equal highs and lows. Nobody in control yet.',{n:12,w:320,h:230,label:'Range'});
  rg.hline(72,{color:'down',label:'resistance',dash:'6 4'});rg.hline(30,{color:'up',label:'support',below:1,dash:'6 4'});rg.line([[0,30],[2,71],[4,31],[6,72],[8,30],[10,71],[11,52]],{color:'pur',draw:1});};

DG['bos']=host=>{const p=new Plot(host,{n:25,h:330,label:'Break of structure and pullbacks'});
  const pts=[[0,8],[3,35],[5,25],[8,50],[10,38],[13,64],[15,52],[18,80],[20,68],[23,93]];p.line(pts,{color:'up',draw:1,width:2.6});
  [[[3,35],[5,25]],[[8,50],[10,38]],[[13,64],[15,52]],[[18,80],[20,68]]].forEach(s=>p.line(s,{color:'blue',width:4.5}));
  [[35,3,6.2],[50,8,11.4],[64,13,16.3],[80,18,21.5]].forEach(b=>p.hline(b[0],{from:b[1],to:b[2],color:'acc',label:'BOS',dash:'5 4'}));
  [[3,35],[8,50],[13,64],[18,80]].forEach(a=>p.text(a[0],a[1],'HH',{dy:-9,size:'sm',color:'up',bold:1,dx:-14}));[[5,25],[10,38],[15,52],[20,68]].forEach(a=>p.text(a[0],a[1],'HL',{dy:18,size:'sm',color:'blue',bold:1}));
  p.text(4,30,'pullback',{color:'blue',size:'sm',anchor:'start',dx:10,dy:18});};

DG['internal']=host=>{const p=new Plot(host,{n:20,h:300,label:'Internal structure'});
  p.box(0,13,12,78,{color:'pur',alpha:.07,label:'INTERNAL STRUCTURE: everything between the swing low and the swing high',pos:'tl'});
  p.hline(78,{color:'up',label:'Swing high',dash:false,width:1.4});p.hline(12,{color:'down',label:'Swing low',dash:false,below:1,width:1.4});
  p.line([[0,12],[1,22],[2,17],[3,30],[4,24],[5,38],[6,32],[7,47],[8,41],[9,56],[10,50],[11,66],[12,60],[13,78],[14,66],[15,71],[16,57],[17,63],[18,50],[19,58]],{draw:1});
  p.text(4.5,22,'small HH / HL inside the leg',{size:'sm',color:'pur',anchor:'start',dx:8});p.text(16,40,'external pullback',{size:'sm',color:'blue'});};

DG['strong-weak']=host=>{const p=new Plot(host,{n:18,h:330,label:'Strong vs weak structure'});
  p.line([[0,12],[3,45],[5,30],[8,68],[10,52],[13,86],[15,74]],{color:'up',draw:1,width:2.6});p.line([[15,74],[17,94]],{color:'acc',dash:'6 5',arrow:1});
  p.hline(45,{from:3,to:6.2,color:'mut',label:'BOS'});p.hline(68,{from:8,to:11.4,color:'mut',label:'BOS'});
  p.box(9.3,17.4,48,56,{color:'up',label:'STRONG LOW: trade FROM here',pos:'ul',alpha:.15});
  p.hline(86,{from:13,color:'down',label:'WEAK HIGH: TARGET it',dash:'6 4',side:'left'});
  p.dot(10,52,{color:'up'});p.dot(13,86,{color:'down'});};

DG['choch']=host=>{const p=new Plot(host,{n:26,h:340,label:'Change of character'});
  p.line([[0,10],[3,40],[5,28],[8,60],[10,45],[13,78],[15,56]],{color:'up',draw:1,width:2.6});p.line([[15,56],[17.5,70],[20,38],[22,50],[25,15]],{color:'down',draw:1,delay:1,width:2.6});
  [[3,40,'HH'],[8,60,'HH'],[13,78,'HH']].forEach(a=>p.text(a[0],a[1],a[2],{dy:-9,size:'sm',color:'up',bold:1}));[[5,28,'HL'],[10,45,'HL'],[15,56,'HL']].forEach(a=>p.text(a[0],a[1],a[2],{dy:18,size:'sm',color:'blue',bold:1}));
  p.text(17.5,70,'LH: failed to make a new high',{dy:-10,size:'sm',color:'acc',bold:1});
  p.hline(56,{from:15,to:18.7,color:'acc',label:'CHoCH',width:2});
  p.text(22,50,'LH',{dy:-9,size:'sm',color:'down',bold:1});p.text(25,15,'LL',{dy:18,size:'sm',color:'down',bold:1,dx:-10});
  p.box(0,15,4,96,{color:'up',alpha:.04,label:'Buyers in control',noStroke:1});p.box(18.7,25.4,4,96,{color:'down',alpha:.05,label:'Sellers take over',noStroke:1,pos:'tr'});};

/* ---------- CANDLES ---------- */
DG['candle-anatomy']=host=>{const p=new Plot(host,{n:8,h:360,max:110,grid:false,label:'Candle anatomy'});
  p.candle(1.6,30,90,10,75,{bw:52});p.candle(5.4,75,90,10,30,{bw:52});
  p.text(1.6,103,'Bullish candle',{color:'up',bold:1});p.text(5.4,103,'Bearish candle',{color:'down',bold:1});
  [[90,'High'],[75,'Close'],[30,'Open'],[10,'Low']].forEach(a=>{p.hline(a[0],{from:-0.2,to:1.2,color:'mut',dash:'2 3'});p.text(-0.2,a[0],a[1],{anchor:'start',dy:-5,size:'sm',color:'ink'});});
  [[90,'High'],[75,'Open'],[30,'Close'],[10,'Low']].forEach(a=>{p.hline(a[0],{from:5.8,to:7.4,color:'mut',dash:'2 3'});p.text(7.4,a[0],a[1],{anchor:'end',dy:-5,size:'sm',color:'ink'});});
  p.text(3.5,83,'upper wick',{size:'sm',color:'acc'});p.text(3.5,53,'BODY',{bold:1,color:'acc'});p.text(3.5,20,'lower wick',{size:'sm',color:'acc'});
  p.arrow(2.9,83,2.3,83,{color:'acc',width:1.4});p.arrow(4.2,83,4.8,83,{color:'acc',width:1.4});p.arrow(2.9,53,2.3,53,{color:'acc',width:1.4});p.arrow(4.2,53,4.8,53,{color:'acc',width:1.4});p.arrow(2.9,20,2.3,20,{color:'acc',width:1.4});p.arrow(4.2,20,4.8,20,{color:'acc',width:1.4});};

DG['candle-types']=host=>{const g=grid(host,4);
  [['Marubozu','Big body, tiny wicks. One side in full control all session.',[22,84,20,82]],['Doji','Open ≈ close. Indecision, balance. Wait for the next candle.',[50,86,14,51]],['Hammer / pin bar','Long lower wick: sellers pushed down, buyers rejected it hard.',[62,72,10,70]],['Shooting star','Long upper wick: buyers pushed up, sellers rejected it.',[40,90,30,32]]].forEach(t=>{const p=mini(g,t[0],t[1],{n:3,w:200,h:200,grid:false,label:t[0]});p.candle(1,t[2][0],t[2][1],t[2][2],t[2][3],{bw:40});});};

function haOf(d){const out=[];d.forEach((x,k)=>{const c=(x[0]+x[1]+x[2]+x[3])/4;const o=k?(out[k-1][0]+out[k-1][3])/2:(x[0]+x[3])/2;out.push([o,Math.max(x[1],o,c),Math.min(x[2],o,c),c]);});return out;}
DG['heikin']=host=>{const r=rng(11);let v=40;const cl=[];for(let k=0;k<14;k++){v+=2.2+(r()-.5)*7;cl.push(v);}for(let k=0;k<10;k++){v-=2.6+(r()-.5)*7;cl.push(v);}for(let k=0;k<8;k++){v+=1.8+(r()-.5)*7;cl.push(v);}
  const d=walk(cl,5,{open:40,wick:3}),ha=haOf(d);let mn=99,mx=0;d.concat(ha).forEach(x=>{mn=Math.min(mn,x[2]);mx=Math.max(mx,x[1]);});const g=grid(host,2);
  const a=mini(g,'Regular Japanese candles','Exact open, high, low, close. Noisy: colours flip often inside a trend.',{n:32,w:360,h:230,min:mn-2,max:mx+2,label:'Japanese candles'});a.candles(d);
  const b=mini(g,'Heikin Ashi (averaged)','Smoothed: long runs of one colour, few wicks against the trend. Easier to see the trend, but prices are not real.',{n:32,w:360,h:230,min:mn-2,max:mx+2,label:'Heikin Ashi'});b.candles(ha);};

DG['htf-ltf']=host=>{const g=grid(host,2);const a=mini(g,'One 1-hour candle','From the outside: one big bullish candle.',{n:3,w:340,h:260,grid:false,label:'1H candle'});a.candle(1,20,95,10,85,{bw:60});
  const b=mini(g,'The same hour on 15M','Zoomed in: four candles, a small trend with its own pullbacks.',{n:4,w:340,h:260,grid:false,label:'15M candles'});b.candles([[20,40,10,35],[35,52,28,47],[47,70,44,65],[65,95,58,85]]);};

DG['tf-ladder']=host=>{const t=[['M',96,'up'],['W',84,'teal'],['D',72,'blue'],['4H',60,'pur'],['1H',50,'acc'],['15M',42,'down'],['5M',36,'down']];
  host.innerHTML='<div class="ladder">'+t.map((x,k)=>`<span style="width:${x[1]}px;height:${x[1]}px;background:var(--${x[2]==='acc'?'accent':x[2]==='pur'?'purple':x[2]});opacity:${1-k*0.07}">${x[0]}</span>`+(k<t.length-1?'<b class="mut">&gt;</b>':'')).join('')+'</div><div class="ladder-axis"><span>◀ more powerful, higher confidence, slower</span><span>more precision, more noise ▶</span></div>';};

DG['topdown-funnel']=host=>{const s=svgBox(host,720,310,'Top down funnel');
  [['HTF','WHO is in control?','Narrative, trend, premium or discount, liquidity','blue',0],['MTF','WHERE to enter?','Point of Interest (POI): OB, FVG, zone','pur',1],['LTF','WHEN to enter?','Confirmation, entry, precise stop loss','up',2]].forEach(r=>{const y=14+r[4]*98,w0=680-r[4]*160,w1=w0-160;
    S('polygon',{points:`${360-w0/2},${y} ${360+w0/2},${y} ${360+w1/2},${y+88} ${360-w1/2},${y+88}`,fill:r[3],'fill-opacity':.17,stroke:r[3],'stroke-width':1.8},s);
    tlines(s,360,y+30,[r[0]+'   ·   '+r[1],r[2]],{color:'ink',cls:'b',lh:24});});};

DG['topdown-example']=host=>{const g=grid(host,3);
  const a=mini(g,'1. HTF (Daily)','Uptrend. Price is pulling back into the discount half of the last leg. Bias: BUY.',{n:12,w:300,h:240,label:'HTF'});
  a.box(5,11.4,38,59,{color:'up',alpha:.13,label:'discount',pos:'bl'});a.hline(59,{from:5,color:'mut',label:'50%'});a.line([[0,15],[3,55],[5,38],[8,82],[10.5,50]],{color:'up',draw:1});
  const b=mini(g,'2. MTF (1H)','Inside that pullback, mark the POI: an order block with an FVG. Wait for price to arrive.',{n:12,w:300,h:240,label:'MTF'});
  b.box(5,11.4,30,42,{color:'blue',label:'POI',pos:'bl',alpha:.18});b.line([[0,88],[2,72],[3,78],[5,58],[6,64],[8,50],[9,55]],{color:'down',draw:1});b.line([[9,55],[11,40]],{color:'acc',dash:'5 5',arrow:1});
  const c2=mini(g,'3. LTF (5M)','Inside the POI: LTF makes a CHoCH up. That is the confirmation. Enter on the pullback, stop below the low.',{n:14,w:300,h:240,label:'LTF'});
  c2.box(0,13.4,22,46,{color:'blue',alpha:.08,noStroke:1});c2.line([[0,66],[2,50],[3,57],[5,30],[6,44],[7,38],[9,62],[10,52],[13,85]],{color:'up',draw:1});
  c2.hline(57,{from:3,to:8.3,color:'acc',label:'CHoCH'});c2.dot(10,52,{color:'acc'});c2.text(10,52,'entry',{dy:18,size:'sm',color:'acc',bold:1});c2.hline(26,{from:4,color:'down',label:'SL',below:1});};

/* ---------- SUPPLY & DEMAND ---------- */
DG['sd-zones']=host=>{const cl=[66,62,57,52,46,41,40,42,39,41,48,56,64,71,77,79,76,78,77,79,72,64,56,49,46,50,47,43,48,55,62];const d=walk(cl,9,{open:70,wick:1.6});
  const p=new Plot(host,{n:32,h:340,min:30,max:90,label:'Supply and demand zones'});
  const base=d.slice(6,10),top=d.slice(15,20);const dl=Math.min(...base.map(x=>x[2])),dh=Math.max(...base.map(x=>Math.max(x[0],x[3])));const sl=Math.min(...top.map(x=>Math.min(x[0],x[3]))),sh=Math.max(...top.map(x=>x[1]));
  p.box(5.6,31.4,dl,dh,{color:'up',label:'DEMAND ZONE (base before the rally)',pos:'ul'});p.box(14.6,31.4,sl,sh,{color:'down',label:'SUPPLY ZONE (base before the drop)',pos:'ar'});
  p.candles(d);p.text(12,60,'aggressive rally',{color:'up',size:'sm',bold:1,anchor:'end',dx:-12});p.text(22,66,'aggressive drop',{color:'down',size:'sm',bold:1,anchor:'start',dx:14});
  p.text(27,33,'price returns → reaction',{size:'sm',color:'acc',bold:1});};

DG['zone-methods']=host=>{const cl=[36,42,48,55,61,66,64,67,65,68,71,58,46,38,33];const d=walk(cl,4,{open:30,wick:1.8});const g=grid(host,2);
  const mn=25,mx=80;const a=mini(g,'1. Range method','Box the whole consolidation (highest high to lowest body). Wider zone, easier to get filled, bigger stop.',{n:16,w:360,h:260,min:mn,max:mx,label:'Range method'});
  const rg=d.slice(5,11);a.box(4.6,15.4,Math.min(...rg.map(x=>Math.min(x[0],x[3]))),Math.max(...rg.map(x=>x[1])),{color:'down',label:'zone',pos:'tr'});a.candles(d);
  const b=mini(g,'2. Pivot method','Box only the candle that caused the break (the last up candle before the drop). Tighter zone, better RR, may be missed.',{n:16,w:360,h:260,min:mn,max:mx,label:'Pivot method'});
  b.box(9.6,15.4,d[10][2],d[10][1],{color:'down',label:'zone',pos:'tr'});b.candles(d,0,k=>k===10?{color:'acc'}:null);};

DG['mitigation']=host=>{const p=new Plot(host,{n:24,h:320,label:'Wait for 50 percent of the zone'});
  p.box(3,23.4,40,50,{color:'up',label:'Demand zone',pos:'bl'});p.hline(45,{from:3,color:'acc',label:'50% of zone',dash:'6 4'});
  p.line([[0,20],[3,40],[4,36],[7,72],[9,64],[11,78],[14,58],[15,50],[16,53],[17,45],[19,62],[22,86]],{draw:1,width:2.6});
  p.dot(15,50,{color:'mut'});p.text(15,50,'tapped: do not rush',{anchor:'end',dx:-10,dy:-8,size:'sm',color:'mut',bold:1});
  p.dot(17,45,{color:'acc',r:6});p.text(17,45,'entry at 50%',{anchor:'start',dx:12,dy:20,size:'sm',color:'acc',bold:1});};

/* ---------- PREMIUM & DISCOUNT ---------- */
DG['pd']=host=>{const p=new Plot(host,{n:20,h:340,label:'Premium and discount'});
  p.box(2,19.4,50,80,{color:'down',alpha:.1,label:'PREMIUM: expensive. Look to SELL',pos:'tr'});p.box(2,19.4,20,50,{color:'up',alpha:.1,label:'DISCOUNT: cheap. Look to BUY',pos:'br'});
  p.hline(80,{color:'mut',label:'Swing high (100%)',dash:false,side:'left'});p.hline(20,{color:'mut',label:'Swing low (0%)',dash:false,side:'left',below:1});p.hline(50,{color:'acc',label:'Equilibrium (50%)',side:'left'});
  p.line([[0,32],[2,20],[4,40],[5,33],[8,64],[9,56],[11,80],[13,64],[14,70],[16,52]],{draw:1,width:2.6});
  const mk=S('g',null,p.svg);const ln=S('line',{x1:p.x(16),x2:p.x(19.4),stroke:'acc','stroke-width':2},mk);const dt=S('circle',{cx:p.x(17.5),r:8,fill:'acc',stroke:'bg','stroke-width':3},mk);
  const wrap=H('div',null,host,'<div class="ctrl"><label>Where is price now inside the leg? <b class="pv">50%</b><input type="range" min="0" max="100" value="35"></label></div><div class="readout"></div>');
  const inp=wrap.querySelector('input'),out=wrap.querySelector('.readout');
  function upd(){const v=+inp.value,pr=20+v*0.6,y=p.y(pr);ln.setAttribute('y1',y);ln.setAttribute('y2',y);dt.setAttribute('cy',y);wrap.querySelector('.pv').textContent=v+'%';
    if(v<45){out.className='readout good';out.innerHTML=`<b>${v}% of the range: DISCOUNT.</b> Price is cheap relative to this leg. In a bullish market this is where you hunt for buys (demand zones, OBs, FVGs).`+(v<20?' Deep discount: better price, but check the swing low is still holding.':'');}
    else if(v<=55){out.className='readout mid';out.innerHTML=`<b>${v}%: EQUILIBRIUM.</b> The middle. Fair price, no edge. Your notes: <i>do not trade mid range, it is choppy.</i>`;}
    else{out.className='readout bad';out.innerHTML=`<b>${v}% of the range: PREMIUM.</b> Price is expensive here. Do not buy. In a bearish market this is where you look for sells (supply zones, bearish OBs).`;}}
  inp.oninput=upd;upd();};

/* ---------- FVG / OB ---------- */
DG['fvg']=host=>{const p=new Plot(host,{n:10,h:340,min:20,max:85,label:'Fair value gaps'});
  p.text(1.5,83,'Bullish FVG',{color:'up',bold:1});p.text(7,83,'Bearish FVG',{color:'down',bold:1});
  p.step(1);p.candle(0.5,30,38,26,36,{bw:34});p.candle(6,72,76,62,64,{bw:34});p.badge(0.5,22,'1',{color:'mut'});p.badge(6,24,'1',{color:'mut'});
  p.step(2);p.candle(1.5,36,70,34,68,{bw:34});p.candle(7,64,66,30,32,{bw:34});p.badge(1.5,22,'2',{color:'mut'});p.badge(7,24,'2',{color:'mut'});
  p.step(3);p.candle(2.5,66,78,56,74,{bw:34});p.candle(8,34,44,28,30,{bw:34});p.badge(2.5,22,'3',{color:'mut'});p.badge(8,24,'3',{color:'mut'});
  p.step(4);p.box(0.5,4.3,38,56,{color:'up',alpha:.22,label:'FVG',pos:'tr'});p.box(6,9.4,44,62,{color:'down',alpha:.22,label:'FVG',pos:'tr'});
  p.hline(38,{from:0.5,to:4.3,color:'up',label:'candle 1 high',below:1});p.hline(56,{from:2.5,to:4.3,color:'up',label:'candle 3 low'});
  p.hline(62,{from:6,to:9.4,color:'down',label:'candle 1 low'});p.hline(44,{from:8,to:9.4,color:'down',label:'candle 3 high',below:1});
  p.step(null);
  stepper(host,p,['Candle 1: a normal candle. Note its high (bullish case) or its low (bearish case).','Candle 2: a big, aggressive candle. One side overwhelmed the other: this is the imbalance.','Candle 3: note its low (bullish) or high (bearish). Do the wicks of candle 1 and candle 3 overlap?','They do NOT overlap. The empty space between candle 1 and candle 3 is the Fair Value Gap. Price only traded one way there, so it often comes back to "fill" it.']);};

DG['fvg-return']=host=>{const cl=[44,46,45,47,56,68,72,70,66,62,60,64,72,79,86];const d=walk(cl,21,{open:42,wick:1.4});d[4]=[47,57,46.5,56];d[5]=[56,69,55,68];d[6]=[68,74,62,72];
  const p=new Plot(host,{n:16,h:300,min:36,max:92,label:'FVG fill'});const fl=d[4][1],fh=d[6][2];p.box(4,15.4,fl,fh,{color:'up',alpha:.18,label:'FVG',pos:'tr'});p.hline((fl+fh)/2,{from:4,color:'acc',label:'50% (CE)',dash:'3 4'});
  p.candles(d);p.text(10,56,'price returns into the FVG, then continues',{size:'sm',color:'acc',bold:1});};

DG['ob']=host=>{const D=[[70,72,60,62],[62,64,52,54],[54,56,44,46],[46,52,44,50],[50,51,40,42],[42,70,41,68],[68,82,60,80],[80,86,74,76],[76,78,64,66],[66,68,55,57],[57,59,47,50],[50,66,49,64],[64,80,62,78],[78,94,76,92]];
  const p=new Plot(host,{n:15,h:360,min:30,max:100,label:'Order block'});
  p.step(1);p.candles(D.slice(0,5));p.badge(4,31,'1',{color:'acc'});p.hline(44,{from:1.6,to:4.4,color:'mut',label:'prev low taken',below:1,side:'left'});
  p.step(2);p.candles(D.slice(5,7),5);p.badge(5,31,'2',{color:'acc'});p.box(4,14.4,51,60,{color:'pur',alpha:.18,label:'FVG',pos:'tr'});
  p.step(3);p.candle(7,...D[7]);p.hline(72,{from:0,to:7,color:'acc',label:'BOS: previous high broken',side:'left'});p.badge(7,91,'3',{color:'acc'});
  p.step(4);p.box(4,14.4,40,51,{color:'up',alpha:.2,label:'ORDER BLOCK = last bearish candle before the move',pos:'ur'});p.badge(13.8,45,'4',{color:'acc'});
  p.step(5);p.candles(D.slice(8,14),8);p.text(11.5,97,'price returns to the OB → reaction',{size:'sm',color:'acc',bold:1});
  p.step(null);
  stepper(host,p,['Price falls. Candle ① is the pivot: a bearish candle that takes out the previous candle\'s low (sweeps liquidity).','A sharp, substantial move up starts right after ①. It leaves a gap (FVG) between ①\'s high and the low of the candle two bars later.','The move breaks structure (BOS): it closes above the previous swing high. Now we know the move was real.','④ The Order Block is the range of candle ①, the last bearish candle before the sharp rally. Big money bought there and may still have orders waiting.','Later price comes back into the OB (re-entry for big money) and reacts upward. That return is your trade.']);};

/* ---------- LIQUIDITY ---------- */
DG['liq-patterns']=host=>{const g=grid(host,5);const o={n:10,w:240,h:180,grid:false};
  let p=mini(g,'1. High / Low','Any obvious peak or trough.',o);p.line([[0,25],[2,75],[4,35]],{color:'ink2'});p.line([[5,72],[7,25],[9,65]],{color:'ink2'});p.money(2,85);p.money(7,15);
  p=mini(g,'2. Strong high / low','The swing that caused a BOS.',o);p.line([[0,35],[1.5,55],[3,45],[5,82],[8,22]],{color:'ink2'});p.hline(45,{from:3,to:6.4,color:'acc',label:'BOS'});p.money(5,92);
  p=mini(g,'3. Equal highs / lows','Double or triple tops and bottoms.',o);p.line([[0,30],[2,75],[4,42],[6,75],[8,30]],{color:'ink2'});p.hline(75,{from:1,to:7,color:'down',dash:'4 3'});p.money(3,86);p.money(5,86);
  p=mini(g,'4. Trendlines','Several clean touches attract stops.',o);p.line([[0,15],[2,40],[3,30],[5,58],[6,47],[8,78],[9,66]],{color:'ink2'});p.line([[0,12],[9,64]],{color:'blue',dash:'5 4'});p.money(4,25);p.money(7,42);
  p=mini(g,'5. Support & resistance','Levels everybody can see.',o);p.hline(78,{color:'down',dash:'4 3'});p.hline(25,{color:'up',dash:'4 3'});p.line([[0,30],[1.5,77],[3,26],[4.5,77],[6,26],[7.5,77],[9,40]],{color:'ink2'});p.money(3,88);p.money(6,15);};

DG['sweep']=host=>{const D=[[50,56,48,55],[55,66,54,64],[64,70,60,62],[62,63,54,56],[56,58,50,52],[52,62,51,60],[60,70.2,58,61],[61,62,53,55],[55,57,49,51],[51,63,50,62],[62,69.8,61,66],[67,78,64,65],[65,66,55,57],[57,58,46,48],[48,50,38,40],[40,44,35,42]];
  const p=new Plot(host,{n:17,h:350,min:30,max:90,label:'Liquidity sweep'});
  p.step(1);p.candles(D.slice(0,11));p.hline(70,{from:2,to:10.6,color:'down',label:'EQUAL HIGHS',dash:'6 4',side:'left',below:1});
  p.step(2);[2,4,6,8,10].forEach(i=>p.money(i,75));p.text(6,83,'buy stops of sellers + breakout buy orders = FUEL',{size:'sm',color:'acc',bold:1});
  p.step(3);p.candle(11,...D[11]);p.box(10.5,11.5,70,78,{color:'acc',alpha:.25});p.text(11,79,'SWEEP',{color:'acc',bold:1,dx:10,anchor:'start'});
  p.step(4);p.candles(D.slice(12),12);p.text(7,36,'smart money sold into those buy orders → price drops',{size:'sm',color:'down',bold:1});
  p.step(null);
  stepper(host,p,['Price makes two highs at almost the same level. Retail traders see "resistance" or a "double top".','Above those highs sit stop losses of everyone who sold, plus buy-stop orders of breakout traders. That pool of orders is liquidity.','Price spikes above the highs, triggers all those orders, then closes back below. This is the liquidity sweep (stop hunt).','Big players used the buy orders to fill their large sell positions. With the fuel spent, price moves the other way.']);};

DG['inducement']=host=>{const p=new Plot(host,{n:16,h:330,label:'Inducement'});
  p.box(1.5,15.4,35,45,{color:'up',label:'Order block (real POI)',pos:'bl'});
  p.line([[0,40],[1,46],[2,36],[5,75],[7,58],[8,64],[10,40],[14,92]],{color:'ink2',draw:1,width:2.6});
  p.hline(58,{from:7,to:9.2,color:'acc',label:'IDM'});p.money(7.8,53,{small:1});p.money(8.5,53,{small:1});
  p.text(7,58,'early buyers enter here',{size:'sm',color:'acc',anchor:'end',dx:-12,dy:4});p.text(10,40,'IDM swept, then OB tapped',{size:'sm',color:'up',bold:1,anchor:'start',dx:12,dy:16});};

DG['flip']=host=>{const p=new Plot(host,{n:22,h:360,label:'Flip zone'});
  p.step(1);p.line([[0,85],[3,45],[5,70],[8,20],[10,55]],{width:2.6});p.badge(5,70,'1',{dy:-20});p.text(5,70,'supply reacts',{anchor:'start',dx:16,dy:-16,size:'sm',color:'down',bold:1});
  p.step(2);p.line([[10,55],[12,32]],{width:2.6});p.badge(12,32,'2',{dy:20});p.text(12,32,'fails to make a lower low',{anchor:'end',dx:-6,dy:34,size:'sm',color:'acc',bold:1});
  p.step(3);p.line([[12,32],[15,82]],{width:2.6,color:'up'});p.hline(70,{from:5,to:14.5,color:'acc',label:'CHoCH / MSS: break & close above',width:2,below:1});
  p.step(4);p.box(10,21.4,32,55,{color:'up',alpha:.16});p.text(13,24,'FLIP ZONE: old supply becomes demand',{anchor:'start',size:'sm',color:'up',bold:1});
  p.step(5);p.line([[15,82],[17,42],[21,95]],{width:2.6,color:'up'});p.badge(17,42,'3',{dy:18});p.text(17,42,'entry',{anchor:'end',dx:-16,dy:20,size:'sm',color:'acc',bold:1});
  p.step(null);
  stepper(host,p,['Downtrend. Price reaches a supply level ① and sellers react, pushing price lower. (Rule 1: price must react to supply.)','Price drops but fails to create a lower low ②. Sellers are getting weaker. (Rule 2.)','Buyers break AND close above the reaction point ①. This is the change of character (market structure shift). (Rule 3.)','Draw the flip zone from the top to the bottom of the reaction that caused the break (or refine it to the pivot candle). Control has flipped from sellers to buyers.','Wait for price to return into the flip zone ③ and enter there, with the stop below the zone.']);};

/* ---------- KILL ZONES ---------- */
DG['killzones']=host=>{const KZ=[['Asia','acc',20,24],['London','up',2,5],['New York','blue',7,10],['Close','pur',10,12]];const SES=[['Tokyo',19,28],['London',27,36],['New York',32,41]];
  const s=svgBox(host,720,250,'Kill zones timeline');const L=20,R=700,xh=h=>L+((h-18+48)%24)/24*(R-L);const xa=h=>L+(h-18)/24*(R-L);
  for(let h=18;h<=42;h+=2){const x=xa(h);S('line',{x1:x,x2:x,y1:30,y2:200,stroke:'line','stroke-dasharray':'2 5'},s);S('text',{x,y:222,'text-anchor':'middle',class:'lbl sm',fill:'mut',text:String(h%24).padStart(2,'0')+':00'},s);}
  S('text',{x:L,y:18,class:'lbl sm b',fill:'mut',text:'SESSIONS (approx.)'},s);
  SES.forEach((t,k)=>{const y=30+k*26;S('rect',{x:xa(t[1]),y,width:xa(t[2])-xa(t[1]),height:20,rx:6,fill:'ink2','fill-opacity':.14},s);S('text',{x:xa(t[1])+8,y:y+14,class:'lbl sm',fill:'ink2',text:t[0]},s);});
  S('text',{x:L,y:128,class:'lbl sm b',fill:'mut',text:'KILL ZONES'},s);
  KZ.forEach((k,i)=>{const x1=xh(k[2]),x2=k[3]===24?xa(24):xh(k[3]);const y=138+(i%2)*28;S('rect',{x:x1,y,width:x2-x1,height:24,rx:6,fill:k[1],'fill-opacity':.85},s);S('text',{x:(x1+x2)/2,y:y+16,'text-anchor':'middle',class:'lbl sm b',fill:'bg',text:k[0]},s);});
  S('text',{x:R,y:244,'text-anchor':'end',class:'lbl sm',fill:'mut',text:'times in New York time (ET)'},s);
  let ny=null,dl=0,du=0;try{const n=new Date();const pt=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(n);const hh=+pt.find(x=>x.type==='hour').value,mm=+pt.find(x=>x.type==='minute').value;ny=hh*60+mm;
    dl=((n.getHours()*60+n.getMinutes()-ny)%1440+1440)%1440;du=((n.getUTCHours()*60+n.getUTCMinutes()-ny)%1440+1440)%1440;}catch(e){ny=null;du=300;}
  if(ny!=null){const x=xh(ny/60);S('line',{x1:x,x2:x,y1:26,y2:200,stroke:'down','stroke-width':2},s);S('text',{x,y:24,'text-anchor':'middle',class:'lbl sm b',fill:'down',text:'NOW'},s);}
  const f=m=>{m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
  H('div',{class:'tbl-wrap'},host,`<table class="tbl"><tr><th>Kill zone</th><th>New York time</th><th>UTC (today)</th><th>Your local time</th></tr>`+KZ.map(k=>`<tr><td>${k[0]==='Close'?'London close':k[0]}</td><td>${f(k[2]*60)} to ${f(k[3]*60)}</td><td>${f(k[2]*60+du)} to ${f(k[3]*60+du)}</td><td>${f(k[2]*60+dl)} to ${f(k[3]*60+dl)}</td></tr>`).join('')+'</table>');};

DG['london-sweep']=host=>{const p=new Plot(host,{n:26,h:320,label:'London sweeps Asian high'});
  p.box(0,9,46,62,{color:'acc',alpha:.1,label:'ASIAN RANGE',pos:'tl'});p.vline(9.5);p.text(13,96,'London kill zone',{size:'sm',color:'up',bold:1});
  p.line([[0,52],[1,58],[2,50],[3,61],[4,48],[5,57],[6,47],[7,60],[8,53],[9,56],[10.5,68],[11.5,60],[13,40],[14,46],[16,28],[18,34],[21,18],[25,22]],{draw:1,width:2.6});
  p.hline(62,{from:3,to:11,color:'acc',label:'Asian high'});p.dot(10.5,68,{color:'down'});p.text(10.5,68,'sweep = high of the day',{anchor:'start',dx:12,dy:-4,size:'sm',color:'down',bold:1});
  p.text(19,62,'bearish daily structure: price runs lower',{size:'sm',color:'down'});};

/* ---------- DAILY BIAS ---------- */
DG['bias-example']=host=>{const p=new Plot(host,{n:30,h:340,label:'Daily bias example'});
  p.vline(14.5);p.text(7,98,'YESTERDAY',{size:'sm',color:'mut',bold:1});p.text(22,98,'TODAY',{size:'sm',color:'mut',bold:1});
  p.box(14.5,29.4,28,53,{color:'up',alpha:.09,label:'discount: buy zone',pos:'br',noStroke:1});
  p.hline(78,{from:8,color:'acc',label:'PDH (previous day high): liquidity target',side:'left'});p.hline(28,{from:12,color:'mut',label:'PDL',below:1});p.hline(53,{from:14.5,color:'mut',label:'50%',dash:'3 4'});
  p.line([[0,50],[3,72],[5,62],[8,78],[10,40],[12,28],[14,45],[15,45],[17,34],[18,40],[19,36],[22,62],[24,58],[27,82],[29,74]],{draw:1,width:2.6});
  p.dot(19,36,{color:'up',r:6});p.text(19,36,'buy',{dy:20,color:'up',bold:1,size:'sm'});p.dot(27,82,{color:'acc',r:6});p.text(27,82,'exit',{dy:-12,color:'acc',bold:1,size:'sm'});};

DG['bias-builder']=host=>{host.innerHTML=`<div class="ctrl"><label>HTF trend<select class="t"><option value="bull">Bullish (HH/HL)</option><option value="bear">Bearish (LH/LL)</option></select></label>
<label>Pair<input type="text" class="pr" value="EUR/USD"></label><label>POI / zone<input type="text" class="poi" value="1H demand at 1.0820"></label><label>Target liquidity<input type="text" class="tg" value="yesterday's high"></label><label>Invalidation<input type="text" class="iv" value="4H close below 1.0790"></label></div><div class="readout good out"></div>`;
  const q=x=>host.querySelector(x);function upd(){const b=q('.t').value==='bull';q('.out').innerHTML=`<b>My bias:</b> ${q('.pr').value} is <b class="${b?'up':'down'}">${b?'bullish':'bearish'}</b>. I look to <b>${b?'buy in discount':'sell in premium'}</b> at the ${q('.poi').value}, targeting ${q('.tg').value}. <b>Invalid if</b> ${q('.iv').value}. If invalidated: stop, reset, re-evaluate. No revenge trades.`;}
  host.querySelectorAll('input,select').forEach(e=>e.oninput=upd);upd();};

/* ---------- RISK ---------- */
DG['sltp']=host=>{const p=new Plot(host,{n:24,h:340,min:30,max:90,label:'Stop loss and take profit'});
  p.box(8,22.4,42,50,{color:'down',alpha:.18,label:'RISK  1R',pos:'bl',noStroke:1});p.box(8,22.4,50,74,{color:'up',alpha:.15,label:'REWARD  3R',pos:'tl',noStroke:1});
  p.box(3,8,44,49,{color:'blue',alpha:.2,noStroke:1});p.text(4.5,44,'demand',{dy:16,size:'sm',color:'blue'});
  p.hline(75,{to:1.5,color:'mut',side:'left'});p.text(0,75,'previous high = liquidity',{anchor:'start',dy:-6,size:'sm',color:'mut'});
  p.line([[0,75],[3,52],[4,58],[6,45],[7,54],[8,50],[11,62],[12,58],[16,74.5],[18,70],[21,80]],{draw:1,width:2.6});
  p.hline(50,{from:8,color:'ink',label:'ENTRY',dash:false});p.hline(42,{from:8,color:'down',label:'STOP LOSS: below the zone / consolidation',below:1,dash:false});p.hline(74,{from:8,color:'up',label:'TAKE PROFIT: before the liquidity',dash:false,side:'left'});};

DG['calc']=host=>{host.innerHTML=`<div class="ctrl"><label>Account balance ($)<input type="number" class="a" value="10000" min="0"></label><label>Risk per trade (%)<input type="number" class="r" value="1" step="0.25" min="0"></label><label>Stop loss (pips)<input type="number" class="s" value="20" min="1"></label><label>Take profit (pips)<input type="number" class="t" value="60" min="0"></label><label>Pip value per standard lot ($)<input type="number" class="pv" value="10" min="0.01" step="0.01"></label></div>
<div class="stat-row"><div class="stat"><small>Money at risk</small><b class="o1 down"></b></div><div class="stat"><small>Position size</small><b class="o2"></b></div><div class="stat"><small>Risk : Reward</small><b class="o3 acc"></b></div><div class="stat"><small>Profit if TP hits</small><b class="o4 up"></b></div></div><div class="readout o5"></div>`;
  const q=x=>host.querySelector(x);function upd(){const a=+q('.a').value,r=+q('.r').value,s=+q('.s').value,t=+q('.t').value,pv=+q('.pv').value;const risk=a*r/100,lots=s&&pv?risk/(s*pv):0,rr=s?t/s:0;
    q('.o1').textContent='$'+risk.toFixed(2);q('.o2').textContent=lots.toFixed(2)+' lots';q('.o3').textContent='1 : '+rr.toFixed(1);q('.o4').textContent='$'+(lots*t*pv).toFixed(2);
    const o=q('.o5');o.className='readout '+(r>2?'bad':rr<1.5?'mid':'good');o.innerHTML=`Position size = money at risk ÷ (stop pips × pip value) = ${risk.toFixed(2)} ÷ (${s} × ${pv}) = <b>${lots.toFixed(2)} standard lots</b> (${(lots*10).toFixed(1)} mini lots, ${(lots*100).toFixed(0)} micro lots).`+(r>2?' <b class="down">Risk above 2% per trade is aggressive: a normal losing streak will hurt badly.</b>':'')+(rr<1.5?' <b class="acc">RR below 1:1.5 needs a high win rate to be profitable.</b>':'');}
  host.querySelectorAll('input').forEach(e=>e.oninput=upd);upd();};

DG['drawdown']=host=>{const D=[[10,11.1],[20,25],[30,42.9],[40,66.7],[50,100],[60,150],[75,300],[90,900]];const s=svgBox(host,720,320,'Drawdown recovery');const L=50,R=705,T=20,B=270,mx=320;const y=v=>B-Math.min(v,mx)/mx*(B-T);const gw=(R-L)/D.length;
  [0,100,200,300].forEach(v=>{S('line',{x1:L,x2:R,y1:y(v),y2:y(v),stroke:'line','stroke-dasharray':'2 5'},s);S('text',{x:L-8,y:y(v)+4,'text-anchor':'end',class:'lbl sm',fill:'mut',text:v+'%'},s);});
  D.forEach((d,k)=>{const x=L+k*gw+gw*0.14,bw=gw*0.34;S('rect',{x,y:y(d[0]),width:bw,height:B-y(d[0]),rx:4,fill:'down','fill-opacity':.85},s);S('rect',{x:x+bw+3,y:y(d[1]),width:bw,height:B-y(d[1]),rx:4,fill:'up','fill-opacity':.85},s);
    S('text',{x:x+bw+3+bw/2,y:y(d[1])-6,'text-anchor':'middle',class:'lbl sm b',fill:'up',text:(d[1]>mx?'↑':'')+d[1]+'%'},s);S('text',{x:x+bw,y:B+18,'text-anchor':'middle',class:'lbl sm',fill:'ink2',text:'-'+d[0]+'%'},s);});
  S('rect',{x:L,y:298,width:12,height:12,rx:3,fill:'down'},s);S('text',{x:L+18,y:309,class:'lbl sm',fill:'ink2',text:'loss on account'},s);S('rect',{x:L+160,y:298,width:12,height:12,rx:3,fill:'up'},s);S('text',{x:L+178,y:309,class:'lbl sm',fill:'ink2',text:'gain needed just to get back to break-even'},s);};

DG['risk-sim']=host=>{const wrap=H('div',null,host);const chart=H('div',null,wrap);const ctrl=H('div',null,wrap,`<div class="ctrl"><label>Win rate <b class="wv"></b><input type="range" class="w" min="25" max="70" value="45"></label><label>Reward : Risk <b class="rv"></b><input type="range" class="r" min="1" max="4" step="0.5" value="2"></label><button class="btn ghost sm rr">🎲 New random sequence</button></div><div class="stat-row st"></div><div class="readout o"></div>`);
  const RK=[[1,'up'],[2,'blue'],[5,'acc'],[10,'down']];let seed=7;const q=x=>ctrl.querySelector(x);
  function run(){const wr=+q('.w').value/100,R=+q('.r').value;q('.wv').textContent=Math.round(wr*100)+'%';q('.rv').textContent=R+' : 1';const r=rng(seed);const seq=[];for(let k=0;k<100;k++)seq.push(r()<wr);
    const curves=RK.map(([rk])=>{let e=10000,pk=e,dd=0;const pts=[[0,e]];seq.forEach((w,k)=>{e=w?e*(1+rk/100*R):e*(1-rk/100);pk=Math.max(pk,e);dd=Math.max(dd,1-e/pk);pts.push([k+1,e]);});return{pts,end:e,dd};});
    let mn=Infinity,mx=-Infinity;curves.forEach(c=>c.pts.forEach(p=>{mn=Math.min(mn,p[1]);mx=Math.max(mx,p[1]);}));mn=Math.log10(Math.max(mn,1));mx=Math.log10(mx);
    chart.innerHTML='';const p=new Plot(chart,{n:101,h:300,min:mn-0.05,max:mx+0.05,label:'Equity curves',pad:{l:10,r:10,t:16,b:16}});p.hline(4,{color:'mut',label:'start $10,000',side:'left',below:1});
    curves.forEach((cv,k)=>p.line(cv.pts.map(x=>[x[0],Math.log10(Math.max(x[1],1))]),{color:RK[k][1],width:2.2}));
    q('.st').innerHTML=curves.map((cv,k)=>`<div class="stat" style="border-top:3px solid var(--${RK[k][1]==='acc'?'accent':RK[k][1]})"><small>${RK[k][0]}% risk / trade</small><b>$${Math.round(cv.end).toLocaleString()}</b><small>max drawdown ${Math.round(cv.dd*100)}%</small></div>`).join('');
    const exp=wr*R-(1-wr);const o=q('.o');o.className='readout '+(exp>0?'good':'bad');o.innerHTML=`Expectancy: <b>${exp>=0?'+':''}${exp.toFixed(2)}R per trade</b>. `+(exp>0?'The method has an edge. Notice how bigger risk turns the same edge into deep, scary drawdowns that most people cannot sit through.':'No edge: every risk level loses over time. Bigger risk just loses faster. Fix the method before you size up.')+' (Chart uses a log scale.)';}
  q('.w').oninput=run;q('.r').oninput=run;q('.rr').onclick=()=>{seed=Math.floor(Math.random()*1e6);run();};run();};

DG['breakeven']=host=>{const R=[0.5,1,1.5,2,2.5,3,4,5];const p=new Plot(host,{n:8,h:300,min:0,max:75,label:'Break-even win rate',pad:{l:14,r:14,t:20,b:34}});
  const pts=R.map((r,k)=>[k,100/(1+r)]);p.line(pts,{color:'acc',width:3,draw:1});pts.forEach((pt,k)=>{p.dot(pt[0],pt[1],{color:'acc'});p.text(pt[0],pt[1],Math.round(pt[1])+'%',{dy:-12,size:'sm',bold:1,color:'ink'});p.text(k,0,'1:'+R[k],{dy:22,size:'sm',color:'mut'});});
  p.text(5.5,55,'above the line: profitable',{size:'sm',color:'up',bold:1});p.text(1.6,12,'below the line: losing',{size:'sm',color:'down',bold:1});};

/* ---------- generic checklist ---------- */
DG['checklist']=host=>{let items=[];try{items=JSON.parse(host.getAttribute('data-items')||'[]');}catch(e){}checklist(host,items,host.getAttribute('data-ok')||'All ticked.',host.getAttribute('data-no')||'Not yet.');};

window.DG=DG;window.TN={Plot,S,H,stepper,checklist,walk,rng};
})();
