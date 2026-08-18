// PostAI — Main Application
// SIH 2026 Prototype

const APP = {
  currentPage  : "home",
  currentTab   : "text",
  analysisResult: null,
  leafletMap   : null,
  charts       : {}
};

// ─── Utility ──────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const show = el => el && el.classList.remove("hidden");
const hide = el => el && el.classList.add("hidden");

// ─── Navigation ───────────────────────────────────────────────────────────────

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = $(`page-${id}`);
  if (page) page.classList.add("active");
  APP.currentPage = id;

  document.querySelectorAll(".nav-link").forEach(l => {
    l.classList.toggle("active", l.dataset.page === id);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (id === "dashboard") renderDashboard();
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function toast(msg, type = "info") {
  const c  = $("toast-container");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add("visible"));
  setTimeout(() => {
    el.classList.remove("visible");
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function switchTab(tab) {
  APP.currentTab = tab;
  ["text", "image"].forEach(t => {
    $(`tab-btn-${t}`).classList.toggle("active", t === tab);
    $(`tab-${t}`).classList.toggle("hidden", t !== tab);
  });
}

// ─── Demo Buttons ────────────────────────────────────────────────────────────

function loadDemo(key) {
  const s = DEMO_SCENARIOS[key];
  if (!s) return;
  $("address-input").value = s.address;
  toast(`Loaded: ${s.label}`, "info");
}

// ─── Step Animation ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Address Parsing",          icon: "📋", ms: 650 },
  { id: 2, label: "PIN Validation",           icon: "🔢", ms: 500 },
  { id: 3, label: "Geolocation",              icon: "📡", ms: 1800 },
  { id: 4, label: "Post Office Matching",     icon: "🗂️", ms: 700 },
  { id: 5, label: "Generating Recommendation",icon: "✨", ms: 500 }
];

function renderSteps(activeStep) {
  const container = $("processing-steps");
  container.innerHTML = STEPS.map(s => {
    const done    = s.id < activeStep;
    const current = s.id === activeStep;
    return `
      <div class="step-item ${done ? "done" : current ? "active" : "pending"}">
        <div class="step-icon-wrap">
          <span class="step-emoji">${done ? "✓" : s.icon}</span>
        </div>
        <div class="step-body">
          <div class="step-label">${s.label}</div>
          <div class="step-status">${done ? "Complete" : current ? "Processing…" : "Waiting"}</div>
        </div>
        ${current ? '<div class="step-spinner"></div>' : ""}
      </div>`;
  }).join("");
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

async function analyzeAddress() {
  const raw = ($("address-input").value || "").trim();
  if (!raw) { toast("Please enter a postal address.", "error"); return; }

  // Reset UI
  hide($("results-section"));
  hide($("empty-state"));
  $("results-section").innerHTML = "";
  show($("processing-section"));
  $("analyze-btn").disabled = true;
  $("analyze-btn").textContent = "Analyzing…";

  try {
    // Step 1 – Parse
    renderSteps(1);
    await sleep(STEPS[0].ms);
    const parsed = parseAddress(raw);
    if (!parsed || parsed.isIncomplete) {
      renderSteps(2);
    }

    // Step 2 – PIN Validation
    renderSteps(2);
    await sleep(STEPS[1].ms);
    const validation = validatePIN(parsed ? parsed.pin : null, parsed ? parsed.area : null);

    // Step 3 – Geocode
    renderSteps(3);
    let coords;
    try {
      coords = await geocodeAddress(raw, parsed || {});
    } catch (e) {
      coords = { lat: 13.0827, lng: 80.2707, source: "default" };
    }

    // Step 4 – Match
    renderSteps(4);
    await sleep(STEPS[3].ms);
    let candidates = [];
    if (parsed) {
      candidates = rankOffices(parsed, coords.lat, coords.lng);
    }

    // Step 5 – Recommend
    renderSteps(5);
    await sleep(STEPS[4].ms);
    const top = candidates[0] || null;

    // Mark all done
    renderSteps(STEPS.length + 1);
    await sleep(300);

    APP.analysisResult = { parsed, validation, coords, candidates, top };
    renderResults(APP.analysisResult);

  } catch (err) {
    console.error(err);
    toast("Analysis failed. Please try again.", "error");
  } finally {
    $("analyze-btn").disabled = false;
    $("analyze-btn").textContent = "Analyze Address";
  }
}

// ─── Results Renderer ─────────────────────────────────────────────────────────

function renderResults(data) {
  const { parsed, validation, coords, candidates, top } = data;
  const container = $("results-section");
  container.innerHTML = "";

  // ── Incomplete address warning
  if (!parsed || parsed.isIncomplete) {
    container.innerHTML += `
      <div class="result-card warn-card">
        <div class="card-header"><span class="badge badge-warn">⚠ Incomplete Address</span></div>
        <p class="warn-text">The address provided is missing key components (street, area, or PIN). PostAI will attempt a best-effort geospatial match.</p>
      </div>`;
  }

  // ── Parsed Address Card
  if (parsed) {
    container.innerHTML += `
      <div class="result-card slide-up" style="animation-delay:.05s">
        <div class="card-header">
          <h3 class="card-title">Detected Address Components</h3>
          <span class="badge badge-blue">Address Parsed</span>
        </div>
        <div class="address-grid">
          ${addressField("House / Unit",  parsed.houseNumber || "—")}
          ${addressField("Street",        parsed.street      || "—")}
          ${addressField("Area / Locality",parsed.area       || "—")}
          ${addressField("City",          parsed.city        || "—")}
          ${addressField("District",      parsed.district    || "—")}
          ${addressField("State",         parsed.state       || "—")}
          ${addressField("PIN Code",      parsed.pin         || "Not detected", !parsed.pin)}
        </div>
      </div>`;
  }

  // ── Validation Card
  const vBadge  = validation.match === "match"    ? "badge-green"  :
                  validation.match === "mismatch" ? "badge-red"    : "badge-gray";
  const vLabel  = validation.match === "match"    ? "Validated"    :
                  validation.match === "mismatch" ? "Review Required" :
                  validation.format === "missing" ? "PIN Missing"  : "Unverified";

  container.innerHTML += `
    <div class="result-card slide-up" style="animation-delay:.12s">
      <div class="card-header">
        <h3 class="card-title">Address &amp; PIN Validation</h3>
        <span class="badge ${vBadge}">${vLabel}</span>
      </div>
      <div class="validation-grid">
        ${validationRow("PIN Format",       formatLabel(validation.format),  validation.format === "valid" ? "ok" : "err")}
        ${validationRow("PIN Match",        matchLabel(validation.match),    validation.match  === "match" ? "ok" : validation.match === "mismatch" ? "err" : "warn")}
        ${validationRow("Location Consistency", coordsSource(coords), coords.source === "nominatim" ? "ok" : "warn")}
        ${validationRow("Geocoding Source", coords.source === "nominatim" ? "Live API (Nominatim)" : coords.source === "area-lookup" ? "Local Area Lookup" : "Default (Chennai)", "info")}
      </div>
      ${validation.issue ? `<div class="validation-issue"><span class="issue-icon">⚠</span>${validation.issue}</div>` : ""}
    </div>`;

  // ── Geospatial Map Card
  container.innerHTML += `
    <div class="result-card slide-up" style="animation-delay:.2s">
      <div class="card-header">
        <h3 class="card-title">Geospatial Analysis</h3>
        <span class="badge badge-blue">OpenStreetMap</span>
      </div>
      <div class="map-meta">
        <div class="map-meta-item"><span class="meta-label">Destination Coordinates</span><span class="meta-val">${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E</span></div>
        ${top ? `<div class="map-meta-item"><span class="meta-label">Nearest Office</span><span class="meta-val">${top.office.name} — ${top.distance} km</span></div>` : ""}
        <div class="map-meta-item"><span class="meta-label">Data Source</span><span class="meta-val">${coords.source === "nominatim" ? "Nominatim API" : coords.source === "area-lookup" ? "Area Lookup (offline)" : "Default coordinates"}</span></div>
      </div>
      <div id="map-container" class="map-container"></div>
    </div>`;

  // ── Recommendation Card
  if (top) {
    const scoreColor = top.score >= 80 ? "#10b981" : top.score >= 60 ? "#f59e0b" : "#ef4444";
    const reasons    = explainRecommendation(top);
    container.innerHTML += `
      <div class="result-card recommendation-card slide-up" style="animation-delay:.28s">
        <div class="card-header">
          <h3 class="card-title">Recommended Delivery Office</h3>
          <span class="badge badge-green">Best Match</span>
        </div>
        <div class="rec-main">
          <div class="rec-office-info">
            <div class="rec-office-icon">📮</div>
            <div>
              <div class="rec-office-name">${top.office.name}</div>
              <div class="rec-office-sub">${top.office.type} &nbsp;|&nbsp; ${top.office.area}, ${top.office.city}</div>
            </div>
          </div>
          <div class="rec-score-block">
            <div class="score-number" style="color:${scoreColor}">${top.score}<span class="score-pct">%</span></div>
            <div class="score-label">Confidence</div>
            <div class="score-bar-wrap"><div class="score-bar-fill" style="width:${top.score}%;background:${scoreColor}"></div></div>
          </div>
        </div>
        <div class="rec-details-grid">
          ${recDetail("PIN Code",        top.office.pin)}
          ${recDetail("Office Type",     top.office.type)}
          ${recDetail("Area",            top.office.area)}
          ${recDetail("Distance",        top.distance + " km")}
          ${recDetail("City",            top.office.city)}
          ${recDetail("Delivery Status", top.office.status)}
        </div>
        <div class="reasons-section">
          <div class="reasons-title">Why this recommendation?</div>
          <div class="reasons-chips">
            ${reasons.map(r => `<span class="reason-chip">✓ ${r}</span>`).join("")}
          </div>
        </div>
        <div class="model-note">Prototype Recommendation Model — Weights: PIN 40% · Distance 30% · Area 20% · Status 10%</div>
      </div>`;
  } else {
    container.innerHTML += `
      <div class="result-card slide-up" style="animation-delay:.28s">
        <div class="card-header"><span class="badge badge-warn">No Match Found</span></div>
        <p style="color:#64748b;margin:0">Unable to determine a reliable delivery office from the available information. Please provide a more complete address including area name and PIN code.</p>
      </div>`;
  }

  // ── Candidate Table
  if (candidates.length > 0) {
    const topFive = candidates.slice(0, 6);
    container.innerHTML += `
      <div class="result-card slide-up" style="animation-delay:.36s">
        <div class="card-header">
          <h3 class="card-title">Candidate Post Offices</h3>
          <span class="badge badge-gray">Top ${topFive.length} of ${candidates.length}</span>
        </div>
        <div class="table-wrap">
          <table class="candidates-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Post Office</th>
                <th>PIN</th>
                <th>Distance</th>
                <th>Area Match</th>
                <th>PIN Match</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              ${topFive.map((c, i) => `
                <tr class="${i === 0 ? "top-row" : ""}">
                  <td>${i === 0 ? "★" : i + 1}</td>
                  <td><strong>${c.office.name}</strong><br><small class="text-muted">${c.office.type}</small></td>
                  <td>${c.office.pin}</td>
                  <td>${c.distance} km</td>
                  <td><span class="area-badge area-${c.areaLabel.toLowerCase().replace(" ","")}">${c.areaLabel}</span></td>
                  <td><span class="pin-badge pin-${c.pinLabel.toLowerCase().replace(/\s/g,"")}">${c.pinLabel}</span></td>
                  <td><div class="mini-score" style="--s:${c.score}%">${c.score}%</div></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ── Score Breakdown
  if (top) {
    container.innerHTML += `
      <div class="result-card slide-up" style="animation-delay:.44s">
        <div class="card-header">
          <h3 class="card-title">Score Breakdown — ${top.office.name}</h3>
          <span class="badge badge-gray">Prototype Model</span>
        </div>
        <div class="breakdown-grid">
          ${breakdownRow("PIN Match",         top.pinScore,      "40%", top.pinLabel)}
          ${breakdownRow("Geographic Proximity", top.distanceScore,"30%", top.distanceLabel)}
          ${breakdownRow("Area Match",        top.areaScore,     "20%", top.areaLabel)}
          ${breakdownRow("Office Status",     top.statusScore,   "10%", top.office.status)}
        </div>
        <div class="model-note" style="margin-top:16px">
          Final Score = 0.40 × ${top.pinScore} + 0.30 × ${top.distanceScore} + 0.20 × ${top.areaScore} + 0.10 × ${top.statusScore} = <strong>${top.score}</strong>
        </div>
      </div>`;
  }

  show(container);
  hide($("processing-section"));

  // Init Leaflet map after DOM painted
  requestAnimationFrame(() => initMap(coords, candidates));
}

// ─── Helper builders ─────────────────────────────────────────────────────────

function addressField(label, value, warn = false) {
  return `<div class="addr-field"><div class="addr-label">${label}</div><div class="addr-value ${warn ? "warn-val" : ""}">${value}</div></div>`;
}
function validationRow(label, value, state) {
  const icons = { ok: "✓", err: "✗", warn: "⚠", info: "ℹ" };
  const cls   = { ok: "v-ok", err: "v-err", warn: "v-warn", info: "v-info" };
  return `<div class="v-row"><span class="v-label">${label}</span><span class="v-val ${cls[state]}">${icons[state]} ${value}</span></div>`;
}
function recDetail(label, value) {
  return `<div class="rec-detail"><div class="rec-detail-label">${label}</div><div class="rec-detail-val">${value}</div></div>`;
}
function breakdownRow(label, score, weight, sublabel) {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return `
    <div class="breakdown-row">
      <div class="br-left">
        <div class="br-label">${label}</div>
        <div class="br-sub">${sublabel} &nbsp;·&nbsp; Weight ${weight}</div>
      </div>
      <div class="br-right">
        <div class="br-bar-wrap"><div class="br-bar" style="width:${score}%;background:${color}"></div></div>
        <div class="br-score">${score}</div>
      </div>
    </div>`;
}
function formatLabel(f) {
  return f === "valid" ? "Valid 6-digit PIN" : f === "invalid" ? "Invalid format" : "Not detected";
}
function matchLabel(m) {
  return m === "match" ? "Match confirmed" : m === "mismatch" ? "Possible mismatch" : m === "not_found" ? "PIN not in dataset" : "Unable to verify";
}
function coordsSource(coords) {
  return coords.source === "nominatim" ? "Live geocoding" : coords.source === "area-lookup" ? "Area-based (offline)" : "Default (Chennai)";
}

// ─── Leaflet Map ─────────────────────────────────────────────────────────────

function initMap(coords, candidates) {
  const el = $("map-container");
  if (!el) return;

  // Destroy previous map instance
  if (APP.leafletMap) { APP.leafletMap.remove(); APP.leafletMap = null; }

  try {
    const map = L.map("map-container", { zoomControl: true, scrollWheelZoom: false });
    APP.leafletMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // User destination marker
    const userIcon = L.divIcon({
      html: `<div class="map-marker user-marker"><svg viewBox="0 0 24 24" fill="white" width="14" height="14"><circle cx="12" cy="12" r="10"/></svg></div>`,
      className: "", iconSize: [34, 34], iconAnchor: [17, 34]
    });

    const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon })
      .bindPopup("<b>Destination Address</b><br>Geocoded location")
      .addTo(map);

    const points = [[coords.lat, coords.lng]];

    // Top offices markers
    const top3 = candidates.slice(0, 3);
    top3.forEach((c, i) => {
      const isTop = i === 0;
      const poIcon = L.divIcon({
        html: `<div class="map-marker ${isTop ? "po-marker-top" : "po-marker"}">${isTop ? "★" : i + 1}</div>`,
        className: "", iconSize: [30, 30], iconAnchor: [15, 30]
      });
      L.marker([c.office.lat, c.office.lng], { icon: poIcon })
        .bindPopup(`<b>${c.office.name}</b><br>PIN: ${c.office.pin}<br>Score: ${c.score}%<br>Distance: ${c.distance} km`)
        .addTo(map);
      points.push([c.office.lat, c.office.lng]);
    });

    // Line from destination to top recommendation
    if (candidates.length > 0) {
      const top = candidates[0];
      L.polyline([[coords.lat, coords.lng], [top.office.lat, top.office.lng]], {
        color: "#3b82f6", weight: 2.5, dashArray: "6 4", opacity: 0.8
      }).addTo(map);
    }

    map.fitBounds(L.latLngBounds(points).pad(0.25));
    userMarker.openPopup();

  } catch (e) {
    console.error("[PostAI] Map init failed:", e);
    el.innerHTML = `<div class="map-fallback">Map unavailable — coordinates: ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E</div>`;
  }
}

// ─── OCR (Tesseract.js) ──────────────────────────────────────────────────────

function setOCRBanner(icon, text, bgColor, borderColor, textColor) {
  const banner = $("ocr-banner");
  if (!banner) return;
  banner.style.background  = bgColor     || "";
  banner.style.borderColor = borderColor || "";
  banner.style.color       = textColor   || "";
  $("ocr-banner-icon").textContent = icon;
  $("ocr-banner-text").innerHTML   = text;
}

function setOCRProgress(pct, statusText) {
  const bar = $("ocr-progress-bar");
  if (bar) bar.style.width = pct + "%";
  const st  = $("ocr-status-text");
  if (st)  st.textContent = statusText;
}

async function handleImageUpload(file) {
  if (!file) return;
  const allowed = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowed.includes(file.type)) {
    toast("Please upload a PNG or JPG image.", "error");
    return;
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = async e => {
    $("ocr-preview").src = e.target.result;
    show($("ocr-preview-wrap"));
    hide($("ocr-result-wrap"));
    show($("ocr-processing"));
    setOCRProgress(0, "Starting OCR engine…");

    // Check if Tesseract is available
    if (typeof Tesseract === "undefined") {
      await runDemoOCR();
      return;
    }

    try {
      const { data } = await Tesseract.recognize(
        file,
        "eng",
        {
          logger: m => {
            const pct = Math.round((m.progress || 0) * 100);
            if (m.status === "loading tesseract core") {
              setOCRProgress(10, "Loading OCR core…");
            } else if (m.status === "initializing tesseract") {
              setOCRProgress(20, "Initialising Tesseract…");
            } else if (m.status === "loading language traineddata") {
              setOCRProgress(35, "Loading English language model…");
            } else if (m.status === "initializing api") {
              setOCRProgress(50, "Initialising API…");
            } else if (m.status === "recognizing text") {
              setOCRProgress(50 + Math.round(pct * 0.5), `Recognising text… ${pct}%`);
            }
          }
        }
      );

      const rawText       = (data.text || "").trim();
      const confidence    = Math.round(data.confidence || 0);
      const cleanedText   = rawText
        .replace(/\n{2,}/g, "\n")     // collapse multiple blank lines
        .replace(/[^\x20-\x7E\n]/g, "") // strip non-printable chars
        .trim();

      hide($("ocr-processing"));
      show($("ocr-result-wrap"));
      $("ocr-extracted").value   = cleanedText || "";
      $("ocr-confidence").textContent = `Tesseract confidence: ${confidence}%`;

      setOCRBanner(
        "✓",
        `<strong>OCR Complete</strong> — Tesseract.js · English · Confidence: ${confidence}%. Edit the text below if needed.`,
        "var(--green-100)", "#86efac", "#065f46"
      );
      toast(`OCR complete — ${confidence}% confidence`, "success");

    } catch (err) {
      console.error("[PostAI OCR] Tesseract failed:", err);
      await runDemoOCR();
    }
  };
  reader.readAsDataURL(file);
}

async function runDemoOCR() {
  setOCRProgress(0, "");
  // Animate demo progress
  const steps = [
    [20,  300,  "Initialising (demo mode)…"],
    [55,  600,  "Recognising text (demo mode)…"],
    [100, 900,  "Done (demo mode)"]
  ];
  for (const [pct, delay, label] of steps) {
    await sleep(delay);
    setOCRProgress(pct, label);
  }
  await sleep(200);
  hide($("ocr-processing"));
  show($("ocr-result-wrap"));
  $("ocr-extracted").value = "24 Gandhi Road, Anna Nagar, Chennai 600040";
  $("ocr-confidence").textContent = "Demo mode — Tesseract.js unavailable (check internet connection)";
  setOCRBanner(
    "⚠",
    "<strong>Demo OCR Mode</strong> — Tesseract.js could not be loaded. Showing sample extracted text. Check your internet connection and reload.",
    "var(--amber-100)", "#fcd34d", "#92400e"
  );
  toast("Tesseract unavailable — showing demo text", "info");
}

function useOCRText() {
  const text = $("ocr-extracted").value.trim();
  if (!text) { toast("No extracted text to use.", "error"); return; }
  switchTab("text");
  $("address-input").value = text;
  toast("Address copied from OCR — click Analyze to proceed.", "info");
}

// ─── Dashboard Charts ────────────────────────────────────────────────────────

function renderDashboard() {
  // Destroy old charts
  Object.values(APP.charts).forEach(c => { try { c.destroy(); } catch(e){} });
  APP.charts = {};

  if (typeof Chart === "undefined") {
    document.querySelectorAll(".chart-card canvas").forEach(c => {
      c.insertAdjacentHTML("afterend", '<div style="padding:40px;text-align:center;color:var(--slate-400);font-size:13px">Chart library unavailable — check internet connection</div>');
      c.style.display = "none";
    });
    return;
  }

  // Confidence Distribution (Doughnut)
  const ctx1 = $("chart-confidence");
  if (ctx1) {
    APP.charts.confidence = new Chart(ctx1, {
      type: "doughnut",
      data: {
        labels: ["Very High (≥90%)", "High (75–89%)", "Medium (60–74%)", "Low (<60%)"],
        datasets: [{ data: [68, 29, 18, 13], backgroundColor: ["#10b981","#3b82f6","#f59e0b","#ef4444"], borderWidth: 0, hoverOffset: 6 }]
      },
      options: { responsive: true, cutout: "65%", plugins: { legend: { position: "bottom", labels: { font: { size: 12 }, padding: 16 } } } }
    });
  }

  // Monthly volume (Bar)
  const ctx2 = $("chart-volume");
  if (ctx2) {
    APP.charts.volume = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: ["Feb","Mar","Apr","May","Jun","Jul","Aug"],
        datasets: [{ label: "Addresses Analyzed", data: [12,18,23,31,27,35,128], backgroundColor: "#3b82f6", borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } } }
    });
  }

  // PIN Mismatch vs correct (Bar)
  const ctx3 = $("chart-mismatch");
  if (ctx3) {
    APP.charts.mismatch = new Chart(ctx3, {
      type: "bar",
      data: {
        labels: ["Anna Nagar","T Nagar","Adyar","Velachery","Tambaram","Nungambakkam"],
        datasets: [
          { label: "Matched",   data: [24,18,14,11,9,7],  backgroundColor: "#10b981", borderRadius: 4 },
          { label: "Mismatch",  data: [4, 2, 3, 3, 2, 3], backgroundColor: "#ef4444", borderRadius: 4 }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, grid: { color: "#f1f5f9" } } } }
    });
  }

  // Avg distance (Line)
  const ctx4 = $("chart-distance");
  if (ctx4) {
    APP.charts.distance = new Chart(ctx4, {
      type: "line",
      data: {
        labels: ["Feb","Mar","Apr","May","Jun","Jul","Aug"],
        datasets: [{ label: "Avg Distance (km)", data: [4.1,3.8,3.2,2.9,3.1,2.7,2.4], borderColor: "#06b6d4", backgroundColor: "rgba(6,182,212,0.1)", fill: true, tension: 0.4, pointRadius: 4 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false, min: 1, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } } }
    });
  }
}

// ─── Event Binding ────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Nav links (desktop + mobile)
  document.querySelectorAll(".nav-link").forEach(l => {
    l.addEventListener("click", e => {
      e.preventDefault();
      showPage(l.dataset.page);
      // Close mobile nav if open
      const mNav = $("mobile-nav");
      if (mNav) mNav.style.display = "none";
    });
  });

  // Hero CTA buttons
  $("hero-analyze-btn") && $("hero-analyze-btn").addEventListener("click", () => showPage("analyze"));
  $("hero-how-btn")     && $("hero-how-btn").addEventListener("click",     () => showPage("how"));

  // Feature "Learn more" / CTA
  document.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => showPage(el.dataset.goto));
  });

  // Tab buttons
  $("tab-btn-text")  && $("tab-btn-text").addEventListener("click",  () => switchTab("text"));
  $("tab-btn-image") && $("tab-btn-image").addEventListener("click", () => switchTab("image"));

  // Demo buttons
  document.querySelectorAll(".demo-btn").forEach(btn => {
    btn.addEventListener("click", () => loadDemo(btn.dataset.demo));
  });

  // Analyze button
  $("analyze-btn") && $("analyze-btn").addEventListener("click", () => analyzeAddress());

  // Image upload
  const dropzone = $("dropzone");
  const fileInput = $("file-input");

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => handleImageUpload(fileInput.files[0]));

    dropzone.addEventListener("dragover",  e => { e.preventDefault(); dropzone.classList.add("drag-over"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
    dropzone.addEventListener("drop", e => {
      e.preventDefault();
      dropzone.classList.remove("drag-over");
      handleImageUpload(e.dataTransfer.files[0]);
    });
  }

  $("use-ocr-btn")   && $("use-ocr-btn").addEventListener("click", useOCRText);

  // Mobile menu toggle
  $("mobile-menu-btn") && $("mobile-menu-btn").addEventListener("click", () => {
    const mNav = $("mobile-nav");
    mNav.style.display = mNav.style.display === "flex" ? "none" : "flex";
    mNav.style.flexDirection = "column";
    mNav.style.position = "fixed";
    mNav.style.top = "60px";
    mNav.style.left = "0";
    mNav.style.right = "0";
    mNav.style.background = "var(--navy-950)";
    mNav.style.padding = "12px 20px";
    mNav.style.gap = "4px";
    mNav.style.zIndex = "999";
    mNav.style.borderTop = "1px solid rgba(255,255,255,.1)";
  });

  // Initial chart render if starting on dashboard
  if (APP.currentPage === "dashboard") renderDashboard();

  // Initialise OCR banner based on Tesseract availability
  initOCRBanner();
});

function initOCRBanner() {
  if (typeof Tesseract !== "undefined") {
    setOCRBanner(
      "✓",
      "<strong>Tesseract.js OCR Ready</strong> — Runs entirely in your browser. No data is sent to any server. Best results with clear printed text on a plain background.",
      "var(--green-100)", "#86efac", "#065f46"
    );
  } else {
    // Tesseract may still be loading asynchronously — check after a short delay
    setTimeout(() => {
      if (typeof Tesseract !== "undefined") {
        setOCRBanner(
          "✓",
          "<strong>Tesseract.js OCR Ready</strong> — Runs entirely in your browser. No data sent to any server.",
          "var(--green-100)", "#86efac", "#065f46"
        );
      } else {
        setOCRBanner(
          "⚠",
          "<strong>OCR engine not loaded</strong> — Check your internet connection. Demo mode will be used as fallback.",
          "var(--amber-100)", "#fcd34d", "#92400e"
        );
      }
    }, 3000);
  }
}
