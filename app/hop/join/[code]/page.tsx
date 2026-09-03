'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { useToast } from '../../../../lib/toast-context';
import { getHopRoomByCode, joinHopRoom, HopRoom } from '../../../../lib/hop-room';
import { getOrSetHopUserId, getHopDisplayName, setHopDisplayName } from '../../../../lib/guest-id';

export default function JoinRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [room, setRoom] = useState<HopRoom | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) return;
    async function fetchRoom() {
      setLoading(true);
      try {
        const { room: fetchedRoom, isExpired: expired, error } = await getHopRoomByCode(code);
        if (error || !fetchedRoom) {
          setRoom(null);
        } else {
          setRoom(fetchedRoom);
          setIsExpired(expired);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [code]);

  useEffect(() => {
    const initialName = user?.name || getHopDisplayName();
    if (initialName && !displayName) {
      setDisplayName(initialName);
    }
  }, [user]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    if (!displayName.trim()) {
      showToast('Please enter your display name', 'warning');
      return;
    }

    setJoining(true);
    try {
      const userId = getOrSetHopUserId(user?.id);
      setHopDisplayName(displayName.trim());

      const { member, error } = await joinHopRoom({
        roomId: room.id,
        displayName: displayName.trim(),
        userId,
      });

      if (error || !member) {
        showToast(error || 'Failed to join room', 'error');
      } else {
        showToast(`Joined ${room.room_name}!`, 'success');
        router.push(`/hop/room/${room.id}`);
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--taupe)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📡</div>
          <div>Checking room invitation...</div>
        </div>
      </div>
    );
  }

  // Error: Room not found
  if (!room) {
    return (
      <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#FFFDF9', border: '1px solid var(--border)', borderRadius: '12px', padding: '36px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: '0 0 8px' }}>Room Not Found</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', margin: '0 0 20px' }}>
            No active room was found matching code <strong style={{ letterSpacing: '1px' }}>{code}</strong>. Please check the code or ask the host for a new invite.
          </p>
          <button
            type="button"
            onClick={() => router.push('/hop')}
            style={{
              padding: '10px 20px',
              background: 'var(--vermilion-gradient)',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Go to Hop Hub
          </button>
        </div>
      </div>
    );
  }

  // Error: Room expired
  if (isExpired) {
    return (
      <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#FFFDF9', border: '1.5px solid var(--border-gold)', borderRadius: '12px', padding: '36px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: '0 0 8px' }}>This Hop Room has expired</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', margin: '0 0 20px' }}>
            Room "{room.room_name}" has expired. To protect user privacy, rooms and live location records automatically expire after their scheduled window.
          </p>
          <button
            type="button"
            onClick={() => router.push('/hop')}
            style={{
              padding: '10px 20px',
              background: 'var(--gold-gradient)',
              color: '#17120F',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Create a New Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div
        style={{
          background: '#FFFDF9',
          border: '1.5px solid var(--border-gold)',
          borderRadius: '12px',
          padding: '36px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 16px 40px rgba(23,18,15,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--warm-cream)',
              border: '1px solid var(--border-gold)',
              padding: '3px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--antique-gold)',
              marginBottom: '12px',
            }}
          >
            <span>✨</span> Hop Room Invitation
          </div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', margin: '0 0 6px', color: 'var(--foreground)' }}>
            {room.room_name}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', margin: 0 }}>
            Room Code: <strong style={{ letterSpacing: '2px', color: 'var(--vermilion)' }}>{room.room_code}</strong>
          </p>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Your Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                background: '#FFF',
              }}
              autoFocus
            />
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--taupe)', marginTop: '6px' }}>
              This is how your friends will see you on the live map. No login required.
            </span>
          </div>

          <div style={{ background: 'var(--warm-cream)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--taupe)' }}>
            🔒 <strong>Live Location:</strong> When you join, your browser will ask for location permission so you and your friends can see each other on the live map.
          </div>

          <button
            type="submit"
            disabled={joining}
            style={{
              padding: '13px',
              background: 'var(--vermilion-gradient)',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: joining ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {joining ? 'Joining Room...' : 'Join Room & Share Location'}
          </button>
        </form>
      </div>
    </div>
  );
}
