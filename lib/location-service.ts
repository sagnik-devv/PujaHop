import { GENERATED_METRO_STATIONS } from './generated-metro';
import { GENERATED_PANDALS } from './generated-pujas';
import { calculateDistance } from './geo';

export interface LocationSuggestion {
  id: string;
  name: string;
  subtitle: string;
  type: 'gps' | 'metro' | 'landmark' | 'pandal' | 'hub';
  lat: number;
  lon: number;
}

// Comprehensive Kolkata Geographic Gazetteer
export const KOLKATA_HUBS: Array<{
  name: string;
  subtitle: string;
  type: 'hub' | 'landmark';
  lat: number;
  lon: number;
  aliases?: string[];
}> = [
  // Major Railway & Transit Hubs
  { name: 'Howrah Railway Station', subtitle: 'Howrah • Major Terminal Hub', type: 'hub', lat: 22.5855, lon: 88.3433, aliases: ['howrah', 'hwh', 'howrah station', 'howrah bridge'] },
  { name: 'Howrah Maidan', subtitle: 'Howrah • Green Line Metro & Market', type: 'hub', lat: 22.5878, lon: 88.3326, aliases: ['howrah maidan', 'ac market'] },
  { name: 'Shibpur / Mandirtala', subtitle: 'Howrah • Vidyasagar Setu Corridor', type: 'landmark', lat: 22.5640, lon: 88.3180, aliases: ['shibpur', 'mandirtala'] },
  { name: 'Salkia Chowrasta', subtitle: 'North Howrah • GT Road Hub', type: 'landmark', lat: 22.6080, lon: 88.3510, aliases: ['salkia', 'salkia chowrasta'] },
  { name: 'Sealdah Railway Station', subtitle: 'Central Kolkata • Main Terminal', type: 'hub', lat: 22.5670, lon: 88.3715, aliases: ['sealdah', 'sda', 'sealdah station', 'sealdah south', 'sealdah north'] },
  { name: 'Kolkata Railway Station (Chitpur)', subtitle: 'North Kolkata • Express Terminal', type: 'hub', lat: 22.6033, lon: 88.3752, aliases: ['chitpur', 'kolkata station', 'koaa'] },
  { name: 'Netaji Subhash Chandra Bose Airport (CCU)', subtitle: 'Dum Dum • International Airport', type: 'hub', lat: 22.6547, lon: 88.4467, aliases: ['airport', 'ccu', 'dum dum airport', 'kolkata airport'] },
  { name: 'Esplanade Bus Terminus & Central', subtitle: 'Central Kolkata • City Core', type: 'hub', lat: 22.5649, lon: 88.3517, aliases: ['esplanade', 'central', 'dharmatala', 'curzon park', 'maidan central'] },
  { name: 'Babughat Ferry & Bus Terminal', subtitle: 'Strand Road • Riverfront Hub', type: 'hub', lat: 22.5678, lon: 88.3378, aliases: ['babughat', 'babu ghat', 'millennium park'] },
  { name: 'Nabanna (State Secretariat)', subtitle: 'Mandirtala • Vidyasagar Setu', type: 'landmark', lat: 22.5560, lon: 88.3240, aliases: ['nabanna', 'mandirtala', 'kona expressway'] },
  { name: 'Santragachi Junction', subtitle: 'Howrah • Long Distance Hub', type: 'hub', lat: 22.5810, lon: 88.2830, aliases: ['santragachi', 'src'] },

  // South Kolkata Core
  { name: 'Gariahat Crossing', subtitle: 'South Kolkata • Retail Hub', type: 'landmark', lat: 22.5190, lon: 88.3653, aliases: ['gariahat', 'gariahat flyover', 'ballygunge phari', 'pantaloons'] },
  { name: 'Jadavpur 8B Bus Stand', subtitle: 'South Kolkata • University Zone', type: 'landmark', lat: 22.4988, lon: 88.3719, aliases: ['jadavpur', '8b', 'jadavpur 8b', 'ju', 'sukanta setu'] },
  { name: 'Tollygunge Tram Depot / Phari', subtitle: 'South Kolkata • Film City Metro Corridor', type: 'landmark', lat: 22.5085, lon: 88.3470, aliases: ['tollygunge', 'tollygunge phari', 'mranalini', 'charu market'] },
  { name: 'Behala Chowrasta', subtitle: 'South West Kolkata • Diamond Harbour Rd', type: 'landmark', lat: 22.4831, lon: 88.3150, aliases: ['behala', 'chowrasta', 'behala chowrasta', 'sakher bazar', 'thakurpukur'] },
  { name: 'Behala Tram Depot', subtitle: 'South West Kolkata • Taratala Corridor', type: 'landmark', lat: 22.4960, lon: 88.3180, aliases: ['behala tram depot', 'behala thana'] },
  { name: 'Taratala Crossing', subtitle: 'South West Kolkata • Port & Industrial Link', type: 'landmark', lat: 22.5080, lon: 88.3150, aliases: ['taratala', 'taratala flyover', 'nature park'] },
  { name: 'Kalighat Temple', subtitle: 'South Kolkata • Historic Pilgrimage', type: 'landmark', lat: 22.5204, lon: 88.3426, aliases: ['kalighat', 'kalighat mandir', 'patuapara'] },
  { name: 'Hazra Crossing', subtitle: 'South Kolkata • SP Mukherjee Rd', type: 'landmark', lat: 22.5270, lon: 88.3480, aliases: ['hazra', 'hazra more', 'ashutosh college'] },
  { name: 'Rashbehari Crossing', subtitle: 'South Kolkata • Deshapriya Park Area', type: 'landmark', lat: 22.5190, lon: 88.3520, aliases: ['rashbehari', 'deshapriya park', 'lake market'] },
  { name: 'Southern Avenue / Rabindra Sarobar Lake', subtitle: 'South Kolkata • Lake Gardens', type: 'landmark', lat: 22.5120, lon: 88.3560, aliases: ['southern avenue', 'rabindra sarobar', 'dhakuria lake'] },
  { name: 'Ballygunge Phari', subtitle: 'South Kolkata • Broad Street Link', type: 'landmark', lat: 22.5290, lon: 88.3650, aliases: ['ballygunge phari', 'ballygunge circular road'] },
  { name: 'Garia Crossing (Mahamayatala)', subtitle: 'South Kolkata • Southern Terminal Zone', type: 'landmark', lat: 22.4660, lon: 88.3840, aliases: ['garia', 'garia more', 'mahamayatala', 'kamalgazi'] },
  { name: 'Naktala / Bansdroni', subtitle: 'South Kolkata • NSC Bose Rd', type: 'landmark', lat: 22.4760, lon: 88.3620, aliases: ['naktala', 'bansdroni', 'ranikuthi'] },
  { name: 'Kasba New Market / Rathin Banerjee Rd', subtitle: 'South East Kolkata • Ruby Connector', type: 'landmark', lat: 22.5180, lon: 88.3880, aliases: ['kasba', 'bosepukur', 'kasba thana'] },
  { name: 'Alipore (National Library / Zoo)', subtitle: 'South Kolkata • Heritage District', type: 'landmark', lat: 22.5350, lon: 88.3320, aliases: ['alipore', 'alipore zoo', 'national library', 'taj bengal'] },
  { name: 'Khidirpur 5-Point Crossing', subtitle: 'West Kolkata • Port Area', type: 'landmark', lat: 22.5375, lon: 88.3242, aliases: ['khidirpur', 'kidderpore', 'fancy market'] },

  // Central & North Kolkata Core
  { name: 'Shyambazar 5-Point Crossing', subtitle: 'North Kolkata • Historic Junction', type: 'landmark', lat: 22.6022, lon: 88.3714, aliases: ['shyambazar', 'shyam bazar', 'shyambazar five point', 'netaji statue'] },
  { name: 'Hatibagan Market', subtitle: 'North Kolkata • Star Theatre & Shopping', type: 'landmark', lat: 22.5937, lon: 88.3714, aliases: ['hatibagan', 'star theatre', 'bidhan sarani'] },
  { name: 'Baghbazar Ghat', subtitle: 'North Kolkata • Historic Riverbank', type: 'landmark', lat: 22.6033, lon: 88.3653, aliases: ['baghbazar', 'bagbazar', 'mayer bari'] },
  { name: 'Sovabazar Rajbari', subtitle: 'North Kolkata • Heritage Aristocracy', type: 'landmark', lat: 22.5985, lon: 88.3670, aliases: ['sovabazar', 'shovabazar', 'rajbari'] },
  { name: 'College Street Boipara', subtitle: 'Central Kolkata • University of Calcutta', type: 'landmark', lat: 22.5744, lon: 88.3639, aliases: ['college street', 'coffee house', 'presidency'] },
  { name: 'Park Street & Camac Street', subtitle: 'Central Kolkata • Dining & Lifestyle', type: 'landmark', lat: 22.5510, lon: 88.3524, aliases: ['park street', 'camac street', 'allen park', 'flurys'] },
  { name: 'Park Circus 7-Point Crossing', subtitle: 'Central-South Link • Syed Amir Ali Ave', type: 'landmark', lat: 22.5447, lon: 88.3670, aliases: ['park circus', '7 point', 'don bosco'] },
  { name: 'Victoria Memorial / Maidan', subtitle: 'Central Kolkata • Iconic Monument', type: 'landmark', lat: 22.5448, lon: 88.3426, aliases: ['victoria', 'victoria memorial', 'maidan', 'race course'] },
  { name: 'Princep Ghat', subtitle: 'Strand Road • Hooghly Riverbank Heritage', type: 'landmark', lat: 22.5560, lon: 88.3300, aliases: ['princep ghat', 'prinsep ghat', 'circular railway'] },

  // East Kolkata & Salt Lake / New Town
  { name: 'Salt Lake City Centre 1 (CC1)', subtitle: 'Salt Lake DC Block • Shopping Hub', type: 'landmark', lat: 22.5898, lon: 88.4091, aliases: ['city centre 1', 'cc1', 'salt lake cc1', 'dc block'] },
  { name: 'Salt Lake Sector V (IT Hub)', subtitle: 'Bidhannagar • Wipro / Technopolis', type: 'landmark', lat: 22.5735, lon: 88.4331, aliases: ['sector v', 'sector 5', 'salt lake sector 5', 'wipro more', 'college more'] },
  { name: 'Karunamoyee Central Bus Station', subtitle: 'Salt Lake • Intercity Bus Terminal', type: 'hub', lat: 22.5867, lon: 88.4190, aliases: ['karunamoyee', 'salt lake bus stand'] },
  { name: 'New Town Eco Park', subtitle: 'Rajarhat • Major Recreation Hub', type: 'landmark', lat: 22.6106, lon: 88.4658, aliases: ['eco park', 'new town eco park', 'rajarhat'] },
  { name: 'New Town City Centre 2 (CC2)', subtitle: 'Chinar Park • Rajarhat Connector', type: 'landmark', lat: 22.6280, lon: 88.4480, aliases: ['city centre 2', 'cc2', 'chinar park'] },
  { name: 'Ultadanga / Hudco Crossing', subtitle: 'North-East Kolkata • Major Junction', type: 'hub', lat: 22.5885, lon: 88.3855, aliases: ['ultadanga', 'hudco', 'bidhannagar station', 'vip road crossing'] },
  { name: 'Science City / Parama Flyover', subtitle: 'EM Bypass • Park Circus Connector', type: 'landmark', lat: 22.5398, lon: 88.3965, aliases: ['science city', 'parama flyover', 'milan mela', 'jbs haldane'] },
  { name: 'Ruby General Hospital (EM Bypass)', subtitle: 'South-East Kolkata • Kasba Connector', type: 'hub', lat: 22.5134, lon: 88.3995, aliases: ['ruby', 'ruby more', 'ruby crossing', 'anandapur'] },
  { name: 'Kankurgachi VIP Market', subtitle: 'East Kolkata • Maniktala Connector', type: 'landmark', lat: 22.5780, lon: 88.3890, aliases: ['kankurgachi', 'vip market', 'pantaloons kankurgachi'] },
  { name: 'Phoolbagan Crossing', subtitle: 'East Kolkata • Beliaghata Link', type: 'landmark', lat: 22.5710, lon: 88.3890, aliases: ['phoolbagan', 'phool bagan'] },

  // Northern Suburbs & VIP Road
  { name: 'Lake Town Clock Tower', subtitle: 'VIP Road • South Dum Dum', type: 'landmark', lat: 22.6040, lon: 88.4060, aliases: ['lake town', 'laketown', 'clock tower', 'big ben'] },
  { name: 'Bangur Avenue Crossing', subtitle: 'VIP Road • Dum Dum East', type: 'landmark', lat: 22.6100, lon: 88.4070, aliases: ['bangur', 'bangur avenue'] },
  { name: 'Baguiati Crossing', subtitle: 'VIP Road • Rajarhat Link', type: 'landmark', lat: 22.6190, lon: 88.4285, aliases: ['baguiati', 'baguiati more', 'jora mandir'] },
  { name: 'Kestopur Crossing', subtitle: 'VIP Road • Salt Lake Footbridge', type: 'landmark', lat: 22.6010, lon: 88.4280, aliases: ['kestopur', 'krishnapur'] },
  { name: 'Nagerbazar Crossing', subtitle: 'Dum Dum • Jessore Road', type: 'landmark', lat: 22.6230, lon: 88.4110, aliases: ['nagerbazar', 'nager bazar', 'satgachi'] },
  { name: 'Dunlop Bridge', subtitle: 'BT Road • Dakshineswar Gateway', type: 'hub', lat: 22.6520, lon: 88.3840, aliases: ['dunlop', 'dunlop bridge', 'barrackpore trunk rd'] },
  { name: 'Dakshineswar Temple', subtitle: 'North 24 Parganas • Hooghly Riverbank', type: 'landmark', lat: 22.6539, lon: 88.3648, aliases: ['dakshineswar', 'dakhineswar', 'kali temple'] },
  { name: 'Belur Math', subtitle: 'Howrah Riverbank • Ramakrishna Mission', type: 'landmark', lat: 22.6322, lon: 88.3562, aliases: ['belur', 'belur math', 'bally'] },
  { name: 'Barasat Champadali More', subtitle: 'North 24 Parganas • Suburb Hub', type: 'hub', lat: 22.7230, lon: 88.4820, aliases: ['barasat', 'champadali'] },
];

/**
 * Searches across Metro stations, Landmarks, Transit Hubs, and Pandals in Kolkata.
 * Returns up to maxResults instant suggestions.
 */
export function searchKolkataLocations(query: string, maxResults = 8): LocationSuggestion[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: LocationSuggestion[] = [];

  // 1. Search Metro Stations
  for (const metro of GENERATED_METRO_STATIONS) {
    if (results.length >= maxResults) break;
    const nameMatch = metro.name.toLowerCase().includes(q) || metro.bengaliName.toLowerCase().includes(q);
    if (nameMatch) {
      results.push({
        id: `metro-${metro.id}`,
        name: `${metro.name} Metro Station`,
        subtitle: `${metro.line} • Open ${metro.opensAt} - ${metro.closesAt}`,
        type: 'metro',
        lat: metro.latitude,
        lon: metro.longitude,
      });
    }
  }

  // 2. Search Kolkata Transit Hubs & Landmarks
  for (const hub of KOLKATA_HUBS) {
    if (results.length >= maxResults) break;
    const nameMatch = hub.name.toLowerCase().includes(q);
    const aliasMatch = hub.aliases?.some(alias => alias.includes(q) || q.includes(alias));
    if (nameMatch || aliasMatch) {
      // Don't duplicate if already added
      if (!results.some(r => r.name.toLowerCase() === hub.name.toLowerCase())) {
        results.push({
          id: `hub-${hub.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: hub.name,
          subtitle: hub.subtitle,
          type: hub.type,
          lat: hub.lat,
          lon: hub.lon,
        });
      }
    }
  }

  // 3. Search Famous Pandals
  for (const pandal of GENERATED_PANDALS) {
    if (results.length >= maxResults) break;
    if (pandal.name.toLowerCase().includes(q) || pandal.region.toLowerCase().includes(q)) {
      results.push({
        id: `pandal-${pandal.id}`,
        name: pandal.name,
        subtitle: `${pandal.region} • Near ${pandal.nearestMetro} Metro`,
        type: 'pandal',
        lat: pandal.latitude,
        lon: pandal.longitude,
      });
    }
  }

  return results.slice(0, maxResults);
}

/**
 * Resolves any freeform user location string to latitude/longitude.
 * 1. Checks exact/fuzzy matches in the local Kolkata Gazetteer & Metro stations.
 * 2. If no local match, queries OpenStreetMap Nominatim for real-world geocoding.
 * 3. Falls back gracefully to Central Kolkata if not found or network is offline.
 */
export async function resolveLocationCoordinates(query: string): Promise<{
  name: string;
  lat: number;
  lon: number;
  source: 'local' | 'osm' | 'fallback';
}> {
  let q = query.toLowerCase().trim();
  if (!q) {
    return { name: 'Central Kolkata (Esplanade)', lat: 22.5649, lon: 88.3517, source: 'fallback' };
  }

  // Strip "my location: ", "my location (", etc.
  if (q.startsWith('my location')) {
    q = q.replace(/^my location[:\s]*(\()?/i, '').replace(/\)$/, '').trim();
  }

  // 1. Check direct match in Metro Stations
  const matchedMetro = GENERATED_METRO_STATIONS.find(
    m => m.name.toLowerCase() === q || q.includes(m.name.toLowerCase())
  );
  if (matchedMetro) {
    return {
      name: `${matchedMetro.name} Metro Station`,
      lat: matchedMetro.latitude,
      lon: matchedMetro.longitude,
      source: 'local',
    };
  }

  // 2. Check direct match in Kolkata Hubs & Landmarks
  const matchedHub = KOLKATA_HUBS.find(h => {
    if (h.name.toLowerCase() === q || h.name.toLowerCase().includes(q) || q.includes(h.name.toLowerCase())) {
      return true;
    }
    return h.aliases?.some(a => a === q || q.includes(a));
  });
  if (matchedHub) {
    return {
      name: matchedHub.name,
      lat: matchedHub.lat,
      lon: matchedHub.lon,
      source: 'local',
    };
  }

  // 3. Check pandals
  const matchedPandal = GENERATED_PANDALS.find(p => p.name.toLowerCase().includes(q));
  if (matchedPandal) {
    return {
      name: matchedPandal.name,
      lat: matchedPandal.latitude,
      lon: matchedPandal.longitude,
      source: 'local',
    };
  }

  // 4. Query OpenStreetMap Nominatim with Kolkata boundary filter
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);
    const searchParam = encodeURIComponent(`${query}, Kolkata, West Bengal, India`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchParam}&limit=1`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PujoNavigationKolkataTransit/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            name: item.display_name.split(',')[0] || query,
            lat,
            lon,
            source: 'osm',
          };
        }
      }
    }
  } catch (e) {
    // Network / abort error - gracefully ignore and continue to fallback
  }

  // 5. Fallback to Central Kolkata / Esplanade
  return {
    name: query,
    lat: 22.5649,
    lon: 88.3517,
    source: 'fallback',
  };
}

/**
 * Given GPS coordinates, finds the closest known Kolkata landmark or metro station
 * to provide a human-readable origin label (e.g. "Near Gariahat Crossing (~180m)").
 */
export function getClosestLandmarkName(lat: number, lon: number): string {
  let closestName = 'Central Kolkata';
  let minDistance = 9999;

  // Check metro stations
  for (const m of GENERATED_METRO_STATIONS) {
    const dist = calculateDistance(lat, lon, m.latitude, m.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closestName = `${m.name} Metro`;
    }
  }

  // Check hubs
  for (const h of KOLKATA_HUBS) {
    const dist = calculateDistance(lat, lon, h.lat, h.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closestName = h.name;
    }
  }

  // Also check all 248 pandals to identify neighborhood
  let closestPandalName = '';
  let closestPandalRegion = '';
  let minPandalDist = 9999;
  for (const p of GENERATED_PANDALS) {
    const dist = calculateDistance(lat, lon, p.latitude, p.longitude);
    if (dist < minPandalDist) {
      minPandalDist = dist;
      closestPandalName = p.name;
      closestPandalRegion = p.region;
    }
  }

  const isKolkata = lat >= 22.20 && lat <= 22.80 && lon >= 88.15 && lon <= 88.60;

  if (minDistance < 0.4) {
    return `${closestName} (${Math.round(minDistance * 1000)}m)`;
  } else if (minDistance < 1.8) {
    return `Near ${closestName} (~${minDistance.toFixed(1)} km)`;
  } else if (minPandalDist < 1.0) {
    return `${closestPandalRegion} (Near ${closestPandalName})`;
  } else if (isKolkata && closestPandalRegion) {
    return `${closestPandalRegion}, Kolkata`;
  } else if (isKolkata) {
    return 'Central Kolkata (Esplanade)';
  } else {
    return `Live GPS (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
  }
}

/**
 * Reverse geocodes coordinates to a human-readable neighborhood/locality name.
 * Uses OpenStreetMap Nominatim with fallback to local geospatial database.
 */
export async function reverseGeocodeLocation(lat: number, lon: number): Promise<{
  formattedName: string;
  locality?: string;
  isKolkata: boolean;
}> {
  const isKolkata = lat >= 22.20 && lat <= 22.80 && lon >= 88.15 && lon <= 88.60;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2600);
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PujoNavigationKolkataTransit/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || addr.commercial || addr.village || addr.town || addr.city_district || addr.road;
      const city = addr.city || addr.town || addr.county || addr.state_district;
      const state = addr.state;

      if (isKolkata) {
        const nearestMetro = findNearestMetroStation(lat, lon);
        if (nearestMetro.distanceM < 1200) {
          const areaLabel = neighborhood || nearestMetro.metro.name;
          return {
            formattedName: `${areaLabel} (Near ${nearestMetro.metro.name} Metro)`,
            locality: areaLabel,
            isKolkata: true,
          };
        } else if (neighborhood) {
          return {
            formattedName: `${neighborhood}, Kolkata`,
            locality: neighborhood,
            isKolkata: true,
          };
        }
      } else {
        const parts = [neighborhood, city, state].filter(Boolean);
        const uniqueParts = Array.from(new Set(parts));
        return {
          formattedName: uniqueParts.join(', ') || city || state || 'Detected Location',
          locality: neighborhood || city,
          isKolkata: false,
        };
      }
    }
  } catch {
    // Network or timeout, fallback below
  }

  // Fallback if reverse geocoding is offline
  const landmark = getClosestLandmarkName(lat, lon);
  return {
    formattedName: landmark,
    locality: landmark,
    isKolkata,
  };
}

export interface UserLocationResult {
  lat: number;
  lon: number;
  accuracy?: number;
  landmark: string;
  nearestMetroName: string;
  nearestMetroId: number;
  nearestMetroDistanceM: number;
  source: 'gps' | 'gps-coarse' | 'cache' | 'default';
  isKolkata: boolean;
  errorMessage?: string;
}

export function findNearestMetroStation(lat: number, lon: number): {
  metro: (typeof GENERATED_METRO_STATIONS)[0];
  distanceM: number;
} {
  let minDistance = Infinity;
  let closest = GENERATED_METRO_STATIONS[0];

  for (const m of GENERATED_METRO_STATIONS) {
    const dist = calculateDistance(lat, lon, m.latitude, m.longitude);
    const distM = Math.round(dist * 1000);
    if (distM < minDistance) {
      minDistance = distM;
      closest = m;
    }
  }

  return { metro: closest, distanceM: minDistance };
}

/**
 * Robust HTML5 GPS location detection.
 * 1. Checks High-Accuracy HTML5 GPS
 * 2. Falls back to Standard/Coarse Accuracy HTML5 GPS
 * 3. Never guesses fake locations via unreliable IP geolocation.
 */
export async function detectUserLocation(options?: {
  preferHighAccuracy?: boolean;
  timeoutMs?: number;
}): Promise<UserLocationResult> {
  const timeoutMs = options?.timeoutMs || 8000;

  const queryBrowserGeo = (highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation not supported by browser'));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 10000,
      });
    });
  };

  let lat = 22.5649; // Default Esplanade
  let lon = 88.3517;
  let accuracy: number | undefined = undefined;
  let source: UserLocationResult['source'] = 'default';
  let errorMessage: string | undefined = undefined;

  // Step 1: Real HTML5 GPS (High Accuracy)
  try {
    const pos = await queryBrowserGeo(options?.preferHighAccuracy ?? true, timeoutMs);
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
    accuracy = pos.coords.accuracy;
    source = 'gps';
  } catch (err: any) {
    console.warn('High accuracy GPS timed out or failed, trying standard accuracy:', err?.message);
    // Step 2: Try standard accuracy GPS
    try {
      const pos2 = await queryBrowserGeo(false, 4000);
      lat = pos2.coords.latitude;
      lon = pos2.coords.longitude;
      accuracy = pos2.coords.accuracy;
      source = 'gps-coarse';
    } catch (err2: any) {
      errorMessage = err2?.message || 'GPS location unavailable';
      // DO NOT fall back to inaccurate IP geolocation! Throw so callers handle cleanly.
      throw new Error(errorMessage);
    }
  }

  // Check if coordinates are in Greater Kolkata region
  const isKolkata = lat >= 22.20 && lat <= 22.80 && lon >= 88.15 && lon <= 88.60;

  // Cache valid detected position only if accuracy is acceptable
  if ((source === 'gps' || source === 'gps-coarse') && (!accuracy || accuracy < 2000)) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'pujahop_cached_location',
          JSON.stringify({ lat, lon, accuracy, timestamp: Date.now() })
        );
      } catch {
        // Ignore quota/storage errors
      }
    }
  }

  // Reverse geocode to exact neighborhood or real-world locality
  const rev = await reverseGeocodeLocation(lat, lon);
  const landmark = rev.formattedName;
  const { metro: nearestMetro, distanceM: nearestMetroDistanceM } = findNearestMetroStation(lat, lon);

  return {
    lat,
    lon,
    accuracy,
    landmark,
    nearestMetroName: nearestMetro.name,
    nearestMetroId: nearestMetro.id,
    nearestMetroDistanceM,
    source,
    isKolkata: rev.isKolkata,
    errorMessage,
  };
}

