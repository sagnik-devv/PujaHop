'use client';

import React, { useState } from 'react';
import { HopMember, LiveLocation } from '../lib/hop-room';
import { calculateDistance, findNearbyPandals } from '../lib/geo';
import { GENERATED_PANDALS } from '../lib/generated-pujas';
import { openGoogleMapsDirections } from './HopMap';
import { Pandal } from '../lib/types';
import { useToast } from '../lib/toast-context';
import { IconMapPin, IconRoute, IconSearch, IconSparkles } from './Icons';

interface HopMemberListProps {
  members: HopMember[];
  locations: Record<string, LiveLocation>;
  currentUserId?: string;
  hostUserId?: string;
  meetup?: {
    pandalId?: number | null;
    pandalName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  selectedMemberId?: string | null;
  onSelectMember?: (member: HopMember) => void;
  onNavigateToMember?: (member: HopMember, loc: LiveLocation) => void;
  onSetMeetup?: (pandal: Pandal) => void;
  onClearMeetup?: () => void;
}

function formatRelativeLastSeen(isoDateString?: string): string {
  if (!isoDateString) return 'Location unavailable';
  const time = new Date(isoDateString).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));

  if (diffSec < 20) return 'Online';
  if (diffSec < 60) return `Last seen ${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `Last seen ${diffHours}h ago`;
}

export default function HopMemberList({
  members,
  locations,
  currentUserId,
  hostUserId,
  meetup,
  selectedMemberId,
  onSelectMember,
  onNavigateToMember,
  onSetMeetup,
  onClearMeetup,
}: HopMemberListProps) {
  const { showToast } = useToast();
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [pandalSearch, setPandalSearch] = useState('');

  const selfLoc = currentUserId ? locations[currentUserId] : null;

  // Filtered pandals for meetup picker
  const filteredPandals = pandalSearch.trim()
    ? GENERATED_PANDALS.filter(
        p =>
          p.name.toLowerCase().includes(pandalSearch.toLowerCase()) ||
          p.region.toLowerCase().includes(pandalSearch.toLowerCase())
      ).slice(0, 15)
    : GENERATED_PANDALS.slice(0, 15);

  const otherMembers = members.filter(m => m.user_id !== currentUserId);
  const selfMember = members.find(m => m.user_id === currentUserId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Meetup Banner / Set Meetup */}
      <div
        style={{
          background: meetup?.pandalName ? '#FFFDF9' : 'var(--warm-cream)',
          border: '1.5px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🪷</span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--antique-gold)' }}>
              Group Meetup Point
            </span>
          </div>
          {meetup?.pandalName && onClearMeetup && (
            <button
              type="button"
              onClick={onClearMeetup}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--taupe)',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {meetup?.pandalName ? (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
              {meetup.pandalName}
            </div>
            {selfLoc && meetup.latitude && meetup.longitude && (
              <div style={{ fontSize: '12px', color: 'var(--taupe)', marginBottom: '10px' }}>
                📍 {(calculateDistance(selfLoc.latitude, selfLoc.longitude, meetup.latitude, meetup.longitude) * 1000).toFixed(0)}m from your current position
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              {meetup.latitude && meetup.longitude && (
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Opening Google Maps directions to ${meetup.pandalName}...`, 'info');
                    openGoogleMapsDirections(meetup.latitude!, meetup.longitude!, selfLoc?.latitude, selfLoc?.longitude);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <IconRoute size={13} />
                  Directions
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMeetupModal(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--antique-gold)',
                }}
              >
                Change Meetup
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '12px', color: 'var(--taupe)' }}>
              Pick a pandal for everyone to gather at.
            </div>
            <button
              type="button"
              onClick={() => setShowMeetupModal(true)}
              style={{
                background: 'var(--gold-gradient)',
                color: '#17120F',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              Set Meetup Pandal
            </button>
          </div>
        )}
      </div>

      {/* Member List Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
            Hop Members ({members.length})
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--taupe)' }}>
            Realtime GPS sharing
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Current User Card */}
          {selfMember && (
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #155799',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#155799',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {selfMember.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{selfMember.display_name}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(21, 87, 153, 0.1)', color: '#155799', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                      YOU
                    </span>
                    {selfMember.user_id === hostUserId && (
                      <span style={{ fontSize: '10px', background: 'var(--warm-cream)', color: 'var(--antique-gold)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                        HOST
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: selfMember.is_sharing ? '#2F7D4A' : '#756D65', marginTop: '2px' }}>
                    {selfMember.is_sharing ? '● Sharing your real location' : '○ Location sharing paused'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Members */}
          {otherMembers.length === 0 ? (
            <div
              style={{
                background: 'var(--warm-cream)',
                borderRadius: '8px',
                padding: '24px 16px',
                textAlign: 'center',
                border: '1px dashed var(--border-gold)',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                No other members have joined yet.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--taupe)', marginTop: '4px' }}>
                Share your room QR code or invite link with friends to hop together!
              </div>
            </div>
          ) : (
            otherMembers.map(member => {
              const loc = locations[member.user_id];
              const isSharing = member.is_sharing && loc?.is_sharing;
              const isSelected = selectedMemberId === member.user_id;

              // Distance calculation
              const distM =
                isSharing && selfLoc && selfLoc.is_sharing && loc
                  ? calculateDistance(selfLoc.latitude, selfLoc.longitude, loc.latitude, loc.longitude) * 1000
                  : null;

              // Nearest Pandal
              const nearbyPandal =
                isSharing && loc
                  ? findNearbyPandals(loc.latitude, loc.longitude, GENERATED_PANDALS, 0.4, 1)[0]
                  : null;

              return (
                <div
                  key={member.id}
                  onClick={() => onSelectMember?.(member)}
                  style={{
                    background: isSelected ? 'var(--warm-cream)' : '#FFFDF9',
                    border: isSelected ? '1.5px solid var(--vermilion)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isSharing ? 'var(--vermilion)' : 'var(--taupe)',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{member.display_name}</span>
                        {member.user_id === hostUserId && (
                          <span style={{ fontSize: '10px', background: 'var(--warm-cream)', color: 'var(--antique-gold)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                            HOST
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '2px' }}>
                        {isSharing ? (
                          <>
                            <span style={{ color: '#2F7D4A', fontWeight: 600 }}>
                              {formatRelativeLastSeen(loc?.last_seen)}
                            </span>
                            {distM !== null && (
                              <span> • <strong>{distM < 1000 ? `${Math.round(distM)}m` : `${(distM / 1000).toFixed(1)} km`} away</strong></span>
                            )}
                            {nearbyPandal && (
                              <div style={{ color: 'var(--antique-gold)', fontWeight: 600, marginTop: '2px' }}>
                                🪷 Near {nearbyPandal.name}
                              </div>
                            )}
                          </>
                        ) : (
                          <span>Location sharing paused</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSharing && loc && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        const selfLoc = currentUserId ? locations[currentUserId] : null;
                        showToast(`Opening Google Maps directions to ${member.display_name}...`, 'info');
                        openGoogleMapsDirections(loc.latitude, loc.longitude, selfLoc?.latitude, selfLoc?.longitude);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)',
                        color: '#FFF',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(26,115,232,0.3)',
                      }}
                    >
                      <IconRoute size={13} />
                      Google Maps
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Meetup Pandal Picker Modal */}
      {showMeetupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowMeetupModal(false)}
        >
          <div
            style={{
              background: '#FFFDF9',
              borderRadius: '10px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Choose Meetup Pandal</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--taupe)' }}>
                  Select from 248+ real Kolkata pandals
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMeetupModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--taupe)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search pandal name or neighborhood..."
                  value={pandalSearch}
                  onChange={e => setPandalSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#FFF',
                  }}
                  autoFocus
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--taupe)' }}>
                  🔍
                </span>
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: '10px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredPandals.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
                  No matching pandals found in Kolkata dataset.
                </div>
              ) : (
                filteredPandals.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSetMeetup?.(p);
                      setShowMeetupModal(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: '#FFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '2px' }}>
                        {p.region} • Near {p.nearestMetro} Metro
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--antique-gold)' }}>
                      Select
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
