// PostAI — Address Parser & Scoring Engine
// Prototype Recommendation Model for SIH 2026 demonstration

// ─── Address Parser ──────────────────────────────────────────────────────────

function parseAddress(text) {
  if (!text || text.trim().length < 3) return null;
  const raw = text.trim();

  // Extract 6-digit PIN
  const pinMatch = raw.match(/\b(\d{6})\b/);
  const pin = pinMatch ? pinMatch[1] : null;
  const withoutPin = raw.replace(/\b\d{6}\b/, "").trim();

  // Split on commas
  const parts = withoutPin.split(",").map(p => p.trim()).filter(Boolean);

  const knownCities  = ["Chennai", "Chengalpattu", "Kancheepuram", "Madras"];
  const knownStates  = ["Tamil Nadu"];
  const streetWords  = /\b(road|street|nagar|colony|layout|avenue|lane|salai|marg|bazaar|garden|cross|main|bypass)\b/i;

  let city = null, area = null, street = null, houseNumber = null;

  parts.forEach(part => {
    const lower = part.toLowerCase();
    if (knownCities.some(c => lower.includes(c.toLowerCase()))) {
      city = knownCities.find(c => lower.includes(c.toLowerCase()));
      return;
    }
    if (knownStates.some(s => lower.includes(s.toLowerCase()))) return;

    if (/^\d/.test(part)) {
      const hm = part.match(/^(\d+\w*)\s*(.*)/);
      if (hm) { houseNumber = hm[1]; street = hm[2] || part; }
      else      street = part;
    } else if (streetWords.test(part)) {
      if (!street) street = part;
    } else {
      if (!area) area = part;
    }
  });

  const hasPin   = !!pin;
  const hasArea  = !!(area || street);
  const hasCity  = !!city;
  const isComplete   = hasPin && hasArea && hasCity;
  const isIncomplete = !hasPin && !hasArea;

  return {
    raw,
    houseNumber : houseNumber || null,
    street      : street      || null,
    area        : area        || null,
    city        : city        || "Chennai",
    district    : city        || "Chennai",
    state       : "Tamil Nadu",
    pin,
    hasPin, hasArea, hasCity,
    isComplete, isIncomplete
  };
}

// ─── PIN Validator ────────────────────────────────────────────────────────────

function validatePIN(pin, area) {
  if (!pin) return { format: "missing", match: "unknown", issue: "No PIN code detected in the address." };
  if (!/^\d{6}$/.test(pin)) return { format: "invalid", match: "unknown", issue: `"${pin}" is not a valid 6-digit PIN code.` };

  // PIN must start with 6 (Tamil Nadu zone)
  if (!pin.startsWith("6")) return { format: "valid", match: "unknown", issue: `PIN ${pin} does not appear to belong to Tamil Nadu.` };

  const matchedOffice = POST_OFFICES.find(o => o.pin === pin);
  if (!matchedOffice) return { format: "valid", match: "not_found", issue: `PIN ${pin} is not in the prototype dataset.` };

  if (area) {
    const al = area.toLowerCase();
    const ol = matchedOffice.area.toLowerCase();
    const isMatch = al.includes(ol) || ol.includes(al) ||
                    ol.split(" ").some(w => w.length > 3 && al.includes(w));
    if (isMatch) {
      return { format: "valid", match: "match", matchedOffice, issue: null };
    } else {
      return {
        format: "valid", match: "mismatch", matchedOffice,
        expectedArea: matchedOffice.area,
        issue: `PIN ${pin} typically serves ${matchedOffice.area}, but address mentions "${area}". Possible mismatch.`
      };
    }
  }
  return { format: "valid", match: "match", matchedOffice, issue: null };
}

// ─── Distance (Haversine) ─────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ─── Office Scorer ────────────────────────────────────────────────────────────

function scoreOffice(office, parsedAddress, userLat, userLng) {
  // 1. PIN Match  (weight 40%)
  let pinScore = 0, pinLabel = "No Match";
  if (parsedAddress.pin) {
    if (office.pin === parsedAddress.pin)                                            { pinScore = 100; pinLabel = "Exact Match"; }
    else if (office.pin.slice(0, 4) === parsedAddress.pin.slice(0, 4))              { pinScore = 60;  pinLabel = "Sub-Zone";   }
    else if (office.pin.slice(0, 3) === parsedAddress.pin.slice(0, 3))              { pinScore = 30;  pinLabel = "Zone Match"; }
  }

  // 2. Distance (weight 30%)
  const distance = haversineKm(userLat, userLng, office.lat, office.lng);
  const distanceScore = Math.max(0, Math.round(100 - (distance / 15) * 100));
  const distanceLabel = distance <= 1 ? "Very Close" : distance <= 3 ? "Close" : distance <= 7 ? "Moderate" : distance <= 12 ? "Far" : "Very Far";

  // 3. Area Match (weight 20%)
  let areaScore = 0, areaLabel = "No Match";
  const addressText = `${parsedAddress.area || ""} ${parsedAddress.street || ""} ${parsedAddress.city || ""}`.toLowerCase();
  const officeText  = `${office.area} ${office.name}`.toLowerCase();
  if (addressText.includes(office.area.toLowerCase())) {
    areaScore = 100; areaLabel = "High";
  } else {
    const words = office.area.toLowerCase().split(/\s+/);
    if (words.some(w => w.length > 3 && addressText.includes(w))) { areaScore = 50; areaLabel = "Partial"; }
  }

  // 4. Status (weight 10%)
  const statusScore = office.status === "Active" ? 100 : 0;

  const score = Math.round(0.40 * pinScore + 0.30 * distanceScore + 0.20 * areaScore + 0.10 * statusScore);

  return { office, score, distance, pinScore, distanceScore, areaScore, statusScore, pinLabel, distanceLabel, areaLabel };
}

// ─── Rank All Offices ─────────────────────────────────────────────────────────

function rankOffices(parsedAddress, userLat, userLng) {
  return POST_OFFICES
    .map(o => scoreOffice(o, parsedAddress, userLat, userLng))
    .sort((a, b) => b.score - a.score);
}

// ─── Explain Recommendation ───────────────────────────────────────────────────

function explainRecommendation(top) {
  const reasons = [];
  if (top.pinScore === 100) reasons.push("PIN code matches exactly");
  else if (top.pinScore > 0) reasons.push("PIN zone is compatible");
  if (top.distanceScore >= 70) reasons.push("Geographically closest matching office");
  else if (top.distanceScore >= 40) reasons.push("Reasonably close by distance");
  if (top.areaScore === 100) reasons.push("Area name matches the address");
  else if (top.areaScore === 50) reasons.push("Partial area name match");
  if (top.statusScore === 100) reasons.push("Office is actively delivering");
  return reasons;
}
