import { calculateDistance } from './geo';

export interface RouteLegResult {
  distanceMeters: number;
  durationSeconds: number;
}

export interface MultiStopRouteResult {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legs: RouteLegResult[];
  source: 'osrm' | 'fallback';
}

const routeCache = new Map<string, MultiStopRouteResult>();

/**
 * Fetches real-world street routing distances and transit times for multiple waypoints.
 * Uses OpenStreetMap OSRM routing engine with an intelligent Kolkata urban transit model fallback.
 */
export async function getRealWorldMultiRoute(
  waypoints: Array<{ lat: number; lon: number }>,
  mode: 'driving' | 'walking' = 'driving'
): Promise<MultiStopRouteResult> {
  if (waypoints.length < 2) {
    return {
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      legs: [],
      source: 'fallback',
    };
  }

  const cacheKey = `${mode}:${waypoints.map(w => `${w.lat.toFixed(5)},${w.lon.toFixed(5)}`).join(';')}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Build OSRM URL: lon,lat;lon,lat;...
  const coordsStr = waypoints.map(w => `${w.lon.toFixed(6)},${w.lat.toFixed(6)}`).join(';');
  const profile = mode === 'walking' ? 'foot' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=false`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const legs: RouteLegResult[] = route.legs.map((leg: any) => ({
          distanceMeters: Math.round(leg.distance),
          durationSeconds: Math.round(leg.duration),
        }));

        const result: MultiStopRouteResult = {
          totalDistanceMeters: Math.round(route.distance),
          totalDurationSeconds: Math.round(route.duration),
          legs,
          source: 'osrm',
        };

        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Network timeout or error - proceed to high-precision Kolkata urban model
  }

  // High-precision Kolkata urban network fallback:
  // Haversine straight line multiplied by the urban road network circuity factor (1.34)
  const legs: RouteLegResult[] = [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const straightDistKm = calculateDistance(from.lat, from.lon, to.lat, to.lon);
    // 1.34 circuity factor for Kolkata street network
    const roadDistKm = straightDistKm * 1.34;
    const distM = Math.round(roadDistKm * 1000);

    let durSec = 0;
    if (mode === 'walking') {
      durSec = Math.round((distM / 75) * 60);
    } else {
      durSec = Math.round((roadDistKm / 18) * 3600);
    }

    legs.push({
      distanceMeters: distM,
      durationSeconds: Math.max(mode === 'walking' ? 120 : 180, durSec),
    });

    totalDistanceMeters += distM;
    totalDurationSeconds += durSec;
  }

  const result: MultiStopRouteResult = {
    totalDistanceMeters,
    totalDurationSeconds,
    legs,
    source: 'fallback',
  };

  routeCache.set(cacheKey, result);
  return result;
}

/**
 * Fetches real-world driving or walking distance & duration between two points.
 */
export async function getRealWorldLeg(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  mode: 'driving' | 'walking' = 'driving'
): Promise<RouteLegResult> {
  const res = await getRealWorldMultiRoute(
    [
      { lat: fromLat, lon: fromLon },
      { lat: toLat, lon: toLon },
    ],
    mode
  );
  return res.legs[0] || { distanceMeters: 0, durationSeconds: 0 };
}
