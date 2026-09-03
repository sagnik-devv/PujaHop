export type CrowdLevel = 'Low' | 'Moderate' | 'High' | 'Surge' | 'Extremely High' | 'Insane';

export type TransportMode = 'metro' | 'walk' | 'bus' | 'cab' | 'auto';

export interface Pandal {
  id: number;
  name: string;
  bengaliName?: string;
  region: string;
  address: string;
  latitude: number;
  longitude: number;
  nearestMetro: string;
  nearestMetroDistanceKm: number;
  walkingDistanceM: number;
  walkingTimeMinutes: number;
  nearestRailwayStation?: string;
  nearestBusStop?: string;
  availableBusesCount?: number;
  topBuses?: string[];
  popularityScore: number;
  crowdLevel: CrowdLevel;
  famous: boolean;
  familyFriendly: boolean;
  bestTimeToVisit: string;
  theme: string;
  description: string;
  imageUrl: string;
  openingTime: string;
  closingTime: string;
  googleMapsUrl: string;
  openstreetmapUrl: string;
}

export interface MetroStation {
  id: number;
  name: string;
  bengaliName: string;
  line: string;
  lineCode: 'BLUE' | 'GREEN' | 'PURPLE' | 'ORANGE';
  latitude: number;
  longitude: number;
  isInterchange: boolean;
  interchangeLines?: string;
  opensAt: string;
  closesAt: string;
}

export interface BusRoute {
  busNumber: string;
  operatorType: string;
  serviceVariant: string;
  isAc: boolean;
  origin: string;
  destination: string;
  routeStops: string[];
  listedStopCount: number;
  pandalIds: number[];
  matchedBusStops: string[];
  famousPandalCount?: number;
  isHotRoute?: boolean;
}

export interface BusStop {
  id: string;
  name: string;
  cleanName: string;
  latitude: number;
  longitude: number;
  nearestMetro?: string;
  busNumbers: string[];
  pandalIds: number[];
}

export interface PandalBusRouteItem {
  busNumber: string;
  isAc: boolean;
  operatorType: string;
  origin: string;
  destination: string;
}

export interface PandalBusConnectivity {
  pandalId: number;
  pandalName: string;
  matchedStop: string;
  cleanStopName: string;
  busCount: number;
  buses: PandalBusRouteItem[];
}

export interface FoodStall {
  id: string;
  name: string;
  bengaliName?: string;
  category:
    | 'Heritage Cabin'
    | 'Kathi Rolls'
    | 'Mughlai & Biryani'
    | 'Mishti & Desserts'
    | 'Street Food & Chaat'
    | 'Bengali Cuisine'
    | 'Cafe & Snacks';
  famousDish: string;
  recommendedItems: string[];
  description: string;
  priceForTwo: string;
  latitude: number;
  longitude: number;
  nearestMetro: string;
  nearestMetroWalkingM: number;
  walkMinutes: number;
  address: string;
  timings: string;
  vibe: string;
}

export interface PandalEatery {
  pandalId: number;
  pandalName: string;
  eateryName: string;
  cleanName: string;
  cuisineType: string;
  distanceM: number;
  distanceKm: number;
  budgetForTwo: number;
  bestRecommendedItem: string;
  latitude: number;
  longitude: number;
}

export interface PandalArtDetails {
  pandalId: number;
  pandalName: string;
  region: string;
  establishedEra: string;
  pandalArtType: string;
  artPhilosophy: string;
  recentAndCurrentThemes: string;
  pastNotableThemes: string;
  idolSculptureStyle: string;
  craftsmanshipAndMaterials: string;
  detailedCulturalDescription: string;
  awardsAndAccolades: string;
  latitude: number;
  longitude: number;
  facebookPageUrl?: string;
  instagramHandle?: string;
  nearestMetroStation: string;
  specialAttractions: string;
  visitorTipsAndTiming: string;
}


export interface RouteSegment {
  id: string;
  mode: TransportMode;
  from: string;
  to: string;
  durationMinutes: number;
  distanceMeters: number;
  fare: number;
  instructions: string;
  lineName?: string;
  lineColor?: string;
  stopsCount?: number;
}

export interface RouteOption {
  id: string;
  title: string;
  tagline: string;
  totalTimeMinutes: number;
  totalDistanceKm: number;
  estimatedFare: number;
  walkingDistanceMeters: number;
  transfersCount: number;
  isRecommended: boolean;
  badge?: string;
  crowdPenaltyMinutes: number;
  trafficPenaltyMinutes: number;
  compositeScore: number;
  segments: RouteSegment[];
  summarySteps: string[];
}

export interface RouteScoreBreakdown {
  baseTravelTime: number;
  walkingPenalty: number;
  fareScore: number;
  transfersPenalty: number;
  crowdPenalty: number;
  trafficPenalty: number;
  finalScore: number;
}

export interface ItineraryStop {
  stopNumber: number;
  pandal: Pandal;
  arrivalTime: string;
  departureTime: string;
  stayDurationMinutes: number;
  travelToNextMinutes?: number;
  travelToNextMode?: TransportMode;
  travelToNextCost?: number;
  travelToNextDistanceM?: number;
  walkingDistanceM?: number;
  crowdLevel: CrowdLevel;
  highlightTheme: string;
}

export interface ItineraryPlan {
  id: string;
  title: string;
  startingPoint: string;
  endingPoint: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  totalEstimatedCost: number;
  totalPandals: number;
  totalTransfers: number;
  transportPreference: 'metro' | 'cab' | 'mixed' | 'budget';
  stops: ItineraryStop[];
  recommendedMetroStations: string[];
  tips: string[];
  initialTravel?: {
    from: string;
    to: string;
    distanceM: number;
    durationMinutes: number;
    mode: TransportMode;
    cost: number;
  };
}

export interface CrowdInfo {
  pandalId: number;
  pandalName: string;
  currentLevel: CrowdLevel;
  statusText: string;
  waitTimeMinutes: number;
  isLive: boolean; // false indicates estimated/demo
  peakHours: string;
  lastUpdated: string;
  entryGateStatus: 'Normal' | 'Slow Moving' | 'Heavy Queue';
}

export interface EmergencyService {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'fire' | 'helpline' | 'control_room' | 'toilet' | 'water';
  phone?: string;
  address: string;
  area: string;
  latitude?: number;
  longitude?: number;
  isLiveFeed: boolean;
  statusText?: string;
}

export interface SearchResultGroup {
  pandals: Pandal[];
  metroStations: MetroStation[];
  areas: string[];
}

export interface FilterState {
  searchQuery: string;
  region: string;
  nearestMetro: string;
  crowdLevel: string;
  famousOnly: boolean;
  familyFriendlyOnly: boolean;
  sortBy: 'popularity' | 'name' | 'distance' | 'nearest_metro';
}
