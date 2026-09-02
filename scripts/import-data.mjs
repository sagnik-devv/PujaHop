import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function parseCSV(text) {
  const lines = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current);
      current = '';
      if (row.length > 0 && row.some(cell => cell.trim().length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some(cell => cell.trim().length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function runImport() {
  console.log('Starting PUJAHOP Data Import Pipeline...\n');

  const dataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Source path check
  const sourcePujaPath = path.join(rootDir, 'pujo csv', 'data', 'kolkata_durga_puja_pandals_geocoded.csv');
  const targetPujaPath = path.join(dataDir, 'pujas.csv');
  const targetMetroPath = path.join(dataDir, 'metro.csv');

  if (fs.existsSync(sourcePujaPath) && !fs.existsSync(targetPujaPath)) {
    fs.copyFileSync(sourcePujaPath, targetPujaPath);
    console.log(`Copied verified pandals data to ${targetPujaPath}`);
  }

  if (!fs.existsSync(targetPujaPath)) {
    if (fs.existsSync(sourcePujaPath)) {
      fs.copyFileSync(sourcePujaPath, targetPujaPath);
    } else {
      throw new Error(`Cannot find pujas.csv in ${dataDir} or source path`);
    }
  }

  if (!fs.existsSync(targetMetroPath)) {
    throw new Error(`Cannot find metro.csv in ${dataDir}`);
  }

  // 1. Parse Metro CSV
  const metroContent = fs.readFileSync(targetMetroPath, 'utf8');
  const metroRows = parseCSV(metroContent);
  const metroHeaders = metroRows[0].map(h => h.trim());
  const metroStations = [];

  for (let i = 1; i < metroRows.length; i++) {
    const row = metroRows[i];
    if (!row || row.length === 0) continue;
    const obj = {};
    metroHeaders.forEach((h, idx) => {
      obj[h] = row[idx] ? row[idx].trim() : '';
    });

    const lat = parseFloat(obj.latitude);
    const lon = parseFloat(obj.longitude);

    if (isNaN(lat) || isNaN(lon)) {
      console.warn(`[Warning] Skipping invalid metro station row: ${obj.name}`);
      continue;
    }

    metroStations.push({
      id: parseInt(obj.station_id || `${i}`, 10),
      name: obj.name,
      bengaliName: obj.bengali_name || '',
      line: obj.line || 'Kolkata Metro',
      lineCode: (obj.line_code || 'BLUE').toUpperCase(),
      latitude: lat,
      longitude: lon,
      isInterchange: obj.is_interchange === 'true',
      interchangeLines: obj.interchange_lines || '',
      opensAt: obj.opens_at || '06:30 AM',
      closesAt: obj.closes_at || '11:00 PM',
    });
  }

  // 2. Parse Pandals CSV
  const pujaContent = fs.readFileSync(targetPujaPath, 'utf8');
  const pujaRows = parseCSV(pujaContent);
  const pujaHeaders = pujaRows[0].map(h => h.trim());

  let validPandalCount = 0;
  let warningsCount = 0;
  const pandals = [];

  for (let i = 1; i < pujaRows.length; i++) {
    const row = pujaRows[i];
    if (!row || row.length === 0) continue;
    const raw = {};
    pujaHeaders.forEach((h, idx) => {
      raw[h] = row[idx] ? row[idx].trim() : '';
    });

    const id = parseInt(raw.pandal_id || raw.id || `${i}`, 10);
    const name = raw.pandal_name || raw.name || `Pandal #${id}`;
    const lat = parseFloat(raw.latitude);
    const lon = parseFloat(raw.longitude);

    if (isNaN(lat) || isNaN(lon)) {
      console.warn(`[Warning] Row ${i}: Pandal "${name}" has invalid coordinates (${raw.latitude}, ${raw.longitude}).`);
      warningsCount++;
      continue;
    }

    // Geographic verification boundary for Kolkata (22.2° to 22.8° N, 88.1° to 88.6° E)
    if (lat < 22.2 || lat > 22.8 || lon < 88.1 || lon > 88.6) {
      console.warn(`[Warning] Row ${i}: Pandal "${name}" coordinates (${lat}, ${lon}) outside Kolkata boundary.`);
      warningsCount++;
    }

    // Find nearest metro dynamically via Haversine
    let nearestMetroName = raw.nearest_metro || '';
    let minDistanceKm = 9999;

    metroStations.forEach(metro => {
      const dist = haversineDistance(lat, lon, metro.latitude, metro.longitude);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        if (!raw.nearest_metro) {
          nearestMetroName = metro.name;
        }
      }
    });

    const walkingDistanceM = Math.round(minDistanceKm * 1000);
    const walkingTimeMinutes = Math.max(1, Math.round((walkingDistanceM / 1000) * 12)); // ~5 km/h -> 12 min/km

    const popularityScore = parseFloat(raw.popularity_score || raw.popularity || '7.5');
    const isFamous = raw.famous === 'True' || raw.famous === 'true' || popularityScore >= 8.5;
    const rawCrowd = (raw.expected_crowd_level || raw.crowd_level || '').trim();
    let crowdLevel = 'Moderate';
    if (rawCrowd.toLowerCase().includes('extreme') || rawCrowd.toLowerCase().includes('surge')) {
      crowdLevel = 'Surge';
    } else if (rawCrowd.toLowerCase().includes('high')) {
      crowdLevel = 'High';
    } else if (rawCrowd.toLowerCase().includes('low')) {
      crowdLevel = 'Low';
    } else {
      crowdLevel = popularityScore >= 8.5 ? 'High' : 'Moderate';
    }

    const address = raw.geocoded_display_name || raw.address || `${name}, ${raw.region || 'Kolkata'}, West Bengal, India`;

    const durgaImages = [
      '/images/durga/durga-1.png',
      '/images/durga/durga-2.png',
      '/images/durga/durga-3.jpg',
      '/images/durga/durga-4.png',
      '/images/durga/durga-5.jpg',
      '/images/durga/durga-6.jpg',
      '/images/durga/durga-7.jpg',
      '/images/durga/durga-8.jpg',
      '/images/durga/durga-9.jpg',
      '/images/durga/durga-10.jpg',
      '/images/durga/durga-11.jpg',
    ];

    const imageUrl = durgaImages[(id - 1) % durgaImages.length];

    pandals.push({
      id,
      name,
      bengaliName: raw.bengali_name || '',
      region: raw.region || raw.area || 'Central Kolkata',
      address,
      latitude: lat,
      longitude: lon,
      nearestMetro: nearestMetroName || (metroStations[0] ? metroStations[0].name : 'Kolkata Metro'),
      nearestMetroDistanceKm: Math.round(minDistanceKm * 10) / 10,
      walkingDistanceM,
      walkingTimeMinutes,
      nearestRailwayStation: raw.nearest_railway_station || 'Sealdah Railway Station',
      popularityScore: isNaN(popularityScore) ? 7.5 : popularityScore,
      crowdLevel,
      famous: isFamous,
      familyFriendly: raw.family_friendly !== 'False' && raw.family_friendly !== 'false',
      bestTimeToVisit: raw.best_time_to_visit || '18:00 - 22:00',
      theme: raw.theme || 'Traditional Sabeki Protima & Bengali Cultural Heritage',
      description: raw.description || `Famous Durga Puja celebration in ${raw.region || 'Kolkata'} featuring traditional rituals, artisanal mandap design, and vibrant community festivities.`,
      imageUrl,
      openingTime: raw.opening_time || '06:00 AM',
      closingTime: raw.closing_time || '02:00 AM',
      googleMapsUrl: raw.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      openstreetmapUrl: raw.openstreetmap_url || `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`
    });

    validPandalCount++;
  }

  // 3. Output TypeScript files
  const libDir = path.join(rootDir, 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const pandalsTsPath = path.join(libDir, 'generated-pujas.ts');
  const metroTsPath = path.join(libDir, 'generated-metro.ts');

  const pandalsTsContent = `// Auto-generated by scripts/import-data.mjs - DO NOT EDIT DIRECTLY
import { Pandal } from './types';

export const GENERATED_PANDALS: Pandal[] = ${JSON.stringify(pandals, null, 2)};
`;

  const metroTsContent = `// Auto-generated by scripts/import-data.mjs - DO NOT EDIT DIRECTLY
import { MetroStation } from './types';

export const GENERATED_METRO_STATIONS: MetroStation[] = ${JSON.stringify(metroStations, null, 2)};
`;

  fs.writeFileSync(pandalsTsPath, pandalsTsContent, 'utf8');
  fs.writeFileSync(metroTsPath, metroTsContent, 'utf8');

  console.log('==========================================');
  console.log('✨ PUJAHOP DATA IMPORT SUMMARY ✨');
  console.log('==========================================');
  console.log(`Total Pandal Records in CSV: ${pujaRows.length - 1}`);
  console.log(`Valid Pandal Records Imported: ${validPandalCount}`);
  console.log(`Warnings / Discrepancies: ${warningsCount}`);
  console.log(`Metro Stations Imported: ${metroStations.length}`);
  console.log('==========================================');
  console.log(`Generated: ${pandalsTsPath}`);
  console.log(`Generated: ${metroTsPath}`);
  console.log('==========================================\n');
}

runImport().catch(err => {
  console.error('Import Pipeline Failed:', err);
  process.exit(1);
});
