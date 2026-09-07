import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';
import { GENERATED_PANDALS } from '@/lib/generated-pujas';
import { getRealWorldMultiRoute } from '@/lib/routing-service';
import { Pandal } from '@/lib/types';

export interface RouteContext {
  params: Promise<{ id: string }>;
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

/**
 * Builds standard Google Maps multi-stop directions URL
 */
function buildGoogleMapsRoute(
  stops: Array<{ latitude: number; longitude: number; name: string }>,
  originOverride?: { lat: number; lon: number }
): string {
  if (stops.length === 0) return '';

  let originParam: string;
  let destParam: string;
  let waypointsParam = '';

  if (originOverride) {
    originParam = `${originOverride.lat.toFixed(6)},${originOverride.lon.toFixed(6)}`;
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
 * GET /api/hop/room/[id]/pandals
 * Returns all saved pandals contributed by room members, aggregated and with route calculation.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id: roomId } = await context.params;
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const { data: rows, error } = await insforge.database
      .from('hop_member_pandals')
      .select('*')
      .eq('room_id', roomId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by pandal_id
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
      // If any member selected it, keep isSelected true
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

    const aggregatedList = Array.from(pandalMap.values());
    const selectedPandals = aggregatedList.filter(p => p.isSelected);

    // Calculate multi-stop street routing
    const waypoints = selectedPandals.map(p => ({
      lat: p.latitude,
      lon: p.longitude,
    }));

    const routeCalc = await getRealWorldMultiRoute(waypoints, 'walking');
    const googleMapsUrl = buildGoogleMapsRoute(selectedPandals);

    return NextResponse.json({
      success: true,
      roomId,
      totalSaved: aggregatedList.length,
      pandals: aggregatedList,
      selectedPandals,
      routeStats: {
        totalDistanceMeters: routeCalc.totalDistanceMeters,
        totalDurationSeconds: routeCalc.totalDurationSeconds,
        stopsCount: selectedPandals.length,
        legs: routeCalc.legs,
        googleMapsUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/hop/room/[id]/pandals
 * Adds or syncs a member's saved pandals to the room pool.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: roomId } = await context.params;
    const body = await req.json();
    const { userId, memberName, pandalIds } = body;

    if (!roomId || !userId || !Array.isArray(pandalIds)) {
      return NextResponse.json(
        { error: 'roomId, userId, and pandalIds array are required' },
        { status: 400 }
      );
    }

    const cleanMemberName = (memberName || 'Hopper').trim();
    const recordsToInsert: any[] = [];

    for (const id of pandalIds) {
      const numId = Number(id);
      if (isNaN(numId)) continue;

      const pandal = GENERATED_PANDALS.find((p: Pandal) => p.id === numId);
      if (!pandal) continue;

      recordsToInsert.push({
        room_id: roomId,
        user_id: userId,
        member_name: cleanMemberName,
        pandal_id: pandal.id,
        pandal_name: pandal.name,
        pandal_region: pandal.region || '',
        nearest_metro: pandal.nearestMetro || '',
        latitude: pandal.latitude,
        longitude: pandal.longitude,
        is_selected: true,
      });
    }

    if (recordsToInsert.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No valid pandals to add' });
    }

    // Upsert into hop_member_pandals on conflict (room_id, user_id, pandal_id)
    const { error: insertError } = await insforge.database
      .from('hop_member_pandals')
      .upsert(recordsToInsert, { onConflict: 'room_id,user_id,pandal_id' });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: recordsToInsert.length,
      message: `Successfully synced ${recordsToInsert.length} pandal(s)`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/hop/room/[id]/pandals
 * Toggles selection (choose/unchoose) or updates ordering for a pandal in the room.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id: roomId } = await context.params;
    const body = await req.json();
    const { pandalId, isSelected, orderIndex } = body;

    if (!roomId || pandalId === undefined) {
      return NextResponse.json({ error: 'roomId and pandalId are required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (isSelected !== undefined) updates.is_selected = Boolean(isSelected);
    if (orderIndex !== undefined) updates.order_index = Number(orderIndex);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await insforge.database
      .from('hop_member_pandals')
      .update(updates)
      .eq('room_id', roomId)
      .eq('pandal_id', Number(pandalId));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/hop/room/[id]/pandals
 * Removes a pandal from the room's group pool.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id: roomId } = await context.params;
    const { searchParams } = new URL(req.url);
    const pandalIdParam = searchParams.get('pandalId');
    const userIdParam = searchParams.get('userId');

    let pandalId = pandalIdParam ? Number(pandalIdParam) : null;
    let userId = userIdParam || null;

    if (!pandalId) {
      try {
        const body = await req.json();
        if (body.pandalId) pandalId = Number(body.pandalId);
        if (body.userId) userId = body.userId;
      } catch {
        // Body optional
      }
    }

    if (!roomId || !pandalId) {
      return NextResponse.json({ error: 'roomId and pandalId are required' }, { status: 400 });
    }

    let query = insforge.database
      .from('hop_member_pandals')
      .delete()
      .eq('room_id', roomId)
      .eq('pandal_id', pandalId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedPandalId: pandalId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
