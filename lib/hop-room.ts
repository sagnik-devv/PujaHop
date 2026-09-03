import { insforge } from './insforge';
import { getOrSetHopUserId } from './guest-id';

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
