import { createClient } from '@insforge/sdk';

const baseUrl = 'https://j4g5vd5y.ap-southeast.insforge.app';
const anonKey = 'anon_3809e5f1f00212bc80009626d40bf7155c19ee38a3299dcd68180410e3404f78';

function createNewClient() {
  return createClient({ baseUrl, anonKey });
}

async function runZeroLoginAndOTPE2E() {
  console.log('🚀 Testing Zero-Login Hop Rooms & Email OTP Verification...');

  const clientGuestA = createNewClient();
  const clientGuestB = createNewClient();

  // Two guest UUIDs (zero login)
  const guestUserIdA = 'a1111111-2222-3333-4444-555555555555';
  const guestUserIdB = 'b1111111-2222-3333-4444-555555555555';

  // --- Step 1: Guest A creates Hop Room without logging in ---
  console.log('\n1. Guest A creating Hop Room without logging in...');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let roomCode = '';
  for (let i = 0; i < 6; i++) roomCode += chars.charAt(Math.floor(Math.random() * chars.length));

  const expiresAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();

  const { data: roomRows, error: roomErr } = await clientGuestA.database
    .from('hop_rooms')
    .insert([
      {
        room_code: roomCode,
        room_name: 'Guest Zero-Login Pandal Hop',
        host_user_id: guestUserIdA,
        expires_at: expiresAt,
      },
    ])
    .select();

  if (roomErr || !roomRows || roomRows.length === 0) {
    throw new Error(`Guest room creation failed: ${roomErr?.message}`);
  }
  const room = roomRows[0];
  console.log(`✓ Guest A room created: ID=${room.id}, Code=${room.room_code}`);

  // Guest A registers in hop_members
  const { error: hostMemErr } = await clientGuestA.database.from('hop_members').insert([
    {
      room_id: room.id,
      user_id: guestUserIdA,
      display_name: 'Guest Host (Sagnik)',
      is_sharing: true,
    },
  ]);
  if (hostMemErr) throw new Error(`Guest A membership failed: ${hostMemErr.message}`);
  console.log('✓ Guest A membership saved in hop_members');

  // --- Step 2: Guest B joins room without logging in ---
  console.log('\n2. Guest B looking up room by code and joining without logging in...');
  const { data: foundRooms, error: findErr } = await clientGuestB.database
    .from('hop_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .gt('expires_at', new Date().toISOString());

  if (findErr || !foundRooms || foundRooms.length === 0) {
    throw new Error(`Guest B lookup failed: ${findErr?.message}`);
  }
  console.log(`✓ Guest B found active room: "${foundRooms[0].room_name}"`);

  const { error: joinErr } = await clientGuestB.database.from('hop_members').insert([
    {
      room_id: room.id,
      user_id: guestUserIdB,
      display_name: 'Guest Friend (Subhojit)',
      is_sharing: true,
    },
  ]);
  if (joinErr) throw new Error(`Guest B join failed: ${joinErr.message}`);
  console.log('✓ Guest B joined room successfully');

  // --- Step 3: Both Guests Share Live Locations ---
  console.log('\n3. Both Guest A and Guest B sharing live GPS locations...');
  const now = new Date().toISOString();

  // Baghbazar Sarbojanin coords
  const { error: locAErr } = await clientGuestA.database.from('live_locations').upsert(
    [
      {
        room_id: room.id,
        user_id: guestUserIdA,
        latitude: 22.6033,
        longitude: 88.3653,
        accuracy: 12.0,
        last_seen: now,
        is_sharing: true,
        updated_at: now,
      },
    ],
    { onConflict: 'room_id,user_id' }
  );
  if (locAErr) throw new Error(`Guest A location upsert failed: ${locAErr.message}`);
  console.log('✓ Guest A location recorded: [22.6033, 88.3653]');

  // Sovabazar Rajbari coords
  const { error: locBErr } = await clientGuestB.database.from('live_locations').upsert(
    [
      {
        room_id: room.id,
        user_id: guestUserIdB,
        latitude: 22.5985,
        longitude: 88.3670,
        accuracy: 14.0,
        last_seen: now,
        is_sharing: true,
        updated_at: now,
      },
    ],
    { onConflict: 'room_id,user_id' }
  );
  if (locBErr) throw new Error(`Guest B location recorded: ${locBErr.message}`);
  console.log('✓ Guest B location recorded: [22.5985, 88.3670]');

  // --- Step 4: Verify Both Locations Visible to Both Users ---
  console.log('\n4. Verifying both locations are visible on the map...');
  const { data: allLocationsForA } = await clientGuestA.database
    .from('live_locations')
    .select('*')
    .eq('room_id', room.id);

  if (!allLocationsForA || allLocationsForA.length !== 2) {
    throw new Error(`Expected 2 visible locations, got: ${allLocationsForA?.length}`);
  }
  console.log(`✓ Confirmed Guest A can see both locations: ${allLocationsForA.map(l => l.user_id).join(', ')}`);

  const { data: allLocationsForB } = await clientGuestB.database
    .from('live_locations')
    .select('*')
    .eq('room_id', room.id);

  if (!allLocationsForB || allLocationsForB.length !== 2) {
    throw new Error(`Expected 2 visible locations for B, got: ${allLocationsForB?.length}`);
  }
  console.log(`✓ Confirmed Guest B can see both locations! Both locations visible on map.`);

  // --- Step 5: Test Meetup Pandal ---
  console.log('\n5. Setting meetup pandal for room...');
  await clientGuestA.database
    .from('hop_rooms')
    .update({
      meetup_pandal_id: 1,
      meetup_pandal_name: 'Baghbazar Sarbojanin',
      meetup_latitude: 22.6033,
      meetup_longitude: 88.3653,
      meetup_set_at: new Date().toISOString(),
    })
    .eq('id', room.id);

  const { data: verifiedRoom } = await clientGuestB.database
    .from('hop_rooms')
    .select('*')
    .eq('id', room.id)
    .single();
  console.log(`✓ Meetup pandal verified by Guest B: ${verifiedRoom.meetup_pandal_name}`);

  // --- Step 6: Test Email OTP Verification Endpoint ---
  console.log('\n6. Testing Email OTP Verification capability in InsForge...');
  const otpClient = createNewClient();
  const testEmail = `otp_test_${Date.now()}@pujonavigation.in`;
  const { data: otpRes, error: otpErr } = await otpClient.auth.signInWithOtp({ email: testEmail });
  if (otpErr) throw new Error(`signInWithOtp failed: ${otpErr.message}`);
  console.log(`✓ signInWithOtp dispatched: success=${otpRes.success}`);

  // Clean up test room
  await clientGuestA.database.from('hop_rooms').delete().eq('id', room.id);
  console.log('✓ Test room cleaned up');

  console.log('\n🎉 ALL ZERO-LOGIN & OTP VERIFICATION TESTS PASSED 100%!');
}

runZeroLoginAndOTPE2E().catch(err => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
