'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pandal, MetroStation, RouteOption } from '../../lib/types';
import { getRoutes } from '../../lib/api';
import {
  searchKolkataLocations,
  resolveLocationCoordinates,
  detectUserLocation,
  LocationSuggestion,
} from '../../lib/location-service';
import { calculateDistance } from '../../lib/geo';
import RouteComparison from '../../components/RouteComparison';
import LeafletMap from '../../components/LeafletMap';
import { IconMapPin, IconRoute, IconNavigation, IconSparkles } from '../../components/Icons';
import { useToast } from '../../lib/toast-context';
import { useLanguage } from '../../lib/language-context';

interface RouteClientProps {
  pandals: Pandal[];
  metroStations: MetroStation[];
  initialToId: number;
  initialFromName: string;
  initialLat?: number;
  initialLon?: number;
}

export default function RouteClient({
  pandals,
  metroStations,
  initialToId,
  initialFromName,
  initialLat,
  initialLon,
}: RouteClientProps) {
  const { showToast } = useToast();
  const { language, tPandalName, tRegion, t } = useLanguage();

  const [selectedToId, setSelectedToId] = useState<number>(initialToId);
  const [fromName, setFromName] = useState<string>(initialFromName);
  const [userCoords, setUserCoords] = useState<{ lat?: number; lon?: number }>({
    lat: initialLat,
    lon: initialLon,
  });
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetPandal, setTargetPandal] = useState<Pandal | null>(null);

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locating, setLocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside click for autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch routes whenever origin coordinates or target pandal change
  useEffect(() => {
    let isCancelled = false;

    async function calculate() {
      setLoading(true);
      try {
        const res = await getRoutes({
          toPandalId: selectedToId,
          fromName: fromName,
          fromLat: userCoords.lat,
          fromLon: userCoords.lon,
          isCurrentLocation: fromName.toLowerCase().includes('location') || fromName.toLowerCase().includes('gps'),
        });
        if (!isCancelled) {
          setRoutes(res.routes);
          setTargetPandal(res.targetPandal);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Routing calculation failed', err);
          showToast('Could not calculate route for this pandal', 'error');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    calculate();

    return () => {
      isCancelled = true;
    };
  }, [selectedToId, userCoords.lat, userCoords.lon, fromName, showToast]);

  // Handle typing in From input with instant suggestions
  const handleFromInputChange = (text: string) => {
    setFromName(text);
    if (text.trim().length >= 1) {
      const results = searchKolkataLocations(text);
      setSuggestions(results);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  // Select a suggestion from autocomplete
  const handleSelectSuggestion = (s: LocationSuggestion) => {
    setFromName(s.name);
    setUserCoords({ lat: s.lat, lon: s.lon });
    setShowDropdown(false);
    showToast(`📍 Origin set to ${s.name}`, 'success');
  };

  // Resolve freeform location string if user submits or presses Enter
  const handleResolveCustomOrigin = async () => {
    if (!fromName.trim()) return;
    setShowDropdown(false);
    setLoading(true);
    try {
      const resolved = await resolveLocationCoordinates(fromName);
      setUserCoords({ lat: resolved.lat, lon: resolved.lon });
      if (resolved.source !== 'fallback') {
        setFromName(resolved.name);
        showToast(`📍 Matched location: ${resolved.name}`, 'success');
      } else {
        showToast(`📍 Routing from ${fromName}`, 'info');
      }
    } catch (e) {
      console.warn('Geocoding error', e);
    } finally {
      setLoading(false);
    }
  };

  // GPS Locate Me Handler
  const handleLocateMe = async () => {
    setLocating(true);
    showToast(t('locating', 'Locating your position in Kolkata...'), 'info');

    try {
      const loc = await detectUserLocation({ preferHighAccuracy: true, timeoutMs: 6000 });
      setUserCoords({ lat: loc.lat, lon: loc.lon });
      setFromName(language === 'bn' ? `আমার অবস্থান (${loc.landmark})` : `My Location (${loc.landmark})`);
      showToast(`📍 ${t('location_detected', 'Location pinned')}: ${loc.landmark}`, 'success');
    } catch (err: any) {
      console.warn('Geolocation error', err);
      showToast('Could not access GPS. Please choose a starting point or Metro station.', 'warning');
    } finally {
      setLocating(false);
    }
  };

  // Quick Hub Selector
  const handleSelectQuickHub = (hubName: string, lat: number, lon: number) => {
    setFromName(hubName);
    setUserCoords({ lat, lon });
    setShowDropdown(false);
    showToast(`📍 Starting point: ${hubName}`, 'success');
  };

  // Calculate direct distance from origin to target
  const directDistanceKm =
    userCoords.lat && userCoords.lon && targetPandal
      ? calculateDistance(userCoords.lat, userCoords.lon, targetPandal.latitude, targetPandal.longitude)
      : null;

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div className="eyebrow">{language === 'bn' ? 'স্মার্ট পরিবহন নির্দেশিকা' : 'Intelligent Festive Transit'}</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {t('smart_route_calc', 'Smart Route Finder')}
          </h1>
          <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
            {t('route_subtitle', 'Compare Metro, shared autos, and walking corridors from your location to avoid Kolkata Durga Puja traffic barricades.')}
          </p>
        </div>

        {/* Origin & Destination Bar */}
        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(23,18,15,0.06)',
            marginBottom: '32px',
          }}
        >
          <div className="search-inputs-grid" style={{ alignItems: 'flex-end' }}>
            {/* FROM: Dynamic Autocomplete & GPS */}
            <div className="input-field-group" style={{ position: 'relative' }} ref={dropdownRef}>
              <label className="input-field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <IconMapPin size={13} color="#B08D57" /> {t('origin', 'From (Your Origin Point)')}
                </span>
                {userCoords.lat && userCoords.lon && (
                  <span style={{ fontSize: '0.7rem', color: '#155799', fontWeight: 600 }}>
                    GPS: {userCoords.lat.toFixed(3)}°, {userCoords.lon.toFixed(3)}°
                  </span>
                )}
              </label>

              <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                <input
                  type="text"
                  value={fromName}
                  onChange={e => handleFromInputChange(e.target.value)}
                  onFocus={() => {
                    if (fromName.trim().length >= 1) {
                      setSuggestions(searchKolkataLocations(fromName));
                      setShowDropdown(true);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleResolveCustomOrigin();
                    }
                  }}
                  placeholder={language === 'bn' ? 'যেকোনো স্থান, মেট্রো স্টেশন বা ল্যান্ডমার্ক লিখুন...' : 'Type any Kolkata location, metro station, landmark...'}
                />

                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locating}
                  className="badge badge-region"
                  style={{ cursor: 'pointer', border: 'none', background: locating ? '#E5DED5' : undefined }}
                  title="Detect My Location via GPS"
                >
                  <IconNavigation size={12} /> {locating ? (language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Locating...') : 'GPS'}
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 150,
                    background: '#FFF',
                    border: '1px solid var(--border-gold)',
                    borderRadius: '6px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    marginTop: '4px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {suggestions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSuggestion(s)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm-cream)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#FFF')}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {s.type === 'metro' && '🚇 '}
                          {s.type === 'hub' && '🚆 '}
                          {s.type === 'landmark' && '📍 '}
                          {s.type === 'pandal' && '🪔 '}
                          {s.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                          {s.subtitle}
                        </div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          textTransform: 'uppercase',
                          background: s.type === 'metro' ? '#E3F2FD' : '#FAF7F2',
                          color: s.type === 'metro' ? '#155799' : 'var(--taupe)',
                        }}
                      >
                        {s.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TO: Destination Pandal */}
            <div className="input-field-group">
              <label className="input-field-label">
                <IconRoute size={13} color="#B3261E" /> {t('destination', 'To (Destination Pandal)')}
              </label>
              <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                <select
                  value={selectedToId}
                  onChange={e => setSelectedToId(parseInt(e.target.value, 10))}
                  style={{ cursor: 'pointer' }}
                >
                  {pandals.map(p => (
                    <option key={p.id} value={p.id}>
                      {tPandalName(p)} ({tRegion(p.region)}) • 🚇 {p.nearestMetro}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Find Route Action Button */}
            <div>
              <button
                type="button"
                onClick={handleResolveCustomOrigin}
                disabled={loading}
                className="btn btn-vermilion"
                style={{ height: '46px', width: '100%', whiteSpace: 'nowrap', padding: '0 20px', justifyContent: 'center' }}
              >
                <IconSparkles size={16} /> {t('calculate_route', 'Find Route')}
              </button>
            </div>
          </div>

          {/* Quick Origin Hub Chips */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--taupe)' }}>
                {language === 'bn' ? 'প্রধান প্রারম্ভিক হাবসমূহ:' : 'Popular Starting Hubs:'}
              </span>

              <button
                type="button"
                onClick={handleLocateMe}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid #B3261E',
                  background: 'rgba(179, 38, 30, 0.08)',
                  color: '#B3261E',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <IconNavigation size={11} /> {language === 'bn' ? 'আমার বর্তমান অবস্থান' : 'My Current Location'}
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickHub('Esplanade Metro Station', 22.5649, 88.3517)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: '#FFF',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                🚇 এসপ্ল্যানেড (সেন্ট্রাল)
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickHub('Howrah Railway Station', 22.5855, 88.3433)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: '#FFF',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                🚆 হাওড়া স্টেশন
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickHub('Sealdah Railway Station', 22.5670, 88.3715)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: '#FFF',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                🚆 শিয়ালদহ স্টেশন
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickHub('Shyambazar 5-Point Crossing', 22.6022, 88.3714)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: '#FFF',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                🪔 শ্যামবাজার (উত্তর)
              </button>
            </div>
          </div>
        </div>

        {/* Results Layout: Split comparison + Leaflet Map */}
        <div className="route-responsive-layout">
          {/* Left Column: Route comparison cards */}
          <div>
            {loading ? (
              <div
                style={{
                  padding: '60px 24px',
                  textAlign: 'center',
                  background: '#FFF',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)',
                  color: 'var(--taupe)',
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
                  {language === 'bn' ? `"${fromName}" থেকে সেরা রুট গণনা করা হচ্ছে...` : `Computing Best Estimated Routes from "${fromName}"...`}
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  {language === 'bn' ? 'মেট্রো লাইন, হাঁটার দূরত্ব এবং ট্রাফিক বিবেচনা করা হচ্ছে।' : 'Evaluating Metro line transfers, walking distances, and Kolkata Police barricade corridors.'}
                </div>
              </div>
            ) : targetPandal ? (
              <RouteComparison
                routes={routes}
                targetPandalName={tPandalName(targetPandal)}
              />
            ) : null}
          </div>

          {/* Right Column: Spatial Map & Corridor Overview */}
          <div>
            <div style={{ position: 'sticky', top: '90px' }}>
              <div
                style={{
                  background: '#FFF',
                  padding: '18px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-gold)',
                  marginBottom: '16px',
                  boxShadow: '0 4px 16px rgba(23,18,15,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div className="eyebrow" style={{ margin: 0, fontSize: '0.68rem' }}>{t('destination', 'Destination')}</div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '2px 0 0' }}>
                      {tPandalName(targetPandal)}
                    </h3>
                  </div>
                  {directDistanceKm !== null && (
                    <span
                      style={{
                        background: 'var(--warm-cream)',
                        border: '1px solid var(--border-gold)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--vermilion)',
                      }}
                    >
                      ~{directDistanceKm.toFixed(1)} {language === 'bn' ? 'কিমি সরাসরি' : 'km direct'}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--taupe)', marginTop: '4px' }}>
                  🚇 {t('nearest_metro', 'Nearest Metro')}: <strong>{targetPandal?.nearestMetro}</strong> (~{targetPandal?.walkingDistanceM}{language === 'bn' ? 'মিঃ হাঁটা' : 'm walk'})
                </div>

                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                  📍 {t('origin', 'Origin')}: <strong>{fromName}</strong>
                </div>
              </div>

              {targetPandal && (
                <LeafletMap
                  pandals={[targetPandal]}
                  metroStations={metroStations}
                  center={[targetPandal.latitude, targetPandal.longitude]}
                  zoom={14}
                  selectedPandalId={targetPandal.id}
                  userLocation={userCoords.lat && userCoords.lon ? [userCoords.lat, userCoords.lon] : undefined}
                  height="460px"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
