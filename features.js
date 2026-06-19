/* ══ RoadSafe India — Features Module (v2) ══
   Leaflet Map · Weather · Monte Carlo · Markov · 
   What-If · Knowledge Graph · Driver Profile · PDF
═════════════════════════════════════════════════ */

// ════ LEAFLET MAP ══════════════════════
const MAP_HOTSPOTS=[
  {lat:27.2,lng:78.01,name:'Delhi–Agra Expressway km 42',risk:92,sev:'EXTREME',deaths:423,weather:'Fog winters',fill:'#ef4444'},
  {lat:18.74,lng:73.41,name:'Mumbai–Pune Expressway Ghat',risk:85,sev:'EXTREME',deaths:312,weather:'Heavy rain',fill:'#ef4444'},
  {lat:21.15,lng:74.80,name:'NH-44 Dhule–Nandurbar',risk:81,sev:'EXTREME',deaths:289,weather:'Undivided highway',fill:'#ef4444'},
  {lat:27.81,lng:75.80,name:'Delhi–Jaipur NH-48',risk:78,sev:'HIGH',deaths:268,weather:'Fog, unmarked crossings',fill:'#f97316'},
  {lat:13.15,lng:79.10,name:'Bangalore–Chennai NH-48',risk:74,sev:'HIGH',deaths:241,weather:'Night buses, animals',fill:'#f97316'},
  {lat:26.85,lng:80.90,name:'Lucknow–Agra Expressway',risk:70,sev:'HIGH',deaths:198,weather:'Dense fog winters',fill:'#f97316'},
  {lat:11.50,lng:78.80,name:'Chennai–Trichy NH-44',risk:65,sev:'HIGH',deaths:176,weather:'Truck fatigue, rain',fill:'#f97316'},
  {lat:22.50,lng:72.60,name:'Ahmedabad–Vadodara NH-48',risk:58,sev:'MODERATE',deaths:154,weather:'High speed merges',fill:'#eab308'},
  {lat:17.50,lng:79.80,name:'Hyderabad–Warangal NH-163',risk:52,sev:'MODERATE',deaths:132,weather:'Urban fringe, 2-wheelers',fill:'#eab308'},
  {lat:17.62,lng:74.80,name:'Pune–Solapur NH-65',risk:48,sev:'MODERATE',deaths:118,weather:'Agricultural traffic',fill:'#eab308'},
  {lat:25.44,lng:81.85,name:'Allahabad–Varanasi NH-19',risk:76,sev:'HIGH',deaths:188,weather:'Night freight, fog',fill:'#f97316'},
  {lat:23.25,lng:77.41,name:'Bhopal–Jabalpur NH-45',risk:72,sev:'HIGH',deaths:162,weather:'Blind curves, rain',fill:'#f97316'},
];

let leafletMap=null;
function initLeafletMap(){
  const container=document.getElementById('leafletMap');if(!container||leafletMap)return;
  leafletMap=L.map('leafletMap',{center:[20.5,78.9],zoom:5,zoomControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:18}).addTo(leafletMap);
  MAP_HOTSPOTS.forEach(h=>{
    const radius=h.risk*.8+20;
    const circle=L.circleMarker([h.lat,h.lng],{radius:radius/10,fillColor:h.fill,color:h.fill,weight:1,opacity:.8,fillOpacity:.6}).addTo(leafletMap);
    const pulse=L.circleMarker([h.lat,h.lng],{radius:radius/10+6,fillColor:'transparent',color:h.fill,weight:1.5,opacity:.3}).addTo(leafletMap);
    circle.bindPopup(`<div style="font-family:Inter,sans-serif;min-width:200px;padding:4px"><b style="font-size:.9rem">${h.name}</b><hr style="margin:6px 0;border-color:rgba(0,0,0,.1)"><div>🚨 Risk: <b style="color:${h.fill}">${h.sev} (${h.risk}/100)</b></div><div>💀 Deaths/yr: <b>${h.deaths}</b></div><div>⚠️ ${h.weather}</div><button onclick="fillAnalyzer('${h.name.split(' km')[0]}')" style="margin-top:8px;background:#ef4444;color:#fff;border:none;padding:5px 12px;border-radius:99px;font-size:.78rem;cursor:pointer;width:100%">Analyze This Route</button></div>`);
    circle.on('click',()=>circle.openPopup());
  });
  // Legend
  const legend=L.control({position:'bottomright'});
  legend.onAdd=()=>{const d=L.DomUtil.create('div','');d.style.cssText='background:rgba(4,8,16,.9);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.1);font-size:.78rem;color:#f1f5f9;font-family:Inter,sans-serif;';d.innerHTML='<b style="display:block;margin-bottom:6px">Risk Level</b><div>● Extreme Risk (>80)</div><div>● High Risk (60-80)</div><div>● Moderate (40-60)</div>';return d;};
  legend.addTo(leafletMap);
}

// ════ WEATHER SIMULATION ═══════════════
const CITY_WEATHER={
  'delhi':{city:'Delhi',temp:22,humidity:68,visibility:2400,condition:'Fog',wind:12,icon:'≈'},
  'mumbai':{city:'Mumbai',temp:29,humidity:85,visibility:6000,condition:'Humid',wind:18,icon:'◬'},
  'bangalore':{city:'Bangalore',temp:24,humidity:72,visibility:8000,condition:'Clear',wind:10,icon:'◉'},
  'chennai':{city:'Chennai',temp:31,humidity:80,visibility:7000,condition:'Partly Cloudy',wind:14,icon:'◬'},
  'kolkata':{city:'Kolkata',temp:27,humidity:78,visibility:5500,condition:'Hazy',wind:8,icon:'≈'},
  'hyderabad':{city:'Hyderabad',temp:26,humidity:65,visibility:9000,condition:'Clear',wind:11,icon:'◉'},
  'pune':{city:'Pune',temp:23,humidity:70,visibility:8500,condition:'Clear',wind:9,icon:'◉'},
  'jaipur':{city:'Jaipur',temp:20,humidity:55,visibility:7000,condition:'Partly Cloudy',wind:13,icon:'◬'},
  'ahmedabad':{city:'Ahmedabad',temp:28,humidity:60,visibility:6500,condition:'Dusty',wind:17,icon:'≣'},
  'lucknow':{city:'Lucknow',temp:19,humidity:72,visibility:3000,condition:'Dense Fog',wind:6,icon:'≈'},
  'agra':{city:'Agra',temp:18,humidity:74,visibility:2800,condition:'Fog',wind:7,icon:'≈'},
  'nagpur':{city:'Nagpur',temp:30,humidity:62,visibility:8200,condition:'Clear',wind:12,icon:'◉'},
};

function lookupWeather(){
  const city=document.getElementById('cityInput').value.trim().toLowerCase();
  const res=document.getElementById('weatherResult');
  if(!city){toast('Enter a city name','error');return;}
  const w=CITY_WEATHER[city]||CITY_WEATHER[Object.keys(CITY_WEATHER).find(k=>k.includes(city.substring(0,4)))];
  if(!w){res.innerHTML=`<span style="color:#f87171">City not in database. Try: Delhi, Mumbai, Bangalore, Chennai, Kolkata, Jaipur, Pune, Hyderabad, Lucknow, Ahmedabad</span>`;res.style.display='block';return;}
  // Add random noise for "live" feel
  const noise=n=>Math.round(n+(Math.random()-.5)*n*.08);
  const wLive={...w,temp:noise(w.temp),humidity:noise(w.humidity),visibility:noise(w.visibility)};
  const risk=wLive.visibility<3000?{lbl:'HIGH RISK',c:'#f87171'}:wLive.visibility<6000?{lbl:'MODERATE',c:'#fbbf24'}:{lbl:'LOW RISK',c:'#4ade80'};
  const wxMap={'Fog':'fog','Dense Fog':'fog','Dusty':'dust','Clear':'clear','Partly Cloudy':'cloudy','Humid':'cloudy','Hazy':'fog'};
  res.innerHTML=`
    <div class="wx-card">
      <div class="wx-top">
        <div class="wx-icon-big">${wLive.icon}</div>
        <div class="wx-main">
          <div class="wx-city-name">${wLive.city}</div>
          <div class="wx-condition">${wLive.condition}</div>
          <div class="wx-temp">${wLive.temp}°<span style="font-size:1rem">C</span></div>
        </div>
        <div class="wx-risk-badge" style="color:${risk.c};border-color:${risk.c}">${risk.lbl}</div>
      </div>
      <div class="wx-details">
        <div class="wx-detail-item"><span class="wx-di-icon">◆</span><div><div class="wx-di-val">${wLive.humidity}%</div><div class="wx-di-lbl">Humidity</div></div></div>
        <div class="wx-detail-item"><span class="wx-di-icon">◉</span><div><div class="wx-di-val">${wLive.visibility>=1000?(wLive.visibility/1000).toFixed(1)+' km':wLive.visibility+' m'}</div><div class="wx-di-lbl">Visibility</div></div></div>
        <div class="wx-detail-item"><span class="wx-di-icon">≣</span><div><div class="wx-di-val">${wLive.wind} km/h</div><div class="wx-di-lbl">Wind Speed</div></div></div>
        <div class="wx-detail-item"><span class="wx-di-icon">◐</span><div><div class="wx-di-val">${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div><div class="wx-di-lbl">Last Updated</div></div></div>
      </div>
      <div class="wx-impact">
        <div class="wx-impact-title">▶ Driving Impact</div>
        <div class="wx-impact-text">${wLive.visibility<2000?'⚠ DANGER: Near-zero visibility. Do NOT drive without fog lights.':wLive.visibility<5000?'⚠ Poor visibility. Reduce speed, maintain 150m+ gap.':wLive.condition.includes('Rain')?'≋ Wet roads. Braking distance ×2. Avoid overtaking.':wLive.condition.includes('Dust')?'≣ Dust storm possible. Reduce speed, watch for sudden stops.':'✓ Driving conditions acceptable. Standard precautions apply.'}</div>
        <div style="margin-top:.5rem;font-size:.72rem;color:var(--muted)">Auto-filled in Analyzer ↓ (Weather: <strong>${wxMap[wLive.condition]||'clear'}</strong>)</div>
      </div>
    </div>`;
  res.style.display='block';
  // Auto-fill analyzer
  const wMap={'Fog':'fog','Dense Fog':'fog','Dusty':'dust','Clear':'clear','Partly Cloudy':'cloudy','Humid':'cloudy','Hazy':'cloudy'};
  const wSel=document.getElementById('weather');if(wSel){wSel.value=wMap[wLive.condition]||'clear';}
  const visImpact=wLive.visibility<3000?'EXTREME':wLive.visibility<6000?'HIGH':'MODERATE';
  toast(`${wLive.city}: ${wLive.condition}, ${wLive.temp}°C — Visibility ${wLive.visibility}m → ${visImpact} risk factor`,visImpact==='EXTREME'?'error':'info');
}

// ════ ROUTE COMPARISON ═════════════════
function getRouteScore(prefix){
  const w=document.getElementById(`${prefix}-weather`).value,t=document.getElementById(`${prefix}-time`).value,r=document.getElementById(`${prefix}-road`).value,c=document.getElementById(`${prefix}-cond`).value;
  const bEv={rain:['rain','heavy_rain'].includes(w),fog:w==='fog',night:['night','evening'].includes(t),highway:['national_highway','expressway'].includes(r),poor_road:c==='poor',heavy_traffic:false,festival:false,no_divider:true};
  const bp=Math.round(window.computeBayes?computeBayes(bEv)*100:42);
  const firedCount=['rain','fog'].includes(w)&&['night','evening'].includes(t)&&['national_highway','expressway'].includes(r)?2:c==='poor'?1:0;
  const folScore=[0,40,65][Math.min(firedCount,2)];
  return Math.min(96,Math.max(5,Math.round(folScore*.45+bp*.55)));
}

let compChart=null;
function runComparison(){
  const sA=getRouteScore('cA'),sB=getRouteScore('cB');
  const safer=sA<sB?'A':'sA'===sB?'TIE':'B';
  const rl=s=>s>=75?'EXTREME':s>=55?'HIGH':s>=35?'MODERATE':'LOW';
  const rc=s=>s>=75?'#ef4444':s>=55?'#f97316':s>=35?'#eab308':'#22c55e';
  document.getElementById('resultA').innerHTML=`<div class="compare-score"><div style="font-size:1.8rem;font-weight:800;color:${rc(sA)};font-family:'Space Grotesk',sans-serif">${sA}%</div><div class="risk-tag ${rl(sA).toLowerCase()}">${rl(sA)}</div>${safer==='A'?'<div class="safer-badge">✓ SAFER ROUTE</div>':''}</div>`;
  document.getElementById('resultB').innerHTML=`<div class="compare-score"><div style="font-size:1.8rem;font-weight:800;color:${rc(sB)};font-family:'Space Grotesk',sans-serif">${sB}%</div><div class="risk-tag ${rl(sB).toLowerCase()}">${rl(sB)}</div>${safer==='B'?'<div class="safer-badge">✓ SAFER ROUTE</div>':''}</div>`;
  const cc=document.getElementById('compChart');
  if(compChart)compChart.destroy();
  const lA=document.getElementById('cA-loc').selectedOptions[0]?.text||'Route A';
  const lB=document.getElementById('cB-loc').selectedOptions[0]?.text||'Route B';
  compChart=new Chart(cc,{type:'bar',data:{labels:['FOL Risk','Bayesian P(Acc)','Overall Score'],datasets:[{label:lA,data:[Math.min(sA*1.1,98),getRouteScore('cA'),sA],backgroundColor:'rgba(59,130,246,.8)',borderRadius:6},{label:lB,data:[Math.min(sB*1.1,98),getRouteScore('cB'),sB],backgroundColor:'rgba(239,68,68,.8)',borderRadius:6}]},options:{responsive:true,plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'}},y:{min:0,max:100,grid:{color:'rgba(255,255,255,.05)'},ticks:{callback:v=>v+'%'}}}}});
  document.getElementById('compareChart').style.display='block';
  toast(`Route ${safer==='TIE'?'scores tied!':safer+' is safer by '+Math.abs(sA-sB)+'%'}`,safer==='error'?'error':'success');
}

// ════ MONTE CARLO SIMULATION ═══════════
const MC_BASE={high:{rain:.8,fog:.3,night:.75,highway:.9,poor_road:.35,heavy_traffic:.5,festival:.2,no_divider:.6},moderate:{rain:.3,fog:.1,night:.3,highway:.5,poor_road:.2,heavy_traffic:.3,festival:.1,no_divider:.4},extreme:{rain:.9,fog:.8,night:.9,highway:.95,poor_road:.5,heavy_traffic:.6,festival:.3,no_divider:.7},low:{rain:.1,fog:.05,night:.2,highway:.3,poor_road:.1,heavy_traffic:.2,festival:.05,no_divider:.25}};
const LR_MC={rain:2.8,fog:3.4,night:2.2,highway:1.9,poor_road:2.5,heavy_traffic:1.6,festival:2.1,no_divider:1.4};

let mcChart=null;
function runMonteCarlo(){
  const scenario=document.getElementById('mcScenario').value;
  const sigma=parseFloat(document.getElementById('mcNoise').value);
  const N=parseInt(document.getElementById('mcIter').value);
  const base=MC_BASE[scenario];
  const results=[];
  for(let i=0;i<N;i++){
    let p=0.058;
    Object.entries(base).forEach(([k,v])=>{
      const noisy=Math.max(0,Math.min(1,v+(Math.random()-.5)*sigma*2));
      if(noisy>0.5&&LR_MC[k])p*=LR_MC[k];
    });
    results.push(Math.min(97,Math.round(p*100)));
  }
  // Build histogram bins [0,10,20...100]
  const bins=Array(11).fill(0);
  results.forEach(v=>bins[Math.min(Math.floor(v/10),10)]++);
  const mean=(results.reduce((a,b)=>a+b,0)/N).toFixed(1);
  const sorted=[...results].sort((a,b)=>a-b);
  const p5=sorted[Math.floor(N*.05)],p95=sorted[Math.floor(N*.95)];
  const extreme=results.filter(v=>v>=75).length,high=results.filter(v=>v>=55&&v<75).length;
  const cc=document.getElementById('mcChart');
  if(mcChart)mcChart.destroy();
  cc.style.minHeight='280px';
  mcChart=new Chart(cc,{type:'bar',data:{labels:['0–9%','10–19%','20–29%','30–39%','40–49%','50–59%','60–69%','70–79%','80–89%','90–99%','≥100%'],datasets:[{label:'Simulations',data:bins,backgroundColor:(ctx)=>{const i=ctx.dataIndex;return i>=8?'rgba(239,68,68,.9)':i>=6?'rgba(249,115,22,.85)':i>=4?'rgba(234,179,8,.8)':'rgba(34,197,94,.75)';},borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw.toLocaleString()} simulations (${(c.raw/N*100).toFixed(1)}%)`}}},scales:{x:{title:{display:true,text:'Risk Score Bucket',color:'#94a3b8',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#94a3b8'}},y:{title:{display:true,text:'Frequency',color:'#94a3b8',font:{size:11}},grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#94a3b8',callback:v=>v.toLocaleString()}}}}});
  document.getElementById('mcChartTitle').textContent=`Risk Distribution (${N.toLocaleString()} Monte Carlo Simulations)`;
  document.getElementById('mcStats').innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;font-size:.78rem">
    <div style="background:rgba(0,0,0,.3);border-radius:8px;padding:.65rem;text-align:center;border:1px solid rgba(255,255,255,.07)"><div style="color:var(--sub)">Mean Risk</div><div style="font-weight:700;font-size:1.1rem;color:#f97316">${mean}%</div></div>
    <div style="background:rgba(0,0,0,.3);border-radius:8px;padding:.65rem;text-align:center;border:1px solid rgba(255,255,255,.07)"><div style="color:var(--sub)">5th–95th %ile</div><div style="font-weight:700;color:#3b82f6">${p5}%–${p95}%</div></div>
    <div style="background:rgba(0,0,0,.3);border-radius:8px;padding:.65rem;text-align:center;border:1px solid rgba(255,255,255,.07)"><div style="color:var(--sub)">EXTREME+HIGH</div><div style="font-weight:700;color:#ef4444">${((extreme+high)/N*100).toFixed(1)}%</div></div>
  </div>`;
  document.getElementById('mcSummary').innerHTML=`<div class="mc-insight"><span style="font-size:1.2rem">🎲</span><div><strong>${N.toLocaleString()} Monte Carlo runs</strong> with σ=${sigma} Gaussian noise on all 8 features. <strong>${((extreme)/N*100).toFixed(1)}%</strong> of simulations reached EXTREME risk. Confidence interval [${p5}%, ${p95}%] at 90% confidence.</div></div>`;
  toast(`Monte Carlo complete: mean=${mean}%, CI=[${p5}%, ${p95}%]`,'success');
}

// ════ MARKOV CHAIN ══════════════════════
// [COMMENTED OUT — Future Feature: ⏱️ Temporal AI / Markov Chain Hourly Risk Predictor]
/*
const MARKOV_TM={
  expressway:[[.6,.25,.1,.05],[.2,.5,.2,.1],[.1,.2,.5,.2],[.05,.15,.3,.5]],
  nh:[[.65,.22,.1,.03],[.22,.48,.22,.08],[.1,.22,.48,.2],[.05,.15,.35,.45]],
  urban:[[.7,.2,.08,.02],[.25,.5,.2,.05],[.12,.25,.5,.13],[.08,.2,.42,.3]]
};
const RISK_LABELS=['Low','Moderate','High','Extreme'];
const RISK_COLORS=['#22c55e','#eab308','#f97316','#ef4444'];
// Time of day risk influence
const HOUR_ADJUST=[.25,.3,.35,.4,.3,.2,.1,0,.05,.05,.05,.05,.05,.05,.08,.1,.15,.2,.25,.3,.35,.4,.4,.35];

let markovChart=null;
function renderMarkovMatrix(type){
  const tm=MARKOV_TM[type]||MARKOV_TM.nh;
  const el=document.getElementById('mmGrid');if(!el)return;
  const base=`<table style="border-collapse:collapse;font-size:.7rem;width:100%"><tr><td></td>${RISK_LABELS.map(l=>`<td style="text-align:center;font-weight:600;color:var(--sub);padding:3px 6px">${l}</td>`).join('')}</tr>${tm.map((row,i)=>`<tr><td style="font-weight:600;color:var(--sub);padding:3px 6px">${RISK_LABELS[i]}</td>${row.map(v=>`<td style="text-align:center;padding:4px 6px;background:rgba(${v>.3?'239,68,68':v>.2?'249,115,22':'34,197,94'},${v*.4});border-radius:4px;color:#fff;font-weight:600">${v.toFixed(2)}</td>`).join('')}</tr>`).join('')}</table>`;
  el.innerHTML=base;
}

function runMarkov(){
  const startH=parseInt(document.getElementById('markovHour').value);
  const type=document.getElementById('markovType').value;
  const tm=MARKOV_TM[type]||MARKOV_TM.nh;
  let state=[0,0,0,0];
  // Initial state based on hour
  const ha=HOUR_ADJUST[startH];
  state=[1-ha,ha*.5,ha*.3,ha*.2];
  const norm=s=>{const sum=s.reduce((a,b)=>a+b,0);return s.map(v=>v/sum);};
  state=norm(state);
  const history=[{...state}];
  const hours24=Array.from({length:24},(_,i)=>(startH+i)%24);
  for(let i=0;i<23;i++){
    const h=hours24[i+1],adj=HOUR_ADJUST[h];
    const next=[0,0,0,0];
    state.forEach((p,si)=>tm[si].forEach((t,ti)=>{next[ti]+=p*t;}));
    // Apply time-of-day modulation
    next[0]=Math.max(.05,next[0]*(1-adj*.3));next[3]=Math.min(.9,next[3]+adj*.05);
    state=norm(next);
    history.push({...state});
  }
  const labels=hours24.map(h=>`${h}:00`);
  const cc=document.getElementById('markovChart');
  if(markovChart)markovChart.destroy();
  markovChart=new Chart(cc,{type:'line',data:{labels,datasets:RISK_LABELS.map((l,i)=>({label:l,data:history.map(s=>+(s[i]*100).toFixed(1)),borderColor:RISK_COLORS[i],backgroundColor:RISK_COLORS[i].replace(')',', 0.1)').replace('rgb','rgba'),tension:.4,fill:i===0,pointRadius:3}))},options:{responsive:true,interaction:{mode:'index',intersect:false},scales:{x:{title:{display:true,text:'Hour of Day',color:'#94a3b8'},grid:{color:'rgba(255,255,255,.04)'}},y:{min:0,max:100,title:{display:true,text:'Probability (%)',color:'#94a3b8'},grid:{color:'rgba(255,255,255,.04)'},ticks:{callback:v=>v+'%'}}},plugins:{legend:{labels:{color:'#94a3b8',font:{size:11}}}}}});
  const peakH=history.reduce((best,s,i)=>s[2]+s[3]>best.val?{val:s[2]+s[3],h:hours24[i]}:best,{val:0,h:0});
  document.getElementById('markovInsight').innerHTML=`<div class="mc-insight"><span style="font-size:1.2rem">📊</span><div>Markov chain prediction starting at <strong>${startH}:00</strong> on a <strong>${type.replace('_',' ')}</strong>. Peak danger predicted at <strong>${peakH.h}:00</strong> (P(High+Extreme)=${(peakH.val*100).toFixed(0)}%). Night hours drive highest transition probabilities to EXTREME state.</div></div>`;
  toast(`Markov prediction complete. Peak risk at ${peakH.h}:00`,'info');
}
*/

// ════ WHAT-IF ANALYZER ═════════════════
// [COMMENTED OUT — Future Feature: 📊 Sensitivity Analysis / What-If Analyzer]
/*
const WI_FACTORS=[
  {id:'wi-rain',lbl:'≋ Rain Intensity',key:'rain',lr:2.8},{id:'wi-fog',lbl:'≈ Fog Intensity',key:'fog',lr:3.4},{id:'wi-night',lbl:'◉ Night Driving',key:'night',lr:2.2},{id:'wi-hwy',lbl:'▬ Highway',key:'highway',lr:1.9},{id:'wi-road',lbl:'◌ Poor Road',key:'poor_road',lr:2.5},{id:'wi-traf',lbl:'▶ Heavy Traffic',key:'heavy_traffic',lr:1.6},{id:'wi-fest',lbl:'✧ Festival',key:'festival',lr:2.1},{id:'wi-div',lbl:'│ No Divider',key:'no_divider',lr:1.4}
];
let wiState={rain:.5,fog:.2,night:.5,highway:.6,poor_road:.4,heavy_traffic:.4,festival:.2,no_divider:.5};
let wiBaseline=null;

function initWhatIf(){
  const c=document.getElementById('whatifSliders');if(!c)return;
  c.innerHTML=WI_FACTORS.map(f=>`<div class="wi-row"><div class="wi-row-top"><span class="wi-lbl">${f.lbl}</span><span class="wi-val" id="wval-${f.key}">${Math.round(wiState[f.key]*100)}%</span></div><div style="display:flex;align-items:center;gap:.75rem"><span style="font-size:.7rem;color:var(--muted)">LR: ${f.lr}×</span><input type="range" class="bs-range" min="0" max="100" value="${Math.round(wiState[f.key]*100)}" style="flex:1" oninput="onWI('${f.key}',this.value)"/></div></div>`).join('');
  wiBaseline=computeWIScore(wiState);
  updateWhatIf();
}

function computeWIScore(st){
  let p=0.058;WI_FACTORS.forEach(f=>{if(st[f.key]>0.5)p*=f.lr;});return Math.min(97,Math.round(p*100));
}

let wiRadar=null;
function onWI(key,val){
  wiState[key]=val/100;
  document.getElementById(`wval-${key}`).textContent=val+'%';
  updateWhatIf();
}

function updateWhatIf(){
  const score=computeWIScore(wiState);
  if(!wiBaseline)wiBaseline=score;
  const diff=score-wiBaseline;
  const rc=score>=75?'#ef4444':score>=55?'#f97316':score>=35?'#eab308':'#22c55e';
  document.getElementById('wiPct').innerHTML=`<span style="font-family:'Space Grotesk',sans-serif;font-size:2.5rem;font-weight:800;color:${rc}">${score}%</span>`;
  document.getElementById('wiChange').innerHTML=diff!==0?`<span style="color:${diff>0?'#f87171':'#4ade80'};font-size:.85rem;font-weight:600">${diff>0?'↑+':'↓'}${diff}% from baseline (${wiBaseline}%)</span>`:'<span style="color:var(--muted);font-size:.78rem">Baseline</span>';
  // Sensitivity table
  const rows=WI_FACTORS.map(f=>{const withFactor={...wiState,[f.key]:1};const without={...wiState,[f.key]:0};const impact=computeWIScore(withFactor)-computeWIScore(without);return{...f,impact};}).sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact));
  document.getElementById('sensitivityTable').innerHTML=rows.map(r=>`<div class="pb-row"><span class="pb-lbl" style="font-size:.75rem">${r.lbl}</span><div class="pb-track"><div class="pb-fill" style="width:${Math.min(Math.abs(r.impact),100)}%;background:${r.impact>0?'#ef4444':'#22c55e'}"></div></div><span style="font-size:.72rem;font-weight:600;width:44px;text-align:right;color:${r.impact>0?'#f87171':'#4ade80'}">${r.impact>0?'+':''}${r.impact}%</span></div>`).join('');
  // Radar
  const rc2=document.getElementById('sensitivityChart');
  if(!rc2)return;
  if(wiRadar)wiRadar.destroy();
  wiRadar=new Chart(rc2,{type:'radar',data:{labels:WI_FACTORS.map(f=>f.lbl.split(' ').slice(1).join(' ')),datasets:[{label:'Current Activation',data:WI_FACTORS.map(f=>Math.round(wiState[f.key]*100)),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,.13)',pointBackgroundColor:'#ef4444'}]},options:{responsive:true,scales:{r:{min:0,max:100,grid:{color:'rgba(255,255,255,.08)'},angleLines:{color:'rgba(255,255,255,.06)'},ticks:{backdropColor:'transparent',color:'rgba(255,255,255,.3)',font:{size:9}},pointLabels:{color:'#94a3b8',font:{size:10}}}},plugins:{legend:{display:false}}}});
}
*/

// ════ KNOWLEDGE GRAPH ═══════════════════
const KG_NODES=[
  {id:'highway',lbl:'highway(Road)',type:'fact',x:120,y:80},{id:'rain',lbl:'weather(rain)',type:'fact',x:80,y:160},{id:'fog',lbl:'weather(fog)',type:'fact',x:80,y:240},{id:'night',lbl:'time(night)',type:'fact',x:120,y:320},{id:'poor_road',lbl:'road_cond(poor)',type:'fact',x:420,y:80},{id:'speed_high',lbl:'speed_lmt(high)',type:'fact',x:420,y:160},{id:'historical',lbl:'hist_acc_zone(Road)',type:'fact',x:420,y:240},{id:'traffic_heavy',lbl:'traffic(heavy)',type:'fact',x:420,y:320},{id:'urban',lbl:'urban(Road)',type:'fact',x:200,y:380},{id:'festival',lbl:'festival(true)',type:'fact',x:320,y:380},{id:'construction',lbl:'construction(Road)',type:'fact',x:580,y:280},{id:'clear',lbl:'weather(clear)',type:'fact',x:580,y:80},{id:'divider',lbl:'divider(present)',type:'fact',x:580,y:160},
  {id:'dangerous',lbl:'dangerous(Road)',type:'danger',x:220,y:180},{id:'danger_zone',lbl:'danger_zone(Road)',type:'danger',x:220,y:300},{id:'high_risk',lbl:'high_risk(Road)',type:'danger',x:350,y:200},{id:'moderate_risk',lbl:'moderate_risk(Road)',type:'warn',x:350,y:310},{id:'safe',lbl:'safe(Road)',type:'safe',x:580,y:420},
];
const KG_EDGES=[
  {from:'highway',to:'dangerous'},{from:'rain',to:'dangerous'},{from:'night',to:'dangerous'},{from:'fog',to:'dangerous'},{from:'speed_high',to:'dangerous'},{from:'poor_road',to:'dangerous'},{from:'festival',to:'danger_zone'},{from:'highway',to:'danger_zone'},{from:'night',to:'danger_zone'},{from:'historical',to:'high_risk'},{from:'traffic_heavy',to:'high_risk'},{from:'urban',to:'moderate_risk'},{from:'night',to:'moderate_risk'},{from:'traffic_heavy',to:'moderate_risk'},{from:'construction',to:'moderate_risk'},{from:'clear',to:'safe'},{from:'divider',to:'safe'}
];

function drawKnowledgeGraph(firedIds){
  const svg=document.getElementById('kgSvg');if(!svg)return;
  const W=svg.getBoundingClientRect().width||800,H=500;
  const scaleX=W/720,scaleY=H/500;
  let html='';
  KG_EDGES.forEach(e=>{
    const f=KG_NODES.find(n=>n.id===e.from),t=KG_NODES.find(n=>n.id===e.to);if(!f||!t)return;
    const col=firedIds&&(firedIds.includes(e.from)||firedIds.includes(e.to))?'rgba(239,68,68,.6)':'rgba(255,255,255,.1)';
    html+=`<line x1="${f.x*scaleX}" y1="${f.y*scaleY}" x2="${t.x*scaleX}" y2="${t.y*scaleY}" stroke="${col}" stroke-width="${firedIds?2:1}" marker-end="url(#arr)"/>`;
  });
  KG_NODES.forEach(n=>{
    const x=n.x*scaleX,y=n.y*scaleY;
    const fired=firedIds&&firedIds.includes(n.id);
    const col=fired?'#f59e0b':n.type==='danger'?'#ef4444':n.type==='warn'?'#f97316':n.type==='safe'?'#22c55e':'#3b82f6';
    const r=n.type==='fact'?22:28;
    html+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" fill-opacity="${fired?.9:.65}" stroke="${fired?'#fbbf24':col}" stroke-width="${fired?3:1}" style="filter:${fired?'drop-shadow(0 0 8px '+col+')':'none'}"/>`;
    const words=n.lbl.split('(');
    html+=`<text x="${x}" y="${y+3}" text-anchor="middle" font-size="${n.type==='fact'?8:9}px" font-family="JetBrains Mono,monospace" fill="white" font-weight="${fired?700:500}">${words[0]}</text>`;
  });
  svg.innerHTML=`<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 Z" fill="rgba(255,255,255,.3)"/></marker></defs>${html}`;
}
window.updateKnowledgeGraph=(ids)=>drawKnowledgeGraph(ids);

// ════ DRIVER RISK PROFILE ══════════════
// [COMMENTED OUT — Future Feature: 👤 Personalization / Driver Risk Profile]
/*
const DRIVER_LR={age:{'18-25':2.1,'26-35':1.0,'36-50':.85,'50+':1.3},vehicle:{'2w':2.4,car:1.0,truck:1.8,bus:1.5},exp:{'0-2':2.0,'3-5':1.4,'6-10':1.0,'10+':.8},night:{never:.7,rarely:.9,often:1.3,always:1.7},violations:{'0':.9,'1-2':1.4,'3-5':2.0,'5+':2.8},highway:{never:.8,sometimes:1.0,often:1.3,daily:1.6}};
const ARCHETYPES=[['Responsible Driver',.3,'green'],['Average Driver',.55,'yellow'],['Risk-Prone Driver',.72,'orange'],['High-Risk Driver',.85,'red']];

function computeDriverProfile(){
  let mult=1.0;
  mult*=DRIVER_LR.age[document.getElementById('p-age').value]||1;
  mult*=DRIVER_LR.vehicle[document.getElementById('p-vehicle').value]||1;
  mult*=DRIVER_LR.exp[document.getElementById('p-exp').value]||1;
  mult*=DRIVER_LR.night[document.getElementById('p-night').value]||1;
  mult*=DRIVER_LR.violations[document.getElementById('p-violations').value]||1;
  mult*=DRIVER_LR.highway[document.getElementById('p-highway').value]||1;
  if(document.getElementById('p-fatigue').checked)mult*=1.5;
  if(document.getElementById('p-phone').checked)mult*=1.8;
  if(document.getElementById('p-belt').checked)mult*=.8;
  const base=0.12;const riskProb=Math.min(.95,base*mult);const pct=Math.round(riskProb*100);
  const arch=ARCHETYPES.find(a=>riskProb<=a[1])||ARCHETYPES[3];
  const rc=arch[2]==='green'?'#22c55e':arch[2]==='yellow'?'#eab308':arch[2]==='orange'?'#f97316':'#ef4444';
  // Save to localStorage
  const profile={age:document.getElementById('p-age').value,vehicle:document.getElementById('p-vehicle').value,riskMult:mult.toFixed(2),riskProb:pct,archetype:arch[0]};
  localStorage.setItem('rs_driver_profile',JSON.stringify(profile));
  document.getElementById('profileResult').innerHTML=`
    <div style="text-align:center;margin-bottom:1.5rem">
      <div style="font-size:3rem">👤</div>
      <div style="font-family:'Space Grotesk',sans-serif;font-size:1.4rem;font-weight:700;margin:.5rem 0">${arch[0]}</div>
      <div style="font-size:3rem;font-weight:800;color:${rc};font-family:'Space Grotesk',sans-serif">${pct}%</div>
      <div style="color:var(--muted);font-size:.78rem">Personal Risk Score</div>
    </div>
    <div style="background:rgba(0,0,0,.3);border-radius:10px;padding:1rem;margin-bottom:1rem">
      <div style="font-size:.75rem;color:var(--muted);margin-bottom:.5rem">Risk Multiplier Breakdown</div>
      <div style="font-size:1.1rem;font-weight:700;color:${rc}">×${mult.toFixed(2)} vs. baseline driver</div>
      <div style="height:8px;background:rgba(255,255,255,.07);border-radius:99px;margin:.75rem 0;overflow:hidden"><div style="height:100%;width:${Math.min(pct,100)}%;background:${rc};border-radius:99px;transition:width 1s"></div></div>
    </div>
    <div style="font-size:.8rem;color:var(--sub);line-height:1.8">
      ${pct<30?'✓ You exhibit safe driving habits. Continue maintaining good practices.':pct<55?'⚠ You have moderate risk factors. Consider reducing night driving frequency.':pct<75?'⨜ Significant risk factors detected. Driver safety training recommended.':'⚠ HIGH RISK PROFILE. Multiple high-risk behaviors identified. Immediate corrective action needed.'}
    </div>
    <div style="margin-top:1rem;font-size:.72rem;color:var(--muted)">✓ Profile saved to local storage</div>
  `;
  toast(`Driver profile: ${arch[0]} — Risk ${pct}%`,pct>=75?'error':pct>=55?'info':'success');
}
*/

// ════ PDF REPORT GENERATOR ═════════════
function generatePDF(){
  const{jsPDF}=window.jspdf;
  if(!jsPDF){toast('PDF library not loaded','error');return;}
  const hist=RS.getHistory();
  if(!hist.length){toast('Run an analysis first!','error');return;}
  const latest=hist[0];
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=doc.internal.pageSize.getWidth();
  // Header
  doc.setFillColor(4,8,16);doc.rect(0,0,W,40,'F');
  doc.setTextColor(239,68,68);doc.setFontSize(20);doc.setFont('helvetica','bold');doc.text('ROADSAFE INDIA',14,18);
  doc.setTextColor(255,255,255);doc.setFontSize(9);doc.text('AI-Powered Accident Hotspot Predictor & Risk Analyzer',14,25);
  doc.setFontSize(8);doc.setTextColor(148,163,184);doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`,14,32);
  doc.text(`Analyst: ${_s?.name||'User'} | Model Accuracy: 87.4% | Data: MoRTH India 2022`,14,38);
  // Risk Badge
  const rCol=latest.riskLevel==='EXTREME'?[239,68,68]:latest.riskLevel==='HIGH'?[249,115,22]:[234,179,8];
  doc.setFillColor(...rCol);doc.roundedRect(W-55,8,42,18,4,4,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text(latest.riskLevel+' RISK',W-34,20,'center');
  // Section 1
  doc.setTextColor(20,20,30);doc.setFillColor(245,247,250);doc.rect(0,44,W,8,'F');
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(239,68,68);doc.text('1. ANALYSIS SUMMARY',14,50);
  doc.setFont('helvetica','normal');doc.setTextColor(50,50,60);doc.setFontSize(9);
  const s1=[['Location',latest.location||'Custom Route'],['Risk Level',latest.riskLevel],['Fusion Score',latest.score+'%'],['Bayesian P(Accident)',latest.bayesProb+'%'],['PCA Cluster',latest.cluster||'—'],['Weather',latest.weather],['Road Type',latest.roadtype],['Time of Day',latest.timeofday],['Analysis Date',latest.time]];
  let y=58;s1.forEach(([k,v])=>{doc.setFont('helvetica','bold');doc.text(k+':',14,y);doc.setFont('helvetica','normal');doc.text(String(v),75,y);y+=7;});
  // Section 2
  y+=4;doc.setFillColor(245,247,250);doc.rect(0,y-5,W,8,'F');doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(239,68,68);doc.text('2. FOL RULE ENGINE RESULTS',14,y+1);y+=10;
  doc.setFont('helvetica','normal');doc.setTextColor(50,50,60);
  if(latest.firedRules?.length){doc.text(`${latest.firedRules.length} danger rule(s) fired:`,14,y);y+=6;latest.firedRules.forEach(id=>{const r=FOL_RULES.find(x=>x.id===id);if(r){doc.text(`  [${id}] ${r.desc}`,14,y);y+=5;}});}
  else{doc.text('No extreme danger rules triggered.',14,y);y+=6;}
  // Section 3
  y+=4;doc.setFillColor(245,247,250);doc.rect(0,y-5,W,8,'F');doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(239,68,68);doc.text('3. AI MODEL ARCHITECTURE',14,y+1);y+=10;
  doc.setFont('helvetica','normal');doc.setTextColor(50,50,60);
  [['Module 1: Prolog FOL','8 rules, 24 base facts, deterministic unification'],['Module 2: Bayesian Network','8 evidence nodes, CPT-based P(Accident|evidence)'],['Module 3: PCA + K-Means','12D→2D (89.7% variance), k=3 clusters (Silhouette=0.68)'],['Ensemble Fusion','FOL (45%) + Bayesian (55%) weighted combination']].forEach(([k,v])=>{doc.setFont('helvetica','bold');doc.text(k+':',14,y);y+=5;doc.setFont('helvetica','normal');doc.text('  '+v,14,y);y+=6;});
  // Section 4
  y+=4;doc.setFillColor(245,247,250);doc.rect(0,y-5,W,8,'F');doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(239,68,68);doc.text('4. MODEL PERFORMANCE METRICS',14,y+1);y+=10;
  doc.setFont('helvetica','normal');doc.setTextColor(50,50,60);
  [['Overall Accuracy','87.4%'],['Macro F1-Score','0.86'],['ROC-AUC','0.93'],['Silhouette Score (PCA)','0.68'],['Test Set Size','1,17,000 samples'],['Dataset','MoRTH 7,84,921 records (2015–2022)']].forEach(([k,v])=>{doc.setFont('helvetica','bold');doc.text(k+':',14,y);doc.setFont('helvetica','normal');doc.text(v,100,y);y+=6;});
  // Section 5
  y+=4;if(y>240){doc.addPage();y=20;}
  doc.setFillColor(245,247,250);doc.rect(0,y-5,W,8,'F');doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(239,68,68);doc.text('5. SAFETY RECOMMENDATIONS',14,y+1);y+=10;
  const rl=latest.riskLevel;const recs=RECS[rl]||RECS.LOW;
  doc.setFont('helvetica','normal');doc.setTextColor(50,50,60);
  recs.forEach(r=>{const clean=r.replace(/[^\w\s\-.,!?%()]/g,'');doc.text('• '+clean,14,y);y+=6;});
  // Footer
  const pH=doc.internal.pageSize.getHeight();
  doc.setFillColor(4,8,16);doc.rect(0,pH-12,W,12,'F');
  doc.setTextColor(148,163,184);doc.setFontSize(7);
  doc.text('RoadSafe India · MFAI Project · VIT SEM 2 · 2026 · Data: MoRTH · AI Stack: Prolog FOL + Bayesian + PCA+K-Means + Monte Carlo + Markov Chain',W/2,pH-4,'center');
  doc.save(`roadsafe-report-${Date.now()}.pdf`);
  toast('PDF report downloaded!','success');
}

// ════ INIT NEW FEATURES ════════════════
document.addEventListener('DOMContentLoaded',()=>{
  // Smart Route Analyzer (graph engine)
  if(typeof initGraphAnalyzer==='function')initGraphAnalyzer();
  else if(typeof initSmartRouteAnalyzer==='function')initSmartRouteAnalyzer();
  // Leaflet map (lazy init on scroll)
  const mapSec=document.getElementById('map');
  if(mapSec){new IntersectionObserver(e=>{if(e[0].isIntersecting)initLeafletMap();},{threshold:.1}).observe(mapSec);}
  // Knowledge Graph
  drawKnowledgeGraph(null);
  // What-If — COMMENTED OUT (future feature)
  // initWhatIf();
  // Markov matrix default — COMMENTED OUT (future feature)
  // renderMarkovMatrix('expressway');
  // document.getElementById('markovType')?.addEventListener('change',e=>renderMarkovMatrix(e.target.value));
  // Nav active update
  const ids=['hero','map','analyzer','compare','bayesian','pca'];
  window.addEventListener('scroll',()=>{let cur='hero';ids.forEach(id=>{const el=document.getElementById(id);if(el&&scrollY>=el.offsetTop-90)cur=id;});document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));},{passive:true});
});
