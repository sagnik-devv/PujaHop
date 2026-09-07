'use client';

import React, { useState } from 'react';
import { HopMember, LiveLocation, AggregatedRoomPandal, RoomRouteStats } from '../lib/hop-room';
import { calculateDistance, findNearbyPandals } from '../lib/geo';
import { GENERATED_PANDALS } from '../lib/generated-pujas';
import { openGoogleMapsDirections } from './HopMap';
import { Pandal } from '../lib/types';
import { useToast } from '../lib/toast-context';
import { IconMapPin, IconRoute, IconSearch, IconSparkles } from './Icons';
import { useLanguage } from '../lib/language-context';

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
  roomPandals?: AggregatedRoomPandal[];
  selectedPandals?: AggregatedRoomPandal[];
  routeStats?: RoomRouteStats;
  userFavoritesCount?: number;
  onSelectMember?: (member: HopMember) => void;
  onNavigateToMember?: (member: HopMember, loc: LiveLocation) => void;
  onSetMeetup?: (pandal: Pandal) => void;
  onClearMeetup?: () => void;
  onSyncFavorites?: () => void;
  onTogglePandal?: (pandalId: number, isSelected: boolean) => void;
  onDeletePandal?: (pandalId: number) => void;
  onAddPandal?: (pandalId: number) => void;
  onSelectPandalOnMap?: (pandal: AggregatedRoomPandal) => void;
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

function formatMetersToKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatSecondsToMins(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

export default function HopMemberList({
  members,
  locations,
  currentUserId,
  hostUserId,
  meetup,
  selectedMemberId,
  roomPandals = [],
  selectedPandals = [],
  routeStats,
  userFavoritesCount = 0,
  onSelectMember,
  onNavigateToMember,
  onSetMeetup,
  onClearMeetup,
  onSyncFavorites,
  onTogglePandal,
  onDeletePandal,
  onAddPandal,
  onSelectPandalOnMap,
}: HopMemberListProps) {
  const { showToast } = useToast();
  const { language, t, tPandalName } = useLanguage();
  const [sidebarTab, setSidebarTab] = useState<'route' | 'members'>('route');
  const [showPandalModal, setShowPandalModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add_route' | 'meetup'>('add_route');
  const [pandalSearch, setPandalSearch] = useState('');

  const selfLoc = currentUserId ? locations[currentUserId] : null;

  // Filtered pandals for search modal
  const filteredPandals = pandalSearch.trim()
    ? GENERATED_PANDALS.filter(
        p =>
          p.name.toLowerCase().includes(pandalSearch.toLowerCase()) ||
          (p.bengaliName && p.bengaliName.includes(pandalSearch)) ||
          p.region.toLowerCase().includes(pandalSearch.toLowerCase()) ||
          (p.nearestMetro && p.nearestMetro.toLowerCase().includes(pandalSearch.toLowerCase()))
      ).slice(0, 20)
    : GENERATED_PANDALS.slice(0, 20);

  const otherMembers = members.filter(m => m.user_id !== currentUserId);
  const selfMember = members.find(m => m.user_id === currentUserId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Group Meetup Point Banner */}
      <div
        style={{
          background: meetup?.pandalName ? '#FFFDF9' : 'var(--warm-cream)',
          border: '1.5px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '14px 16px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>🪷</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--antique-gold)',
              }}
            >
              {language === 'bn' ? 'গ্রুপের মিলিত হওয়ার স্থান' : 'Group Meetup Point'}
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
              {language === 'bn' ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>

        {meetup?.pandalName ? (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
              {(() => {
                const pObj = GENERATED_PANDALS.find(p => p.name === meetup.pandalName || p.id === meetup.pandalId);
                return tPandalName(meetup.pandalName, pObj?.bengaliName);
              })()}
            </div>
            {selfLoc && meetup.latitude && meetup.longitude && (
              <div style={{ fontSize: '12px', color: 'var(--taupe)', marginBottom: '10px' }}>
                📍 {language === 'bn' 
                  ? `আপনার অবস্থান থেকে ${(calculateDistance(selfLoc.latitude, selfLoc.longitude, meetup.latitude, meetup.longitude) * 1000).toFixed(0)} মিটার দূরে`
                  : `${(calculateDistance(selfLoc.latitude, selfLoc.longitude, meetup.latitude, meetup.longitude) * 1000).toFixed(0)}m from your current position`}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                    boxShadow: '0 2px 6px rgba(26,115,232,0.25)',
                  }}
                >
                  <IconRoute size={13} />
                  {language === 'bn' ? 'গুগল ম্যাপসে রুট দেখুন' : 'Navigate in Google Maps'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setModalMode('meetup');
                  setShowPandalModal(true);
                }}
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
                {language === 'bn' ? 'স্থান পরিবর্তন করুন' : 'Change Meetup'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--taupe)', lineHeight: 1.4 }}>
              {language === 'bn' ? 'গ্রুপের তালিকা থেকে বা অন্য যেকোনো প্যান্ডেল মিলিত হওয়ার স্থান হিসেবে বেছে নিন।' : 'Choose a meetup pandal from the group route below or pick any pandal.'}
            </div>
            <button
              type="button"
              onClick={() => {
                setModalMode('meetup');
                setShowPandalModal(true);
              }}
              style={{
                background: 'var(--gold-gradient)',
                color: '#17120F',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              {language === 'bn' ? 'স্থান পছন্দ করুন' : 'Choose Meetup'}
            </button>
          </div>
        )}
      </div>

      {/* 2. Subtabs Switcher: Group Route & Pandals vs Members & GPS */}
      <div
        style={{
          display: 'flex',
          background: 'var(--warm-cream)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border-gold)',
        }}
      >
        <button
          type="button"
          onClick={() => setSidebarTab('route')}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: '6px',
            border: 'none',
            background: sidebarTab === 'route' ? '#FFF' : 'transparent',
            fontWeight: 700,
            fontSize: '12px',
            color: sidebarTab === 'route' ? 'var(--foreground)' : 'var(--taupe)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: sidebarTab === 'route' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span>{language === 'bn' ? '🗺️ গ্রুপ রুট' : '🗺️ Group Route'}</span>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '10px',
              background: sidebarTab === 'route' ? 'var(--vermilion)' : 'rgba(0,0,0,0.08)',
              color: sidebarTab === 'route' ? '#FFF' : 'var(--taupe)',
              fontWeight: 800,
            }}
          >
            {selectedPandals.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('members')}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: '6px',
            border: 'none',
            background: sidebarTab === 'members' ? '#FFF' : 'transparent',
            fontWeight: 700,
            fontSize: '12px',
            color: sidebarTab === 'members' ? 'var(--foreground)' : 'var(--taupe)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: sidebarTab === 'members' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span>{language === 'bn' ? '👥 সদস্যবর্গ' : '👥 Members'}</span>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '10px',
              background: sidebarTab === 'members' ? 'var(--antique-gold)' : 'rgba(0,0,0,0.08)',
              color: sidebarTab === 'members' ? '#FFF' : 'var(--taupe)',
              fontWeight: 800,
            }}
          >
            {members.length}
          </span>
        </button>
      </div>

      {/* 3. Tab Content: Group Route & Pandals */}
      {sidebarTab === 'route' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Personal Wishlist Sync Banner */}
          {userFavoritesCount > 0 && onSyncFavorites && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(217, 154, 37, 0.12) 0%, rgba(179, 38, 30, 0.08) 100%)',
                border: '1px solid var(--border-gold)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>
                You have <strong>{userFavoritesCount}</strong> saved pandal{userFavoritesCount > 1 ? 's' : ''} in your personal wishlist.
              </div>
              <button
                type="button"
                onClick={onSyncFavorites}
                style={{
                  background: 'var(--vermilion)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(179,38,30,0.25)',
                }}
              >
                ⚡ Sync Wishlist
              </button>
            </div>
          )}

          {/* Route Overview & Multi-stop Google Maps Action */}
          {selectedPandals.length > 0 && routeStats && (
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid var(--border-gold)',
                borderRadius: '8px',
                padding: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--antique-gold)' }}>
                  Total Route Metrics
                </div>
                <div style={{ fontSize: '11px', color: 'var(--taupe)', fontWeight: 600 }}>
                  {selectedPandals.length} active stops
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--warm-cream)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--taupe)', textTransform: 'uppercase', fontWeight: 700 }}>Total Distance</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
                    {formatMetersToKm(routeStats.totalDistanceMeters)}
                  </div>
                </div>
                <div style={{ background: 'var(--warm-cream)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--taupe)', textTransform: 'uppercase', fontWeight: 700 }}>Est. Walk Time</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
                    {formatSecondsToMins(routeStats.totalDurationSeconds)}
                  </div>
                </div>
              </div>

              {/* Multi-Stop Google Maps Navigation Button */}
              {routeStats.googleMapsUrl && (
                <a
                  href={routeStats.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)',
                    color: '#FFF',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 3px 10px rgba(26,115,232,0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <IconRoute size={16} />
                  Open Full Route in Google Maps ({selectedPandals.length} stops)
                </a>
              )}
            </div>
          )}

          {/* Action Row: Add Pandal to Route */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
              Group Pandals ({roomPandals.length})
            </div>
            <button
              type="button"
              onClick={() => {
                setModalMode('add_route');
                setShowPandalModal(true);
              }}
              style={{
                background: 'var(--gold-gradient)',
                color: '#17120F',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              <span>➕ Add Pandal</span>
            </button>
          </div>

          {/* List of Member Saved Pandals */}
          {roomPandals.length === 0 ? (
            <div
              style={{
                background: 'var(--warm-cream)',
                borderRadius: '8px',
                padding: '28px 16px',
                textAlign: 'center',
                border: '1px dashed var(--border-gold)',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪷</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                No pandals added yet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--taupe)', marginTop: '4px', maxWidth: '280px', margin: '4px auto 14px' }}>
                Each member can sync their saved pandals or search from 248 Kolkata pujas to build the ultimate hopping route!
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {userFavoritesCount > 0 && onSyncFavorites && (
                  <button
                    type="button"
                    onClick={onSyncFavorites}
                    style={{
                      background: 'var(--vermilion)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Sync My Wishlist ({userFavoritesCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('add_route');
                    setShowPandalModal(true);
                  }}
                  style={{
                    background: 'var(--gold-gradient)',
                    color: '#17120F',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Browse 248 Pandals
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roomPandals.map((pandal, idx) => {
                const isCurrentMeetup = meetup?.pandalId === pandal.id;
                const fullPandal = GENERATED_PANDALS.find(p => p.id === pandal.id);
                const stopIndex = selectedPandals.findIndex(p => p.id === pandal.id);

                return (
                  <div
                    key={pandal.id}
                    onClick={() => onSelectPandalOnMap?.(pandal)}
                    style={{
                      background: pandal.isSelected ? '#FFFDF9' : 'rgba(255,255,255,0.6)',
                      border: isCurrentMeetup
                        ? '2px solid #D99A25'
                        : pandal.isSelected
                        ? '1.5px solid var(--border)'
                        : '1px dashed #CCC',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                      opacity: pandal.isSelected ? 1 : 0.65,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {/* Checkbox / Toggle Include in Route */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onTogglePandal?.(pandal.id, !pandal.isSelected);
                          }}
                          title={pandal.isSelected ? 'Exclude from route' : 'Include in route'}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            border: pandal.isSelected ? 'none' : '1.5px solid #999',
                            background: pandal.isSelected ? 'var(--vermilion)' : '#FFF',
                            color: '#FFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        >
                          {pandal.isSelected ? '✓' : ''}
                        </button>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {pandal.isSelected && stopIndex >= 0 && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  background: 'var(--vermilion)',
                                  color: '#FFF',
                                  padding: '1px 6px',
                                  borderRadius: '10px',
                                }}
                              >
                                Stop #{stopIndex + 1}
                              </span>
                            )}
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                              {pandal.name}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '2px' }}>
                            {pandal.region} {pandal.nearestMetro ? `• Near ${pandal.nearestMetro} Metro` : ''}
                          </div>

                          {/* Contributor tags */}
                          {pandal.savedBy && pandal.savedBy.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--taupe)' }}>Saved by:</span>
                              {pandal.savedBy.map(s => (
                                <span
                                  key={s.userId}
                                  style={{
                                    fontSize: '10px',
                                    background: 'rgba(217, 154, 37, 0.12)',
                                    color: 'var(--antique-gold)',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                  }}
                                >
                                  {s.userId === currentUserId ? 'You' : s.memberName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete / Remove Stop Button */}
                      {onDeletePandal && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onDeletePandal(pandal.id);
                          }}
                          title="Remove from group list"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            fontSize: '14px',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Bottom Actions on Card */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                        marginTop: '2px',
                      }}
                    >
                      {/* Set as Meetup Point Button */}
                      {isCurrentMeetup ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#D99A25',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          🪷 Current Meetup Point
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (fullPandal && onSetMeetup) {
                              onSetMeetup(fullPandal);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-gold)',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--antique-gold)',
                            cursor: 'pointer',
                          }}
                        >
                          🪷 Set as Meetup
                        </button>
                      )}

                      {/* Single Stop Google Maps */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          openGoogleMapsDirections(pandal.latitude, pandal.longitude, selfLoc?.latitude, selfLoc?.longitude);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1A73E8',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <IconRoute size={11} /> Directions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Tab Content: Hop Members & Live GPS */}
      {sidebarTab === 'members' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
              Live GPS Hop Members ({members.length})
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--taupe)' }}>
              Realtime GPS sharing
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Current User Card */}
            {selfMember && (
              <div
                style={{
                  background: '#FFFDF9',
                  border: '1.5px solid #155799',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
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
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{selfMember.display_name}</span>
                      <span style={{ fontSize: '10px', background: 'rgba(21, 87, 153, 0.1)', color: '#155799', padding: '1px 5px', borderRadius: '10px', fontWeight: 700 }}>
                        YOU
                      </span>
                      {selfMember.user_id === hostUserId && (
                        <span style={{ fontSize: '10px', background: 'var(--warm-cream)', color: 'var(--antique-gold)', padding: '1px 5px', borderRadius: '10px', fontWeight: 700 }}>
                          HOST
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: selfMember.is_sharing ? '#2F7D4A' : '#756D65', marginTop: '1px' }}>
                      {selfMember.is_sharing ? '● Sharing your live position' : '○ Location sharing paused'}
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
                  padding: '20px 14px',
                  textAlign: 'center',
                  border: '1px dashed var(--border-gold)',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>👥</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  No other members have joined yet.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '3px' }}>
                  Share your room code with friends to coordinate in real time!
                </div>
              </div>
            ) : (
              otherMembers.map(member => {
                const loc = locations[member.user_id];
                const isSharing = member.is_sharing && loc?.is_sharing;
                const isSelected = selectedMemberId === member.user_id;

                const distM =
                  isSharing && selfLoc && selfLoc.is_sharing && loc
                    ? calculateDistance(selfLoc.latitude, selfLoc.longitude, loc.latitude, loc.longitude) * 1000
                    : null;

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
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
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
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>{member.display_name}</span>
                          {member.user_id === hostUserId && (
                            <span style={{ fontSize: '10px', background: 'var(--warm-cream)', color: 'var(--antique-gold)', padding: '1px 5px', borderRadius: '10px', fontWeight: 700 }}>
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
                          showToast(`Opening Google Maps directions to ${member.display_name}...`, 'info');
                          openGoogleMapsDirections(loc.latitude, loc.longitude, selfLoc?.latitude, selfLoc?.longitude);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)',
                          color: '#FFF',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 5px rgba(26,115,232,0.25)',
                        }}
                      >
                        <IconRoute size={12} />
                        Maps
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. Pandal Search Modal (For Add to Route or Set Meetup) */}
      {showPandalModal && (
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
          onClick={() => setShowPandalModal(false)}
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
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  {modalMode === 'meetup' ? 'Choose Group Meetup Point' : 'Add Pandal to Group Route'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--taupe)' }}>
                  Select from 248 verified Kolkata Durga Pujas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPandalModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--taupe)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search pandal, neighborhood, metro..."
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
                      if (modalMode === 'meetup') {
                        onSetMeetup?.(p);
                      } else {
                        onAddPandal?.(p.id);
                      }
                      setShowPandalModal(false);
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
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '2px' }}>
                        {p.region} • Near {p.nearestMetro} Metro
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: modalMode === 'meetup' ? 'var(--antique-gold)' : 'var(--vermilion)',
                      }}
                    >
                      {modalMode === 'meetup' ? 'Set Meetup' : '➕ Add Stop'}
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
