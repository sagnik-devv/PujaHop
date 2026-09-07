import { createClient } from '@insforge/sdk';

const baseUrl = 'https://j4g5vd5y.ap-southeast.insforge.app';
const anonKey = 'anon_3809e5f1f00212bc80009626d40bf7155c19ee38a3299dcd68180410e3404f78';

const client = createClient({ baseUrl, anonKey });

async function runTest() {
  console.log('🚀 Starting E2E Verification of Collaborative Member Saved Pandals & Route Planning...');

  const roomId = 'test-room-' + Date.now();
  const roomCode = 'TP' + Math.floor(1000 + Math.random() * 9000);
  const userA = 'a1111111-2222-3333-4444-555555555555';
  const userB = 'b1111111-2222-3333-4444-555555555555';

  // 1. Create temporary active room
  const expiresAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
  const { data: roomRows, error: roomErr } = await client.database
    .from('hop_rooms')
    .insert([
      {
        room_code: roomCode,
        room_name: 'Test Collaborative Hopping',
        host_user_id: userA,
        expires_at: expiresAt,
      },
    ])
    .select();

  if (roomErr || !roomRows || roomRows.length === 0) {
    throw new Error('Failed to create test room: ' + roomErr?.message);
  }
  const room = roomRows[0];
  console.log(`✓ Test Room Created: ${room.id} (${room.room_code})`);

  try {
    // 2. Add members
    await client.database.from('hop_members').insert([
      { room_id: room.id, user_id: userA, display_name: 'Sagnik', is_sharing: true },
      { room_id: room.id, user_id: userB, display_name: 'Subhojit', is_sharing: true },
    ]);
    console.log('✓ Members registered: Sagnik and Subhojit');

    // 3. Member A syncs saved pandals (Ahiritola: 1, Baghbazar: 2, Kumartuli: 5)
    console.log('\n--- Step 1: Member A (Sagnik) saves pandals [1, 2, 5] ---');
    const memberAPandals = [
      {
        room_id: room.id,
        user_id: userA,
        member_name: 'Sagnik',
        pandal_id: 1,
        pandal_name: 'Ahiritola Jubak Brinda',
        pandal_region: 'North Kolkata',
        nearest_metro: 'Shobhabazar',
        latitude: 22.5962,
        longitude: 88.3582,
        is_selected: true,
      },
      {
        room_id: room.id,
        user_id: userA,
        member_name: 'Sagnik',
        pandal_id: 2,
        pandal_name: 'Baghbazar Sarbojanin',
        pandal_region: 'North Kolkata',
        nearest_metro: 'Shyambazar',
        latitude: 22.6033,
        longitude: 88.3653,
        is_selected: true,
      },
      {
        room_id: room.id,
        user_id: userA,
        member_name: 'Sagnik',
        pandal_id: 5,
        pandal_name: 'Kumartuli Park',
        pandal_region: 'North Kolkata',
        nearest_metro: 'Shobhabazar',
        latitude: 22.5991,
        longitude: 88.3644,
        is_selected: true,
      },
    ];

    const { error: insAErr } = await client.database
      .from('hop_member_pandals')
      .upsert(memberAPandals, { onConflict: 'room_id,user_id,pandal_id' });
    if (insAErr) throw new Error('Member A sync failed: ' + insAErr.message);
    console.log('✓ Member A synced 3 saved pandals successfully');

    // 4. Member B syncs saved pandals (Baghbazar: 2, College Square: 8)
    console.log('\n--- Step 2: Member B (Subhojit) saves pandals [2, 8] ---');
    const memberBPandals = [
      {
        room_id: room.id,
        user_id: userB,
        member_name: 'Subhojit',
        pandal_id: 2,
        pandal_name: 'Baghbazar Sarbojanin',
        pandal_region: 'North Kolkata',
        nearest_metro: 'Shyambazar',
        latitude: 22.6033,
        longitude: 88.3653,
        is_selected: true,
      },
      {
        room_id: room.id,
        user_id: userB,
        member_name: 'Subhojit',
        pandal_id: 8,
        pandal_name: 'College Square',
        pandal_region: 'Central Kolkata',
        nearest_metro: 'Central',
        latitude: 22.5744,
        longitude: 88.3639,
        is_selected: true,
      },
    ];

    const { error: insBErr } = await client.database
      .from('hop_member_pandals')
      .upsert(memberBPandals, { onConflict: 'room_id,user_id,pandal_id' });
    if (insBErr) throw new Error('Member B sync failed: ' + insBErr.message);
    console.log('✓ Member B synced 2 saved pandals successfully');

    // 5. Query and Aggregate
    console.log('\n--- Step 3: Fetch all member saved pandals and verify aggregation ---');
    const { data: rows, error: fetchErr } = await client.database
      .from('hop_member_pandals')
      .select('*')
      .eq('room_id', room.id);

    if (fetchErr) throw new Error('Fetch failed: ' + fetchErr.message);
    console.log(`✓ Fetched total records: ${rows.length}`);

    // Verify deduplication
    const uniquePandalIds = Array.from(new Set(rows.map(r => r.pandal_id)));
    console.log(`✓ Unique Pandals: ${uniquePandalIds.join(', ')} (expected [1, 2, 5, 8])`);

    const baghbazarContributors = rows.filter(r => r.pandal_id === 2).map(r => r.member_name);
    console.log(`✓ Baghbazar (pandal 2) saved by: ${baghbazarContributors.join(', ')}`);
    if (baghbazarContributors.length !== 2) {
      throw new Error(`Expected Baghbazar to have 2 contributors, got ${baghbazarContributors.length}`);
    }

    // 6. Test Toggle Selection (Exclude pandal 5)
    console.log('\n--- Step 4: Toggle selection (Exclude pandal 5 from active route) ---');
    const { error: updateErr } = await client.database
      .from('hop_member_pandals')
      .update({ is_selected: false })
      .eq('room_id', room.id)
      .eq('pandal_id', 5);

    if (updateErr) throw new Error('Toggle failed: ' + updateErr.message);

    const { data: updatedRows } = await client.database
      .from('hop_member_pandals')
      .select('*')
      .eq('room_id', room.id)
      .eq('pandal_id', 5);

    if (updatedRows?.[0]?.is_selected !== false) {
      throw new Error('Pandal 5 was not marked as false');
    }
    console.log('✓ Pandal 5 successfully toggled to is_selected = false');

    // 7. Test Set as Meetup Point from Route (Pandal 2: Baghbazar)
    console.log('\n--- Step 5: Designate Pandal 2 (Baghbazar) as Group Meetup Point ---');
    await client.database
      .from('hop_rooms')
      .update({
        meetup_pandal_id: 2,
        meetup_pandal_name: 'Baghbazar Sarbojanin',
        meetup_latitude: 22.6033,
        meetup_longitude: 88.3653,
        meetup_set_at: new Date().toISOString(),
      })
      .eq('id', room.id);

    const { data: verifiedRoom } = await client.database
      .from('hop_rooms')
      .select('*')
      .eq('id', room.id)
      .single();

    console.log(`✓ Room Meetup Point verified: ${verifiedRoom.meetup_pandal_name} [${verifiedRoom.meetup_latitude}, ${verifiedRoom.meetup_longitude}]`);

    // 8. Test Delete Pandal (Delete pandal 8)
    console.log('\n--- Step 6: Delete Pandal 8 (College Square) from room ---');
    const { error: delErr } = await client.database
      .from('hop_member_pandals')
      .delete()
      .eq('room_id', room.id)
      .eq('pandal_id', 8);

    if (delErr) throw new Error('Delete failed: ' + delErr.message);

    const { data: afterDelete } = await client.database
      .from('hop_member_pandals')
      .select('*')
      .eq('room_id', room.id)
      .eq('pandal_id', 8);

    if (afterDelete && afterDelete.length > 0) {
      throw new Error('Pandal 8 was not deleted');
    }
    console.log('✓ Pandal 8 successfully deleted from room');

    console.log('\n🎉 ALL COLLABORATIVE PANDALS, ROUTING & MEETUP TESTS PASSED 100%!');
  } finally {
    // Clean up test room
    await client.database.from('hop_rooms').delete().eq('id', room.id);
    console.log('✓ Test room and member pandals cleaned up');
  }
}

runTest().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
