/* ══ RoadSafe India — Core AI Engine ══ */
Chart.defaults.color='#94a3b8';Chart.defaults.borderColor='rgba(255,255,255,0.06)';Chart.defaults.font.family='Inter';

// ── Auth guard ──────────────────────────
const _s=RS.guard();
if(_s){document.getElementById('navAvatar').textContent=_s.avatar;document.getElementById('navName').textContent=_s.name;}

// ── Toast ───────────────────────────────
function toast(msg,type='info'){
  const tc=document.getElementById('toastContainer');
  const t=document.createElement('div');
  t.style.cssText=`background:#0b1120;border:1px solid ${type==='error'?'rgba(239,68,68,.4)':type==='success'?'rgba(34,197,94,.4)':'rgba(249,115,22,.4)'};border-radius:10px;padding:.75rem 1.1rem;font-size:.82rem;color:${type==='error'?'#f87171':type==='success'?'#4ade80':'#fb923c'};box-shadow:0 8px 24px rgba(0,0,0,.4);animation:toaIn .3s ease;`;
  t.textContent=msg;tc.appendChild(t);
  setTimeout(()=>t.remove(),4000);
}

// ── Stat counters ───────────────────────
window.addEventListener('scroll',()=>document.getElementById('navbar').classList.toggle('scrolled',scrollY>50),{passive:true});
const cObs=new IntersectionObserver(e=>{if(e[0].isIntersecting){document.querySelectorAll('[data-to]').forEach(el=>{const to=parseFloat(el.dataset.to),dec=parseInt(el.dataset.dec||0),suf=el.dataset.suffix||'';let c=0,inc=to/110;const t=setInterval(()=>{c=Math.min(c+inc,to);el.textContent=(dec?c.toFixed(dec):Math.floor(c))+suf;if(c>=to)clearInterval(t);},16);});}},{threshold:.4});
const hs=document.querySelector('.hero-stats');if(hs)cObs.observe(hs);

// ════ MODULE 1 — FOL ENGINE (kept for internal analysis logic) ════
// Note: FOL Prolog Rule Engine section UI has been removed from display.
// The FOL engine below is still used internally by runAnalysis() for risk scoring.
const FOL_RULES=[
  {id:'R1',head:'dangerous(Road)',body:['highway(Road)','weather(rain)','time(night)'],sev:'EXTREME',desc:'Highway + Rain + Night → Extreme'},
  {id:'R2',head:'dangerous(Road)',body:['road_condition(poor)','speed_limit(high)'],sev:'HIGH',desc:'Poor Road + High Speed → High Risk'},
  {id:'R3',head:'high_risk(Road)',body:['historical_accident_zone(Road)','traffic(heavy)'],sev:'HIGH',desc:'Accident Zone + Heavy Traffic'},
  {id:'R4',head:'moderate_risk(Road)',body:['urban(Road)','time(night)','traffic(heavy)'],sev:'MODERATE',desc:'Urban + Night + Heavy Traffic'},
  {id:'R5',head:'dangerous(Road)',body:['weather(fog)','speed_limit(high)'],sev:'EXTREME',desc:'Dense Fog + High Speed → Extreme'},
  {id:'R6',head:'safe(Road)',body:['weather(clear)','time(day)','road_condition(good)','divider(present)'],sev:'LOW',desc:'Clear + Day + Good + Divider → Safe'},
  {id:'R7',head:'danger_zone(Road)',body:['festival_season(true)','highway(Road)','time(night)'],sev:'EXTREME',desc:'Festival + Highway + Night'},
  {id:'R8',head:'moderate_risk(Road)',body:['construction(Road)','traffic(moderate)'],sev:'MODERATE',desc:'Construction Zone + Traffic'},
];

// renderFOLRules() — UI display removed; kept for reference
// function renderFOLRules(){...}

function buildFacts(inp){
  const f=new Set();
  if(['national_highway','expressway'].includes(inp.roadtype))f.add('highway(Road)');
  if(inp.roadtype==='urban')f.add('urban(Road)');
  f.add(`weather(${inp.weather==='heavy_rain'?'rain':inp.weather})`);
  if(inp.weather==='fog')f.add('weather(fog)');
  ['night','evening'].includes(inp.timeofday)?f.add('time(night)'):f.add(`time(${inp.timeofday})`);
  f.add(`road_condition(${inp.roadcondition==='construction'?'poor':inp.roadcondition})`);
  if(inp.roadcondition==='construction')f.add('construction(Road)');
  f.add(parseInt(inp.speedlimit)>=100?'speed_limit(high)':parseInt(inp.speedlimit)<=60?'speed_limit(low)':'speed_limit(medium)');
  f.add(`traffic(${inp.traffic==='jam'?'heavy':inp.traffic})`);
  if(inp.festival)f.add('festival_season(true)');
  if(inp.accident_history)f.add('historical_accident_zone(Road)');
  if(inp.divider)f.add('divider(present)');
  return f;
}

function evalFOL(inp){const facts=buildFacts(inp);const fired=[],unfired=[];FOL_RULES.forEach(r=>(r.body.every(b=>facts.has(b))?fired:unfired).push(r));return{fired,unfired,facts};}

function renderFOLTerminal(fired,facts){
  const el=document.getElementById('folTerminal');if(!el)return;
  const boot=[
    {p:'%',t:'─── Prolog FOL Engine v2.1 ── 8 rules loaded ───',c:'comment'},
    {p:':-',t:'assert(highway(delhi_agra)).',c:'fact'},
    {p:':-',t:'assert(historical_accident_zone(delhi_agra)).',c:'fact'},
    ...FOL_RULES.map(r=>({p:':-',t:`${r.head}:- ${r.body.join(', ')}.`,c:'rule'})),
    {p:'%',t:'── Run Analyzer to see live unification ──',c:'comment'},
  ];
  const lines=fired?[
    {p:'%',t:`── Analysis at ${new Date().toLocaleTimeString()} ──`,c:'comment'},
    {p:'%',t:`── ${facts.size} facts asserted ──`,c:'comment'},
    ...[...facts].map(f=>({p:'+',t:f,c:'fact'})),
    {p:'%',t:'── Unification Pass ──',c:'comment'},
    ...FOL_RULES.map(r=>{const ok=fired.find(x=>x.id===r.id);return{p:ok?'✓':'✗',t:`${r.head}:-[${r.body.join(', ')}]`,c:ok?'ok':'fail'};}),
    fired.length?{p:'⚠',t:`VERDICT: ${fired.length} danger rule(s) FIRED → ${fired[0].sev}`,c:'warn'}:{p:'✓',t:'VERDICT: No extreme danger rules triggered.',c:'ok'},
  ]:boot;
  el.innerHTML=lines.map(l=>`<div class="fl-line"><span class="fl-pre">${l.p}</span><span class="fl-txt ${l.c}">${l.t}</span></div>`).join('');
}

// ════ MODULE 2 — BAYESIAN ══════════════
const LR={rain:2.8,fog:3.4,night:2.2,highway:1.9,poor_road:2.5,heavy_traffic:1.6,festival:2.1,no_divider:1.4};
const BASE=0.058;
const BLABELS={rain:'≋ Rain',fog:'≈ Fog',night:'◉ Night',highway:'▬ Highway',poor_road:'◌ Poor Road',heavy_traffic:'▶ Heavy Traffic',festival:'✧ Festival',no_divider:'│ No Divider'};
const bState={rain:.5,fog:.2,night:.5,highway:.6,poor_road:.4,heavy_traffic:.4,festival:.2,no_divider:.5};

function computeBayes(ev){let p=BASE;Object.entries(ev).forEach(([k,v])=>{if(v&&LR[k])p*=LR[k];});return Math.min(0.97,Math.round(p*100)/100);}

function initBayesSliders(){
  const c=document.getElementById('bayesSliders');if(!c)return;
  c.innerHTML='';
  Object.entries(bState).forEach(([k,v])=>{
    const d=document.createElement('div');d.className='bs-item';
    d.innerHTML=`<div class="bs-head"><span class="bs-lbl">${BLABELS[k]}</span><span class="bs-val" id="bv-${k}">${Math.round(v*100)}%</span></div><input type="range" class="bs-range" id="bs-${k}" min="0" max="100" value="${Math.round(v*100)}" oninput="onBS('${k}',this.value)"/>`;
    c.appendChild(d);
  });
  updateBayesian();
}
function onBS(k,val){bState[k]=val/100;document.getElementById(`bv-${k}`).textContent=val+'%';}

function updateBayesian(){
  const ev={};Object.entries(bState).forEach(([k,v])=>ev[k]=v>0.5);
  const prob=computeBayes(ev),pct=Math.round(prob*100);
  document.getElementById('dialPct').textContent=pct+'%';
  updateDial(prob);
  const net=document.getElementById('bayesNetwork');
  if(net)net.innerHTML=`<div class="bn-vis-title">Evidence Nodes</div><div class="bn-nodes">${Object.entries(ev).map(([k,v])=>`<span class="bn-node ${v?'bn-active':'bn-inactive'}">${BLABELS[k].split(' ').slice(1).join(' ')}: ${Math.round(bState[k]*100)}%</span>`).join('')}<span class="bn-node" style="border-color:#f59e0b;color:#fbbf24;background:rgba(245,158,11,.1)">P(Accident)=${pct}%</span></div>`;
  const bd=document.getElementById('probBreakdown');if(!bd)return;
  const rows=[{l:'Rain/Fog',v:ev.rain||ev.fog?.85:.15,c:'#3b82f6'},{l:'Night/Visibility',v:ev.night?.78:.20,c:'#6366f1'},{l:'Road Condition',v:ev.poor_road?.72:.22,c:'#f97316'},{l:'Highway Speed',v:ev.highway?.65:.25,c:'#ef4444'},{l:'Traffic',v:ev.heavy_traffic?.60:.30,c:'#f59e0b'},{l:'Festival',v:ev.festival?.55:.10,c:'#a855f7'}];
  bd.innerHTML=rows.map(r=>`<div class="pb-row"><span class="pb-lbl">${r.l}</span><div class="pb-track"><div class="pb-fill" style="width:${Math.round(r.v*100)}%;background:${r.c}"></div></div><span class="pb-val" style="color:${r.c}">${Math.round(r.v*100)}%</span></div>`).join('');
}
function updateDial(p){
  const ang=p*Math.PI,r=88,cx=110,cy=108;
  const x=cx+r*Math.cos(Math.PI-ang),y=cy-r*Math.sin(Math.PI-ang),la=ang>Math.PI/2?1:0;
  const arc=document.getElementById('dialArc');
  if(arc)arc.setAttribute('d',`M22,108 A${r},${r} 0 ${la},1 ${x.toFixed(1)},${y.toFixed(1)}`);
}

// ════ MODULE 3 — PCA ═══════════════════
function drawPCA(){
  const cv=document.getElementById('pcaCanvas');if(!cv)return;
  const ctx=cv.getContext('2d'),W=cv.offsetWidth||540,H=Math.round(W*.74);
  cv.width=W;cv.height=H;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.roundRect(0,0,W,H,10);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=W/10){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=H/8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  const ox=W/2,oy=H/2;
  ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1.2;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(20,oy);ctx.lineTo(W-20,oy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(ox,20);ctx.lineTo(ox,H-20);ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='rgba(255,255,255,.2)';ctx.font='10px Inter';ctx.fillText('PC1→',W-50,oy-6);ctx.fillText('PC2↑',ox+6,24);
  const toX=p=>ox+(p/4.8)*(W/2-30),toY=p=>oy-(p/2.6)*(H/2-26);
  const clusters=[{cx:3,cy:1.7,cl:'rgba(239,68,68,'},{cx:.4,cy:.2,cl:'rgba(249,115,22,'},{cx:-2.4,cy:-1.3,cl:'rgba(34,197,94,'}];
  clusters.forEach(c=>{const x=toX(c.cx),y=toY(c.cy),g=ctx.createRadialGradient(x,y,0,x,y,100);g.addColorStop(0,c.cl+'0.1)');g.addColorStop(1,c.cl+'0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,100,0,Math.PI*2);ctx.fill();});
  const rng=s=>{let x=Math.sin(s+1)*1e4;return x-Math.floor(x);};
  [{cx:3,cy:1.7,col:'rgba(239,68,68,.85)',n:35,hs:['Delhi-Agra','Lko-Agra Exp','NH-44 Dhule']},{cx:.4,cy:.2,col:'rgba(249,115,22,.85)',n:45,hs:['Delhi-Jaipur','Pune-Solapur','Ahmd-Vadodara']},{cx:-2.4,cy:-1.3,col:'rgba(34,197,94,.85)',n:30,hs:['Blr Ring Rd','Hyd-Warangal']}].forEach((c,ci)=>{
    for(let i=0;i<c.n;i++){const s=ci*1e3+i*7+13,a=rng(s)*Math.PI*2,r2=rng(s+1)*1.1;const x=toX(c.cx+Math.cos(a)*r2*.85),y=toY(c.cy+Math.sin(a)*r2*.55);ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fillStyle=c.col;ctx.fill();if(i<c.hs.length){ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='8px Inter';ctx.fillText(c.hs[i],x+6,y+3);}}
    const x=toX(c.cx),y=toY(c.cy);ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fillStyle=c.col;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();
  });
  ctx.setLineDash([5,4]);ctx.lineWidth=1.2;
  [[toX(3),toY(1.7),110,65,'rgba(239,68,68,.35)',0.15],[toX(.4),toY(.2),100,70,'rgba(249,115,22,.3)',-0.1],[toX(-2.4),toY(-1.3),105,60,'rgba(34,197,94,.3)',0.12]].forEach(([x,y,rx,ry,s,rot])=>{ctx.strokeStyle=s;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);ctx.stroke();});
  ctx.setLineDash([]);
}

// ════ HOTSPOTS ═════════════════════════
const HOTSPOTS=[
  {name:'Delhi–Agra Expressway',nh:'NH-19 | UP',deaths:423,acc:1840,risk:92,sev:'extreme',emoji:'●',reasons:'4-lane high speed · Fog winters · Night driving'},
  {name:'Mumbai–Pune Expressway',nh:'NH-48 | MH',deaths:312,acc:1450,risk:85,sev:'extreme',emoji:'●',reasons:'Ghat curves · Heavy rain · Overloaded trucks'},
  {name:'NH-44 Dhule–Nandurbar',nh:'NH-44 | MH',deaths:289,acc:1120,risk:81,sev:'extreme',emoji:'●',reasons:'Two-lane undivided · No lighting'},
  {name:'Delhi–Jaipur Highway',nh:'NH-48 | RJ',deaths:268,acc:1380,risk:78,sev:'high',emoji:'●',reasons:'High speed · Fog winter · Unmarked crossings'},
  {name:'Bangalore–Chennai',nh:'NH-48 | TN',deaths:241,acc:1010,risk:74,sev:'high',emoji:'●',reasons:'Night buses · Animal crossing · Fatigue'},
  {name:'Lucknow–Agra Expressway',nh:'UP Exp. Auth.',deaths:198,acc:890,risk:70,sev:'high',emoji:'●',reasons:'Very high speed · Winter fog'},
  {name:'Chennai–Trichy',nh:'NH-44 | TN',deaths:176,acc:780,risk:65,sev:'high',emoji:'●',reasons:'Two-lane · Truck fatigue · Rain'},
  {name:'Ahmedabad–Vadodara',nh:'NH-48 | GJ',deaths:154,acc:720,risk:58,sev:'moderate',emoji:'●',reasons:'High speed merges · Dust storms'},
  {name:'Hyderabad–Warangal',nh:'NH-163 | TG',deaths:132,acc:640,risk:52,sev:'moderate',emoji:'●',reasons:'Urban fringe · Two-wheelers'},
  {name:'Pune–Solapur',nh:'NH-65 | MH',deaths:118,acc:590,risk:48,sev:'moderate',emoji:'●',reasons:'Agricultural traffic · Speed variation'},
];

function renderHotspots(){
  const g=document.getElementById('hotspotGrid');if(!g)return;
  g.innerHTML=HOTSPOTS.map(h=>`<div class="hs-card" onclick="fillAnalyzer('${h.name}')"><div class="hs-head"><div><div class="hs-name">${h.name}</div><div class="hs-nh">${h.nh}</div></div><span style="font-size:1.4rem">${h.emoji}</span></div><div class="hs-stats"><div class="hs-s"><div class="hs-n" style="color:var(--red)">${h.deaths}</div><div class="hs-l">Deaths/yr</div></div><div class="hs-s"><div class="hs-n" style="color:var(--orange)">${h.acc.toLocaleString()}</div><div class="hs-l">Accidents/yr</div></div></div><div class="hs-reasons">${h.reasons}</div><div class="hs-bar-track"><div class="hs-bar-fill hs-fill-${h.sev[0]}" style="width:${h.risk}%"></div></div><div class="hs-score-row"><span>Risk Score</span><span style="color:${h.sev==='extreme'?'var(--red)':h.sev==='high'?'var(--orange)':'var(--yellow)'}">${h.risk}/100</span></div></div>`).join('');
}
function fillAnalyzer(name){const m={'Delhi–Agra Expressway':'Delhi–Agra Expressway','Mumbai–Pune Expressway':'Mumbai–Pune Expressway','Bangalore–Chennai':'Bangalore–Chennai','Delhi–Jaipur Highway':'Delhi–Jaipur Highway','Lucknow–Agra Expressway':'Lucknow–Agra Expressway'};const l=document.getElementById('location');if(l&&m[name])l.value=m[name];document.getElementById('analyzer').scrollIntoView({behavior:'smooth'});}

// ════ CONFUSION MATRIX ═════════════════
function renderConfMatrix(){
  const el=document.getElementById('confMatrix');if(!el)return;
  const labels=['Extreme','High','Moderate'],m=[[17820,2134,1080],[2310,35040,2502],[980,2740,52394]],max=Math.max(...m.flat());
  let h=`<div class="cm-cell cm-head"></div>${labels.map(l=>`<div class="cm-cell cm-head">Pred ${l}</div>`).join('')}`;
  m.forEach((row,i)=>{h+=`<div class="cm-cell cm-head">Act. ${labels[i]}</div>`;row.forEach((v,j)=>{const a=0.1+(v/max)*.75;h+=`<div class="cm-cell" style="background:${i===j?`rgba(34,197,94,${a})`:`rgba(239,68,68,${a*.6})`};font-size:.72rem;font-weight:${i===j?700:400};color:${i===j?'#4ade80':'#f87171'}">${v.toLocaleString()}</div>`;});});
  el.innerHTML=h;
}

// ════ CHARTS ═══════════════════════════
function initCharts(){
  new Chart(document.getElementById('elbowChart'),{type:'line',data:{labels:['k=1','k=2','k=3','k=4','k=5','k=6'],datasets:[{label:'WCSS',data:[1842,980,412,390,381,378],borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,.1)',tension:.4,fill:true,pointBackgroundColor:['#94a3b8','#94a3b8','#ef4444','#94a3b8','#94a3b8','#94a3b8'],pointRadius:[4,4,8,4,4,4]}]},options:{responsive:true,scales:{x:{grid:{color:'rgba(255,255,255,.04)'}},y:{grid:{color:'rgba(255,255,255,.04)'}}},plugins:{legend:{display:false}}}});
  new Chart(document.getElementById('silhouetteChart'),{type:'bar',data:{labels:['k=2','k=3','k=4','k=5','k=6'],datasets:[{data:[.51,.68,.60,.55,.48],backgroundColor:['rgba(59,130,246,.7)','rgba(34,197,94,.9)','rgba(59,130,246,.6)','rgba(59,130,246,.5)','rgba(59,130,246,.4)'],borderRadius:5}]},options:{responsive:true,scales:{x:{grid:{color:'rgba(255,255,255,.04)'}},y:{min:0,max:1,grid:{color:'rgba(255,255,255,.04)'}}},plugins:{legend:{display:false}}}});
  // rocChart removed (Evaluation section removed)
}

// ════ ANALYSIS HISTORY ═════════════════
function renderHistory(){
  const hist=RS.getHistory();
  const tb=document.getElementById('historyTable');if(!tb)return;
  if(!hist.length){tb.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)">No analyses yet. Run your first analysis above!</td></tr>`;return;}
  tb.innerHTML=hist.map(h=>`<tr><td>${h.location||'—'}</td><td><span class="risk-tag ${h.riskLevel?.toLowerCase()}">${h.riskLevel||'?'}</span></td><td style="font-weight:700;color:${h.riskLevel==='EXTREME'?'#f87171':h.riskLevel==='HIGH'?'#fb923c':'#4ade80'}">${h.score||'?'}%</td><td>${h.weather||'—'}</td><td>${h.roadtype||'—'}</td><td>${h.timeofday||'—'}</td><td style="color:var(--muted);font-size:.72rem">${h.time||'—'}</td></tr>`).join('');
}
function exportHistoryCSV(){
  const h=RS.getHistory();if(!h.length){toast('No history to export','error');return;}
  const rows=[['Location','Risk','Score','Weather','Road','Time','Date'],...h.map(x=>[x.location,x.riskLevel,x.score,x.weather,x.roadtype,x.timeofday,x.time])];
  const csv=rows.map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download=`roadsafe-history-${Date.now()}.csv`;a.click();
  toast('History exported as CSV ✓','success');
}

// ════ MAIN ANALYSIS ════════════════════
const RECS={EXTREME:['⚠ Consider alternate route — extreme conditions','⚠ Keep both hands on wheel at all times','● Headlights + fog lights mandatory','◐ Reduce speed by 50%+ of posted limit','■ Stop at rest areas if conditions worsen'],HIGH:['⚠ Reduce speed 30-40%','● Use fog lights, 100m+ following distance','⚠ No overtaking on divided sections','◆ Beware of aquaplaning on wet surfaces'],MODERATE:['✓ Maintain posted speed','▶ Keep 60m following distance','⚠ Watch for potholes'],LOW:['✓ Safe conditions — standard driving practices','▶ Rest every 2 hours on long routes']};

async function runAnalysis(){
  const btn=document.getElementById('analyzeBtn');
  btn.querySelector('.btn-txt').style.display='none';btn.querySelector('.btn-ld').style.display='flex';btn.disabled=true;
  await new Promise(r=>setTimeout(r,1600));
  const inp={location:document.getElementById('location').value,weather:document.getElementById('weather').value,timeofday:document.getElementById('timeofday').value,roadtype:document.getElementById('roadtype').value,traffic:document.getElementById('traffic').value,roadcondition:document.getElementById('roadcondition').value,speedlimit:document.getElementById('speedlimit').value,festival:document.getElementById('festival').checked,accident_history:document.getElementById('accident_history').checked,divider:document.getElementById('divider').checked};
  const{fired,facts}=evalFOL(inp);
  const bEv={rain:['rain','heavy_rain'].includes(inp.weather),fog:inp.weather==='fog',night:['night','evening'].includes(inp.timeofday),highway:['national_highway','expressway'].includes(inp.roadtype),poor_road:['poor','construction'].includes(inp.roadcondition),heavy_traffic:['heavy','jam'].includes(inp.traffic),festival:inp.festival,no_divider:!inp.divider};
  const bProb=computeBayes(bEv);
  const fScore=[0,40,65,78,90][Math.min(fired.length,4)];
  const score=Math.min(97,Math.max(3,Math.round(fScore*.45+Math.round(bProb*100)*.55)));
  const rl=fired.some(r=>r.sev==='EXTREME')?'EXTREME':fired.some(r=>r.sev==='HIGH')?'HIGH':score>=60?'HIGH':score>=35?'MODERATE':'LOW';
  const rc={EXTREME:'#ef4444',HIGH:'#f97316',MODERATE:'#eab308',LOW:'#22c55e'}[rl];
  const cluster=rl==='EXTREME'?'C1 — Extreme Risk':rl==='HIGH'?'C2 — High Risk':'C3 — Moderate Risk';
  const wM={fog:'3.4×',dust:'3.1×',heavy_rain:'2.9×',rain:'2.8×',cloudy:'1.3×',clear:'1.0×'}[inp.weather]||'1.0×';
  const circ=2*Math.PI*50;
  document.getElementById('resultPanel').innerHTML=`
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
      <div><div style="font-size:.68rem;color:var(--muted)">${inp.location||'Selected Route'}</div><span class="risk-badge2 rb-${rl.toLowerCase()}">${rl} RISK</span></div>
      <div style="margin-left:auto;text-align:right"><div style="font-size:.68rem;color:var(--muted)">Fusion Score</div><div style="font-family:'Space Grotesk',sans-serif;font-size:1.6rem;font-weight:800;color:${rc}">${score}%</div></div>
    </div>
    <div class="risk-score-ring"><svg width="110" height="110" viewBox="0 0 110 110"><circle cx="55" cy="55" r="50" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="9"/><circle cx="55" cy="55" r="50" fill="none" stroke="${rc}" stroke-width="9" stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-score/100)}" stroke-linecap="round" transform="rotate(-90 55 55)" style="transition:stroke-dashoffset 1s;filter:drop-shadow(0 0 6px ${rc})"/></svg><div class="rs-text"><div class="rs-pct" style="color:${rc}">${score}%</div><div class="rs-lbl">risk</div></div></div>
    <div class="a-grid">
      <div class="a-item"><div class="a-item-lbl">● P(Accident)</div><div class="a-item-val" style="color:${rc}">${Math.round(bProb*100)}%</div></div>
      <div class="a-item"><div class="a-item-lbl">● PCA Cluster</div><div class="a-item-val" style="font-size:.75rem">${cluster}</div></div>
      <div class="a-item"><div class="a-item-lbl">◬ Weather ×</div><div class="a-item-val" style="color:var(--orange)">${wM}</div></div>
      <div class="a-item"><div class="a-item-lbl">● FOL Rules</div><div class="a-item-val" style="color:${fired.length?'var(--red)':'var(--green)'}">${fired.length}/${FOL_RULES.length} fired</div></div>
    </div>
    <div style="margin-bottom:.875rem"><div style="font-size:.72rem;color:var(--muted);margin-bottom:.35rem">FOL Rules Triggered</div>${fired.map(r=>`<div class="fol-rule-result fr-fired">✓ ${r.id}: ${r.desc}</div>`).join('')||'<div class="fol-rule-result fr-safe">✓ No danger rules fired</div>'}</div>
    <div><div style="font-size:.72rem;color:var(--muted);margin-bottom:.35rem">Recommendations</div>${(RECS[rl]||RECS.LOW).map(r=>`<div class="rec-item">${r}</div>`).join('')}</div>
  `;
  document.getElementById('pdfBtn').style.display='block';
  // renderFOLTerminal removed (FOL terminal UI section removed)
  // Sync Bayesian
  Object.assign(bState,{rain:bEv.rain?.8:.15,fog:bEv.fog?.8:.1,night:bEv.night?.78:.2,highway:bEv.highway?.72:.3,poor_road:bEv.poor_road?.76:.18,heavy_traffic:bEv.heavy_traffic?.68:.25,festival:bEv.festival?.78:.1,no_divider:bEv.no_divider?.62:.15});
  Object.keys(bState).forEach(k=>{const sl=document.getElementById(`bs-${k}`),sv=document.getElementById(`bv-${k}`);if(sl&&sv){sl.value=Math.round(bState[k]*100);sv.textContent=Math.round(bState[k]*100)+'%';}});
  updateBayesian();
  // Save to history
  RS.saveAnalysis({location:inp.location||'Custom Route',riskLevel:rl,score,weather:inp.weather,roadtype:inp.roadtype,timeofday:inp.timeofday,firedRules:fired.map(r=>r.id),bayesProb:Math.round(bProb*100),cluster});
  toast(`Analysis complete — ${rl} RISK (${score}%)`,rl==='EXTREME'||rl==='HIGH'?'error':'success');
  // Trigger knowledge graph update
  if(window.updateKnowledgeGraph)window.updateKnowledgeGraph(fired.map(r=>r.id));
  btn.querySelector('.btn-txt').style.display='flex';btn.querySelector('.btn-ld').style.display='none';btn.disabled=false;
  renderHistory();
  if(rl==='EXTREME')toast('⚠ EXTREME RISK detected! Consider alternate route.','error');
}

// ════ INIT ══════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  // renderFOLRules() and renderFOLTerminal() removed (FOL display UI removed)
  // renderConfMatrix() removed (Evaluation/Metrics section removed)
  renderHotspots();
  initBayesSliders();drawPCA();initCharts();renderHistory();
  window.addEventListener('resize',drawPCA,{passive:true});
  const io=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.style.opacity='1';x.target.style.transform='translateY(0)';}}),{threshold:.08});
  document.querySelectorAll('.ds-card,.hs-card').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(16px)';el.style.transition='opacity .5s ease,transform .5s ease';io.observe(el);});
});
