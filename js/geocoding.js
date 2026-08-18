// PostAI — Geocoding Module
// Primary: Nominatim / OpenStreetMap (free, no key required)
// Fallback: Area-name coordinate lookup from local dataset

async function geocodeAddress(addressText, parsed) {
  // Try Nominatim first
  try {
    const result = await nominatimGeocode(addressText);
    if (result) return { ...result, source: "nominatim" };
  } catch (e) {
    console.warn("[PostAI] Nominatim unavailable:", e.message);
  }
  // Fallback to local area lookup
  return localAreaLookup(parsed);
}

async function nominatimGeocode(addressText) {
  const q    = encodeURIComponent(addressText + ", India");
  const url  = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=in&limit=1&addressdetails=1`;

  const ctrl    = new AbortController();
  const timer   = setTimeout(() => ctrl.abort(), 6000);

  try {
    const res  = await fetch(url, {
      headers: { "User-Agent": "PostAI-SIH2026-Prototype/1.0 (educational)" },
      signal:  ctrl.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat         : parseFloat(data[0].lat),
        lng         : parseFloat(data[0].lon),
        displayName : data[0].display_name
      };
    }
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
  return null;
}

function localAreaLookup(parsed) {
  const candidates = [parsed.area, parsed.street, parsed.city].filter(Boolean);

  for (const term of candidates) {
    const t = term.toLowerCase().trim();
    for (const [key, coords] of Object.entries(AREA_COORDINATES)) {
      if (t === key || t.includes(key) || key.includes(t)) {
        return { ...coords, source: "area-lookup", displayName: `${term} (area lookup)` };
      }
    }
  }

  // Default: Chennai centre
  return { lat: 13.0827, lng: 80.2707, source: "default", displayName: "Chennai (default)" };
}
