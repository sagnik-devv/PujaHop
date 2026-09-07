import { insforge } from './insforge';
import { getOrSetHopUserId } from './guest-id';
import { GENERATED_PANDALS } from './generated-pujas';
import { getRealWorldMultiRoute } from './routing-service';

export interface HopRoom {
  id: string;
  room_code: string;
  room_name: string;
  host_user_id: string;
  created_at: string;
  expires_at: string;
  meetup_pandal_id?: number | null;
  meetup_pandal_name?: string | null;
  meetup_latitude?: number | null;
  meetup_longitude?: number | null;
  meetup_set_at?: string | null;
}

export interface HopMember {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
  is_sharing: boolean;
}

export interface LiveLocation {
  id: string;
  room_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  last_seen: string;
  is_sharing: boolean;
  updated_at: string;
}

export interface RoomDetailsResult {
  room: HopRoom;
  members: HopMember[];
  locations: Record<string, LiveLocation>;
  isExpired: boolean;
}

export interface HopMemberPandal {
  id: string;
  room_id: string;
  user_id: string;
  member_name: string;
  pandal_id: number;
  pandal_name: string;
  pandal_region?: string;
  nearest_metro?: string;
  latitude: number;
  longitude: number;
  is_selected: boolean;
  order_index: number;
  created_at: string;
}

export interface AggregatedRoomPandal {
  id: number;
  name: string;
  region: string;
  nearestMetro?: string;
  latitude: number;
  longitude: number;
  isSelected: boolean;
  orderIndex: number;
  savedBy: Array<{ userId: string; memberName: string }>;
}

export interface RoomRouteStats {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  stopsCount: number;
  legs: Array<{ distanceMeters: number; durationSeconds: number }>;
  googleMapsUrl: string;
}

export interface RoomPandalsData {
  pandals: AggregatedRoomPandal[];
  selectedPandals: AggregatedRoomPandal[];
  routeStats: RoomRouteStats;
}

const JOINED_ROOMS_KEY = 'pujo_hop_joined_room_ids';

function saveJoinedRoomId(roomId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(JOINED_ROOMS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(roomId)) {
      ids.unshift(roomId);
      localStorage.setItem(JOINED_ROOMS_KEY, JSON.stringify(ids.slice(0, 20)));
    }
  } catch {
    // Ignore storage issues
  }
}

function removeJoinedRoomId(roomId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(JOINED_ROOMS_KEY);
    if (!raw) return;
    const ids: string[] = JSON.parse(raw);
    const filtered = ids.filter(id => id !== roomId);
    localStorage.setItem(JOINED_ROOMS_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage issues
  }
}

export async function resolveUserId(providedUserId?: string): Promise<string> {
  if (providedUserId) return providedUserId;
  try {
    const { data } = await insforge.auth.getCurrentUser();
    if (data?.user?.id) {
      return data.user.id;
    }
  } catch {
    // Guest fallback
  }
  return getOrSetHopUserId();
}

/**
 * Generates an unambiguous, easy-to-type 6-character room code (e.g. PJ8K4X)
 */
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Creates a real Hop Room in InsForge with real expiration and adds the host as initial member.
 * Works seamlessly for both guest users (zero login) and signed-in users.
 */
export async function createHopRoom(params: {
  roomName: string;
  displayName: string;
  durationHours?: number;
  userId?: string;
}): Promise<{ room: HopRoom | null; error: string | null }> {
  const userId = await resolveUserId(params.userId);
  const roomName = params.roomName.trim();
  const displayName = params.displayName.trim() || 'Room Host';
  const duration = params.durationHours && params.durationHours > 0 ? params.durationHours : 8;

  if (!roomName) {
    return { room: null, error: 'Room name cannot be empty' };
  }

  const roomCode = generateRoomCode();
  const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

  // 1. Insert room record
  const { data: roomData, error: roomInsertError } = await insforge.database
    .from('hop_rooms')
    .insert([
      {
        room_code: roomCode,
        room_name: roomName,
        host_user_id: userId,
        expires_at: expiresAt,
      },
    ])
    .select()
    .single();

  if (roomInsertError || !roomData) {
    return { room: null, error: roomInsertError?.message || 'Failed to create room in database' };
  }

  const createdRoom = roomData as HopRoom;
  saveJoinedRoomId(createdRoom.id);

  // 2. Insert host as initial room member
  const { error: memberError } = await insforge.database.from('hop_members').insert([
    {
      room_id: createdRoom.id,
      user_id: userId,
      display_name: displayName,
      is_sharing: true,
    },
  ]);

  if (memberError) {
    console.warn('Host membership error:', memberError.message);
  }

  return { room: createdRoom, error: null };
}

/**
 * Gets a room by 6-character room code. Checks expiration.
 */
export async function getHopRoomByCode(
  code: string
): Promise<{ room: HopRoom | null; isExpired: boolean; error: string | null }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { room: null, isExpired: false, error: 'Please enter a valid room code' };
  }

  const { data, error } = await insforge.database
    .from('hop_rooms')
    .select('*')
    .eq('room_code', cleanCode)
    .maybeSingle();

  if (error) {
    return { room: null, isExpired: false, error: error.message };
  }

  if (!data) {
    return { room: null, isExpired: false, error: 'Room not found' };
  }

  const room = data as HopRoom;
  const isExpired = new Date(room.expires_at).getTime() <= Date.now();

  return { room, isExpired, error: null };
}

/**
 * Gets a room by UUID id. Checks expiration.
 */
export async function getHopRoom(
  roomId: string
): Promise<{ room: HopRoom | null; isExpired: boolean; error: string | null }> {
  const { data, error } = await insforge.database
    .from('hop_rooms')
    .select('*')
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    return { room: null, isExpired: false, error: error.message };
  }

  if (!data) {
    return { room: null, isExpired: false, error: 'Room not found' };
  }

  const room = data as HopRoom;
  const isExpired = new Date(room.expires_at).getTime() <= Date.now();

  return { room, isExpired, error: null };
}

/**
 * Joins an active unexpired room. Works for both guests and signed-in users.
 */
export async function joinHopRoom(params: {
  roomId: string;
  displayName: string;
  userId?: string;
}): Promise<{ member: HopMember | null; error: string | null }> {
  const userId = await resolveUserId(params.userId);
  const displayName = params.displayName.trim() || 'Hopper';

  // Verify room is still active
  const { room, isExpired, error: roomError } = await getHopRoom(params.roomId);
  if (roomError || !room) {
    return { member: null, error: roomError || 'Room not found' };
  }
  if (isExpired) {
    return { member: null, error: 'This Hop Room has expired' };
  }

  saveJoinedRoomId(params.roomId);

  // Check if already a member
  const { data: existingMember } = await insforge.database
    .from('hop_members')
    .select('*')
    .eq('room_id', params.roomId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    // Update display name
    const { data: updatedMember, error: updateErr } = await insforge.database
      .from('hop_members')
      .update({ display_name: displayName, is_sharing: true })
      .eq('id', (existingMember as HopMember).id)
      .select()
      .single();

    if (updateErr) {
      return { member: existingMember as HopMember, error: null };
    }
    return { member: updatedMember as HopMember, error: null };
  }

  // Insert new member
  const { data: newMember, error: insertError } = await insforge.database
    .from('hop_members')
    .insert([
      {
        room_id: params.roomId,
        user_id: userId,
        display_name: displayName,
        is_sharing: true,
      },
    ])
    .select()
    .single();

  if (insertError || !newMember) {
    return { member: null, error: insertError?.message || 'Failed to join room' };
  }

  return { member: newMember as HopMember, error: null };
}

/**
 * Fetches all members of a room.
 */
export async function getRoomMembers(
  roomId: string
): Promise<{ members: HopMember[]; error: string | null }> {
  const { data, error } = await insforge.database
    .from('hop_members')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    return { members: [], error: error.message };
  }

  return { members: (data as HopMember[]) || [], error: null };
}

/**
 * Fetches all latest locations for members of a room.
 */
export async function getLatestLocations(
  roomId: string
): Promise<{ locations: Record<string, LiveLocation>; error: string | null }> {
  const { data, error } = await insforge.database
    .from('live_locations')
    .select('*')
    .eq('room_id', roomId);

  if (error) {
    return { locations: {}, error: error.message };
  }

  const map: Record<string, LiveLocation> = {};
  if (Array.isArray(data)) {
    for (const loc of data as LiveLocation[]) {
      map[loc.user_id] = loc;
    }
  }

  return { locations: map, error: null };
}

/**
 * Upserts the user's latest location for an active room.
 * Stores ONLY the latest position, no history trail.
 */
export async function upsertLiveLocation(params: {
  roomId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  isSharing?: boolean;
  userId?: string;
}): Promise<{ location: LiveLocation | null; error: string | null }> {
  const userId = await resolveUserId(params.userId);
  const isSharing = params.isSharing !== undefined ? params.isSharing : true;
  const now = new Date().toISOString();

  const { data, error } = await insforge.database
    .from('live_locations')
    .upsert(
      [
        {
          room_id: params.roomId,
          user_id: userId,
          latitude: params.latitude,
          longitude: params.longitude,
          accuracy: params.accuracy ?? null,
          last_seen: now,
          is_sharing: isSharing,
          updated_at: now,
        },
      ],
      { onConflict: 'room_id,user_id' }
    )
    .select()
    .single();

  if (error) {
    return { location: null, error: error.message };
  }

  return { location: data as LiveLocation, error: null };
}

/**
 * Toggles location sharing state for the current user.
 */
export async function setLocationSharing(params: {
  roomId: string;
  isSharing: boolean;
  userId?: string;
}): Promise<{ error: string | null }> {
  const userId = await resolveUserId(params.userId);
  const now = new Date().toISOString();

  // 1. Update hop_members
  await insforge.database
    .from('hop_members')
    .update({ is_sharing: params.isSharing })
    .eq('room_id', params.roomId)
    .eq('user_id', userId);

  // 2. Update live_locations if present
  await insforge.database
    .from('live_locations')
    .update({ is_sharing: params.isSharing, updated_at: now })
    .eq('room_id', params.roomId)
    .eq('user_id', userId);

  return { error: null };
}

/**
 * Sets a real meetup pandal for the room.
 */
export async function setMeetupPandal(params: {
  roomId: string;
  pandalId: number;
  pandalName: string;
  latitude: number;
  longitude: number;
}): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await insforge.database
    .from('hop_rooms')
    .update({
      meetup_pandal_id: params.pandalId,
      meetup_pandal_name: params.pandalName,
      meetup_latitude: params.latitude,
      meetup_longitude: params.longitude,
      meetup_set_at: now,
    })
    .eq('id', params.roomId);

  return { error: error ? error.message : null };
}

/**
 * Clears the meetup pandal for the room.
 */
export async function clearMeetupPandal(roomId: string): Promise<{ error: string | null }> {
  const { error } = await insforge.database
    .from('hop_rooms')
    .update({
      meetup_pandal_id: null,
      meetup_pandal_name: null,
      meetup_latitude: null,
      meetup_longitude: null,
      meetup_set_at: null,
    })
    .eq('id', roomId);

  return { error: error ? error.message : null };
}

/**
 * Leaves a room (removes membership and location record).
 */
export async function leaveHopRoom(roomId: string, userIdParam?: string): Promise<{ error: string | null }> {
  const userId = await resolveUserId(userIdParam);
  removeJoinedRoomId(roomId);

  await insforge.database
    .from('live_locations')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  const { error } = await insforge.database
    .from('hop_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  return { error: error ? error.message : null };
}

/**
 * Fetches active rooms for the user, checking both database membership and local session history.
 */
export async function getUserActiveRooms(userIdParam?: string): Promise<{ rooms: HopRoom[]; error: string | null }> {
  const userId = await resolveUserId(userIdParam);
  const now = new Date().toISOString();

  // 1. Get room IDs from DB
  const { data: memberRows } = await insforge.database
    .from('hop_members')
    .select('room_id')
    .eq('user_id', userId);

  const dbRoomIds: string[] = memberRows ? (memberRows as any[]).map(r => r.room_id) : [];

  // 2. Also check local joined rooms
  let localRoomIds: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(JOINED_ROOMS_KEY);
      if (raw) localRoomIds = JSON.parse(raw);
    } catch {
      // Ignore
    }
  }

  const allRoomIds = Array.from(new Set([...dbRoomIds, ...localRoomIds]));

  if (allRoomIds.length === 0) {
    return { rooms: [], error: null };
  }

  // 3. Fetch those rooms that have not expired
  const { data: rooms, error } = await insforge.database
    .from('hop_rooms')
    .select('*')
    .in('id', allRoomIds)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  if (error) {
    return { rooms: [], error: error.message };
  }

  return { rooms: (rooms as HopRoom[]) || [], error: null };
}

/**
 * Builds standard multi-stop Google Maps directions URL
 */
export function buildGoogleMapsRouteUrl(
  stops: Array<{ latitude: number; longitude: number; name?: string }>,
  originCoords?: { lat: number; lon: number }
): string {
  if (!stops || stops.length === 0) return '';

  let originParam: string;
  let destParam: string;
  let waypointsParam = '';

  if (originCoords) {
    originParam = `${originCoords.lat.toFixed(6)},${originCoords.lon.toFixed(6)}`;
    destParam = `${stops[stops.length - 1].latitude.toFixed(6)},${stops[stops.length - 1].longitude.toFixed(6)}`;
    const intermediate = stops.slice(0, -1);
    if (intermediate.length > 0) {
      waypointsParam = intermediate
        .map(p => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
        .join('%7C');
    }
  } else if (stops.length === 1) {
    originParam = `${stops[0].latitude.toFixed(6)},${stops[0].longitude.toFixed(6)}`;
    destParam = `${stops[0].latitude.toFixed(6)},${stops[0].longitude.toFixed(6)}`;
  } else {
    originParam = `${stops[0].latitude.toFixed(6)},${stops[0].longitude.toFixed(6)}`;
    destParam = `${stops[stops.length - 1].latitude.toFixed(6)},${stops[stops.length - 1].longitude.toFixed(6)}`;
    const intermediate = stops.slice(1, -1);
    if (intermediate.length > 0) {
      waypointsParam = intermediate
        .map(p => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
        .join('%7C');
    }
  }

  let url = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=walking`;
  if (waypointsParam) {
    url += `&waypoints=${waypointsParam}`;
  }
  return url;
}

/**
 * Fetches all saved pandals contributed by room members with aggregated route stats.
 * Uses the API endpoint with database fallback.
 */
export async function fetchRoomPandals(roomId: string): Promise<RoomPandalsData> {
  if (!roomId) {
    return {
      pandals: [],
      selectedPandals: [],
      routeStats: {
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        stopsCount: 0,
        legs: [],
        googleMapsUrl: '',
      },
    };
  }

  // Attempt API call
  try {
    const res = await fetch(`/api/hop/room/${roomId}/pandals`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          pandals: data.pandals || [],
          selectedPandals: data.selectedPandals || [],
          routeStats: data.routeStats || {
            totalDistanceMeters: 0,
            totalDurationSeconds: 0,
            stopsCount: 0,
            legs: [],
            googleMapsUrl: '',
          },
        };
      }
    }
  } catch {
    // Fall back to direct database query
  }

  // Database fallback
  try {
    const { data: rows } = await insforge.database
      .from('hop_member_pandals')
      .select('*')
      .eq('room_id', roomId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    const pandalMap = new Map<number, AggregatedRoomPandal>();

    for (const row of rows || []) {
      const pId = row.pandal_id;
      if (!pandalMap.has(pId)) {
        pandalMap.set(pId, {
          id: pId,
          name: row.pandal_name,
          region: row.pandal_region || '',
          nearestMetro: row.nearest_metro || undefined,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          isSelected: row.is_selected ?? true,
          orderIndex: row.order_index ?? 0,
          savedBy: [],
        });
      }

      const item = pandalMap.get(pId)!;
      if (row.is_selected === false && item.savedBy.length === 0) {
        item.isSelected = false;
      } else if (row.is_selected === true) {
        item.isSelected = true;
      }

      if (!item.savedBy.some(s => s.userId === row.user_id)) {
        item.savedBy.push({
          userId: row.user_id,
          memberName: row.member_name || 'Hopper',
        });
      }
    }

    const aggregated = Array.from(pandalMap.values());
    const selected = aggregated.filter(p => p.isSelected);

    const waypoints = selected.map(p => ({ lat: p.latitude, lon: p.longitude }));
    const routeRes = await getRealWorldMultiRoute(waypoints, 'walking');
    const googleMapsUrl = buildGoogleMapsRouteUrl(selected);

    return {
      pandals: aggregated,
      selectedPandals: selected,
      routeStats: {
        totalDistanceMeters: routeRes.totalDistanceMeters,
        totalDurationSeconds: routeRes.totalDurationSeconds,
        stopsCount: selected.length,
        legs: routeRes.legs,
        googleMapsUrl,
      },
    };
  } catch (err) {
    console.warn('Failed to fetch room pandals from database:', err);
    return {
      pandals: [],
      selectedPandals: [],
      routeStats: {
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        stopsCount: 0,
        legs: [],
        googleMapsUrl: '',
      },
    };
  }
}

/**
 * Synchronizes a member's local saved pandals (favorites) to the room pool via API.
 */
export async function syncMemberFavoritesToRoom(params: {
  roomId: string;
  userId: string;
  memberName: string;
  pandalIds: number[];
}): Promise<{ count: number; error: string | null }> {
  try {
    const res = await fetch(`/api/hop/room/${params.roomId}/pandals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        memberName: params.memberName,
        pandalIds: params.pandalIds,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { count: data.count ?? params.pandalIds.length, error: null };
    }
    const errData = await res.json();
    return { count: 0, error: errData.error || 'Failed to sync favorites' };
  } catch {
    // Database fallback
    try {
      const cleanMemberName = (params.memberName || 'Hopper').trim();
      const recordsToInsert = params.pandalIds
        .map(id => {
          const pandal = GENERATED_PANDALS.find(p => p.id === id);
          if (!pandal) return null;
          return {
            room_id: params.roomId,
            user_id: params.userId,
            member_name: cleanMemberName,
            pandal_id: pandal.id,
            pandal_name: pandal.name,
            pandal_region: pandal.region || '',
            nearest_metro: pandal.nearestMetro || '',
            latitude: pandal.latitude,
            longitude: pandal.longitude,
            is_selected: true,
          };
        })
        .filter(Boolean);

      if (recordsToInsert.length === 0) return { count: 0, error: null };

      const { error } = await insforge.database
        .from('hop_member_pandals')
        .upsert(recordsToInsert, { onConflict: 'room_id,user_id,pandal_id' });

      if (error) return { count: 0, error: error.message };
      return { count: recordsToInsert.length, error: null };
    } catch (e: any) {
      return { count: 0, error: e.message || 'Database error' };
    }
  }
}

/**
 * Toggles whether a pandal is included in the room route.
 */
export async function toggleRoomPandalSelection(params: {
  roomId: string;
  pandalId: number;
  isSelected: boolean;
}): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`/api/hop/room/${params.roomId}/pandals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pandalId: params.pandalId,
        isSelected: params.isSelected,
      }),
    });

    if (res.ok) return { error: null };
    const err = await res.json();
    return { error: err.error || 'Failed to toggle pandal' };
  } catch {
    const { error } = await insforge.database
      .from('hop_member_pandals')
      .update({ is_selected: params.isSelected })
      .eq('room_id', params.roomId)
      .eq('pandal_id', params.pandalId);

    return { error: error ? error.message : null };
  }
}

/**
 * Removes a pandal from the room pool.
 */
export async function deleteRoomPandal(params: {
  roomId: string;
  pandalId: number;
}): Promise<{ error: string | null }> {
  try {
    const res = await fetch(
      `/api/hop/room/${params.roomId}/pandals?pandalId=${params.pandalId}`,
      { method: 'DELETE' }
    );
    if (res.ok) return { error: null };
    const err = await res.json();
    return { error: err.error || 'Failed to remove pandal' };
  } catch {
    const { error } = await insforge.database
      .from('hop_member_pandals')
      .delete()
      .eq('room_id', params.roomId)
      .eq('pandal_id', params.pandalId);

    return { error: error ? error.message : null };
  }
}

/**
 * Adds a specific pandal to the room pool.
 */
export async function addPandalToRoom(params: {
  roomId: string;
  userId: string;
  memberName: string;
  pandalId: number;
}): Promise<{ error: string | null }> {
  return (
    await syncMemberFavoritesToRoom({
      roomId: params.roomId,
      userId: params.userId,
      memberName: params.memberName,
      pandalIds: [params.pandalId],
    })
  ).error
    ? { error: 'Failed to add pandal' }
    : { error: null };
}
