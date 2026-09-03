'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HopMember, LiveLocation } from '../lib/hop-room';
import { calculateDistance } from '../lib/geo';

interface HopMapProps {
  members: HopMember[];
  locations: Record<string, LiveLocation>;
  currentUserId?: string;
  meetup?: {
    pandalId?: number | null;
    pandalName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  selectedMemberId?: string | null;
  onSelectMember?: (member: HopMember) => void;
  height?: string;
}

/**
 * Opens Google Maps directions directly in a new tab for native turn-by-turn routing
 */
export function openGoogleMapsDirections(
  destLat: number,
  destLon: number,
  selfLat?: number,
  selfLon?: number
) {
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat.toFixed(6)},${destLon.toFixed(6)}&travelmode=walking`;
  if (selfLat && selfLon) {
    url += `&origin=${selfLat.toFixed(6)},${selfLon.toFixed(6)}`;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function HopMap({
  members,
  locations,
  currentUserId,
  meetup,
  selectedMemberId,
  onSelectMember,
  height = '100%',
}: HopMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const meetupMarkerRef = useRef<any>(null);
  const prevCoordsRef = useRef<Map<string, [number, number]>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const fitBoundsTimeoutRef = useRef<any>(null);

  // Expose global navigator function for popup buttons
  useEffect(() => {
    (window as any).__hopNavigateToFriend = (lat: number, lon: number) => {
      const selfLoc = currentUserId ? locations[currentUserId] : null;
      openGoogleMapsDirections(lat, lon, selfLoc?.latitude, selfLoc?.longitude);
    };
    return () => {
      delete (window as any).__hopNavigateToFriend;
    };
  }, [currentUserId, locations]);

  // Initialize Leaflet Map once
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstance.current) return;
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [22.5726, 88.3639], // Kolkata
        zoom: 13,
        zoomControl: false,
        preferCanvas: true, // Hardware-accelerated canvas rendering for buttery smoothness
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;
      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Center / Fit all points
  const handleFitAll = useCallback(async () => {
    if (!mapInstance.current) return;
    const L = (await import('leaflet')).default;

    const points: [number, number][] = [];
    for (const member of members) {
      const loc = locations[member.user_id];
      if (loc && (loc.is_sharing ?? true) && (member.is_sharing ?? true)) {
        points.push([loc.latitude, loc.longitude]);
      }
    }
    if (meetup?.latitude && meetup?.longitude) {
      points.push([meetup.latitude, meetup.longitude]);
    }

    if (points.length === 1) {
      mapInstance.current.setView(points[0], 15, { animate: true });
    } else if (points.length > 1) {
      mapInstance.current.fitBounds(L.latLngBounds(points), {
        padding: [60, 60],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [members, locations, meetup]);

  // Center on Self
  const handleCenterSelf = useCallback(() => {
    if (!mapInstance.current || !currentUserId) return;
    const selfLoc = locations[currentUserId];
    if (selfLoc) {
      mapInstance.current.setView([selfLoc.latitude, selfLoc.longitude], 16, { animate: true });
    }
  }, [currentUserId, locations]);

  // Update Markers incrementally without UI lag
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    let isCancelled = false;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      if (isCancelled || !mapInstance.current) return;

      const currentMarkerIds = new Set<string>();
      const validPoints: [number, number][] = [];

      // Current user's location for distance calculation
      const selfLoc = currentUserId ? locations[currentUserId] : null;

      for (const member of members) {
        const loc = locations[member.user_id];
        const isSharing = (member.is_sharing ?? true) && (loc?.is_sharing ?? true);

        // Skip members without locations or sharing paused
        if (!loc || !isSharing) {
          if (markersRef.current.has(member.user_id)) {
            markersRef.current.get(member.user_id).remove();
            markersRef.current.delete(member.user_id);
            prevCoordsRef.current.delete(member.user_id);
          }
          continue;
        }

        const isSelf = member.user_id === currentUserId;
        const coords: [number, number] = [loc.latitude, loc.longitude];
        validPoints.push(coords);
        currentMarkerIds.add(member.user_id);

        const initials = member.display_name
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'H';

        const distanceText =
          !isSelf && selfLoc
            ? `${(calculateDistance(selfLoc.latitude, selfLoc.longitude, loc.latitude, loc.longitude) * 1000).toFixed(0)}m away`
            : null;

        const iconHtml = isSelf
          ? `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; pointer-events:none;">
            <div style="position:absolute; width:42px; height:42px; border-radius:50%; background:rgba(179,38,30,0.25); animation: pulse 2s infinite;"></div>
            <div style="position:absolute; width:28px; height:28px; border-radius:50%; background:#B3261E; border:2.5px solid #FFFFFF; box-shadow:0 3px 10px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#FFF; font-weight:800; font-size:11px; font-family:sans-serif;">
              You
            </div>
          </div>
        `
          : `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div style="background:#FFFDF9; border:1.5px solid #155799; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#17120F; box-shadow:0 2px 6px rgba(0,0,0,0.2); white-space:nowrap; margin-bottom:2px; font-family:sans-serif;">
              ${member.display_name}
            </div>
            <div style="width:32px; height:32px; border-radius:50%; background:#155799; border:2.5px solid #FFFFFF; box-shadow:0 3px 10px rgba(21,87,153,0.4); display:flex; align-items:center; justify-content:center; color:#FFF; font-weight:700; font-size:12px; font-family:sans-serif;">
              ${initials}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'hop-member-marker',
          html: iconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const popupContent = `
          <div style="font-family:sans-serif; padding:4px 6px; min-width:170px;">
            <div style="font-size:14px; font-weight:700; color:#17120F; margin-bottom:2px;">
              ${member.display_name} ${isSelf ? '<span style="color:#B3261E; font-size:11px;">(You)</span>' : ''}
            </div>
            <div style="font-size:11px; color:#756D65; margin-bottom:6px;">
              ${distanceText ? `📍 <strong>${distanceText}</strong><br/>` : ''}Accuracy: ±${Math.round(loc.accuracy || 10)}m
            </div>
            ${
              !isSelf
                ? `<button 
                    type="button"
                    onclick="window.__hopNavigateToFriend(${loc.latitude}, ${loc.longitude})"
                    style="width:100%; background:linear-gradient(135deg, #4285F4 0%, #1A73E8 100%); color:#FFF; border:none; padding:8px 12px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 6px rgba(26,115,232,0.3);"
                   >
                    🗺️ Open in Google Maps
                   </button>`
                : ''
            }
          </div>
        `;

        if (markersRef.current.has(member.user_id)) {
          const marker = markersRef.current.get(member.user_id);
          const prev = prevCoordsRef.current.get(member.user_id);

          // Only mutate position if moved to eliminate layout thrashing
          if (!prev || Math.abs(prev[0] - coords[0]) > 0.00002 || Math.abs(prev[1] - coords[1]) > 0.00002) {
            marker.setLatLng(coords);
            prevCoordsRef.current.set(member.user_id, coords);
          }
          marker.setIcon(icon);
          marker.setPopupContent(popupContent);
        } else {
          const marker = L.marker(coords, { icon, zIndexOffset: isSelf ? 1000 : 500 }).addTo(
            mapInstance.current
          );
          marker.bindPopup(popupContent);
          marker.on('click', () => {
            onSelectMember?.(member);
          });
          markersRef.current.set(member.user_id, marker);
          prevCoordsRef.current.set(member.user_id, coords);
        }
      }

      // Remove removed members
      for (const [uid, marker] of markersRef.current.entries()) {
        if (!currentMarkerIds.has(uid)) {
          marker.remove();
          markersRef.current.delete(uid);
          prevCoordsRef.current.delete(uid);
        }
      }

      // Meetup Marker
      if (meetup?.latitude && meetup?.longitude) {
        const meetupCoords: [number, number] = [meetup.latitude, meetup.longitude];
        validPoints.push(meetupCoords);

        const meetupIcon = L.divIcon({
          className: 'hop-meetup-marker',
          html: `
            <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
              <div style="background:#B08D57; color:#FFF; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; box-shadow:0 3px 8px rgba(0,0,0,0.25); white-space:nowrap; margin-bottom:2px; font-family:sans-serif;">
                🚩 MEET HERE
              </div>
              <div style="width:34px; height:34px; border-radius:50%; background:#FAF7F2; border:2.5px solid #B08D57; box-shadow:0 3px 12px rgba(176,141,87,0.5); display:flex; align-items:center; justify-content:center; font-size:18px;">
                🪷
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        if (meetupMarkerRef.current) {
          meetupMarkerRef.current.setLatLng(meetupCoords);
        } else {
          meetupMarkerRef.current = L.marker(meetupCoords, { icon: meetupIcon, zIndexOffset: 2000 })
            .addTo(mapInstance.current)
            .bindPopup(`
              <div style="font-family:sans-serif; padding:4px;">
                <div style="color:#B08D57; font-weight:700; font-size:12px;">GROUP MEETUP POINT</div>
                <div style="font-size:14px; font-weight:700; color:#17120F; margin-top:2px;">${meetup.pandalName || 'Selected Pandal'}</div>
                <button 
                  type="button"
                  onclick="window.__hopNavigateToFriend(${meetupCoords[0]}, ${meetupCoords[1]})"
                  style="width:100%; margin-top:8px; background:#1A73E8; color:#FFF; border:none; padding:6px 10px; border-radius:4px; font-weight:700; font-size:11px; cursor:pointer;"
                >
                  🗺️ Google Maps Directions
                </button>
              </div>
            `);
        }
      } else if (meetupMarkerRef.current) {
        meetupMarkerRef.current.remove();
        meetupMarkerRef.current = null;
      }

      // Auto fit bounds when new members join or positions arrive
      if (validPoints.length >= 2) {
        clearTimeout(fitBoundsTimeoutRef.current);
        fitBoundsTimeoutRef.current = setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.fitBounds(L.latLngBounds(validPoints), {
              padding: [60, 60],
              maxZoom: 16,
            });
          }
        }, 300);
      } else if (validPoints.length === 1 && !prevCoordsRef.current.has('initial_fit')) {
        mapInstance.current.setView(validPoints[0], 15);
        prevCoordsRef.current.set('initial_fit', validPoints[0]);
      }
    }

    updateMarkers();

    return () => {
      isCancelled = true;
    };
  }, [members, locations, currentUserId, meetup, mapReady, onSelectMember]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {/* Map Element */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'pan-x pan-y',
          background: '#EBE5D8',
        }}
      />

      {/* Floating Controls: Fit All Members & My Location */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={handleFitAll}
          title="Fit all members on map"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid var(--border-gold)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--foreground)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🔍</span>
          <span>Fit All ({members.filter(m => locations[m.user_id]).length})</span>
        </button>

        {currentUserId && locations[currentUserId] && (
          <button
            type="button"
            onClick={handleCenterSelf}
            title="Recenter on your location"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--vermilion)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📍</span>
            <span>My Location</span>
          </button>
        )}
      </div>
    </div>
  );
}
