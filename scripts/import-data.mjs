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

function cleanStopName(raw) {
  if (!raw) return 'Kolkata Bus Stop';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  const specificMap = {
    'sovabazar metro': 'Shobhabazar Metro Stop',
    'mg road metro': 'MG Road Metro Stop',
    'shyambazar': 'Shyambazar Five-Point',
    'belgachia': 'Belgachia Bridge Stop',
    'girish park': 'Girish Park Crossing',
    'cossipore': 'Cossipore Road',
    'dum dum station': 'Dum Dum Station Hub',
    'dumdumpark': 'Dum Dum Park VIP',
    'dum dum park': 'Dum Dum Park VIP',
    'greystreet': 'Grey Street Junction',
    'hatibagan': 'Hatibagan Crossing',
    'bagbazar': 'Bagbazar Bata',
    'khanna': 'Khanna Cinema Crossing',
    'ultadanga': 'Ultadanga Hudco More',
    'saltlake': 'Salt Lake Karunamoyee',
    'sealdah': 'Sealdah Station Hub',
    'howrah': 'Howrah Station Terminus',
    'esplanade': 'Esplanade Bus Terminus',
    'park street': 'Park Street Crossing',
    'rabindra sadan': 'Exide / Rabindra Sadan',
    'bhawanipore': 'Bhowanipore / Ashutosh Mukherjee Rd',
    'kalighat': 'Kalighat Tram Depot',
    'rashbehari': 'Rashbehari Crossing',
    'gariahat': 'Gariahat Junction',
    'jadavpur': 'Jadavpur 8B Bus Stand',
    'tollygunge': 'Tollygunge Tram Depot',
    'behala': 'Behala Chowrasta',
    'taratala': 'Taratala Crossing',
    'new alipore': 'New Alipore Petrol Pump',
    'ballygunge': 'Ballygunge Phari',
    'kasba': 'Kasba New Market',
    'ruby': 'Ruby Hospital More (EM Bypass)',
    'acropolis': 'Acropolis Mall / Rajdanga',
    'science city': 'Science City Crossing',
    'vip road': 'VIP Road Kaikhali',
  };

  if (specificMap[lower]) {
    return specificMap[lower];
  }

  return trimmed
    .split(/[\s_]+/)
    .map(w => {
      const l = w.toLowerCase();
      if (l === 'mg') return 'MG';
      if (l === 'rg') return 'RG';
      if (l === 'vip') return 'VIP';
      if (l === 'em') return 'EM';
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
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
  const sourceBusPath = path.join(rootDir, 'pujo csv', 'data', 'bus route.csv');
  const targetBusPath = path.join(dataDir, 'bus_routes.csv');

  if (fs.existsSync(sourcePujaPath) && !fs.existsSync(targetPujaPath)) {
    fs.copyFileSync(sourcePujaPath, targetPujaPath);
    console.log(`Copied verified pandals data to ${targetPujaPath}`);
  }

  if (fs.existsSync(sourceBusPath) && !fs.existsSync(targetBusPath)) {
    fs.copyFileSync(sourceBusPath, targetBusPath);
    console.log(`Copied verified bus routes data to ${targetBusPath}`);
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

  if (!fs.existsSync(targetBusPath)) {
    if (fs.existsSync(sourceBusPath)) {
      fs.copyFileSync(sourceBusPath, targetBusPath);
    } else {
      throw new Error(`Cannot find bus_routes.csv in ${dataDir} or source path`);
    }
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

  // 2. Parse Bus CSV
  // Pre-scan famous pandal IDs for Hot Bus rankings
  const prePujaContent = fs.readFileSync(targetPujaPath, 'utf8');
  const prePujaRows = parseCSV(prePujaContent);
  const prePujaHeaders = prePujaRows[0].map(h => h.trim());
  const famousPandalIdSet = new Set();
  for (let i = 1; i < prePujaRows.length; i++) {
    const row = prePujaRows[i];
    if (!row || row.length === 0) continue;
    const raw = {};
    prePujaHeaders.forEach((h, idx) => { raw[h] = row[idx] ? row[idx].trim() : ''; });
    const id = parseInt(raw.pandal_id || raw.id || `${i}`, 10);
    const pop = parseFloat(raw.popularity_score || raw.popularity || '7.5');
    const isFamous = raw.famous === 'True' || raw.famous === 'true' || pop >= 8.5;
    if (isFamous && !isNaN(id)) {
      famousPandalIdSet.add(id);
    }
  }

  const busContent = fs.readFileSync(targetBusPath, 'utf8');
  const busRows = parseCSV(busContent);
  const busHeaders = busRows[0].map(h => h.trim());

  const busRoutesMap = new Map();
  const busStopsMap = new Map();
  const pandalBusMap = new Map();

  for (let i = 1; i < busRows.length; i++) {
    const row = busRows[i];
    if (!row || row.length === 0) continue;
    const raw = {};
    busHeaders.forEach((h, idx) => {
      raw[h] = row[idx] ? row[idx].trim() : '';
    });

    const busNo = raw.bus_number;
    if (!busNo) continue;

    const pandalId = parseInt(raw.pandal_id, 10);
    const pandalName = raw.pandal_name || '';
    const stopName = raw.matched_bus_stop || 'Kolkata Bus Stop';
    const stopKey = stopName.toLowerCase();
    const lat = parseFloat(raw.pandal_latitude);
    const lon = parseFloat(raw.pandal_longitude);
    const isAc = raw.is_ac ? raw.is_ac.toLowerCase() === 'true' : false;

    // Bus Route aggregation
    if (!busRoutesMap.has(busNo)) {
      busRoutesMap.set(busNo, {
        busNumber: busNo,
        operatorType: raw.operator_type || 'Private',
        serviceVariant: raw.service_variant || 'Standard',
        isAc,
        origin: raw.origin || 'Kolkata',
        destination: raw.destination || 'Kolkata',
        routeStops: (raw.route_stops || '').split(';').map(s => s.trim()).filter(Boolean),
        listedStopCount: parseInt(raw.listed_stop_count || '0', 10),
        pandalIdsSet: new Set(),
        matchedBusStopsSet: new Set(),
      });
    }
    const routeObj = busRoutesMap.get(busNo);
    if (!isNaN(pandalId)) routeObj.pandalIdsSet.add(pandalId);
    routeObj.matchedBusStopsSet.add(stopName);

    // Bus Stop aggregation
    if (!busStopsMap.has(stopKey)) {
      busStopsMap.set(stopKey, {
        id: `bus-stop-${busStopsMap.size + 1}`,
        name: stopName,
        cleanName: cleanStopName(stopName),
        lats: [],
        lons: [],
        nearestMetro: raw.nearest_metro || '',
        busNumbersSet: new Set(),
        pandalIdsSet: new Set(),
      });
    }
    const stopObj = busStopsMap.get(stopKey);
    if (!isNaN(lat) && !isNaN(lon)) {
      stopObj.lats.push(lat);
      stopObj.lons.push(lon);
    }
    stopObj.busNumbersSet.add(busNo);
    if (!isNaN(pandalId)) stopObj.pandalIdsSet.add(pandalId);

    // Pandal Bus mapping
    if (!isNaN(pandalId)) {
      if (!pandalBusMap.has(pandalId)) {
        pandalBusMap.set(pandalId, {
          pandalId,
          pandalName,
          matchedStop: stopName,
          cleanStopName: cleanStopName(stopName),
          busesMap: new Map(),
        });
      }
      const pEntry = pandalBusMap.get(pandalId);
      if (!pEntry.busesMap.has(busNo)) {
        pEntry.busesMap.set(busNo, {
          busNumber: busNo,
          isAc,
          operatorType: raw.operator_type || 'Private',
          origin: raw.origin || 'Kolkata',
          destination: raw.destination || 'Kolkata',
        });
      }
    }
  }

  // Convert bus routes to serializable array
  const busRoutes = Array.from(busRoutesMap.values()).map(r => {
    const pandalIds = Array.from(r.pandalIdsSet).sort((a, b) => a - b);
    const famousCount = pandalIds.filter(id => famousPandalIdSet.has(id)).length;
    return {
      busNumber: r.busNumber,
      operatorType: r.operatorType,
      serviceVariant: r.serviceVariant,
      isAc: r.isAc,
      origin: r.origin,
      destination: r.destination,
      routeStops: r.routeStops,
      listedStopCount: r.listedStopCount || r.routeStops.length,
      pandalIds,
      matchedBusStops: Array.from(r.matchedBusStopsSet),
      famousPandalCount: famousCount,
      isHotRoute: famousCount >= 8,
    };
  }).sort((a, b) => (b.famousPandalCount || 0) - (a.famousPandalCount || 0) || b.pandalIds.length - a.pandalIds.length);

  // Convert bus stops to serializable array
  const busStops = Array.from(busStopsMap.values()).map(s => {
    const avgLat = s.lats.length > 0 ? s.lats.reduce((a, b) => a + b, 0) / s.lats.length : 22.5726;
    const avgLon = s.lons.length > 0 ? s.lons.reduce((a, b) => a + b, 0) / s.lons.length : 88.3639;
    return {
      id: s.id,
      name: s.name,
      cleanName: s.cleanName,
      latitude: Math.round(avgLat * 1000000) / 1000000,
      longitude: Math.round(avgLon * 1000000) / 1000000,
      nearestMetro: s.nearestMetro || undefined,
      busNumbers: Array.from(s.busNumbersSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      pandalIds: Array.from(s.pandalIdsSet).sort((a, b) => a - b),
    };
  }).sort((a, b) => b.busNumbers.length - a.busNumbers.length);

  // Convert pandalBusMap to Record<number, PandalBusConnectivity>
  const pandalBusRecords = {};
  pandalBusMap.forEach((entry, id) => {
    pandalBusRecords[id] = {
      pandalId: entry.pandalId,
      pandalName: entry.pandalName,
      matchedStop: entry.matchedStop,
      cleanStopName: entry.cleanStopName,
      busCount: entry.busesMap.size,
      buses: Array.from(entry.busesMap.values()),
    };
  });

  // 3. Parse Pandals CSV
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

    // Bus connectivity info
    const busInfo = pandalBusRecords[id];
    const nearestBusStop = busInfo ? busInfo.cleanStopName : 'Kolkata Bus Corridor';
    const availableBusesCount = busInfo ? busInfo.busCount : 0;
    const topBuses = busInfo ? busInfo.buses.slice(0, 4).map(b => b.busNumber) : [];

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
      nearestBusStop,
      availableBusesCount,
      topBuses,
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

  // 4. Output TypeScript files
  const libDir = path.join(rootDir, 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const pandalsTsPath = path.join(libDir, 'generated-pujas.ts');
  const metroTsPath = path.join(libDir, 'generated-metro.ts');
  const busTsPath = path.join(libDir, 'generated-buses.ts');

  const pandalsTsContent = `// Auto-generated by scripts/import-data.mjs - DO NOT EDIT DIRECTLY
import { Pandal } from './types';

export const GENERATED_PANDALS: Pandal[] = ${JSON.stringify(pandals, null, 2)};
`;

  const metroTsContent = `// Auto-generated by scripts/import-data.mjs - DO NOT EDIT DIRECTLY
import { MetroStation } from './types';

export const GENERATED_METRO_STATIONS: MetroStation[] = ${JSON.stringify(metroStations, null, 2)};
`;

  const busTsContent = `// Auto-generated by scripts/import-data.mjs - DO NOT EDIT DIRECTLY
import { BusRoute, BusStop, PandalBusConnectivity } from './types';

export const GENERATED_BUS_ROUTES: BusRoute[] = ${JSON.stringify(busRoutes, null, 2)};

export const GENERATED_BUS_STOPS: BusStop[] = ${JSON.stringify(busStops, null, 2)};

export const PANDAL_BUS_MAP: Record<number, PandalBusConnectivity> = ${JSON.stringify(pandalBusRecords, null, 2)};
`;

  fs.writeFileSync(pandalsTsPath, pandalsTsContent, 'utf8');
  fs.writeFileSync(metroTsPath, metroTsContent, 'utf8');
  fs.writeFileSync(busTsPath, busTsContent, 'utf8');

  console.log('==========================================');
  console.log('✨ PUJAHOP DATA IMPORT SUMMARY ✨');
  console.log('==========================================');
  console.log(`Total Pandal Records in CSV: ${pujaRows.length - 1}`);
  console.log(`Valid Pandal Records Imported: ${validPandalCount}`);
  console.log(`Warnings / Discrepancies: ${warningsCount}`);
  console.log(`Metro Stations Imported: ${metroStations.length}`);
  console.log(`Bus Routes Ingested: ${busRoutes.length}`);
  console.log(`Bus Stop Hubs Ingested: ${busStops.length}`);
  console.log(`Pandals with Bus Mappings: ${Object.keys(pandalBusRecords).length}`);
  console.log('==========================================');
  console.log(`Generated: ${pandalsTsPath}`);
  console.log(`Generated: ${metroTsPath}`);
  console.log(`Generated: ${busTsPath}`);
  console.log('==========================================\n');
}

runImport().catch(err => {
  console.error('Import Pipeline Failed:', err);
  process.exit(1);
});
