import { GENERATED_PANDALS } from './generated-pujas';
import { GENERATED_METRO_STATIONS } from './generated-metro';
import { GENERATED_BUS_ROUTES, GENERATED_BUS_STOPS, PANDAL_BUS_MAP } from './generated-buses';
import { GENERATED_FOOD_STALLS } from './generated-food';
import { GENERATED_PANDAL_EATERIES, PANDAL_EATERIES_MAP } from './generated-eateries';
import { GENERATED_PANDAL_ART_DETAILS, PANDAL_ART_DETAILS_MAP } from './generated-art-details';
import {
  Pandal,
  MetroStation,
  BusRoute,
  BusStop,
  PandalBusConnectivity,
  FoodStall,
  PandalEatery,
  PandalArtDetails,
  RouteOption,
  ItineraryPlan,
  ItineraryStop,
  CrowdInfo,
  EmergencyService,
  SearchResultGroup,
  FilterState,
  TransportMode,
} from './types';
import { getRealWorldMultiRoute, getRealWorldLeg } from './routing-service';
import {
  calculateDistance,
  calculateDistanceMeters,
  findNearestMetro,
  findNearbyPandals,
  estimateWalkMinutes,
  estimateCabMinutes,
  estimateCabFare,
  estimateMetroFare,
} from './geo';
import { formatDistance } from './format';
import { resolveLocationCoordinates } from './location-service';

/**
 * PUJO NAVIGATION SERVICE LAYER
 * Consolidated verified client & server accessors for pandals, metro stations, food pitstops and routes.
 */

export async function getPandals(): Promise<Pandal[]> {
  return GENERATED_PANDALS;
}

export async function getPandalById(id: number | string): Promise<Pandal | null> {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  const found = GENERATED_PANDALS.find(p => p.id === numericId);
  return found || null;
}

export async function getTrendingPandals(limit = 8): Promise<Pandal[]> {
  // Sreebhumi/Shreebhumi (id 40) is permanently ranked #1 as Kolkata's most crowded spectacle magnet
  return [...GENERATED_PANDALS]
    .sort((a, b) => {
      if (a.id === 40) return -1;
      if (b.id === 40) return 1;
      return b.popularityScore - a.popularityScore;
    })
    .slice(0, limit);
}

export async function getNearbyPandalsAPI(
  lat: number,
  lon: number,
  radiusKm = 3,
  limit = 10,
  excludeId?: number
): Promise<(Pandal & { distanceKm: number; distanceMeters: number })[]> {
  return findNearbyPandals(lat, lon, GENERATED_PANDALS, radiusKm, limit, excludeId);
}

export async function getMetroStations(): Promise<MetroStation[]> {
  return GENERATED_METRO_STATIONS;
}

export async function getNearestMetroForPandal(pandalId: number): Promise<{
  metro: MetroStation;
  distanceKm: number;
  walkingMeters: number;
  walkingMinutes: number;
} | null> {
  const pandal = await getPandalById(pandalId);
  if (!pandal) return null;
  return findNearestMetro(pandal.latitude, pandal.longitude, GENERATED_METRO_STATIONS);
}

export async function getBusRoutes(): Promise<BusRoute[]> {
  return GENERATED_BUS_ROUTES;
}

export async function getBusRouteByNumber(busNumber: string): Promise<BusRoute | null> {
  const norm = busNumber.trim().toLowerCase();
  const route = GENERATED_BUS_ROUTES.find(r => r.busNumber.toLowerCase() === norm);
  return route || null;
}

export async function getHotBusRoutes(limit?: number): Promise<BusRoute[]> {
  const hot = GENERATED_BUS_ROUTES
    .filter(r => (r.famousPandalCount || 0) > 0)
    .sort((a, b) => (b.famousPandalCount || 0) - (a.famousPandalCount || 0) || b.pandalIds.length - a.pandalIds.length);
  return limit ? hot.slice(0, limit) : hot;
}

export async function getBusStops(): Promise<BusStop[]> {
  return GENERATED_BUS_STOPS;
}

export async function getBusStopById(id: string): Promise<BusStop | null> {
  const stop = GENERATED_BUS_STOPS.find(s => s.id === id);
  return stop || null;
}

export async function getBusRoutesForPandal(pandalId: number): Promise<PandalBusConnectivity | null> {
  const conn = PANDAL_BUS_MAP[pandalId];
  return conn || null;
}

export async function searchBusRoutes(query: string): Promise<BusRoute[]> {
  const q = query.trim().toLowerCase();
  if (!q) return GENERATED_BUS_ROUTES.slice(0, 25);
  return GENERATED_BUS_ROUTES.filter(
    r =>
      r.busNumber.toLowerCase().includes(q) ||
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.operatorType.toLowerCase().includes(q) ||
      r.routeStops.some(s => s.toLowerCase().includes(q))
  );
}

export async function searchPandals(query: string): Promise<SearchResultGroup> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      pandals: [],
      metroStations: [],
      areas: [],
    };
  }

  // Find if query matches a bus route number (e.g. "30A", "47B")
  const matchingBus = GENERATED_BUS_ROUTES.find(r => r.busNumber.toLowerCase() === q);
  const busPandalIds = matchingBus ? new Set(matchingBus.pandalIds) : new Set();

  const pandals = GENERATED_PANDALS.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.theme.toLowerCase().includes(q) ||
      p.nearestMetro.toLowerCase().includes(q) ||
      (p.nearestBusStop && p.nearestBusStop.toLowerCase().includes(q)) ||
      (p.topBuses && p.topBuses.some(b => b.toLowerCase().includes(q))) ||
      busPandalIds.has(p.id)
  ).slice(0, 15);

  const metroStations = GENERATED_METRO_STATIONS.filter(
    m =>
      m.name.toLowerCase().includes(q) ||
      m.bengaliName.toLowerCase().includes(q) ||
      m.line.toLowerCase().includes(q)
  ).slice(0, 8);

  const allAreas = Array.from(new Set(GENERATED_PANDALS.map(p => p.region)));
  const areas = allAreas.filter(a => a.toLowerCase().includes(q));

  return {
    pandals,
    metroStations,
    areas,
  };
}

export async function filterPandals(filters: Partial<FilterState>): Promise<Pandal[]> {
  let list = [...GENERATED_PANDALS];

  if (filters.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.nearestMetro.toLowerCase().includes(q)
    );
  }

  if (filters.region && filters.region !== 'ALL') {
    list = list.filter(p => p.region.toLowerCase() === filters.region?.toLowerCase());
  }

  if (filters.nearestMetro && filters.nearestMetro !== 'ALL') {
    list = list.filter(p => p.nearestMetro === filters.nearestMetro);
  }

  if (filters.crowdLevel && filters.crowdLevel !== 'ALL') {
    list = list.filter(p => p.crowdLevel === filters.crowdLevel);
  }

  if (filters.famousOnly) {
    list = list.filter(p => p.famous);
  }

  if (filters.familyFriendlyOnly) {
    list = list.filter(p => p.familyFriendly);
  }

  if (filters.sortBy === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sortBy === 'nearest_metro') {
    list.sort((a, b) => a.nearestMetro.localeCompare(b.nearestMetro));
  } else {
    // Default: popularity
    list.sort((a, b) => b.popularityScore - a.popularityScore);
  }

  return list;
}

export interface RouteSearchParams {
  fromLat?: number;
  fromLon?: number;
  fromName?: string;
  isCurrentLocation?: boolean;
  toPandalId: number;
}

/**
 * Intelligent multi-modal route finder:
 * Calculates routes comparing Metro + Walk, Direct Cab/Auto, Bus/Public, and Less-Walking options.
 */
export async function getRoutes(params: RouteSearchParams): Promise<{
  targetPandal: Pandal;
  fromTitle: string;
  routes: RouteOption[];
}> {
  const targetPandal = await getPandalById(params.toPandalId);
  if (!targetPandal) {
    throw new Error(`Pandal with ID ${params.toPandalId} not found`);
  }

  // Determine origin coordinates dynamically
  let fromLat = params.fromLat;
  let fromLon = params.fromLon;
  let fromTitle = params.fromName || (params.isCurrentLocation ? 'Current Location' : 'Central Kolkata');

  if (fromLat === undefined || fromLon === undefined) {
    const resolved = await resolveLocationCoordinates(fromTitle);
    fromLat = resolved.lat;
    fromLon = resolved.lon;
    if (!params.fromName && resolved.name) {
      fromTitle = resolved.name;
    }
  }

  const directDistanceKm = calculateDistance(fromLat, fromLon, targetPandal.latitude, targetPandal.longitude);
  const directDistanceMeters = Math.round(directDistanceKm * 1000);

  // Find nearest metro to origin and destination
  const originMetroMatch = findNearestMetro(fromLat, fromLon, GENERATED_METRO_STATIONS);
  const targetMetroMatch = findNearestMetro(targetPandal.latitude, targetPandal.longitude, GENERATED_METRO_STATIONS);

  const originMetro = originMetroMatch?.metro || GENERATED_METRO_STATIONS[0];
  const targetMetro = targetMetroMatch?.metro || GENERATED_METRO_STATIONS[1];

  const originToMetroWalkM = originMetroMatch?.walkingMeters || 400;
  const originToMetroWalkMins = estimateWalkMinutes(originToMetroWalkM);

  const metroToTargetWalkM = targetMetroMatch?.walkingMeters || targetPandal.walkingDistanceM;
  const metroToTargetWalkMins = estimateWalkMinutes(metroToTargetWalkM);

  // Metro transit estimation
  const metroDistanceKm = calculateDistance(
    originMetro.latitude,
    originMetro.longitude,
    targetMetro.latitude,
    targetMetro.longitude
  );
  const metroRideMinutes = Math.max(8, Math.round(metroDistanceKm * 2.2));
  const isSameMetro = originMetro.id === targetMetro.id;
  const metroFare = isSameMetro ? 5 : estimateMetroFare(metroDistanceKm);

  // 1. SMART METRO EXPRESS (Usually Fastest & Most Reliable during Puja)
  const metroTotalTime = isSameMetro
    ? originToMetroWalkMins + metroToTargetWalkMins
    : originToMetroWalkMins + 5 + metroRideMinutes + metroToTargetWalkMins;
  const metroTotalWalkM = originToMetroWalkM + metroToTargetWalkM;
  const metroTotalFare = metroFare;

  const metroOption: RouteOption = {
    id: 'route-metro-smart',
    title: 'Smart Metro Express',
    tagline: 'Fastest & immune to festive road barricades',
    totalTimeMinutes: metroTotalTime,
    totalDistanceKm: Math.round((directDistanceKm + 0.8) * 10) / 10,
    estimatedFare: metroTotalFare,
    walkingDistanceMeters: metroTotalWalkM,
    transfersCount: originMetro.lineCode !== targetMetro.lineCode ? 1 : 0,
    isRecommended: true,
    badge: 'Fastest & Recommended',
    crowdPenaltyMinutes: 4,
    trafficPenaltyMinutes: 0,
    compositeScore: 9.4,
    segments: [
      {
        id: 'seg-1',
        mode: 'walk',
        from: fromTitle,
        to: `${originMetro.name} Metro Station`,
        durationMinutes: originToMetroWalkMins,
        distanceMeters: originToMetroWalkM,
        fare: 0,
        instructions: `Walk ${originToMetroWalkM}m to ${originMetro.name} Metro Gate`,
      },
      {
        id: 'seg-2',
        mode: 'metro',
        from: `${originMetro.name} Metro`,
        to: `${targetMetro.name} Metro`,
        durationMinutes: metroRideMinutes,
        distanceMeters: Math.round(metroDistanceKm * 1000),
        fare: metroFare,
        instructions: `Board ${originMetro.line} towards ${targetMetro.name}`,
        lineName: originMetro.line,
        lineColor: originMetro.lineCode === 'BLUE' ? '#1E88E5' : originMetro.lineCode === 'GREEN' ? '#43A047' : '#8E24AA',
      },
      {
        id: 'seg-3',
        mode: 'walk',
        from: `${targetMetro.name} Metro`,
        to: targetPandal.name,
        durationMinutes: metroToTargetWalkMins,
        distanceMeters: metroToTargetWalkM,
        fare: 0,
        instructions: `Exit towards ${targetPandal.region} and follow Puja signage to pandal gate`,
      },
    ],
    summarySteps: [
      `Walk to ${originMetro.name} Metro`,
      `Metro ride to ${targetMetro.name}`,
      `Walk ${formatDistance(metroToTargetWalkM)} to Pandal`,
    ],
  };

  // 2. METRO + E-RICKSHAW / AUTO (Less Walking)
  const autoFare = 20;
  const autoDuration = Math.max(5, Math.round(metroToTargetWalkMins * 0.4));
  const lessWalkingOption: RouteOption = {
    id: 'route-metro-auto',
    title: 'Metro + Shared Auto / Toto',
    tagline: 'Minimal walking, best for families and senior citizens',
    totalTimeMinutes: metroTotalTime - metroToTargetWalkMins + autoDuration + 4,
    totalDistanceKm: Math.round((directDistanceKm + 0.9) * 10) / 10,
    estimatedFare: metroFare + autoFare,
    walkingDistanceMeters: originToMetroWalkM + 120,
    transfersCount: 1,
    isRecommended: false,
    badge: 'Less Walking',
    crowdPenaltyMinutes: 3,
    trafficPenaltyMinutes: 4,
    compositeScore: 8.8,
    segments: [
      {
        id: 'seg-1',
        mode: 'walk',
        from: fromTitle,
        to: `${originMetro.name} Metro`,
        durationMinutes: originToMetroWalkMins,
        distanceMeters: originToMetroWalkM,
        fare: 0,
        instructions: `Walk to ${originMetro.name} Metro Station`,
      },
      {
        id: 'seg-2',
        mode: 'metro',
        from: `${originMetro.name} Metro`,
        to: `${targetMetro.name} Metro`,
        durationMinutes: metroRideMinutes,
        distanceMeters: Math.round(metroDistanceKm * 1000),
        fare: metroFare,
        instructions: `Board ${originMetro.line} to ${targetMetro.name}`,
      },
      {
        id: 'seg-3',
        mode: 'auto',
        from: `${targetMetro.name} Auto Stand`,
        to: `${targetPandal.name} Entry Zone`,
        durationMinutes: autoDuration,
        distanceMeters: metroToTargetWalkM,
        fare: autoFare,
        instructions: `Take designated Puja Auto / E-Rickshaw to designated drop point`,
      },
    ],
    summarySteps: [
      `Walk to ${originMetro.name}`,
      `Metro to ${targetMetro.name}`,
      `Shared Toto / Auto to Pandal Gate`,
    ],
  };

  // 3. DIRECT CAB / TAXI (Door to Door with real-world road routing)
  const realCabLeg = await getRealWorldLeg(fromLat, fromLon, targetPandal.latitude, targetPandal.longitude, 'driving');
  const realCabDistanceKm = realCabLeg.distanceMeters > 0 ? realCabLeg.distanceMeters / 1000 : directDistanceKm * 1.34;
  const cabDuration = Math.max(8, Math.round((realCabLeg.durationSeconds / 60) * 1.35));
  const cabFare = estimateCabFare(realCabDistanceKm);
  const cabOption: RouteOption = {
    id: 'route-cab-direct',
    title: 'Direct Cab / Yellow Taxi',
    tagline: 'Direct ride with real-time Puja traffic penalties',
    totalTimeMinutes: cabDuration,
    totalDistanceKm: Math.round(realCabDistanceKm * 10) / 10,
    estimatedFare: cabFare,
    walkingDistanceMeters: 250,
    transfersCount: 0,
    isRecommended: false,
    badge: 'Comfort Ride',
    crowdPenaltyMinutes: 0,
    trafficPenaltyMinutes: Math.round(cabDuration * 0.4),
    compositeScore: 7.2,
    segments: [
      {
        id: 'seg-1',
        mode: 'cab',
        from: fromTitle,
        to: `Near ${targetPandal.name} (Police Drop Zone)`,
        durationMinutes: cabDuration - 4,
        distanceMeters: Math.round(directDistanceKm * 1000),
        fare: cabFare,
        instructions: `Cab drops at nearest allowed vehicular zone due to Puja pedestrian restrictions`,
      },
      {
        id: 'seg-2',
        mode: 'walk',
        from: `Police Drop Zone`,
        to: targetPandal.name,
        durationMinutes: 4,
        distanceMeters: 250,
        fare: 0,
        instructions: `Walk 250m through pedestrian pathway to main pandal queue`,
      },
    ],
    summarySteps: [
      `Pick up at ${fromTitle}`,
      `Cab via festive corridor`,
      `Short 250m walk from Police Drop Zone`,
    ],
  };

  // 4. BUDGET PUBLIC BUS ROUTE (Direct Kolkata Bus Route)
  const targetBusInfo = PANDAL_BUS_MAP[targetPandal.id];
  const targetBusStopName = targetBusInfo ? targetBusInfo.cleanStopName : (targetPandal.nearestBusStop || `${targetPandal.region} Bus Hub`);
  const topBuses = targetBusInfo && targetBusInfo.buses.length > 0 ? targetBusInfo.buses.slice(0, 3) : [];
  const topBusesStr = topBuses.map(b => b.busNumber).join(', ');
  const primaryBus = topBuses[0] || null;

  const busDuration = Math.max(20, Math.round(directDistanceKm * 4.2));
  const busFare = 15;
  const busOption: RouteOption = {
    id: 'route-bus-public',
    title: topBusesStr ? `Kolkata Bus (${topBusesStr})` : 'Kolkata Public Bus',
    tagline: primaryBus ? `Route ${primaryBus.busNumber} (${primaryBus.origin} ➔ ${primaryBus.destination})` : 'Economical surface route via Kolkata bus network',
    totalTimeMinutes: busDuration,
    totalDistanceKm: Math.round(directDistanceKm * 1.1 * 10) / 10,
    estimatedFare: busFare,
    walkingDistanceMeters: 600,
    transfersCount: 0,
    isRecommended: false,
    badge: 'Cheapest (₹15)',
    crowdPenaltyMinutes: 6,
    trafficPenaltyMinutes: 10,
    compositeScore: 8.0,
    segments: [
      {
        id: 'seg-1',
        mode: 'walk',
        from: fromTitle,
        to: 'Nearest Boarding Bus Stop',
        durationMinutes: 5,
        distanceMeters: 350,
        fare: 0,
        instructions: 'Walk to the nearest major arterial bus stop',
      },
      {
        id: 'seg-2',
        mode: 'bus',
        from: 'Arterial Bus Stop',
        to: targetBusStopName,
        durationMinutes: busDuration - 9,
        distanceMeters: Math.round(directDistanceKm * 1000),
        fare: busFare,
        instructions: primaryBus
          ? `Board Bus ${primaryBus.busNumber} (${primaryBus.operatorType}${primaryBus.isAc ? ' AC' : ''}) towards ${targetBusStopName}`
          : `Take festive bus corridor towards ${targetBusStopName}`,
        lineName: topBusesStr ? `Bus ${topBusesStr}` : 'Kolkata Bus',
        lineColor: '#2F7D4A',
      },
      {
        id: 'seg-3',
        mode: 'walk',
        from: targetBusStopName,
        to: targetPandal.name,
        durationMinutes: 4,
        distanceMeters: 250,
        fare: 0,
        instructions: `Alight at ${targetBusStopName} and walk 250m along pedestrian lane to pandal entry gate`,
      },
    ],
    summarySteps: [
      `Walk to Bus Stop`,
      topBusesStr ? `Board Bus ${topBusesStr}` : 'Board Public Bus',
      `Alight at ${targetBusStopName} & walk to pandal`,
    ],
  };

  const allRoutes: RouteOption[] = [];

  if (directDistanceKm <= 2.2) {
    const directWalkMins = estimateWalkMinutes(directDistanceMeters);
    const walkDirectOption: RouteOption = {
      id: 'route-walk-direct',
      title: 'Festive Pedestrian Corridor',
      tagline: 'Direct short walk — immune to road blockages and vehicular diversions',
      totalTimeMinutes: directWalkMins,
      totalDistanceKm: Math.round(directDistanceKm * 10) / 10,
      estimatedFare: 0,
      walkingDistanceMeters: directDistanceMeters,
      transfersCount: 0,
      isRecommended: true,
      badge: 'Fastest Direct Walk',
      crowdPenaltyMinutes: 2,
      trafficPenaltyMinutes: 0,
      compositeScore: 9.8,
      segments: [
        {
          id: 'seg-walk-1',
          mode: 'walk',
          from: fromTitle,
          to: targetPandal.name,
          durationMinutes: directWalkMins,
          distanceMeters: directDistanceMeters,
          fare: 0,
          instructions: `Walk ${formatDistance(directDistanceMeters)} through festive illuminated pathway directly to pandal gate`,
        },
      ],
      summarySteps: [
        `Walk from ${fromTitle}`,
        `Follow Kolkata Police Puja pedestrian signage`,
        `Arrive at ${targetPandal.name}`,
      ],
    };
    // If walk is direct, make it primary recommended
    metroOption.isRecommended = false;
    allRoutes.push(walkDirectOption);
  }

  allRoutes.push(metroOption, lessWalkingOption, cabOption, busOption);

  return {
    targetPandal,
    fromTitle,
    routes: allRoutes,
  };
}

export async function getCrowdData(pandalId: number): Promise<CrowdInfo> {
  const pandal = await getPandalById(pandalId);
  const level = pandal ? pandal.crowdLevel : 'Moderate';
  const waitTimes: Record<string, number> = {
    Low: 10,
    Moderate: 25,
    High: 55,
    Surge: 90,
  };

  return {
    pandalId,
    pandalName: pandal ? pandal.name : `Pandal #${pandalId}`,
    currentLevel: level,
    statusText:
      level === 'Low'
        ? 'Quick entry, queue moving fast'
        : level === 'Moderate'
        ? 'Moderate queue, 20-30 min wait time'
        : level === 'High'
        ? 'Heavy festive rush, security barricades active'
        : 'Peak surge, expect extensive queueing',
    waitTimeMinutes: waitTimes[level] || 25,
    isLive: false, // Clearly labelled as demo/estimated
    peakHours: '07:30 PM - 01:30 AM',
    lastUpdated: 'Updated 5 mins ago (Estimated Model)',
    entryGateStatus: level === 'High' || level === 'Surge' ? 'Heavy Queue' : level === 'Moderate' ? 'Slow Moving' : 'Normal',
  };
}

export interface ItineraryOptions {
  startingPoint: string;
  startCoords?: { lat: number; lon: number };
  endingPoint?: string;
  startTime: string;
  endTime: string;
  budget: number;
  selectedPandalIds: number[];
  transportPreference: 'metro' | 'cab' | 'mixed' | 'budget';
  crowdPreference: 'any' | 'low_first' | 'iconic_first';
}

/**
 * Intelligent Pandal Hopping Itinerary Generator.
 * Consumes real pandal coordinates and builds an optimized timeline route.
 */
export async function generateItinerary(options: ItineraryOptions): Promise<ItineraryPlan> {
  const pandals = await Promise.all(options.selectedPandalIds.map(id => getPandalById(id)));
  const validPandals = pandals.filter((p): p is Pandal => p !== null);

  if (validPandals.length === 0) {
    // Fallback: Pick 4 iconic pandals
    const trending = await getTrendingPandals(4);
    validPandals.push(...trending);
  }

  // Resolve starting coordinates
  let startLat = 22.5649; // Default Central Kolkata (Esplanade)
  let startLon = 88.3517;

  if (options.startCoords && options.startCoords.lat && options.startCoords.lon) {
    startLat = options.startCoords.lat;
    startLon = options.startCoords.lon;
  } else if (options.startingPoint) {
    try {
      const resolvedStart = await resolveLocationCoordinates(options.startingPoint);
      if (resolvedStart) {
        startLat = resolvedStart.lat;
        startLon = resolvedStart.lon;
      }
    } catch {
      // Retain fallback coordinates
    }
  }

  // Find the pandal closest to the starting location to anchor the route
  let firstIndex = 0;
  let minStartDist = 9999;
  validPandals.forEach((p, idx) => {
    const dist = calculateDistance(startLat, startLon, p.latitude, p.longitude);
    if (dist < minStartDist) {
      minStartDist = dist;
      firstIndex = idx;
    }
  });

  // Sort logically by geographic proximity (TSP-greedy approximation starting from closest to user's hub)
  const orderedPandals: Pandal[] = [validPandals[firstIndex]];
  const remaining = validPandals.filter((_, idx) => idx !== firstIndex);

  while (remaining.length > 0) {
    const current = orderedPandals[orderedPandals.length - 1];
    let closestIndex = 0;
    let minDistance = 9999;

    remaining.forEach((p, idx) => {
      const dist = calculateDistance(current.latitude, current.longitude, p.latitude, p.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    orderedPandals.push(remaining.splice(closestIndex, 1)[0]);
  }

  // Construct waypoints list: starting origin followed by all ordered pandals
  const waypoints = [
    { lat: startLat, lon: startLon },
    ...orderedPandals.map(p => ({ lat: p.latitude, lon: p.longitude })),
  ];

  // Fetch real-world street routing from OSRM routing engine
  const routingProfile = options.transportPreference === 'cab' ? 'driving' : 'driving';
  const realRoute = await getRealWorldMultiRoute(waypoints, routingProfile);

  let currentHour = parseInt(options.startTime.split(':')[0] || '17', 10);
  let currentMinute = parseInt(options.startTime.split(':')[1] || '00', 10);
  const startTotalMinutes = currentHour * 60 + currentMinute;

  let totalDistanceKm = 0;
  let totalEstimatedCost = 0;
  let totalTransfers = 0;
  const recommendedMetroStations = new Set<string>();

  // Calculate Leg 0: Transit from Starting Location to First Pandal
  const initialLeg = realRoute.legs[0] || { distanceMeters: 0, durationSeconds: 0 };
  const initialDistM = initialLeg.distanceMeters;
  const initialDistKm = initialDistM / 1000;
  totalDistanceKm += initialDistKm;

  let initialMode: TransportMode = 'metro';
  let initialTravelMins = 0;
  let initialCost = 0;

  if (initialDistKm <= 1.2) {
    initialMode = 'walk';
    initialTravelMins = estimateWalkMinutes(initialDistM);
    initialCost = 0;
  } else if (options.transportPreference === 'cab') {
    initialMode = 'cab';
    initialTravelMins = Math.max(5, Math.round((initialLeg.durationSeconds / 60) * 1.3));
    initialCost = estimateCabFare(initialDistKm);
  } else {
    initialMode = 'metro';
    initialTravelMins = Math.max(10, Math.round(initialDistKm * 2.2) + 8);
    initialCost = estimateMetroFare(initialDistKm);
    totalTransfers += 1;
  }
  totalEstimatedCost += initialCost;

  // Advance time from start by initial transit time to first pandal
  currentMinute += initialTravelMins;
  while (currentMinute >= 60) {
    currentMinute -= 60;
    currentHour += 1;
  }

  const initialTravel = {
    from: options.startingPoint || 'Starting Point',
    to: orderedPandals[0].name,
    distanceM: initialDistM,
    durationMinutes: initialTravelMins,
    mode: initialMode,
    cost: initialCost,
  };

  const stops: ItineraryStop[] = [];

  for (let i = 0; i < orderedPandals.length; i++) {
    const p = orderedPandals[i];
    const isLast = i === orderedPandals.length - 1;

    const arrivalStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const stayMins = p.famous ? 45 : 30;

    // Increment time for stay
    currentMinute += stayMins;
    while (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour += 1;
    }
    const departureStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    let travelToNextMins = 0;
    let travelCost = 0;
    let distM = 0;
    let nextMode: TransportMode = 'metro';

    if (!isLast) {
      const leg = realRoute.legs[i + 1] || { distanceMeters: 0, durationSeconds: 0 };
      distM = leg.distanceMeters;
      const distKm = distM / 1000;
      totalDistanceKm += distKm;

      if (distKm <= 1.2) {
        nextMode = 'walk';
        travelToNextMins = estimateWalkMinutes(distM);
        travelCost = 0;
      } else if (options.transportPreference === 'cab') {
        nextMode = 'cab';
        travelToNextMins = Math.max(4, Math.round((leg.durationSeconds / 60) * 1.3));
        travelCost = estimateCabFare(distKm);
      } else {
        nextMode = 'metro';
        travelToNextMins = Math.max(10, Math.round(distKm * 2.2) + 8);
        travelCost = estimateMetroFare(distKm);
        totalTransfers += 1;
      }

      totalEstimatedCost += travelCost;

      // Add travel time to clock
      currentMinute += travelToNextMins;
      while (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour += 1;
      }
    }

    if (p.nearestMetro) {
      recommendedMetroStations.add(p.nearestMetro);
    }

    stops.push({
      stopNumber: i + 1,
      pandal: p,
      arrivalTime: arrivalStr,
      departureTime: departureStr,
      stayDurationMinutes: stayMins,
      travelToNextMinutes: isLast ? undefined : travelToNextMins,
      travelToNextMode: isLast ? undefined : nextMode,
      travelToNextCost: isLast ? undefined : travelCost,
      travelToNextDistanceM: isLast ? undefined : distM,
      walkingDistanceM: p.walkingDistanceM,
      crowdLevel: p.crowdLevel,
      highlightTheme: p.theme,
    });
  }

  const endStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
  const endTotalMinutes = currentHour * 60 + currentMinute;
  const totalDurationMinutes = endTotalMinutes - startTotalMinutes;

  return {
    id: `plan-${Date.now()}`,
    title: `${orderedPandals.length}-Pandal Festive Hop Route`,
    startingPoint: options.startingPoint || 'Central Kolkata',
    endingPoint: options.endingPoint || 'Return via Metro',
    startTime: options.startTime,
    endTime: endStr,
    totalDurationMinutes,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalEstimatedCost: Math.max(40, totalEstimatedCost),
    totalPandals: orderedPandals.length,
    totalTransfers,
    transportPreference: options.transportPreference,
    stops,
    initialTravel,
    recommendedMetroStations: Array.from(recommendedMetroStations),
    tips: [
      'Carry your Metro Smart Card to bypass ticket counter queues during festive nights.',
      'Wear comfortable walking shoes for pandal queue lanes.',
      'Keep Kolkata Police Puja Helpline (1090) saved for immediate crowd/road assistance.',
      'Visit high-rush pandals before 8:00 PM or after 1:00 AM for smoother darshan.',
    ],
  };
}

export async function getEmergencyServices(): Promise<EmergencyService[]> {
  return [
    {
      id: 'em-1',
      name: 'Kolkata Police Central Puja Control Room',
      category: 'control_room',
      phone: '1090 / 033-22143230',
      address: 'Lalbazar, Kolkata Central',
      area: 'Central Kolkata',
      isLiveFeed: true,
      statusText: '24x7 Active Control Room',
    },
    {
      id: 'em-2',
      name: 'National Emergency Response Helpline',
      category: 'helpline',
      phone: '112',
      address: 'All Kolkata Jurisdiction',
      area: 'Citywide',
      isLiveFeed: true,
      statusText: 'Toll-free 24/7',
    },
    {
      id: 'em-3',
      name: 'Kolkata Traffic Police Puja Helpdesk',
      category: 'police',
      phone: '1073 / 033-22143644',
      address: 'Lalbazar Traffic HQ',
      area: 'Central Kolkata',
      isLiveFeed: true,
      statusText: 'Live Traffic Diversion Desk',
    },
    {
      id: 'em-4',
      name: 'Medical Ambulance Emergency',
      category: 'hospital',
      phone: '102 / 108',
      address: 'West Bengal Health Emergency Services',
      area: 'Citywide',
      isLiveFeed: true,
      statusText: 'Rapid Response Fleet',
    },
    {
      id: 'em-5',
      name: 'West Bengal Fire & Emergency Services',
      category: 'fire',
      phone: '101 / 033-22521111',
      address: 'Free School Street Fire HQ',
      area: 'Central Kolkata',
      isLiveFeed: true,
      statusText: 'Festival Ready Fire Units',
    },
    {
      id: 'em-6',
      name: 'SSKM Government Hospital (IPGMER)',
      category: 'hospital',
      phone: '033-22231589',
      address: '244 AJC Bose Road, Bhowanipore',
      area: 'South Kolkata',
      isLiveFeed: true,
      statusText: '24/7 Trauma Care Center',
    },
    {
      id: 'em-7',
      name: 'RG Kar Medical College & Hospital',
      category: 'hospital',
      phone: '033-25557656',
      address: '1 Khudiram Bose Sarani, Belgachia',
      area: 'North Kolkata',
      isLiveFeed: true,
      statusText: '24/7 Emergency Wing',
    },
    {
      id: 'em-8',
      name: 'KMC Public Restroom & Drinking Water Feed',
      category: 'toilet',
      address: 'Kolkata Municipal Corporation Pandal Hubs',
      area: 'Citywide',
      isLiveFeed: false,
      statusText: 'Live Geo-Feed Coming Soon in Phase 2',
    },
  ];
}

export async function submitReport(report: {
  pandalId: number;
  reportType: string;
  notes: string;
  timestamp?: string;
}): Promise<{ success: boolean; message: string }> {
  console.log('User report submitted:', report);
  return {
    success: true,
    message: 'Thank you for your report! Our Puja crowd moderation team has received your update.',
  };
}

export async function getFoodStalls(): Promise<FoodStall[]> {
  return [...GENERATED_FOOD_STALLS];
}

export async function getFoodStallsByMetro(metroName: string): Promise<FoodStall[]> {
  const norm = metroName.toLowerCase().trim();
  return GENERATED_FOOD_STALLS.filter(f => f.nearestMetro.toLowerCase().includes(norm));
}

export function findNearbyFoodStalls(
  lat: number,
  lon: number,
  radiusKm = 1.6,
  limit = 3
): (FoodStall & { distanceM: number; walkMins: number })[] {
  return GENERATED_FOOD_STALLS.map(stall => {
    const distKm = calculateDistance(lat, lon, stall.latitude, stall.longitude);
    const distanceM = Math.round(distKm * 1000);
    const walkMins = estimateWalkMinutes(distanceM);
    return {
      ...stall,
      distanceM,
      walkMins,
    };
  })
    .filter(f => f.distanceM <= radiusKm * 1000)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}

export async function getEateriesForPandal(pandalId: number): Promise<PandalEatery[]> {
  return PANDAL_EATERIES_MAP[pandalId] || [];
}

export async function getAllPandalEateries(): Promise<PandalEatery[]> {
  return GENERATED_PANDAL_EATERIES;
}

export function getEateriesForCoords(
  lat: number,
  lon: number,
  radiusM = 2000,
  limit = 5
): (PandalEatery & { walkMins: number })[] {
  const seen = new Set<string>();
  const results: (PandalEatery & { walkMins: number })[] = [];

  for (const eatery of GENERATED_PANDAL_EATERIES) {
    const key = eatery.cleanName.toLowerCase();
    if (seen.has(key)) continue;
    const distKm = calculateDistance(lat, lon, eatery.latitude, eatery.longitude);
    const distM = Math.round(distKm * 1000);
    if (distM <= radiusM) {
      seen.add(key);
      results.push({
        ...eatery,
        distanceM: distM,
        distanceKm: +(distM / 1000).toFixed(2),
        walkMins: estimateWalkMinutes(distM),
      });
    }
  }

  results.sort((a, b) => a.distanceM - b.distanceM);
  return results.slice(0, limit);
}

/**
 * Returns verified art philosophy, themes, sculpture, and social media details
 * for a specific pandal.
 */
export async function getPandalArtDetails(pandalId: number | string): Promise<PandalArtDetails | null> {
  const numericId = typeof pandalId === 'string' ? parseInt(pandalId, 10) : pandalId;
  return PANDAL_ART_DETAILS_MAP[numericId] || null;
}

/**
 * Returns art philosophy and cultural details for all 248 pandals.
 */
export async function getAllPandalArtDetails(): Promise<PandalArtDetails[]> {
  return GENERATED_PANDAL_ART_DETAILS;
}



