'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { useToast } from '../../../../lib/toast-context';
import {
  getHopRoom,
  getRoomMembers,
  getLatestLocations,
  joinHopRoom,
  setLocationSharing,
  setMeetupPandal,
  clearMeetupPandal,
  leaveHopRoom,
  HopRoom,
  HopMember,
  LiveLocation,
} from '../../../../lib/hop-room';
import { getOrSetHopUserId, getHopDisplayName, setHopDisplayName } from '../../../../lib/guest-id';
import { RealtimeLocationManager } from '../../../../lib/realtime-location';
import { Pandal } from '../../../../lib/types';
import HopMap from '../../../../components/HopMap';
import HopMemberList from '../../../../components/HopMemberList';
import HopRoomQRCode from '../../../../components/HopRoomQRCode';

export default function HopRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [room, setRoom] = useState<HopRoom | null>(null);
  const [members, setMembers] = useState<HopMember[]>([]);
  const [locations, setLocations] = useState<Record<string, LiveLocation>>({});
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sharing & Realtime state
  const [isSharing, setIsSharing] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'members'>('map');
  const [isMobile, setIsMobile] = useState(false);

  const locationManagerRef = useRef<RealtimeLocationManager | null>(null);

  // Detect Mobile Viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Initialize persistent User ID (guest or auth)
  useEffect(() => {
    const uid = getOrSetHopUserId(user?.id);
    setCurrentUserId(uid);
  }, [user]);

  // 2. Initial Load of Room Data
  const loadRoomData = useCallback(async () => {
    if (!roomId) return;
    try {
      const { room: fetchedRoom, isExpired: expired, error: roomError } = await getHopRoom(roomId);
      if (roomError || !fetchedRoom) {
        showToast(roomError || 'Room not found', 'error');
        setRoom(null);
        return;
      }

      setRoom(fetchedRoom);
      setIsExpired(expired);

      if (!expired) {
        const [{ members: fetchedMembers }, { locations: fetchedLocations }] = await Promise.all([
          getRoomMembers(roomId),
          getLatestLocations(roomId),
        ]);

        const uid = getOrSetHopUserId(user?.id);

        // Check if current user is already in members; if not, auto-register them!
        const existingSelf = fetchedMembers.find(m => m.user_id === uid);
        if (!existingSelf) {
          const fallbackName = user?.name || getHopDisplayName() || 'Pujo Hopper';
          const { member: newMem } = await joinHopRoom({
            roomId,
            displayName: fallbackName,
            userId: uid,
          });
          if (newMem) {
            fetchedMembers.push(newMem);
          }
        } else {
          setIsSharing(existingSelf.is_sharing);
        }

        setMembers(fetchedMembers);
        setLocations(fetchedLocations);
      }
    } finally {
      setLoading(false);
    }
  }, [roomId, user, showToast]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // 3. Periodic Background Sync (Polls every 8s so both users stay 100% synchronized)
  useEffect(() => {
    if (!room || isExpired) return;

    const pollInterval = setInterval(async () => {
      try {
        const [{ members: polledMembers }, { locations: polledLocations }] = await Promise.all([
          getRoomMembers(roomId),
          getLatestLocations(roomId),
        ]);
        if (polledMembers && polledMembers.length > 0) {
          setMembers(polledMembers);
        }
        if (polledLocations) {
          setLocations(prev => ({
            ...prev,
            ...polledLocations,
          }));
        }
      } catch {
        // Ignore network hiccups during background sync
      }
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [room?.id, isExpired, roomId]);

  // 4. Realtime Location Manager Lifecycle (WebSockets + Geolocation)
  useEffect(() => {
    if (!room || isExpired || !currentUserId) return;

    const manager = new RealtimeLocationManager(room.id, currentUserId, {
      onLocationUpdate: (newLoc: LiveLocation) => {
        setLocations(prev => ({
          ...prev,
          [newLoc.user_id]: newLoc,
        }));
      },
      onMemberJoined: (newMember: HopMember) => {
        setMembers(prev => {
          if (prev.some(m => m.user_id === newMember.user_id)) {
            return prev.map(m => (m.user_id === newMember.user_id ? newMember : m));
          }
          return [...prev, newMember];
        });
        showToast(`${newMember.display_name} is in the room!`, 'info');
      },
      onSharingChanged: ({ userId, isSharing: sharingState }) => {
        setMembers(prev =>
          prev.map(m => (m.user_id === userId ? { ...m, is_sharing: sharingState } : m))
        );
        setLocations(prev => {
          if (prev[userId]) {
            return {
              ...prev,
              [userId]: { ...prev[userId], is_sharing: sharingState },
            };
          }
          return prev;
        });
      },
      onMeetupChanged: meetup => {
        setRoom(prev => (prev ? { ...prev, ...meetup } : null));
        if (meetup.pandalName) {
          showToast(`Meetup set to ${meetup.pandalName}!`, 'info');
        } else {
          showToast('Meetup cleared.', 'info');
        }
      },
      onConnectionChange: connected => {
        setIsConnected(connected);
      },
      onError: errMsg => {
        showToast(errMsg, 'warning');
      },
    });

    locationManagerRef.current = manager;
    manager.start();

    return () => {
      manager.stop();
      locationManagerRef.current = null;
    };
  }, [room?.id, isExpired, currentUserId, showToast]);

  // Expiration check timer
  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      const expired = new Date(room.expires_at).getTime() <= Date.now();
      if (expired && !isExpired) {
        setIsExpired(true);
        locationManagerRef.current?.stop();
        showToast('This Hop Room has expired.', 'warning');
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [room, isExpired, showToast]);

  // Toggle Sharing
  const handleToggleSharing = async () => {
    if (!room || !currentUserId) return;
    const nextState = !isSharing;
    setIsSharing(nextState);

    await setLocationSharing({ roomId: room.id, isSharing: nextState, userId: currentUserId });
    await locationManagerRef.current?.setSharing(nextState);

    showToast(nextState ? 'Location sharing resumed' : 'Location sharing paused', 'info');
  };

  // Set Meetup Pandal
  const handleSetMeetup = async (pandal: Pandal) => {
    if (!room) return;
    const meetupData = {
      pandalId: pandal.id,
      pandalName: pandal.name,
      latitude: pandal.latitude,
      longitude: pandal.longitude,
    };

    const { error } = await setMeetupPandal({
      roomId: room.id,
      ...meetupData,
    });

    if (error) {
      showToast('Failed to set meetup point', 'error');
    } else {
      setRoom(prev => (prev ? { ...prev, ...meetupData } : null));
      locationManagerRef.current?.broadcastMeetup(meetupData);
      showToast(`Meetup point set to ${pandal.name}!`, 'success');
    }
  };

  // Clear Meetup Pandal
  const handleClearMeetup = async () => {
    if (!room) return;
    await clearMeetupPandal(room.id);
    const clearData = {
      pandalId: null,
      pandalName: null,
      latitude: null,
      longitude: null,
    };
    setRoom(prev => (prev ? { ...prev, ...clearData } : null));
    locationManagerRef.current?.broadcastMeetup(clearData);
    showToast('Meetup cleared', 'info');
  };

  // Leave Room
  const handleLeaveRoom = async () => {
    if (!room) return;
    const confirm = window.confirm('Are you sure you want to leave this Hop Room?');
    if (!confirm) return;

    locationManagerRef.current?.stop();
    await leaveHopRoom(room.id, currentUserId);
    showToast('You have left the room', 'info');
    router.push('/hop');
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--taupe)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📡</div>
          <div>Loading live Hop Room...</div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#FFFDF9', border: '1px solid var(--border)', borderRadius: '12px', padding: '36px', textAlign: 'center', maxWidth: '420px' }}>
          <h2>Room Not Found</h2>
          <p style={{ color: 'var(--taupe)', fontSize: '13px' }}>This room does not exist or was closed.</p>
          <button type="button" onClick={() => router.push('/hop')} style={{ marginTop: '16px', padding: '10px 20px', background: 'var(--vermilion)', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
            Back to Hop Hub
          </button>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#FFFDF9', border: '1.5px solid var(--border-gold)', borderRadius: '12px', padding: '36px', textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: '0 0 8px' }}>This Hop Room has expired</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', margin: '0 0 20px' }}>
            All location sharing for "{room.room_name}" has ended. Rooms automatically expire to protect your privacy.
          </p>
          <button
            type="button"
            onClick={() => router.push('/hop')}
            style={{
              padding: '10px 24px',
              background: 'var(--gold-gradient)',
              color: '#17120F',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Create New Room
          </button>
        </div>
      </div>
    );
  }

  // Calculate remaining time
  const msLeft = Math.max(0, new Date(room.expires_at).getTime() - Date.now());
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="hop-room-wrapper">
      {/* Top Header Bar */}
      <div
        style={{
          background: '#FFFDF9',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '8px 14px' : '12px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          {/* Room Title & Code */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: isMobile ? '1.05rem' : '1.25rem', fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--foreground)' }}>
                {room.room_name}
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: isConnected ? 'rgba(47, 125, 74, 0.1)' : 'rgba(217, 154, 37, 0.1)',
                  color: isConnected ? '#2F7D4A' : '#D99A25',
                  fontWeight: 700,
                }}
              >
                {isConnected ? '● Live' : '○ Syncing'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Code: <strong style={{ letterSpacing: '1px', color: 'var(--vermilion)' }}>{room.room_code}</strong></span>
              <span>•</span>
              <span>Expires {hoursLeft}h {minsLeft}m</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Sharing Toggle */}
            <button
              type="button"
              onClick={handleToggleSharing}
              style={{
                padding: isMobile ? '6px 10px' : '7px 12px',
                borderRadius: '6px',
                border: isSharing ? '1px solid #2F7D4A' : '1px solid var(--border)',
                background: isSharing ? 'var(--success-bg)' : '#FFF',
                color: isSharing ? '#2F7D4A' : 'var(--taupe)',
                fontWeight: 700,
                fontSize: isMobile ? '11px' : '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{isSharing ? '●' : '○'}</span>
              <span>{isSharing ? (isMobile ? 'Sharing' : 'Stop Sharing') : 'Share GPS'}</span>
            </button>

            {/* QR Code Modal Button */}
            <button
              type="button"
              onClick={() => setShowQR(true)}
              style={{
                padding: isMobile ? '6px 10px' : '7px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--gold-gradient)',
                color: '#17120F',
                fontWeight: 700,
                fontSize: isMobile ? '11px' : '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              <span>📲</span>
              <span>Invite</span>
            </button>

            {/* Leave Room Button */}
            <button
              type="button"
              onClick={handleLeaveRoom}
              style={{
                padding: isMobile ? '6px 8px' : '7px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--taupe)',
                fontWeight: 600,
                fontSize: isMobile ? '11px' : '12px',
                cursor: 'pointer',
              }}
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="hop-mobile-tabs">
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '6px',
            border: mobileTab === 'map' ? '1.5px solid var(--border-gold)' : '1px solid transparent',
            background: mobileTab === 'map' ? '#FFF' : 'transparent',
            fontWeight: 700,
            fontSize: '12px',
            color: mobileTab === 'map' ? 'var(--foreground)' : 'var(--taupe)',
            cursor: 'pointer',
            boxShadow: mobileTab === 'map' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          🗺️ Live Map
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('members')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '6px',
            border: mobileTab === 'members' ? '1.5px solid var(--border-gold)' : '1px solid transparent',
            background: mobileTab === 'members' ? '#FFF' : 'transparent',
            fontWeight: 700,
            fontSize: '12px',
            color: mobileTab === 'members' ? 'var(--foreground)' : 'var(--taupe)',
            cursor: 'pointer',
            boxShadow: mobileTab === 'members' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          👥 Members ({members.length})
        </button>
      </div>

      {/* Main Workspace: Split View */}
      <div className="hop-workspace">
        {/* Map Column */}
        <div
          className="hop-map-col"
          style={{
            display: isMobile ? (mobileTab === 'map' ? 'block' : 'none') : 'block',
          }}
        >
          <HopMap
            members={members}
            locations={locations}
            currentUserId={currentUserId}
            meetup={{
              pandalId: room.meetup_pandal_id,
              pandalName: room.meetup_pandal_name,
              latitude: room.meetup_latitude,
              longitude: room.meetup_longitude,
            }}
            selectedMemberId={selectedMemberId}
            onSelectMember={m => setSelectedMemberId(m.user_id)}
            height="100%"
            active={!isMobile || mobileTab === 'map'}
          />
        </div>

        {/* Members & Meetup Sidebar Column */}
        <div
          className="hop-sidebar-col"
          style={{
            display: isMobile ? (mobileTab === 'members' ? 'block' : 'none') : 'block',
          }}
        >
          <HopMemberList
            members={members}
            locations={locations}
            currentUserId={currentUserId}
            hostUserId={room.host_user_id}
            meetup={{
              pandalId: room.meetup_pandal_id,
              pandalName: room.meetup_pandal_name,
              latitude: room.meetup_latitude,
              longitude: room.meetup_longitude,
            }}
            selectedMemberId={selectedMemberId}
            onSelectMember={m => {
              setSelectedMemberId(m.user_id);
              if (isMobile) {
                setMobileTab('map');
              }
            }}
            onSetMeetup={handleSetMeetup}
            onClearMeetup={handleClearMeetup}
          />
        </div>
      </div>

      {/* QR Code Invitation Modal */}
      <HopRoomQRCode
        roomCode={room.room_code}
        roomName={room.room_name}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </div>
  );
}
