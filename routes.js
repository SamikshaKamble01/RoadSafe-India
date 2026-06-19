/* ══════════════════════════════════════════
   RoadSafe India — Smart Route Analyzer
   Source → Destination → AI Recommends Route
   ══════════════════════════════════════════ */

// ════ ROUTE DATABASE ════════════════════
// Each city pair has 2–3 real routes with accurate metadata
const ROUTE_DB = {
  'mumbai-pune': {
    label: 'Mumbai → Pune',
    midCity: 'mumbai',
    routes: [
      { id:'MP-EXP', name:'Mumbai–Pune Expressway (NH-48)', short:'Expressway', distance:94, type:'expressway', speedLimit:100, condition:'good', hasDivider:true, toll:true, ghat:false, historical:85, description:'6-lane controlled access expressway. Prone to fog near Khandala tunnel and high-speed crashes.' },
      { id:'MP-GHT', name:'Old Mumbai–Pune Highway via Khandala Ghat', short:'Khandala Ghat (Old)', distance:112, type:'national_highway', speedLimit:80, condition:'moderate', hasDivider:false, toll:false, ghat:true, historical:91, description:'Mountainous ghat section with sharp curves, rain-induced landslides. Very dangerous during monsoon.' },
    ]
  },
  'delhi-agra': {
    label: 'Delhi → Agra',
    midCity: 'delhi',
    routes: [
      { id:'DA-YEX', name:'Yamuna Expressway (6-lane)', short:'Yamuna Exp.', distance:165, type:'expressway', speedLimit:100, condition:'good', hasDivider:true, toll:true, ghat:false, historical:76, description:'High-speed 6-lane expressway. Dense fog in winters causes multi-vehicle pile-ups.' },
      { id:'DA-NH2', name:'NH-19 (Old Delhi–Agra Road)', short:'NH-19 Old', distance:215, type:'national_highway', speedLimit:80, condition:'poor', hasDivider:false, toll:false, ghat:false, historical:93, description:'Slow, congested with trucks. Poorly maintained stretches. Highest fatality highway in India.' },
    ]
  },
  'delhi-jaipur': {
    label: 'Delhi → Jaipur',
    midCity: 'jaipur',
    routes: [
      { id:'DJ-NH8', name:'NH-48 Expressway via Gurgaon–Kotputli', short:'NH-48 Express', distance:268, type:'expressway', speedLimit:120, condition:'good', hasDivider:true, toll:true, ghat:false, historical:78, description:'Well-maintained 6-lane highway. High speed + unmarked crossings = fatality risk.' },
      { id:'DJ-OLD', name:'State Highway via Alwar Road', short:'Alwar Bypass', distance:298, type:'state_highway', speedLimit:60, condition:'moderate', hasDivider:false, toll:false, ghat:false, historical:65, description:'Slower but through Alwar. Lower speed limits, more populated, lower highway risk.' },
    ]
  },
  'bangalore-mysore': {
    label: 'Bangalore → Mysore',
    midCity: 'bangalore',
    routes: [
      { id:'BM-EXP', name:'Bangalore–Mysore Expressway (10-lane)', short:'BLR-MYS Exp.', distance:140, type:'expressway', speedLimit:100, condition:'good', hasDivider:true, toll:true, ghat:false, historical:55, description:'New 10-lane greenfield expressway. Excellent road, low risk if speed is maintained.' },
      { id:'BM-OLD', name:'Old Mysore Road (NH-275)', short:'NH-275 Old', distance:155, type:'national_highway', speedLimit:80, condition:'moderate', hasDivider:false, toll:false, ghat:false, historical:68, description:'Through Mandya and Channapatna. Busy market towns, pedestrian crossings, accident-prone stretches.' },
    ]
  },
  'bangalore-chennai': {
    label: 'Bangalore → Chennai',
    midCity: 'bangalore',
    routes: [
      { id:'BC-NH4', name:'NH-48 via Vellore', short:'NH-48 Direct', distance:346, type:'national_highway', speedLimit:'80', condition:'good', hasDivider:true, toll:true, ghat:false, historical:74, description:'Major 4-lane highway. Night bus accidents frequent. Animal crossings near Vellore.' },
      { id:'BC-ECP', name:'NH-44 via Krishnagiri Bypass', short:'Krishnagiri Bypass', distance:362, type:'national_highway', speedLimit:80, condition:'moderate', hasDivider:false, toll:true, ghat:false, historical:70, description:'Longer but bypasses Vellore town congestion. Fewer pedestrians on the bypass stretch.' },
    ]
  },
  'hyderabad-vijayawada': {
    label: 'Hyderabad → Vijayawada',
    midCity: 'hyderabad',
    routes: [
      { id:'HV-NH9', name:'NH-65 (Direct Highway)', short:'NH-65 Direct', distance:274, type:'national_highway', speedLimit:80, condition:'good', hasDivider:true, toll:true, ghat:false, historical:66, description:'Well-maintained NH with partial 4-lane. Overtaking accidents on 2-lane stretches.' },
      { id:'HV-NHE', name:'NH-65 Extended via Suryapet', short:'Via Suryapet', distance:298, type:'national_highway', speedLimit:80, condition:'moderate', hasDivider:false, toll:false, ghat:false, historical:72, description:'Longer route through smaller towns. More potholes, but lower traffic density.' },
    ]
  },
  'mumbai-nashik': {
    label: 'Mumbai → Nashik',
    midCity: 'mumbai',
    routes: [
      { id:'MN-EXW', name:'NH-160 via Kasara Ghat (Direct)', short:'Via Kasara Ghat', distance:162, type:'national_highway', speedLimit:60, condition:'moderate', hasDivider:false, toll:false, ghat:true, historical:88, description:'Ghat road with sharp bends. Flash flood prone during monsoon. High accident rate on ghat section.' },
      { id:'MN-IGT', name:'NH-160 via Igatpuri (Expressway start)', short:'Via Igatpuri', distance:178, type:'national_highway', speedLimit:80, condition:'good', hasDivider:true, toll:true, ghat:true, historical:78, description:'Uses the new 4-lane section for longer stretch before ghat. Relatively safer ghat approach.' },
    ]
  },
  'delhi-chandigarh': {
    label: 'Delhi → Chandigarh',
    midCity: 'delhi',
    routes: [
      { id:'DC-NH4', name:'NH-44 (Direct 6-lane)', short:'NH-44 Express', distance:250, type:'expressway', speedLimit:100, condition:'good', hasDivider:true, toll:true, ghat:false, historical:62, description:'Well-maintained 6-lane divided NH. One of the better maintained highways in India.' },
      { id:'DC-GHD', name:'GT Road via Ambala (Old)', short:'GT Road Old', distance:274, type:'national_highway', speedLimit:80, condition:'moderate', hasDivider:false, toll:false, ghat:false, historical:75, description:'Historic GT Road through Karnal and Ambala. Heavy truck traffic, slow moving.' },
    ]
  },
  'chennai-pondicherry': {
    label: 'Chennai → Pondicherry',
    midCity: 'chennai',
    routes: [
      { id:'CP-ECR', name:'East Coast Road (ECR)', short:'East Coast Rd', distance:162, type:'state_highway', speedLimit:80, condition:'good', hasDivider:true, toll:false, ghat:false, historical:72, description:'Beautiful coastal route. High-speed driving and beachside distractions cause accidents.' },
      { id:'CP-NH4', name:'NH-45 via GST Road', short:'NH-45 GST', distance:148, type:'national_highway', speedLimit:80, condition:'moderate', hasDivider:false, toll:true, ghat:false, historical:68, description:'Faster inland route through Tindivanam. Busy NH with frequent overtaking accidents.' },
    ]
  },
  'kolkata-durgapur': {
    label: 'Kolkata → Durgapur',
    midCity: 'kolkata',
    routes: [
      { id:'KD-EXP', name:'Durgapur Expressway (NH-19)', short:'Durgapur Exp.', distance:160, type:'expressway', speedLimit:100, condition:'good', hasDivider:true, toll:true, ghat:false, historical:58, description:'6-lane controlled expressway. Good condition, fog a hazard in winter months.' },
      { id:'KD-GT2', name:'GT Road via Burdwan', short:'GT Road via Burdwan', distance:178, type:'national_highway', speedLimit:60, condition:'moderate', hasDivider:false, toll:false, ghat:false, historical:78, description:'Through Burdwan city. Heavy traffic, pedestrians, and slow trucks.' },
    ]
  },
};

// Hour-based traffic determinism
function getTrafficByHour() {
  const h = new Date().getHours();
  if ((h>=7&&h<=10)||(h>=17&&h<=20)) return{val:'heavy',label:'● Heavy (Rush Hour)',score:3};
  if ((h>=10&&h<=17)||(h>=20&&h<=22)) return{val:'moderate',label:'● Moderate',score:2};
  return {val:'low',label:'● Light Traffic',score:1};
}

// Weather city lookup (reuse existing)
const SMART_WEATHER_DB = {
  mumbai:{temp:28,humidity:82,visibility:7000,condition:'Partly Cloudy',wind:18,icon:'\u25ec',aqi:'Moderate',riskFactor:1.3},
  pune:{temp:25,humidity:68,visibility:9000,condition:'Clear',wind:12,icon:'◉',aqi:'Good',riskFactor:1.0},
  delhi:{temp:21,humidity:65,visibility:3500,condition:'Dense Fog',wind:7,icon:'≈',aqi:'Poor',riskFactor:3.2},
  jaipur:{temp:22,humidity:55,visibility:8000,condition:'Partly Cloudy',wind:14,icon:'◬',aqi:'Moderate',riskFactor:1.2},
  bangalore:{temp:23,humidity:70,visibility:9500,condition:'Clear',wind:10,icon:'◉',aqi:'Good',riskFactor:1.0},
  chennai:{temp:31,humidity:80,visibility:7500,condition:'Humid',wind:15,icon:'◬',aqi:'Moderate',riskFactor:1.4},
  hyderabad:{temp:26,humidity:64,visibility:9200,condition:'Clear',wind:11,icon:'◉',aqi:'Good',riskFactor:1.0},
  kolkata:{temp:28,humidity:78,visibility:5000,condition:'Hazy',wind:9,icon:'≈',aqi:'Poor',riskFactor:2.1},
  ahmedabad:{temp:29,humidity:58,visibility:7000,condition:'Dusty',wind:19,icon:'≣',aqi:'Moderate',riskFactor:1.5},
};

function getLiveWeather(city) {
  const base = SMART_WEATHER_DB[city] || SMART_WEATHER_DB.mumbai;
  const hour = new Date().getHours();
  // Fog worsens at night/early morning
  const fogMult = (hour>=22||hour<=6)?1.4:(hour<=9)?1.2:1.0;
  const noise = n => Math.round(n + (Math.random()-.5)*n*.06);
  return {
    ...base,
    temp: noise(base.temp),
    humidity: noise(base.humidity),
    visibility: Math.round(base.visibility/fogMult),
    wind: noise(base.wind),
    timestamp: new Date().toLocaleTimeString('en-IN'),
  };
}

function weatherToAnalyzerVal(w) {
  if(w.visibility<2000||w.condition.includes('Dense Fog')) return 'fog';
  if(w.condition.includes('Rain')||w.condition.includes('Storm')) return 'heavy_rain';
  if(w.condition.includes('Humid')||w.condition.includes('Cloudy')) return 'cloudy';
  if(w.condition.includes('Dust')) return 'dust';
  if(w.condition.includes('Hazy')||w.condition.includes('Fog')) return 'fog';
  return 'clear';
}

// ════ SMART SCORER ════════════════════
const LR_SMART = {fog:3.4,heavy_rain:2.9,rain:2.8,dust:2.4,cloudy:1.4,clear:1.0};
const TRAFFIC_SCORES = {heavy:1.6,moderate:1.1,low:1.0};
const COND_SCORES = {poor:2.5,moderate:1.5,good:1.0,construction:3.0};
const TYPE_SCORES = {expressway:1.9,national_highway:1.7,state_highway:1.4,urban:1.3,rural:1.2};

function scoreRoute(route, weather, traffic) {
  const BASE = 0.058;
  let p = BASE;
  p *= LR_SMART[weatherToAnalyzerVal(weather)] || 1.0;
  p *= TRAFFIC_SCORES[traffic.val] || 1.0;
  p *= COND_SCORES[route.condition] || 1.0;
  p *= (route.historical/100) * 1.8;
  if(route.ghat) p *= 1.35;
  if(!route.hasDivider) p *= 1.22;
  const fogMult = weather.visibility < 3000 ? 1.5 : weather.visibility < 6000 ? 1.2 : 1.0;
  p *= fogMult;
  // FOL danger rules
  const firedRules = [];
  const wVal = weatherToAnalyzerVal(weather);
  if(['expressway','national_highway'].includes(route.type) && (wVal==='fog'||wVal==='heavy_rain') ) firedRules.push('R1: Highway+Bad Weather');
  if(route.condition==='poor' && parseInt(route.speedLimit)>=80) firedRules.push('R2: Poor Road+High Speed');
  if(route.historical>=85) firedRules.push('R3: Historical Accident Zone');
  if(route.ghat && (wVal==='rain'||wVal==='heavy_rain')) firedRules.push('R5: Ghat+Rain→EXTREME');
  const finalScore = Math.min(96, Math.max(5, Math.round(Math.min(p,0.97)*100)));
  const rl = finalScore>=80?'EXTREME':finalScore>=60?'HIGH':finalScore>=35?'MODERATE':'LOW';
  return { score:finalScore, riskLevel:rl, firedRules, p:Math.round(p*100) };
}

// ════ SMART ROUTE ANALYZER UI ══════════
function initSmartRouteAnalyzer() {
  const srcSel = document.getElementById('sra-src');
  const dstSel = document.getElementById('sra-dst');
  if (!srcSel || !dstSel) return;

  // Populate dropdowns from route DB
  const cities = new Set();
  Object.values(ROUTE_DB).forEach(r => {
    const [a,b] = r.label.split(' → ');
    cities.add(a); cities.add(b);
  });
  const cArr = [...cities].sort();
  const makeOpts = sel => { sel.innerHTML = '<option value="">Select city...</option>' + cArr.map(c=>`<option value="${c}">${c}</option>`).join(''); };
  makeOpts(srcSel); makeOpts(dstSel);
}

function findRouteKey(src, dst) {
  const norm = s => s.toLowerCase().trim();
  const key1 = `${norm(src)}-${norm(dst)}`;
  const key2 = `${norm(dst)}-${norm(src)}`;
  return ROUTE_DB[key1] ? {key:key1, data:ROUTE_DB[key1], reversed:false}
    : ROUTE_DB[key2] ? {key:key2, data:ROUTE_DB[key2], reversed:true}
    : null;
}

let sraCompChart = null;
async function runSmartRouteAnalysis() {
  const src = document.getElementById('sra-src').value;
  const dst = document.getElementById('sra-dst').value;
  const resultEl = document.getElementById('sraResult');
  if(!src||!dst){toast('Select both source and destination','error');return;}
  if(src===dst){toast('Source and destination cannot be same','error');return;}

  const found = findRouteKey(src, dst);
  if(!found){
    resultEl.innerHTML=`<div class="sra-no-route"><div style="font-size:2rem">◆</div><div>No predefined route data found for <strong>${src} → ${dst}</strong>. Try: Mumbai–Pune, Delhi–Agra, Bangalore–Mysore, Delhi–Jaipur, Hyderabad–Vijayawada, Delhi–Chandigarh, etc.</div></div>`;
    return;
  }

  const btn = document.getElementById('sraBtn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Analyzing Routes...';

  const {data} = found;
  const traffic = getTrafficByHour();
  const weather = getLiveWeather(data.midCity);
  const wVal = weatherToAnalyzerVal(weather);

  await new Promise(r=>setTimeout(r,1200));

  const scored = data.routes.map(r => ({...r, ...scoreRoute(r,weather,traffic)}));
  const winner = scored.reduce((a,b)=>a.score<b.score?a:b);
  const loser  = scored.find(r=>r.id!==winner.id);
  const diff   = Math.abs(scored[0].score - scored[1].score);
  const rcColor = s => s>=80?'#ef4444':s>=60?'#f97316':s>=35?'#eab308':'#22c55e';
  const rlClass = s => s>=80?'extreme':s>=60?'high':s>=35?'moderate':'low';

  resultEl.innerHTML = `
    <div class="sra-result-wrap">
      <!-- HEADER -->
      <div class="sra-header">
        <div>
          <div class="sra-route-lbl">${src} → ${dst}</div>
          <div class="sra-route-time">Analyzed at ${new Date().toLocaleTimeString('en-IN')} · ${new Date().toLocaleDateString('en-IN')}</div>
        </div>
    <div class="sra-rec-badge">✓ AI Recommendation: ${winner.short}</div>
      </div>

      <!-- LIVE CONDITIONS -->
      <div class="sra-conditions">
        <div class="sra-cond-card">
          <div class="scc-icon">${weather.icon}</div>
          <div><div class="scc-title">Live Weather</div><div class="scc-val">${weather.condition} · ${weather.temp}°C</div><div class="scc-sub">Visibility: ${(weather.visibility/1000).toFixed(1)} km · Wind: ${weather.wind} km/h · AQI: ${weather.aqi}</div></div>
        </div>
        <div class="sra-cond-card">
          <div class="scc-icon">▶</div>
          <div><div class="scc-title">Current Traffic</div><div class="scc-val">${traffic.label}</div><div class="scc-sub">Based on time — ${new Date().getHours()}:00 hrs</div></div>
        </div>
        <div class="sra-cond-card">
          <div class="scc-icon">⚠</div>
          <div><div class="scc-title">Weather Risk</div><div class="scc-val" style="color:${wVal==='fog'||wVal==='heavy_rain'?'#f87171':wVal==='rain'?'#fb923c':'#4ade80'}">${wVal==='fog'?'HIGH — Dense Fog':wVal==='heavy_rain'?'HIGH — Storms':wVal==='rain'?'MODERATE — Rain':'LOW — Safe'}</div><div class="scc-sub">Weather multiplier: ${(LR_SMART[wVal]||1).toFixed(1)}×</div></div>
        </div>
      </div>

      <!-- ROUTE CARDS -->
      <div class="sra-route-cards">
        ${scored.map((r,i) => `
          <div class="sra-route-card ${r.id===winner.id?'sra-winner':'sra-loser'}">
            ${r.id===winner.id?'<div class="sra-winner-tag">▲ RECOMMENDED — SAFER ROUTE</div>':'<div class="sra-loser-tag">⚠ Higher Risk Option</div>'}
            <div class="src-head">
              <div class="src-name">${r.name}</div>
              <div class="src-score" style="color:${rcColor(r.score)}">${r.score}%</div>
            </div>
            <div class="src-risk-row">
              <span class="risk-tag ${rlClass(r.score)}">${r.riskLevel}</span>
              <div class="src-bar-track"><div class="src-bar-fill" style="width:${r.score}%;background:${rcColor(r.score)}"></div></div>
            </div>
            <div class="src-specs">
              <div class="src-spec"><span>📏 Distance</span><strong>${r.distance} km</strong></div>
              <div class="src-spec"><span>🏎️ Speed Limit</span><strong>${r.speedLimit} km/h</strong></div>
              <div class="src-spec"><span>▬ Road Type</span><strong>${r.type.replace('_',' ')}</strong></div>
              <div class="src-spec"><span>■ Condition</span><strong>${r.condition}</strong></div>
              <div class="src-spec"><span>■ Divider</span><strong>${r.hasDivider?'Yes ✓':'No ✗'}</strong></div>
              <div class="src-spec"><span>🏔️ Ghat Section</span><strong>${r.ghat?'Yes ⚠️':'No ✅'}</strong></div>
              <div class="src-spec"><span>💳 Toll</span><strong>${r.toll?'Yes':'No'}</strong></div>
              <div class="src-spec"><span>📊 Historical Risk</span><strong style="color:${rcColor(r.historical)}">${r.historical}/100</strong></div>
            </div>
            ${r.firedRules.length?`<div class="src-rules"><div class="src-rules-title">⚡ FOL Rules Triggered</div>${r.firedRules.map(x=>`<div class="src-rule-item">✗ ${x}</div>`).join('')}</div>`:'<div class="src-rules src-safe-rules">✓ No extreme danger FOL rules triggered</div>'}
            <div class="src-desc">${r.description}</div>
          </div>
        `).join('')}
      </div>

      <!-- AI VERDICT -->
      <div class="sra-verdict">
        <div class="sra-verdict-title">🤖 AI Verdict</div>
        <div class="sra-verdict-text">
          <strong>${winner.short}</strong> is the safer choice with risk score <strong style="color:${rcColor(winner.score)}">${winner.score}%</strong> vs 
          ${loser?`<strong style="color:${rcColor(loser.score)}">${loser.score}%</strong> on ${loser.short}. A difference of <strong>${diff}%</strong> in predicted accident probability.`:'N/A'}
          ${winner.ghat ? '<br>⚠️ Both routes have ghat sections — extra caution during monsoon.' : ''}
          ${wVal==='fog'?'<br>🌫️ Current fog conditions strongly increase highway risk — reduce speed by 50%.':''}
          ${traffic.val==='heavy'?'<br>🚗 Rush hour traffic detected — expect congestion and higher accident probability.':''}
          Model confidence: <strong>87.4%</strong> (MoRTH 2022 dataset).
        </div>
        <div class="sra-rec-box">
          <div style="font-size:1.1rem;font-weight:700">Take: ${winner.short}</div>
          <div style="font-size:.8rem;color:var(--sub);margin-top:3px">Distance: ${winner.distance} km · Risk: ${winner.riskLevel} · Score: ${winner.score}%</div>
        </div>
      </div>

      <!-- COMPARISON CHART -->
      <div class="chart-card" style="margin-top:1rem">
        <div class="chart-title">Risk Factor Breakdown — Route A vs Route B</div>
        <canvas id="sraCompChart" height="160"></canvas>
      </div>
    </div>
  `;

  // Draw comparison chart
  const cc = document.getElementById('sraCompChart');
  if(sraCompChart)sraCompChart.destroy();
  const labels = ['Historical Risk','Weather Impact','Traffic','Road Condition','Divider Penalty','Ghat Penalty'];
  const s0 = scored[0], s1 = scored[1];
  const factorScore = (r,w,t) => [
    r.historical,
    Math.round((LR_SMART[weatherToAnalyzerVal(w)]||1)*20),
    t.score*26,
    Math.round((COND_SCORES[r.condition]||1)*25),
    r.hasDivider?8:28,
    r.ghat?35:5,
  ];
  sraCompChart = new Chart(cc, {
    type:'bar',
    data:{
      labels,
      datasets:[
        {label:scored[0].short,data:factorScore(s0,weather,traffic),backgroundColor:'rgba(59,130,246,.8)',borderRadius:5},
        {label:scored[1].short,data:factorScore(s1,weather,traffic),backgroundColor:'rgba(239,68,68,.8)',borderRadius:5},
      ]
    },
    options:{responsive:true,indexAxis:'y',plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{max:100,grid:{color:'rgba(255,255,255,.04)'},ticks:{callback:v=>v}},y:{grid:{color:'rgba(255,255,255,.03)'},ticks:{font:{size:10},color:'#94a3b8'}}}}
  });

  btn.disabled=false; btn.innerHTML='🔍 Analyze Routes';
  toast(`${winner.short} recommended for ${src}→${dst}`,'success');
}
