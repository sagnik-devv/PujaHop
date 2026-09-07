'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../lib/toast-context';
import { createHopRoom, getUserActiveRooms, HopRoom } from '../../lib/hop-room';
import { getOrSetHopUserId, getHopDisplayName, setHopDisplayName } from '../../lib/guest-id';
import { useLanguage } from '../../lib/language-context';

export default function HopHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  // Create Room State
  const [roomName, setRoomName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [durationHours, setDurationHours] = useState(8);
  const [creating, setCreating] = useState(false);

  // Join Code State
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Active Rooms State
  const [activeRooms, setActiveRooms] = useState<HopRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    // Prefill display name from auth user or saved guest name
    const initialName = user?.name || getHopDisplayName();
    if (initialName && !displayName) {
      setDisplayName(initialName);
    }
    loadRooms();
  }, [user]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const userId = getOrSetHopUserId(user?.id);
      const { rooms, error } = await getUserActiveRooms(userId);
      if (!error) {
        setActiveRooms(rooms);
      }
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      showToast(language === 'bn' ? 'দয়া করে একটি রুমের নাম দিন' : 'Please enter a room name', 'warning');
      return;
    }
    if (!displayName.trim()) {
      showToast(language === 'bn' ? 'দয়া করে আপনার নাম দিন' : 'Please enter your name', 'warning');
      return;
    }

    setCreating(true);
    try {
      const userId = getOrSetHopUserId(user?.id);
      setHopDisplayName(displayName.trim());

      const { room, error } = await createHopRoom({
        roomName: roomName.trim(),
        displayName: displayName.trim(),
        durationHours,
        userId,
      });

      if (error || !room) {
        showToast(error || (language === 'bn' ? 'রুম তৈরি করা সম্ভব হয়নি' : 'Failed to create room'), 'error');
      } else {
        showToast(language === 'bn' ? `"${room.room_name}" রুম তৈরি হয়েছে!` : `Room "${room.room_name}" created!`, 'success');
        router.push(`/hop/room/${room.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) {
      showToast(language === 'bn' ? 'দয়া করে ৬-সংখ্যার রুম কোড দিন' : 'Please enter a 6-character room code', 'warning');
      return;
    }
    setJoining(true);
    router.push(`/hop/join/${clean}`);
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        {/* Hub Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--warm-cream)',
              border: '1px solid var(--border-gold)',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--antique-gold)',
              marginBottom: '12px',
            }}
          >
            <span>📡</span> {language === 'bn' ? 'লাইভ গ্রুপ লোকেশন শেয়ারিং • লগইন বাধ্যতামূলক নয়' : 'Live Group Location Sharing • No Login Required'}
          </div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', margin: '0 0 10px', color: 'var(--foreground)' }}>
            {t('hop_room')}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--taupe)', maxWidth: '620px', margin: '0 auto' }}>
            {t('hop_room_tagline')}
          </p>

          {/* User Status / Optional Login Notice */}
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--taupe)' }}>
            {user ? (
              <span>
                {language === 'bn' ? `লগইন করেছেন ${user.name || user.email} হিসেবে • সব ডিভাইসে রুম সিঙ্ক হচ্ছে` : `Logged in as ${user.name || user.email} • Your rooms sync across devices`}
              </span>
            ) : (
              <span>
                {language === 'bn' ? 'গেস্ট হিসেবে পরিক্রমা করছেন। ' : 'Hopping as guest. '}
                <a href="/login" style={{ color: 'var(--vermilion)', fontWeight: 700, textDecoration: 'underline' }}>
                  {language === 'bn' ? 'ইমেল ওটিপি দিয়ে সাইন ইন করুন' : 'Sign in with Email OTP'}
                </a>
              </span>
            )}
          </div>
        </div>

        {/* Action Grid: Create Room & Join Room */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Create Room Card */}
          <div
            style={{
              background: '#FFFDF9',
              border: '1.5px solid var(--border-gold)',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 12px 32px rgba(23,18,15,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>{t('create_new_room')}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--taupe)', margin: 0 }}>{language === 'bn' ? 'তাৎক্ষণিক রুম তৈরি করুন' : 'Instant temporary room — zero login required'}</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  {language === 'bn' ? 'রুমের নাম' : 'Room Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: উত্তর কলকাতার পুজো গ্যাং' : 'e.g. Baghbazar & North Puja Gang'}
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  {language === 'bn' ? 'আপনার নাম' : 'Your Display Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sagnik"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  {language === 'bn' ? 'রুমের মেয়াদ' : 'Room Expiration Duration'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[4, 8, 12, 24].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: durationHours === hours ? '1.5px solid var(--vermilion)' : '1px solid var(--border)',
                        background: durationHours === hours ? 'var(--warm-cream)' : '#FFF',
                        color: durationHours === hours ? 'var(--vermilion)' : 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {hours}{language === 'bn' ? 'ঘণ্টা' : 'h'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                style={{
                  marginTop: '10px',
                  padding: '13px',
                  background: 'var(--vermilion-gradient)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {creating ? (language === 'bn' ? 'রুম তৈরি হচ্ছে...' : 'Creating Room...') : (language === 'bn' ? 'হপ রুম তৈরি ও কিউআর পান' : 'Create Hop Room & Get QR')}
              </button>
            </form>
          </div>

          {/* Join with Code & Active Rooms Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Join with Code */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>
                {t('join_existing_room')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--taupe)', margin: '0 0 14px' }}>
                {t('enter_room_code')}
              </p>

              <form onSubmit={handleJoinWithCode} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="e.g. PJ8K4X"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    background: '#FFF',
                  }}
                />
                <button
                  type="submit"
                  disabled={joining}
                  style={{
                    padding: '11px 20px',
                    background: 'var(--gold-gradient)',
                    color: '#17120F',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {language === 'bn' ? 'রুমে যোগ দিন' : 'Join Room'}
                </button>
              </form>
            </div>

            {/* Active Rooms */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                flex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {language === 'bn' ? 'আপনার সক্রিয় হপ রুমসমূহ' : 'Your Active Hop Rooms'}
                </h3>
                <button
                  type="button"
                  onClick={loadRooms}
                  style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--antique-gold)', cursor: 'pointer', fontWeight: 600 }}
                >
                  {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                </button>
              </div>

              {loadingRooms ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
                  {language === 'bn' ? 'রুমগুলো লোড হচ্ছে...' : 'Loading active rooms...'}
                </div>
              ) : activeRooms.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
                  {language === 'bn' ? 'কোনো সক্রিয় রুম নেই। নতুন রুম তৈরি করুন বা কোড লিখুন!' : 'No active rooms yet. Create a room above or enter a code to join one!'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeRooms.map(r => {
                    const expiresDate = new Date(r.expires_at);
                    const hoursLeft = Math.max(0, Math.round((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60)));

                    return (
                      <div
                        key={r.id}
                        onClick={() => router.push(`/hop/room/${r.id}`)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-gold)',
                          background: '#FFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                            {r.room_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '2px' }}>
                            {language === 'bn' ? 'কোড: ' : 'Code: '}<strong style={{ letterSpacing: '1px' }}>{r.room_code}</strong> • {language === 'bn' ? `বাকি ~${hoursLeft} ঘণ্টা` : `Expires in ~${hoursLeft}h`}
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--vermilion)' }}>
                          {language === 'bn' ? 'রুম খুলুন →' : 'Open Room →'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
