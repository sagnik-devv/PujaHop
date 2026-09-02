'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Pandal, MetroStation } from '../lib/types';
import { formatDistance } from '../lib/format';
import { detectUserLocation } from '../lib/location-service';

interface LeafletMapProps {
  pandals: Pandal[];
  metroStations?: MetroStation[];
  center?: [number, number];
  zoom?: number;
  selectedPandalId?: number;
  userLocation?: [number, number];
  showMetro?: boolean;
  onPandalSelect?: (pandal: Pandal) => void;
  className?: string;
  height?: string;
}

export default function LeafletMap({
  pandals,
  metroStations = [],
  center = [22.5726, 88.3639], // Default Kolkata Central
  zoom = 13,
  selectedPandalId,
  userLocation,
  showMetro = true,
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
      // Inject leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!isMounted) return;

      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap clean tile layer (zero watermarks, globally reliable)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;
      markersLayer.current = L.layerGroup().addTo(map);
      setMapLoaded(true);
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
      if (showMetro && metroStations.length > 0) {
        metroStations.forEach(m => {
          const marker = L.marker([m.latitude, m.longitude], {
            icon: createMetroIcon(),
          });

          marker.bindPopup(`
            <div style="padding: 10px; font-family: sans-serif;">
              <div style="font-weight: bold; font-size: 13px; color: #155799;">${m.name} Metro</div>
              <div style="font-size: 11px; color: #555;">${m.bengaliName} • ${m.line}</div>
              <div style="font-size: 10px; color: #777; margin-top: 4px;">Opens: ${m.opensAt} | Closes: ${m.closesAt}</div>
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
  }, [pandals, metroStations, userLocation, showMetro, mapLoaded, onPandalSelect]);

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
