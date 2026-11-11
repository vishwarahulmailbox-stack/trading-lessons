/* Trader's Notebook : navigation, progress, quizzes */
(function(){
'use strict';
const LESSONS=[
 {s:'index',t:'Home',p:0,d:'Start here'},
 {s:'price-movement',t:'How Price Moves',p:1,q:'Q1',d:'Liquidity as fuel, balance vs imbalance, the 4 stages of price.'},
 {s:'forex-basics',t:'Forex Basics',p:1,q:'Q2',d:'Pairs, base and quote, pips, lots, who trades, the 3 Ms.'},
 {s:'trading-styles',t:'Trading Styles',p:1,q:'Q2',d:'Scalping to position trading, choosing your style and broker.'},
 {s:'mindset',t:'Beliefs & Mindset',p:1,q:'Q3',d:'Beliefs, the pre-trade process and the conviction loop.'},
 {s:'market-structure',t:'Market Structure',p:2,q:'Q4',d:'Trends, BOS, pullbacks, internal structure, CHoCH.'},
 {s:'candlesticks',t:'Candlesticks',p:2,q:'Q5',d:'Body vs wick, candle types, Heikin Ashi, HTF candles.'},
 {s:'top-down',t:'Top Down Analysis',p:2,q:'Q10',d:'HTF for direction, MTF for POI, LTF for entry.'},
 {s:'supply-demand',t:'Supply & Demand Zones',p:3,q:'Q6',d:'Institutional zones, range vs pivot method, 50% rule.'},
 {s:'premium-discount',t:'Premium & Discount',p:3,q:'Q7',d:'Buy cheap, sell expensive: the 50% line of a swing.'},
 {s:'fair-value-gap',t:'Fair Value Gaps',p:3,q:'Q8',d:'The 3 candle imbalance and why price returns to it.'},
 {s:'order-blocks',t:'Order Blocks',p:3,q:'Q9',d:'Where big money enters and re-enters. The 5 validity rules.'},
 {s:'liquidity',t:'Liquidity',p:3,q:'Q12',d:'Stops as fuel, sweeps, inducement, the 5 liquidity patterns.'},
 {s:'flip-zones',t:'Flip Zones',p:3,q:'Q13',d:'When supply becomes demand (and vice versa).'},
 {s:'kill-zones',t:'Kill Zones',p:4,q:'Q11',d:'The best hours to trade, converted to your local time.'},
 {s:'daily-bias',t:'Daily Bias',p:4,q:'Q14',d:'A plan, not a prediction. 9 steps, exits, 5 mistakes.'},
 {s:'when-not-to-trade',t:'When Not to Trade & SL/TP',p:4,q:'Q15 to Q16',d:'No-trade conditions, stop loss and take profit placement.'},
 {s:'risk-management',t:'Risk Management',p:4,q:'Q17',d:'Position sizing, drawdown maths, risk simulator.'},
 {s:'cheat-sheet',t:'Cheat Sheet & Glossary',p:5,d:'The whole process on one page plus every abbreviation.'}
];
const PARTS=['','Foundations','Reading the Chart','Zones & Concepts','Execution','Reference'];
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const root=document.documentElement;
let th=store.get('tn-theme',null);if(!th){try{th=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}catch(e){th='dark';}}root.setAttribute('data-theme',th);
const page=document.body.getAttribute('data-page')||'index';
const done=new Set(store.get('tn-done',[]));
const counted=LESSONS.filter(l=>l.p>=1&&l.p<=4);
const numOf=l=>l.p===0?'⌂':l.p===5?'★':String(counted.indexOf(l)+1);

function sidebar(){const sb=document.getElementById('sidebar');if(!sb)return;const n=counted.filter(l=>done.has(l.s)).length;
  let h=`<a class="brand" href="index.html"><span class="logo">▲▼</span><span><b>Trader's Notebook</b><small>Price action, explained</small></span></a><div class="prog"><div class="prog-bar"><i style="width:${n/counted.length*100}%"></i></div>${n} of ${counted.length} lessons complete</div><nav>`;
  PARTS.forEach((pt,pi)=>{const ls=LESSONS.filter(l=>l.p===pi);if(pt)h+=`<div class="part">${pi<5?'Part '+pi+' · ':''}${pt}</div>`;ls.forEach(l=>{h+=`<a href="${l.s}.html" class="${l.s===page?'active':''} ${done.has(l.s)?'done':''}"><span class="num">${done.has(l.s)?'✓':numOf(l)}</span>${l.t}</a>`;});});
  h+='</nav><button class="theme-btn" id="themeBtn">◐ Light / dark</button>';sb.innerHTML=h;
  document.getElementById('themeBtn').onclick=()=>{th=th==='dark'?'light':'dark';root.setAttribute('data-theme',th);store.set('tn-theme',th);};}

function shell(){const bar=document.createElement('div');bar.id='readbar';document.body.prepend(bar);
  const top=document.createElement('div');top.className='topbar';top.innerHTML='<button aria-label="Menu">☰</button><span>Trader\'s Notebook</span>';const main=document.querySelector('.main');if(main)main.prepend(top);
  top.querySelector('button').onclick=()=>document.body.classList.toggle('nav-open');
  const sc=document.createElement('div');sc.className='scrim';sc.onclick=()=>document.body.classList.remove('nav-open');document.body.appendChild(sc);
  addEventListener('scroll',()=>{const h=document.documentElement;const p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);bar.style.width=(p*100)+'%';},{passive:true});}

function pager(){const el=document.getElementById('pager');if(!el)return;const i=LESSONS.findIndex(l=>l.s===page);const pv=LESSONS[i-1],nx=LESSONS[i+1];
  el.innerHTML=(pv?`<a class="prev" href="${pv.s}.html"><small>← Previous</small>${pv.t}</a>`:'')+(nx?`<a class="next" href="${nx.s}.html"><small>Next →</small>${nx.t}</a>`:'');
  const me=LESSONS[i];if(me&&me.p>=1&&me.p<=4){const c=document.createElement('div');c.className='complete';const b=document.createElement('button');b.className='btn';c.appendChild(b);el.before(c);
    const set=()=>{b.textContent=done.has(page)?'✓ Lesson complete':'Mark lesson as complete';b.classList.toggle('is-done',done.has(page));};set();
    b.onclick=()=>{done.has(page)?done.delete(page):done.add(page);store.set('tn-done',[...done]);set();sidebar();};}
  const f=document.createElement('p');f.className='footer-note';f.textContent='Educational content built from personal study notes. Not financial advice. Trading leveraged products such as forex carries a high risk of losing money; practise on a demo account first.';el.after(f);}

function quiz(){const dataEl=document.getElementById('quiz-data'),host=document.getElementById('quiz');if(!dataEl||!host)return;let Q=[];try{Q=JSON.parse(dataEl.textContent);}catch(e){return;}
  let h='<div class="quiz"><h2>🧠 Check your understanding</h2><div class="qsub">Pick an answer to see the explanation. Get them all right to complete the lesson.</div>';
  Q.forEach((q,i)=>{h+=`<div class="qq" data-i="${i}"><div class="qt">${i+1}. ${q.q}</div><div class="opts">`+q.o.map((o,j)=>`<button data-j="${j}">${o}</button>`).join('')+`</div><div class="why"></div></div>`;});
  h+='<div class="qscore"></div></div>';host.innerHTML=h;let right=0,answered=0;
  host.querySelectorAll('.qq').forEach(box=>{const q=Q[+box.dataset.i];box.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(box.classList.contains('answered'))return;box.classList.add('answered');answered++;const j=+b.dataset.j;
    box.querySelectorAll('button').forEach(x=>{x.disabled=true;if(+x.dataset.j===q.a)x.classList.add('right');});if(j!==q.a)b.classList.add('wrong');else right++;
    box.querySelector('.why').innerHTML=(j===q.a?'<b class="up">Correct.</b> ':'<b class="down">Not quite.</b> ')+q.w;
    if(answered===Q.length){host.querySelector('.qscore').textContent=`Score: ${right} / ${Q.length}`+(right===Q.length?'  🎉 Lesson marked complete':'  Review the sections above and try again (reload the page).');
      if(right===Q.length){done.add(page);store.set('tn-done',[...done]);sidebar();const cb=document.querySelector('.complete .btn');if(cb){cb.textContent='✓ Lesson complete';cb.classList.add('is-done');}}}});});}

function diagrams(){document.querySelectorAll('[data-dg]').forEach(el=>{const f=window.DG&&window.DG[el.getAttribute('data-dg')];if(!f)return;try{f(el);}catch(e){console.error(e);el.textContent='(diagram could not load)';}});
  const paths=document.querySelectorAll('.draw');paths.forEach(p=>{try{const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=L;}catch(e){}});
  const go=svg=>svg.querySelectorAll('.draw').forEach(p=>p.style.strokeDashoffset=0);
  const svgs=new Set();paths.forEach(p=>svgs.add(p.ownerSVGElement));
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){go(e.target);io.unobserve(e.target);}}),{threshold:.25});svgs.forEach(s=>s&&io.observe(s));}else svgs.forEach(s=>s&&go(s));}

function home(){const g=document.getElementById('lesson-grid');if(!g)return;let h='';
  PARTS.forEach((pt,pi)=>{if(!pi)return;h+=`<div class="part-title" style="grid-column:1/-1">Part ${pi} · ${pt}</div>`;LESSONS.filter(l=>l.p===pi).forEach(l=>{h+=`<a class="lcard ${done.has(l.s)?'done':''}" href="${l.s}.html"><span class="ln">${l.p===5?'REFERENCE':'LESSON '+numOf(l)}${l.q?' · NOTES '+l.q:''}</span><b>${l.t}</b><span>${l.d}</span></a>`;});});g.innerHTML=h;}

shell();sidebar();diagrams();quiz();pager();home();
})();
