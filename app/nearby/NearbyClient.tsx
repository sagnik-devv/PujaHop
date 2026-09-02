'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Pandal, MetroStation } from '../../lib/types';
import { calculateDistance } from '../../lib/geo';
import { detectUserLocation } from '../../lib/location-service';
import PandalCard from '../../components/PandalCard';
import LeafletMap from '../../components/LeafletMap';
import { IconMapPin, IconNavigation, IconSparkles } from '../../components/Icons';
import { useToast } from '../../lib/toast-context';

interface NearbyClientProps {
  pandals: Pandal[];
  metroStations: MetroStation[];
  initialLat?: number;
  initialLon?: number;
}

export default function NearbyClient({
  pandals,
  metroStations,
  initialLat,
  initialLon,
}: NearbyClientProps) {
  const { showToast } = useToast();

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(
    initialLat && initialLon ? { lat: initialLat, lon: initialLon } : null
  );
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'loading' | 'success' | 'denied' | 'error'>(
    initialLat && initialLon ? 'success' : 'prompt'
  );
  const [radiusKm, setRadiusKm] = useState<number>(3.5);
  const [famousOnly, setFamousOnly] = useState(false);

  // Request location on initial mount if not provided via searchParams
  useEffect(() => {
    if (!initialLat || !initialLon) {
      requestLocation();
    }
  }, [initialLat, initialLon]);

  const requestLocation = async () => {
    setLocationStatus('loading');
    showToast('Detecting your position in Kolkata...', 'info');

    try {
      const loc = await detectUserLocation();
      setUserLocation({
        lat: loc.lat,
        lon: loc.lon,
      });
      setLocationStatus('success');
      showToast(`📍 Location detected: ${loc.landmark}!`, 'success');
    } catch (err: any) {
      console.warn('Geolocation denied or timed out:', err);
      setLocationStatus('denied');
      setUserLocation({ lat: 22.5649, lon: 88.3517 }); // Default: Esplanade
      showToast('Could not access GPS. Showing distances from Central Kolkata.', 'info');
    }
  };

  // Compute distances to all pandals
  const nearbyPandals = useMemo(() => {
    if (!userLocation) return [];

    return pandals
      .map(p => {
        const distKm = calculateDistance(userLocation.lat, userLocation.lon, p.latitude, p.longitude);
        return {
          ...p,
          distanceUserKm: distKm,
        };
      })
      .filter(p => p.distanceUserKm <= radiusKm && (!famousOnly || p.famous))
      .sort((a, b) => a.distanceUserKm - b.distanceUserKm);
  }, [pandals, userLocation, radiusKm, famousOnly]);

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div className="eyebrow">Real-Time Proximity</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            Puja Pandals Near You
          </h1>
          <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
            Find the closest pandals within walking and short transit distance using exact GPS coordinates.
          </p>
        </div>

        {/* Location Status & Filter Controls Banner */}
        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            padding: '20px 24px',
            boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: locationStatus === 'success' ? '#EAF6EE' : '#FDF6E7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconMapPin size={18} color={locationStatus === 'success' ? '#2F7D4A' : '#D99A25'} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                {locationStatus === 'success'
                  ? '📍 Your GPS Position Active'
                  : locationStatus === 'loading'
                  ? 'Detecting your coordinates...'
                  : '📍 Pinned to Central Kolkata (Esplanade)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
                {locationStatus === 'denied'
                  ? 'Grant browser location permission for live proximity.'
                  : `Coordinates: ${userLocation?.lat.toFixed(4)}, ${userLocation?.lon.toFixed(4)}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={requestLocation}
              className="btn btn-secondary btn-sm"
              disabled={locationStatus === 'loading'}
            >
              <IconNavigation size={14} /> {locationStatus === 'loading' ? 'Locating...' : 'Refresh GPS'}
            </button>

            {/* Radius Filters */}
            <div style={{ display: 'flex', background: 'var(--warm-cream)', padding: '3px', borderRadius: '4px' }}>
              {[1.5, 3.5, 6, 12].map(r => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '3px',
                    background: radiusKm === r ? 'var(--dark-bg)' : 'transparent',
                    color: radiusKm === r ? '#FFF' : 'var(--foreground)',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  {r} km
                </button>
              ))}
            </div>

            <button
              onClick={() => setFamousOnly(!famousOnly)}
              className={`badge ${famousOnly ? 'badge-famous' : 'badge-region'}`}
              style={{ cursor: 'pointer', padding: '6px 12px', border: famousOnly ? '1.5px solid #B08D57' : '1px solid var(--border)' }}
            >
              <IconSparkles size={11} /> Iconic Only
            </button>
          </div>
        </div>

        {/* Results Layout: Split List + Map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '36px' }}>
          {/* List */}
          <div>
            <div style={{ marginBottom: '16px', fontSize: '0.88rem', color: 'var(--taupe)' }}>
              Found <strong>{nearbyPandals.length}</strong> pandals within <strong>{radiusKm} km</strong> of your location.
            </div>

            {nearbyPandals.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', background: '#FFF', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Pandals in this immediate radius</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '16px' }}>
                  Expand the radius slider above to 6 km or 12 km to see surrounding puja pandals.
                </p>
                <button onClick={() => setRadiusKm(6)} className="btn btn-primary btn-sm">
                  Expand Radius to 6 km
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {nearbyPandals.map(pandal => (
                  <PandalCard
                    key={pandal.id}
                    pandal={pandal}
                    distanceUserKm={pandal.distanceUserKm}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sticky Map */}
          <div>
            <div style={{ position: 'sticky', top: '90px' }}>
              <LeafletMap
                pandals={nearbyPandals}
                metroStations={metroStations}
                center={userLocation ? [userLocation.lat, userLocation.lon] : undefined}
                zoom={14}
                userLocation={userLocation ? [userLocation.lat, userLocation.lon] : undefined}
                height="540px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
