/**
 * Marine GIS data preparation for the Southern India fisheries dashboard.
 *
 * Downloads (cached in .cache/):
 *   1. India state boundaries        — geohacker/india (GADM-derived)
 *   2. India district boundaries     — udit-001/india-maps-data (2011 census derived)
 *   3. World countries               — Natural Earth 10m (Sri Lanka land mask)
 *   4. India EEZ (200 NM)            — MarineRegions/VLIZ WFS, MRGID 8480
 *   5. Coastal locations             — docs/O3L_Southern_Coastal_States_FINAL_Database.xlsx (Locations sheet)
 *
 * Produces (served from public/data/marine/, fetched at runtime — no external GeoJSON calls):
 *   southern-states.geojson    AP/KA/KL/TN state polygons (simplified)
 *   coastal-districts.geojson  35 coastal district polygons + label points
 *   coastal-locations.geojson  111 fishing villages / harbours / landing centres
 *   coastal-bands.geojson      12 km seaward bands (ban + lean period metadata)
 *   eez-south.geojson          India EEZ clipped to the southern view bbox
 *
 * Run: node scripts/prepare-marine-geo.mjs   (from apps/web)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as turf from "@turf/turf";
import XLSX from "xlsx";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, ".cache");
const OUT = path.resolve(HERE, "../../public/data/marine");
const XLSX_PATH = path.resolve(
  HERE,
  "../../../docs/O3L_Southern_Coastal_States_FINAL_Database.xlsx"
);

const SOURCES = {
  states: {
    file: "india_state.geojson",
    url: "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson",
  },
  districts: {
    file: "india_districts.geojson",
    url: "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson",
  },
  countries: {
    file: "ne_countries.geojson",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson",
  },
  eez: {
    file: "india_eez.json",
    url:
      "https://geo.vliz.be/geoserver/MarineRegions/wfs?service=WFS&version=1.0.0&request=GetFeature" +
      "&typeName=MarineRegions:eez&outputFormat=application/json" +
      "&filter=%3CFilter%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3Emrgid%3C/PropertyName%3E" +
      "%3CLiteral%3E8480%3C/Literal%3E%3C/PropertyIsEqualTo%3E%3C/Filter%3E",
  },
};

const STATE_SLUGS = {
  "Andhra Pradesh": "andhra-pradesh",
  Karnataka: "karnataka",
  Kerala: "kerala",
  "Tamil Nadu": "tamil-nadu",
};

/** Coastal districts per state (district names as in the source dataset). */
const COASTAL_DISTRICTS = {
  "Andhra Pradesh": [
    "Srikakulam",
    "Vizianagaram",
    "Visakhapatnam",
    "East Godavari",
    "West Godavari",
    "Krishna",
    "Guntur",
    "Prakasam",
    "S.P.S. Nellore",
  ],
  Karnataka: ["Uttara Kannada", "Udupi", "Dakshina Kannada"],
  Kerala: [
    "Kasaragod",
    "Kannur",
    "Kozhikode",
    "Malappuram",
    "Thrissur",
    "Ernakulam",
    "Alappuzha",
    "Kollam",
    "Thiruvananthapuram",
  ],
  "Tamil Nadu": [
    "Thiruvallur",
    "Chennai",
    "Kancheepuram",
    "Chengalpattu",
    "Viluppuram",
    "Cuddalore",
    "Nagapattinam",
    "Thanjavur",
    "Thiruvarur",
    "Pudukkottai",
    "Ramanathapuram",
    "Thoothukkudi",
    "Tirunelveli",
    "Kanyakumari",
  ],
};

/** Fishing-ban / closed-season period per state (district override for Kanniyakumari). */
const BAN_PERIODS = {
  "Andhra Pradesh": "15 April – 14 June (61 days)",
  Karnataka: "1 June – 31 July (west-coast monsoon closure)",
  Kerala: "1 June – 31 July (west-coast closure; trawl-ban arrangements can differ)",
  "Tamil Nadu": "15 April – 14 June (east coast)",
};

const DEFAULT_LEAN = {
  "Andhra Pradesh": {
    district: "",
    region: "Coastal Andhra",
    period: "April–May",
    reason:
      "Annual fishing-ban period makes April–May a particularly low-activity period for mechanised fisheries. Historical CMFRI analysis identifies April–May as lean and November–January as peak season.",
    confidence: "high",
    confidenceLabel:
      "Good – avoid assigning different months to every district without district-specific data",
  },
  Karnataka: {
    district: "",
    region: "Karnataka coast",
    period: "June–July",
    reason:
      "Southwest monsoon and seasonal fishing restrictions reduce fishing activity (uniform west-coast ban 1 June – 31 July).",
    confidence: "moderate",
    confidenceLabel: "Good for seasonal closure; moderate for general lean classification",
  },
  Kerala: {
    district: "",
    region: "Kerala coast",
    period: "June–July",
    reason:
      "Southwest monsoon, rough sea conditions and seasonal fishing restrictions. National west-coast closure 1 June – 31 July; Kerala's trawl-ban arrangements can differ.",
    confidence: "moderate",
    confidenceLabel: "Good for seasonal restriction; moderate for general lean period",
  },
  "Tamil Nadu": {
    district: "",
    region: "Northern & central/eastern coast",
    period: "October–March, varying by district",
    reason:
      "Northeast monsoon, rough-sea conditions and weather warnings can reduce fishing days. State lean-period assistance is intended for this period.",
    confidence: "high",
    confidenceLabel: "Good",
  },
};

const LEAN_OVERRIDES = {
  Alappuzha: {
    region: "Alappuzha",
    period: "Monsoon period, especially June–July",
    reason:
      "Mud-bank (chakara) fisheries can provide good fishing opportunities — lean conditions are not uniform throughout Kerala.",
    confidence: "verify",
    confidenceLabel: "Use with qualification",
  },
  Ernakulam: {
    region: "Ernakulam",
    period: "Monsoon period, especially June–July",
    reason:
      "Monsoon affects fishing activity, but mud-bank and prawn fisheries can provide alternative opportunities.",
    confidence: "verify",
    confidenceLabel: "Use with qualification",
  },
  Thrissur: {
    region: "Thrissur",
    period: "Monsoon period, especially June–July",
    reason: "Seasonal/monsoon effects; local fisheries can vary.",
    confidence: "verify",
    confidenceLabel: "Use with qualification",
  },
  Thoothukkudi: {
    region: "Thoothukudi",
    period: "Around April onward",
    reason:
      "Historical state policy documents indicate the lean season in Thoothukudi begins around April.",
    confidence: "verify",
    confidenceLabel: "Good historical evidence; verify current district schedule",
  },
  Tirunelveli: {
    region: "Tirunelveli",
    period: "Around April onward",
    reason:
      "Historical state policy documents similarly identify the lean season as commencing around April.",
    confidence: "verify",
    confidenceLabel: "Good historical evidence; verify current district schedule",
  },
  Kanyakumari: {
    region: "Kanniyakumari – east coast",
    period: "April–June fishing-ban period (east); June–July (west)",
    reason:
      "East-coast seasonal closure (15 April – 14 June) applies; the west-coast closure (1 June – 31 July) applies to western Kanniyakumari.",
    confidence: "high",
    confidenceLabel: "Good for ban period",
    banOverride: "East coast 15 April – 14 June; west coast 1 June – 31 July",
  },
};

const BAND_KM = 12;
const VIEW_BBOX = [66, 4, 92, 26]; // minLon, minLat, maxLon, maxLat

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function ensureCache() {
  fs.mkdirSync(CACHE, { recursive: true });
}

async function download(name, { file, url }) {
  const dest = path.join(CACHE, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  console.log(`  downloading ${name} …`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`  ${name}: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
  return dest;
}

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function roundGeom(geometry, dp = 4) {
  const round = (n) => Math.round(n * 10 ** dp) / 10 ** dp;
  const walk = (c) => (typeof c[0] === "number" ? [round(c[0]), round(c[1])] : c.map(walk));
  geometry.coordinates = walk(geometry.coordinates);
  return geometry;
}

function simplify(feature, tolerance, { high = false, dp = 4 } = {}) {
  const out = turf.simplify(feature, { tolerance, high, mutate: false });
  out.geometry = roundGeom(out.geometry, dp);
  return out;
}

function fc(features) {
  return { type: "FeatureCollection", features };
}

function write(name, collection) {
  fs.mkdirSync(OUT, { recursive: true });
  const dest = path.join(OUT, name);
  fs.writeFileSync(dest, JSON.stringify(collection));
  const kb = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`  → ${name}  (${collection.features.length} features, ${kb} KB)`);
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  ensureCache();
  console.log("Fetching sources (cached) …");
  const [statesFile, districtsFile, countriesFile, eezFile] = await Promise.all([
    download("states", SOURCES.states),
    download("districts", SOURCES.districts),
    download("countries", SOURCES.countries),
    download("eez", SOURCES.eez),
  ]);

  const statesRaw = load(statesFile);
  const districtsRaw = load(districtsFile);
  const countriesRaw = load(countriesFile);
  const eezRaw = load(eezFile);

  /* ---- 1. southern state polygons ---- */
  console.log("\nSouthern states …");
  const stateFeatures = [];
  for (const [name, slug] of Object.entries(STATE_SLUGS)) {
    const src = statesRaw.features.find(
      (f) => String(f.properties.NAME_1 || "").toLowerCase() === name.toLowerCase()
    );
    if (!src) throw new Error(`State not found in source: ${name}`);
    const f = simplify(src, 0.005, { dp: 4 });
    f.properties = { state: name, slug };
    stateFeatures.push(f);
    console.log(`  ${name}: ok`);
  }
  write("southern-states.geojson", fc(stateFeatures));

  /* ---- 2. coastal districts ---- */
  console.log("\nCoastal districts …");
  const districtFeatures = [];
  const districtIndex = []; // for band generation
  for (const [state, districts] of Object.entries(COASTAL_DISTRICTS)) {
    for (const districtName of districts) {
      const src = districtsRaw.features.find(
        (f) =>
          String(f.properties.st_nm) === state &&
          String(f.properties.district) === districtName
      );
      if (!src) {
        console.warn(`  ! district not found: ${state} / ${districtName}`);
        continue;
      }
      const f = simplify(src, 0.003, { dp: 4 });
      const label = turf.pointOnFeature(f);
      f.properties = {
        state,
        state_slug: STATE_SLUGS[state],
        district: districtName,
        slug: districtName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        label_lng: Math.round(label.geometry.coordinates[0] * 10000) / 10000,
        label_lat: Math.round(label.geometry.coordinates[1] * 10000) / 10000,
      };
      districtFeatures.push(f);
      districtIndex.push({ state, districtName, feature: src });
    }
  }
  write("coastal-districts.geojson", fc(districtFeatures));

  /* ---- 3. coastal locations from workbook ---- */
  console.log("\nCoastal locations (workbook) …");
  const wb = XLSX.readFile(XLSX_PATH);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Locations, { defval: "" });
  const kindOf = (type) => {
    if (/harbour/i.test(type)) return "harbour";
    if (/village|settlement/i.test(type)) return "village";
    return "landing";
  };
  const locationFeatures = rows
    .filter((r) => Number.isFinite(+r.Latitude) && Number.isFinite(+r.Longitude))
    .map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [+r.Longitude, +r.Latitude] },
      properties: {
        name: r.Display_Name,
        town: r.Coastal_Town_or_Village,
        district: r.District,
        state: r.State,
        state_slug: STATE_SLUGS[r.State] || "",
        kind: kindOf(String(r.Location_Type)),
        location_type: r.Location_Type,
        confidence: String(r.Coordinate_Confidence || "").toLowerCase(),
        source: r.Coordinate_Source,
        region: r.Coastal_Region,
        id: r.Location_ID,
      },
    }));
  write("coastal-locations.geojson", fc(locationFeatures));

  /* ---- 4. land mask + seaward bands ---- */
  console.log("\nLand mask …");
  const maskNames = new Set([
    ...Object.keys(STATE_SLUGS),
    "Odisha",
    "Goa",
    "Telangana",
    "Maharashtra",
    "Puducherry",
    "Pondicherry",
    "West Bengal",
    "Chhattisgarh",
  ]);
  const maskParts = statesRaw.features
    .filter((f) => maskNames.has(String(f.properties.NAME_1)))
    .map((f) => simplify(f, 0.01, { high: false, dp: 4 }));
  const sriLanka = countriesRaw.features.find(
    (f) => String(f.properties.ADMIN) === "Sri Lanka" || String(f.properties.NAME) === "Sri Lanka"
  );
  if (sriLanka) maskParts.push(simplify(sriLanka, 0.01, { dp: 4 }));
  const landMask = turf.union(turf.featureCollection(maskParts));
  console.log(`  mask parts: ${maskParts.length}`);

  console.log("\nSeaward bands …");
  const bandFeatures = [];
  for (const { state, districtName, feature } of districtIndex) {
    let buffered;
    try {
      buffered = turf.buffer(feature, BAND_KM, { units: "kilometers", steps: 6 });
    } catch {
      console.warn(`  ! buffer failed: ${state}/${districtName}`);
      continue;
    }
    if (!buffered) continue;
    let band;
    try {
      band = turf.difference(turf.featureCollection([buffered, landMask]));
    } catch {
      console.warn(`  ! difference failed: ${state}/${districtName}`);
      continue;
    }
    if (!band || !band.geometry || band.geometry.coordinates.length === 0) continue;

    const lean = { ...DEFAULT_LEAN[state], ...(LEAN_OVERRIDES[districtName] || {}) };
    band = simplify(band, 0.008, { dp: 4 });
    band.properties = {
      state,
      state_slug: STATE_SLUGS[state],
      district: districtName,
      ban_period: lean.banOverride || BAN_PERIODS[state],
      lean_period: lean.period,
      lean_region: lean.region,
      lean_reason: lean.reason,
      confidence: lean.confidence,
      confidence_label: lean.confidenceLabel,
    };
    bandFeatures.push(band);
  }
  write("coastal-bands.geojson", fc(bandFeatures));

  /* ---- 5. EEZ clipped to the southern view ---- */
  console.log("\nEEZ …");
  try {
    const bboxPoly = turf.bboxPolygon(VIEW_BBOX);
    const eezSrc = eezRaw.features[0];
    let clipped = turf.intersect(turf.featureCollection([eezSrc, bboxPoly]));
    if (clipped) {
      clipped = simplify(clipped, 0.02, { dp: 4 });
      clipped.properties = {
        name: "Indian Exclusive Economic Zone (200 NM)",
        source: "Marine Regions / Flanders Marine Institute (MRGID 8480)",
        area_km2: eezSrc.properties.area_km2,
      };
      write("eez-south.geojson", fc([clipped]));
    } else {
      console.warn("  ! EEZ clip returned empty");
    }
  } catch (err) {
    console.warn(`  ! EEZ clip failed (${err.message}) — keeping simplified full EEZ`);
    const clipped = simplify(eezRaw.features[0], 0.03, { dp: 4 });
    clipped.properties = {
      name: "Indian Exclusive Economic Zone (200 NM)",
      source: "Marine Regions / Flanders Marine Institute (MRGID 8480)",
      area_km2: eezRaw.features[0].properties.area_km2,
    };
    write("eez-south.geojson", fc([clipped]));
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
