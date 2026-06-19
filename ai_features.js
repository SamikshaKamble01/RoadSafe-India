/* ═══════════════════════════════════════════════════════════════
   RoadSafe India — AI Features Module
   Feature 1: Explainable AI (XAI) Panel
   Feature 2: Voice Input + Speech Output
   Feature 3: Live Weather Integration (Open-Meteo — free, no key)
   Feature 4: Grok AI Chatbot (xAI API)
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════
   FEATURE 1 — EXPLAINABLE AI (XAI) PANEL
   ═══════════════════════════════════════ */

/**
 * XAI_FACTORS: maps input flags → { label, icon, multiplier, maxContrib }
 * multiplier = likelihood ratio from Bayesian engine (same source of truth)
 */
require('dotenv').config();
const XAI_FACTORS = [
  { key: 'fog', label: 'Dense Fog', icon: '🌫️', lr: 3.4, cap: 28 },
  { key: 'heavy_rain', label: 'Heavy Rain', icon: '⛈️', lr: 2.9, cap: 24 },
  { key: 'rain', label: 'Rain', icon: '🌧️', lr: 2.8, cap: 22 },
  { key: 'poor_road', label: 'Poor Road Condition', icon: '🏗️', lr: 2.5, cap: 20 },
  { key: 'festival', label: 'Festival Season', icon: '🎉', lr: 2.1, cap: 17 },
  { key: 'night', label: 'Night Driving', icon: '🌙', lr: 2.2, cap: 18 },
  { key: 'highway', label: 'High-Speed Highway', icon: '🛣️', lr: 1.9, cap: 15 },
  { key: 'heavy_traffic', label: 'Heavy Traffic / Jam', icon: '🚦', lr: 1.6, cap: 12 },
  { key: 'no_divider', label: 'No Road Divider', icon: '⚠️', lr: 1.4, cap: 10 },
  { key: 'accident_zone', label: 'Historical Accident Zone', icon: '📍', lr: 1.7, cap: 14 },
  { key: 'construction', label: 'Construction Zone', icon: '👷', lr: 1.5, cap: 11 },
  { key: 'high_speed', label: 'High Speed Limit (≥100)', icon: '🏎️', lr: 1.6, cap: 12 },
];

/**
 * buildXAIFactors — reads the analysis inputs and maps them to active factors
 */
function buildXAIFactors(inp) {
  const active = [];
  const w = inp.weather, t = inp.timeofday, r = inp.roadtype, c = inp.roadcondition;

  if (w === 'fog') active.push('fog');
  if (w === 'heavy_rain') active.push('heavy_rain');
  if (w === 'rain') active.push('rain');
  if (['poor', 'construction'].includes(c)) active.push('poor_road');
  if (inp.festival) active.push('festival');
  if (['night', 'evening'].includes(t)) active.push('night');
  if (['national_highway', 'expressway'].includes(r)) active.push('highway');
  if (['heavy', 'jam'].includes(inp.traffic)) active.push('heavy_traffic');
  if (!inp.divider) active.push('no_divider');
  if (inp.accident_history) active.push('accident_zone');
  if (c === 'construction') active.push('construction');
  if (parseInt(inp.speedlimit) >= 100) active.push('high_speed');

  return active;
}

/**
 * renderXAIPanel — builds the XAI explanation UI after analysis runs
 */
function renderXAIPanel(inp, score, riskLevel) {
  const panel = document.getElementById('xaiPanel');
  if (!panel) return;

  const activeKeys = buildXAIFactors(inp);

  // Compute contributions: each factor gets a weighted share of (score - base)
  const base = 8; // baseline risk %
  const totalLR = activeKeys.reduce((sum, k) => {
    const f = XAI_FACTORS.find(x => x.key === k);
    return sum + (f ? f.lr : 1);
  }, 0);

  const factors = activeKeys.map(k => {
    const f = XAI_FACTORS.find(x => x.key === k);
    if (!f) return null;
    const share = totalLR > 0 ? (f.lr / totalLR) : 0;
    const contrib = Math.round((score - base) * share);
    return { ...f, contrib };
  }).filter(Boolean).sort((a, b) => b.contrib - a.contrib);

  const maxContrib = factors[0]?.contrib || 1;
  const riskColors = { EXTREME: '#ef4444', HIGH: '#f97316', MODERATE: '#eab308', LOW: '#22c55e' };
  const rc = riskColors[riskLevel] || '#94a3b8';

  const barsHTML = factors.length === 0
    ? `<div class="xai-empty">✅ No significant risk factor detected. Conditions appear safe.</div>`
    : factors.map(f => {
      const pct = maxContrib > 0 ? Math.round((f.contrib / maxContrib) * 100) : 0;
      const barColor = f.contrib >= 15 ? '#ef4444' : f.contrib >= 10 ? '#f97316' : f.contrib >= 6 ? '#eab308' : '#22c55e';
      return `
          <div class="xai-factor-row">
            <div class="xai-factor-left">
              <span class="xai-factor-icon">${f.icon}</span>
              <div class="xai-factor-info">
                <div class="xai-factor-name">${f.label}</div>
                <div class="xai-factor-meta">LR: ${f.lr}× &nbsp;|&nbsp; Contribution: +${f.contrib}%</div>
              </div>
            </div>
            <div class="xai-bar-wrap">
              <div class="xai-bar-track">
                <div class="xai-bar-fill" style="width:${pct}%;background:${barColor}" data-pct="${pct}"></div>
              </div>
              <span class="xai-bar-val" style="color:${barColor}">+${f.contrib}%</span>
            </div>
          </div>`;
    }).join('');

  panel.innerHTML = `
    <div class="xai-header">
      <div class="xai-title">
        <span class="xai-icon">🧠</span>
        <div>
          <div class="xai-title-text">Explainable AI — Why this score?</div>
          <div class="xai-title-sub">Showing ${factors.length} active risk factor${factors.length !== 1 ? 's' : ''} that contributed to the <span style="color:${rc};font-weight:700">${score}% ${riskLevel}</span> score</div>
        </div>
      </div>
      <div class="xai-score-pill" style="background:${rc}22;border-color:${rc};color:${rc}">${score}%</div>
    </div>
    <div class="xai-baseline-row">
      <span class="xai-baseline-lbl">Base Risk (no factors)</span>
      <div class="xai-bar-track" style="max-width:160px">
        <div class="xai-bar-fill" style="width:${Math.round(base / score * 100)}%;background:#475569"></div>
      </div>
      <span class="xai-baseline-val">+${base}%</span>
    </div>
    <div class="xai-factors-list">${barsHTML}</div>
    <div class="xai-footnote">
      Scores computed using Bayesian Likelihood Ratios from MoRTH 2022 dataset. 
      Ensemble: FOL (45%) + Bayesian (55%).
    </div>`;

  panel.style.display = 'block';
  panel.style.animation = 'xaiFadeIn 0.4s ease';

  // Animate bars after render
  requestAnimationFrame(() => {
    panel.querySelectorAll('.xai-bar-fill').forEach(bar => {
      const target = bar.dataset.pct;
      bar.style.width = '0%';
      bar.style.transition = 'none';
      setTimeout(() => {
        bar.style.transition = 'width 0.9s cubic-bezier(0.25,1,0.5,1)';
        bar.style.width = target + '%';
      }, 80);
    });
  });
}


/* ═══════════════════════════════════════
   FEATURE 2 — VOICE INPUT + SPEECH OUTPUT
   ═══════════════════════════════════════ */

let voiceActive = false;
let currentMicTarget = null;

const voiceSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * startVoiceInput — starts recognition and fills targetFieldId
 */
function startVoiceInput(targetFieldId, micBtnId) {
  if (!voiceSupported) {
    toast('Voice input not supported in this browser', 'error');
    return;
  }
  if (voiceActive) return;

  const rec = new SpeechRec();
  rec.lang = 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 3;

  const micBtn = document.getElementById(micBtnId);
  if (micBtn) {
    micBtn.classList.add('mic-listening');
    micBtn.title = 'Listening…';
  }
  voiceActive = true;
  currentMicTarget = targetFieldId;

  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript.trim();
    const field = document.getElementById(targetFieldId);
    if (field) {
      field.value = transcript;
      // Dispatch input + change so existing listeners trigger
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    toast(`🎤 Heard: "${transcript}"`, 'success');
    // Auto-fetch weather for source city
    if (targetFieldId === 'srcCity' || targetFieldId === 'voiceCity') {
      triggerLiveWeather(transcript);
    }
  };

  rec.onerror = () => {
    toast('Voice recognition failed. Try again.', 'error');
  };

  rec.onend = () => {
    voiceActive = false;
    if (micBtn) {
      micBtn.classList.remove('mic-listening');
      micBtn.title = 'Click to speak';
    }
  };

  rec.start();
}

/**
 * speakResult — announces risk result using Web Speech API
 */
function speakResult(score, riskLevel, location) {
  if (!('speechSynthesis' in window)) return;
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const msgs = {
    EXTREME: `Warning! Extreme road risk detected at ${location || 'this route'}. Risk score is ${score} percent. Do NOT travel without extreme precautions. Consider an alternate route immediately.`,
    HIGH: `Caution. High road risk detected at ${location || 'this route'}. Risk score is ${score} percent. Reduce speed significantly and drive with full attention.`,
    MODERATE: `Alert. Moderate road risk on ${location || 'this route'}. Score is ${score} percent. Drive carefully and maintain a safe following distance.`,
    LOW: `Safe conditions on ${location || 'this route'}. Risk score is ${score} percent. Standard driving practices apply. Have a safe journey!`,
  };

  const utter = new SpeechSynthesisUtterance(msgs[riskLevel] || msgs.LOW);
  utter.lang = 'en-IN';
  utter.rate = 0.92;
  utter.pitch = riskLevel === 'EXTREME' ? 1.2 : 1.0;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

/**
 * toggleSpeech — called by the speaker button in result panel area
 */
window._lastAnalysisForSpeech = null;
function toggleSpeechOutput() {
  const d = window._lastAnalysisForSpeech;
  if (!d) { toast('Run an analysis first!', 'error'); return; }
  speakResult(d.score, d.riskLevel, d.location);
}


/* ═══════════════════════════════════════
   FEATURE 3 — LIVE WEATHER INTEGRATION
   Uses open-meteo.com — free, no API key
   ═══════════════════════════════════════ */

const weatherCache = {};
const WMO_MAP = {
  0: { label: 'Clear Sky', cat: 'clear', icon: '☀️' },
  1: { label: 'Mainly Clear', cat: 'clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', cat: 'cloudy', icon: '⛅' },
  3: { label: 'Overcast', cat: 'cloudy', icon: '☁️' },
  45: { label: 'Fog', cat: 'fog', icon: '🌫️' },
  48: { label: 'Dense Fog', cat: 'fog', icon: '🌫️' },
  51: { label: 'Light Drizzle', cat: 'rain', icon: '🌦️' },
  61: { label: 'Light Rain', cat: 'rain', icon: '🌧️' },
  63: { label: 'Moderate Rain', cat: 'rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', cat: 'heavy_rain', icon: '⛈️' },
  71: { label: 'Light Snow', cat: 'cloudy', icon: '🌨️' },
  80: { label: 'Rain Showers', cat: 'rain', icon: '🌦️' },
  95: { label: 'Thunderstorm', cat: 'heavy_rain', icon: '⛈️' },
};

let weatherDebounceTimer = null;

/**
 * triggerLiveWeather — debounced, called on city field input
 */
function triggerLiveWeather(cityName) {
  if (!cityName || cityName.length < 2) return;
  clearTimeout(weatherDebounceTimer);
  weatherDebounceTimer = setTimeout(() => fetchLiveWeather(cityName), 800);
}

async function fetchLiveWeather(city) {
  const cacheKey = city.toLowerCase().trim();
  if (weatherCache[cacheKey]) {
    renderLiveWeatherCard(weatherCache[cacheKey]);
    return;
  }

  const card = document.getElementById('liveWeatherCard');
  if (card) {
    card.style.display = 'block';
    card.innerHTML = `<div class="lwx-loading"><div class="lwx-spinner"></div> Fetching live weather for <strong>${city}</strong>…</div>`;
  }

  try {
    // Step 1: Geocode city name
    const geoResp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},India&format=json&limit=1`,
      { headers: { 'User-Agent': 'RoadSafe-India/1.0 (student project)' } }
    );
    const geoData = await geoResp.json();
    if (!geoData.length) throw new Error('City not found');

    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);
    const displayName = geoData[0].display_name.split(',')[0];

    // Step 2: Fetch weather
    const wxResp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility,weather_code&timezone=Asia%2FKolkata`
    );
    const wxData = await wxResp.json();
    const cur = wxData.current;
    const wmo = WMO_MAP[cur.weather_code] || { label: 'Variable', cat: 'cloudy', icon: '🌡️' };

    const result = {
      city: displayName,
      lat, lon,
      temp: Math.round(cur.temperature_2m),
      humidity: cur.relative_humidity_2m,
      wind: Math.round(cur.wind_speed_10m),
      visibility: cur.visibility ? Math.round(cur.visibility) : 10000,
      condition: wmo.label,
      cat: wmo.cat,
      icon: wmo.icon,
      code: cur.weather_code,
    };

    weatherCache[cacheKey] = result;
    renderLiveWeatherCard(result);

    // Auto-sync weather dropdown in analyzer
    const wSel = document.getElementById('weather');
    if (wSel && result.cat) {
      wSel.value = result.cat;
      wSel.dispatchEvent(new Event('change', { bubbles: true }));
    }

  } catch (err) {
    if (card) {
      card.innerHTML = `<div class="lwx-error">⚠️ Could not fetch weather for <strong>${city}</strong>. Check connection.</div>`;
    }
  }
}

function renderLiveWeatherCard(d) {
  const card = document.getElementById('liveWeatherCard');
  if (!card) return;

  const vis = d.visibility >= 1000 ? (d.visibility / 1000).toFixed(1) + ' km' : d.visibility + ' m';
  const visNum = d.visibility;
  const riskColor = visNum < 1000 ? '#ef4444' : visNum < 4000 ? '#f97316' : visNum < 8000 ? '#eab308' : '#22c55e';
  const riskLabel = visNum < 1000 ? 'EXTREME RISK' : visNum < 4000 ? 'HIGH RISK' : visNum < 8000 ? 'MODERATE' : 'LOW RISK';
  const impact = visNum < 1000
    ? '⚠️ Near-zero visibility — Do NOT drive without fog lights'
    : visNum < 4000 ? '⚠️ Poor visibility — Reduce speed, increase following distance'
      : d.cat === 'heavy_rain' ? '🌊 Wet roads — Braking distance doubled'
        : d.cat === 'fog' ? '🌫️ Fog conditions — Hazard lights mandatory'
          : '✅ Acceptable driving conditions — Standard precautions';

  card.style.display = 'block';
  card.innerHTML = `
    <div class="lwx-card">
      <div class="lwx-top">
        <div class="lwx-left">
          <span class="lwx-emoji">${d.icon}</span>
          <div>
            <div class="lwx-city">${d.city}</div>
            <div class="lwx-cond">${d.condition}</div>
            <div class="lwx-temp">${d.temp}°<span style="font-size:1rem">C</span></div>
          </div>
        </div>
        <div class="lwx-badge" style="color:${riskColor};border-color:${riskColor}">${riskLabel}</div>
      </div>
      <div class="lwx-stats">
        <div class="lwx-stat"><span class="lwx-stat-icon">💧</span><div class="lwx-stat-val">${d.humidity}%</div><div class="lwx-stat-lbl">Humidity</div></div>
        <div class="lwx-stat"><span class="lwx-stat-icon">👁️</span><div class="lwx-stat-val">${vis}</div><div class="lwx-stat-lbl">Visibility</div></div>
        <div class="lwx-stat"><span class="lwx-stat-icon">💨</span><div class="lwx-stat-val">${d.wind} km/h</div><div class="lwx-stat-lbl">Wind</div></div>
        <div class="lwx-stat"><span class="lwx-stat-icon">🕐</span><div class="lwx-stat-val">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div><div class="lwx-stat-lbl">Live</div></div>
      </div>
      <div class="lwx-impact">${impact}</div>
      <div class="lwx-sync">📊 Weather auto-synced to Analyzer dropdown</div>
    </div>`;
}


/* ═══════════════════════════════════════
   FEATURE 4 — GROK AI CHATBOT
   ═══════════════════════════════════════ */

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

let chatHistory = [];
let chatContext = {};
let chatOpen = false;

const SYSTEM_PROMPT = `You are RoadSafe AI, an intelligent road safety assistant integrated into the RoadSafe India platform.
You help users understand road safety, interpret risk scores, explain AI model results, and provide safety advice.
You are aware of the current analysis context and use it to give personalized answers.
Tone: Friendly, expert, succinct. Support English, Hindi, and Hinglish naturally.
Keep responses under 150 words unless asked for detail. Use bullet points when listing.
Always base safety advice on real Indian road conditions and MoRTH data.`;

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  const btn = document.getElementById('chatFab');
  if (!panel) return;
  if (chatOpen) {
    panel.style.display = 'flex';
    panel.style.animation = 'chatSlideIn 0.3s ease';
    if (chatHistory.length === 0) addChatBubble('bot', '👋 **Namaste!** I\'m RoadSafe AI. Ask me anything about road safety, risk scores, or route advice. I know about your current analysis!');
    document.getElementById('chatInput')?.focus();
    if (btn) btn.innerHTML = '✕';
  } else {
    panel.style.display = 'none';
    if (btn) btn.innerHTML = '🤖';
  }
}

function updateChatContext(analysisData) {
  chatContext = analysisData || {};
}

function addChatBubble(role, text) {
  const feed = document.getElementById('chatFeed');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = `chat-bubble chat-${role}`;
  // Simple markdown: **bold**, _italic_
  div.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function addTypingIndicator() {
  const feed = document.getElementById('chatFeed');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = 'chat-bubble chat-bot chat-typing';
  div.id = 'chatTyping';
  div.innerHTML = '<span></span><span></span><span></span>';
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('chatTyping');
  if (el) el.remove();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  if (!input) return;

  const userMsg = input.value.trim();
  if (!userMsg) return;

  input.value = '';
  addChatBubble('user', userMsg);
  chatHistory.push({ role: 'user', content: userMsg });

  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '…'; }
  addTypingIndicator();

  // Build context string
  const ctxStr = chatContext.riskLevel
    ? `Current Analysis Context:
- Location: ${chatContext.location || 'Not specified'}
- Risk Level: ${chatContext.riskLevel}
- Risk Score: ${chatContext.score}%
- Weather: ${chatContext.weather}
- Road Type: ${chatContext.roadtype}
- Time of Day: ${chatContext.timeofday}
- FOL Rules Fired: ${chatContext.firedRules?.join(', ') || 'None'}
- Bayesian P(Accident): ${chatContext.bayesProb}%`
    : 'No analysis has been run yet.';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n' + ctxStr },
    ...chatHistory.slice(-8), // last 8 turns for context
  ];

  try {
    const resp = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${resp.status}`);
    }

    const data = await resp.json();
    const botMsg = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    chatHistory.push({ role: 'assistant', content: botMsg });
    removeTypingIndicator();
    addChatBubble('bot', botMsg);

  } catch (err) {
    removeTypingIndicator();
    addChatBubble('bot', `⚠️ **Connection issue:** ${err.message}.\n\nTip: Check your API key or network connection. I'm still here to help once it's fixed!`);
  } finally {
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '➤'; }
    input.focus();
  }
}

function clearChat() {
  chatHistory = [];
  const feed = document.getElementById('chatFeed');
  if (feed) feed.innerHTML = '';
  addChatBubble('bot', '🔄 Chat cleared. How can I help you with road safety?');
}

// Enter key sends
document.addEventListener('DOMContentLoaded', () => {
  const ci = document.getElementById('chatInput');
  if (ci) {
    ci.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
    });
  }
});


/* ═══════════════════════════════════════
   INTEGRATION — PATCH runAnalysis() hook
   Extends app.js runAnalysis without modifying it
   ═══════════════════════════════════════ */

// We wait for DOMContentLoaded then wrap the existing runAnalysis
document.addEventListener('DOMContentLoaded', () => {
  // Inject live weather trigger on location/city inputs
  const cityInput = document.getElementById('cityInput');
  if (cityInput) {
    cityInput.addEventListener('input', () => triggerLiveWeather(cityInput.value));
  }

  // Also inject on the SRA source city input if present
  const srcCity = document.getElementById('srcCity');
  if (srcCity) {
    srcCity.addEventListener('input', () => triggerLiveWeather(srcCity.value));
  }

  // Patch runAnalysis to add XAI + Voice output
  const _origAnalysis = window.runAnalysis;
  if (typeof _origAnalysis === 'function') {
    window.runAnalysis = async function () {
      await _origAnalysis.call(this);

      // Read the inputs and last history entry
      const hist = RS.getHistory();
      if (!hist.length) return;
      const latest = hist[0];

      const inp = {
        weather: document.getElementById('weather')?.value || 'clear',
        timeofday: document.getElementById('timeofday')?.value || 'day',
        roadtype: document.getElementById('roadtype')?.value || 'national_highway',
        roadcondition: document.getElementById('roadcondition')?.value || 'good',
        traffic: document.getElementById('traffic')?.value || 'moderate',
        speedlimit: document.getElementById('speedlimit')?.value || '80',
        festival: document.getElementById('festival')?.checked || false,
        accident_history: document.getElementById('accident_history')?.checked || false,
        divider: document.getElementById('divider')?.checked || false,
      };

      // Feature 1: XAI Panel
      renderXAIPanel(inp, latest.score, latest.riskLevel);

      // Feature 2: Speech output
      window._lastAnalysisForSpeech = {
        score: latest.score,
        riskLevel: latest.riskLevel,
        location: latest.location,
      };
      // Auto-speak if user had previously clicked speech button
      if (window._autoSpeak) {
        speakResult(latest.score, latest.riskLevel, latest.location);
      }

      // Feature 4: Update chatbot context
      updateChatContext({
        location: latest.location,
        riskLevel: latest.riskLevel,
        score: latest.score,
        weather: latest.weather,
        roadtype: latest.roadtype,
        timeofday: latest.timeofday,
        firedRules: latest.firedRules,
        bayesProb: latest.bayesProb,
      });
    };
  }
});

/* expose globals */
window.startVoiceInput = startVoiceInput;
window.toggleSpeechOutput = toggleSpeechOutput;
window.triggerLiveWeather = triggerLiveWeather;
window.toggleChat = toggleChat;
window.sendChat = sendChat;
window.clearChat = clearChat;
window.renderXAIPanel = renderXAIPanel;
