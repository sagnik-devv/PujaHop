import { Pandal, MetroStation } from './types';

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
 * @returns Distance in kilometers.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
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

/**
 * Calculates distance in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return Math.round(calculateDistance(lat1, lon1, lat2, lon2) * 1000);
}

/**
 * Finds the nearest metro station to a given coordinate or pandal from real metro data.
 */
export function findNearestMetro(
  lat: number,
  lon: number,
  metroStations: MetroStation[]
): { metro: MetroStation; distanceKm: number; walkingMeters: number; walkingMinutes: number } | null {
  if (!metroStations || metroStations.length === 0) return null;

  let nearest = metroStations[0];
  let minDistance = calculateDistance(lat, lon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < metroStations.length; i++) {
    const station = metroStations[i];
    const dist = calculateDistance(lat, lon, station.latitude, station.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  const walkingMeters = Math.round(minDistance * 1000);
  const walkingMinutes = Math.max(1, Math.round((walkingMeters / 1000) * 12));

  return {
    metro: nearest,
    distanceKm: Math.round(minDistance * 10) / 10,
    walkingMeters,
    walkingMinutes,
  };
}

/**
 * Finds nearby pandals within a given radius (km) sorted by distance.
 */
export function findNearbyPandals(
  lat: number,
  lon: number,
  pandals: Pandal[],
  radiusKm = 3,
  limit = 10,
  excludeId?: number
): (Pandal & { distanceKm: number; distanceMeters: number })[] {
  return pandals
    .filter(p => (excludeId !== undefined ? p.id !== excludeId : true))
    .map(p => {
      const distanceKm = calculateDistance(lat, lon, p.latitude, p.longitude);
      const distanceMeters = Math.round(distanceKm * 1000);
      return {
        ...p,
        distanceKm: Math.round(distanceKm * 100) / 100,
        distanceMeters,
      };
    })
    .filter(p => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Finds nearby metro stations within a given radius.
 */
export function findNearbyMetroStations(
  lat: number,
  lon: number,
  metroStations: MetroStation[],
  radiusKm = 5,
  limit = 5
): (MetroStation & { distanceKm: number })[] {
  return metroStations
    .map(m => {
      const distanceKm = calculateDistance(lat, lon, m.latitude, m.longitude);
      return {
        ...m,
        distanceKm: Math.round(distanceKm * 100) / 100,
      };
    })
    .filter(m => m.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Estimates walking travel time in minutes (~5km/h = 83m/min).
 */
export function estimateWalkMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / 80));
}

/**
 * Estimates taxi/cab travel time in minutes accounting for Kolkata Puja traffic.
 */
export function estimateCabMinutes(distanceKm: number, trafficPenalty = 1.6): number {
  const avgSpeedKmh = 18; // Slow festive Kolkata traffic
  const rawMinutes = (distanceKm / avgSpeedKmh) * 60;
  return Math.round(rawMinutes * trafficPenalty);
}

/**
 * Estimates cab fare (₹) based on distance.
 */
export function estimateCabFare(distanceKm: number): number {
  const baseFare = 50;
  const perKm = 18;
  return Math.max(60, Math.round(baseFare + distanceKm * perKm));
}

/**
 * Estimates metro fare (₹) based on distance in Kolkata.
 */
export function estimateMetroFare(distanceKm: number): number {
  if (distanceKm <= 2) return 5;
  if (distanceKm <= 5) return 10;
  if (distanceKm <= 10) return 15;
  if (distanceKm <= 20) return 20;
  return 25;
}
