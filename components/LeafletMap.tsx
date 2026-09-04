'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Pandal, MetroStation, BusStop } from '../lib/types';
import { formatDistance } from '../lib/format';
import { detectUserLocation } from '../lib/location-service';

interface LeafletMapProps {
  pandals: Pandal[];
  metroStations?: MetroStation[];
  busStops?: BusStop[];
  center?: [number, number];
  zoom?: number;
  selectedPandalId?: number;
  userLocation?: [number, number];
  showMetro?: boolean;
  showBusStops?: boolean;
  onPandalSelect?: (pandal: Pandal) => void;
  className?: string;
  height?: string;
}

export default function LeafletMap({
  pandals,
  metroStations = [],
  busStops = [],
  center = [22.5726, 88.3639], // Default Kolkata Central
  zoom = 13,
  selectedPandalId,
  userLocation,
  showMetro = true,
  showBusStops = true,
  onPandalSelect,
  className = '',
  height = '100%',
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const pandalMarkersRef = useRef<Map<number, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locatingMap, setLocatingMap] = useState(false);
  const [enableMetro, setEnableMetro] = useState(showMetro);
  const [enableBus, setEnableBus] = useState(showBusStops);

  useEffect(() => {
    setEnableMetro(showMetro);
  }, [showMetro]);

  useEffect(() => {
    setEnableBus(showBusStops);
  }, [showBusStops]);

  // Invalidate size on container resize / window resize
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || !mapRef.current) return;

    const triggerInvalidate = () => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    };

    const timer1 = setTimeout(triggerInvalidate, 80);
    const timer2 = setTimeout(triggerInvalidate, 250);
    const timer3 = setTimeout(triggerInvalidate, 600);

    window.addEventListener('resize', triggerInvalidate);
    window.addEventListener('orientationchange', triggerInvalidate);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        triggerInvalidate();
      });
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', triggerInvalidate);
      window.removeEventListener('orientationchange', triggerInvalidate);
      resizeObserver?.disconnect();
    };
  }, [mapLoaded]);

  const handleMapLocateMe = async () => {
    if (!mapInstance.current) return;
    setLocatingMap(true);
    try {
      const loc = await detectUserLocation();
      const coords: [number, number] = [loc.lat, loc.lon];
      const L = (await import('leaflet')).default;

      mapInstance.current.flyTo(coords, 16, { duration: 1.2 });

      // Add pulsating user marker
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:rgba(21, 87, 153, 0.25); border:1px solid rgba(21, 87, 153, 0.5);"></div>
            <div style="position:absolute; width:16px; height:16px; border-radius:50%; background:#155799; border:2.5px solid #FFF; box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(coords, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <strong style="color:#155799; font-size:0.85rem;">📍 Your Live Location</strong>
            <div style="font-size:0.75rem; color:#444; margin-top:2px;">${loc.landmark}</div>
            <div style="font-size:0.72rem; color:#777; margin-top:1px;">Nearest Metro: ${loc.nearestMetroName} (~${Math.round(loc.nearestMetroDistanceM)}m)</div>
          </div>
        `)
        .openPopup();
    } catch (err) {
      console.warn('Map locate error:', err);
    } finally {
      setLocatingMap(false);
    }
  };

  useEffect(() => {
    // Dynamic import of leaflet on client
    let isMounted = true;

    async function initMap() {
      if (!mapRef.current || mapInstance.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        preferCanvas: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap clean tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        keepBuffer: 4,
        updateWhenIdle: true,
      }).addTo(map);

      mapInstance.current = map;
      markersLayer.current = L.layerGroup().addTo(map);
      setMapLoaded(true);

      // Staggered size invalidations to ensure smooth render on cold load
      setTimeout(() => {
        if (isMounted && mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 100);
      setTimeout(() => {
        if (isMounted && mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 350);
      setTimeout(() => {
        if (isMounted && mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 800);
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

  // Update center/zoom when selected pandal changes
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    if (selectedPandalId) {
      const selected = pandals.find(p => p.id === selectedPandalId);
      if (selected) {
        mapInstance.current.flyTo([selected.latitude, selected.longitude], 16, {
          duration: 1.0,
        });
        const marker = pandalMarkersRef.current.get(selectedPandalId);
        if (marker) {
          marker.openPopup();
        }
      }
    } else if (center) {
      mapInstance.current.setView(center, zoom);
    }
  }, [center, zoom, selectedPandalId, mapLoaded, pandals]);

  // Render Markers
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || !markersLayer.current) return;

    async function renderMarkers() {
      const L = (await import('leaflet')).default;
      markersLayer.current.clearLayers();

      // Custom icon generators
      const createPandalIcon = (isFamous: boolean, isSelected: boolean) => {
        const bg = isSelected ? '#7F1712' : isFamous ? '#B08D57' : '#B3261E';
        const size = isSelected ? 36 : isFamous ? 30 : 26;
        const star = isFamous ? '★' : '';

        return L.divIcon({
          className: 'custom-pandal-pin',
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: ${bg};
              border: 2px solid #FAF7F2;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <span style="
                transform: rotate(45deg);
                color: #FAF7F2;
                font-size: ${size * 0.45}px;
                font-weight: bold;
              ">${star || '🪔'}</span>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
        });
      };

      const createMetroIcon = () => {
        return L.divIcon({
          className: 'custom-metro-pin',
          html: `
            <div style="
              width: 22px;
              height: 22px;
              background: #155799;
              border: 2px solid #FFF;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #FFF;
              font-size: 11px;
              font-weight: 900;
            ">M</div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -11],
        });
      };

      const createBusIcon = () => {
        return L.divIcon({
          className: 'custom-bus-pin',
          html: `
            <div style="
              width: 22px;
              height: 22px;
              background: #1B5E20;
              border: 2px solid #FFF;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #FFF;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">🚌</div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -11],
        });
      };

      const createUserIcon = () => {
        return L.divIcon({
          className: 'custom-user-pin',
          html: `
            <div style="
              width: 18px;
              height: 18px;
              background: #0D47A1;
              border: 3px solid #FFF;
              border-radius: 50%;
              box-shadow: 0 0 0 6px rgba(13, 71, 161, 0.25);
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
      };

      // Add user location marker
      if (userLocation) {
        L.marker(userLocation, { icon: createUserIcon() })
          .bindPopup('<strong>Your Current Location</strong>')
          .addTo(markersLayer.current);
      }

      // Add metro stations if enabled
      if (enableMetro && metroStations.length > 0) {
        metroStations.forEach(m => {
          const marker = L.marker([m.latitude, m.longitude], {
            icon: createMetroIcon(),
          });

          marker.bindPopup(`
            <div style="padding: 10px; font-family: sans-serif;">
              <div style="font-weight: bold; font-size: 13px; color: #155799;">🚇 ${m.name} Metro</div>
              <div style="font-size: 11px; color: #555;">${m.bengaliName} • ${m.line}</div>
              <div style="font-size: 10px; color: #777; margin-top: 4px;">Opens: ${m.opensAt} | Closes: ${m.closesAt}</div>
            </div>
          `);
          marker.addTo(markersLayer.current);
        });
      }

      // Add bus stops if enabled
      if (enableBus && busStops.length > 0) {
        busStops.forEach(b => {
          const marker = L.marker([b.latitude, b.longitude], {
            icon: createBusIcon(),
          });

          const topBusesPills = b.busNumbers
            .slice(0, 8)
            .map(
              no =>
                `<span style="background: #E8F5E9; color: #1B5E20; border: 1px solid #C8E6C9; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 700;">${no}</span>`
            )
            .join(' ');

          marker.bindPopup(`
            <div style="padding: 10px; font-family: sans-serif; max-width: 260px;">
              <div style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #1B5E20; letter-spacing: 0.5px;">🚌 Kolkata Bus Stop Hub</div>
              <div style="font-weight: bold; font-size: 13px; color: #1B5E20; margin: 3px 0;">${b.cleanName}</div>
              ${b.nearestMetro ? `<div style="font-size: 11px; color: #666; margin-bottom: 4px;">🚇 Near ${b.nearestMetro} Metro</div>` : ''}
              <div style="font-size: 11px; color: #333; margin-top: 6px; font-weight: 600;">
                Buses Serving Stop (${b.busNumbers.length}):
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                ${topBusesPills}
                ${b.busNumbers.length > 8 ? `<span style="font-size: 10px; color: #666; align-self: center;">+${b.busNumbers.length - 8} more</span>` : ''}
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #E0E0E0; font-size: 11px; color: #555;">
                🪔 <strong>${b.pandalIds.length}</strong> Puja Pandals reachable
              </div>
            </div>
          `);
          marker.addTo(markersLayer.current);
        });
      }

      // Add Pandal markers
      pandalMarkersRef.current.clear();
      pandals.forEach(p => {
        const marker = L.marker([p.latitude, p.longitude], {
          icon: createPandalIcon(p.famous, false),
        });

        const popupContent = `
          <div class="custom-popup-box">
            <div style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #B08D57; letter-spacing: 0.5px;">${p.region}</div>
            <div class="custom-popup-title">${p.name}</div>
            <div class="custom-popup-meta">🚇 ${p.nearestMetro} (${formatDistance(p.walkingDistanceM)} walk)</div>
            ${p.nearestBusStop ? `<div class="custom-popup-meta" style="color: #1B5E20;">🚌 ${p.nearestBusStop} ${p.topBuses && p.topBuses.length > 0 ? `(${p.topBuses.join(', ')})` : ''}</div>` : ''}
            <div style="font-size: 11px; color: #555; margin-bottom: 8px;">Theme: ${p.theme || 'Traditional Sabeki'}</div>
            <div style="display: flex; gap: 6px;">
              <a href="/pandal/${p.id}" class="custom-popup-btn" style="flex: 1; text-decoration: none;">View Pandal</a>
              <a href="/route?to=${p.id}" class="custom-popup-btn" style="flex: 1; background: #B3261E; text-decoration: none;">Find Route</a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onPandalSelect) {
            onPandalSelect(p);
          }
        });

        marker.addTo(markersLayer.current);
        pandalMarkersRef.current.set(p.id, marker);
      });

      // Draw transit route corridor line between origin and pandal if single target
      if (userLocation && pandals.length === 1) {
        const routeLine = L.polyline([userLocation, [pandals[0].latitude, pandals[0].longitude]], {
          color: '#B3261E',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.75,
        });
        routeLine.addTo(markersLayer.current);

        const bounds = L.latLngBounds([userLocation, [pandals[0].latitude, pandals[0].longitude]]);
        if (bounds.isValid()) {
          mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } else if (pandals.length > 1) {
        const allPoints = pandals.map(p => [p.latitude, p.longitude] as [number, number]);
        if (userLocation) allPoints.push(userLocation);
        const bounds = L.latLngBounds(allPoints);
        if (bounds.isValid()) {
          mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
      }
    }

    renderMarkers();
  }, [pandals, metroStations, busStops, userLocation, enableMetro, enableBus, mapLoaded, onPandalSelect]);

  return (
    <div
      style={{
        width: '100%',
        height: height,
        position: 'relative',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
      className={className}
    >
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Transit Layer Toggles */}
      {mapLoaded && (metroStations.length > 0 || busStops.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 400,
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          {metroStations.length > 0 && (
            <button
              type="button"
              onClick={() => setEnableMetro(!enableMetro)}
              style={{
                background: enableMetro ? '#155799' : '#FFF',
                color: enableMetro ? '#FFF' : '#155799',
                border: '1.5px solid #155799',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🚇</span>
              <span>Metro ({metroStations.length})</span>
            </button>
          )}

          {busStops.length > 0 && (
            <button
              type="button"
              onClick={() => setEnableBus(!enableBus)}
              style={{
                background: enableBus ? '#1B5E20' : '#FFF',
                color: enableBus ? '#FFF' : '#1B5E20',
                border: '1.5px solid #1B5E20',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🚌</span>
              <span>Bus Stops ({busStops.length})</span>
            </button>
          )}
        </div>
      )}

      {mapLoaded && (
        <button
          type="button"
          onClick={handleMapLocateMe}
          disabled={locatingMap}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 400,
            background: '#FFF',
            border: '1px solid var(--border-gold)',
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#B3261E',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Detect and center map on your live location"
        >
          <span>📍</span>
          <span>{locatingMap ? 'Locating...' : 'Locate Me'}</span>
        </button>
      )}

      {!mapLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            color: 'var(--taupe)',
          }}
        >
          Loading Kolkata Puja Map...
        </div>
      )}
    </div>
  );
}
