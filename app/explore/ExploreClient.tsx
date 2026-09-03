'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Pandal, MetroStation } from '../../lib/types';
import PandalCard from '../../components/PandalCard';
import LeafletMap from '../../components/LeafletMap';
import {
  IconSearch,
  IconSparkles,
  IconMetro,
  IconNavigation,
  IconRoute,
  IconWalk,
  IconMapPin,
  IconEye,
} from '../../components/Icons';
import CrowdBadge from '../../components/CrowdBadge';
import { calculateDistance } from '../../lib/geo';
import { formatDistance } from '../../lib/format';

interface ExploreClientProps {
  initialPandals: Pandal[];
  metroStations: MetroStation[];
}

export default function ExploreClient({
  initialPandals,
  metroStations,
}: ExploreClientProps) {
  // Main view toggle: Standard View vs Metro Reference View
  const [metroReferenceMode, setMetroReferenceMode] = useState(false);
  const [selectedMetroLine, setSelectedMetroLine] = useState('ALL');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedMetro, setSelectedMetro] = useState('ALL');
  const [selectedCrowd, setSelectedCrowd] = useState('ALL');
  const [famousOnly, setFamousOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'nearest_metro' | 'metro_distance'>('popularity');
  const [selectedPandalId, setSelectedPandalId] = useState<number | undefined>(undefined);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [displayCount, setDisplayCount] = useState(32);

  // Extract unique regions
  const regions = useMemo(() => {
    return Array.from(new Set(initialPandals.map(p => p.region))).filter(Boolean);
  }, [initialPandals]);

  // Extract unique metro stations present in pandal dataset
  const presentMetros = useMemo(() => {
    return Array.from(new Set(initialPandals.map(p => p.nearestMetro))).filter(Boolean).sort();
  }, [initialPandals]);

  // Selected metro station object if user filtered by a specific metro
  const activeMetroStation = useMemo(() => {
    if (selectedMetro === 'ALL') return null;
    return metroStations.find(m => m.name.toLowerCase() === selectedMetro.toLowerCase()) || null;
  }, [selectedMetro, metroStations]);

  // Filtered and Sorted Pandals
  const filteredPandals = useMemo(() => {
    let result = [...initialPandals];

    // Filter by Metro Line if in Metro Reference Mode
    if (metroReferenceMode && selectedMetroLine !== 'ALL') {
      const stationsOnLine = metroStations
        .filter(m => m.lineCode === selectedMetroLine)
        .map(m => m.name.toLowerCase());

      result = result.filter(p =>
        stationsOnLine.some(st => p.nearestMetro.toLowerCase().includes(st))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.theme.toLowerCase().includes(q) ||
          p.nearestMetro.toLowerCase().includes(q)
      );
    }

    if (selectedRegion !== 'ALL') {
      result = result.filter(p => p.region.toLowerCase() === selectedRegion.toLowerCase());
    }

    if (selectedMetro !== 'ALL') {
      result = result.filter(
        p =>
          p.nearestMetro.toLowerCase().includes(selectedMetro.toLowerCase()) ||
          (activeMetroStation &&
            calculateDistance(
              activeMetroStation.latitude,
              activeMetroStation.longitude,
              p.latitude,
              p.longitude
            ) <= 2.5)
      );
    }

    if (selectedCrowd !== 'ALL') {
      result = result.filter(p => p.crowdLevel === selectedCrowd);
    }

    if (famousOnly) {
      result = result.filter(p => p.famous);
    }

    // Sorting
    if (metroReferenceMode && activeMetroStation) {
      // If a specific metro station is selected in Metro Reference mode, sort by distance from that station
      result.sort((a, b) => {
        const distA = calculateDistance(
          activeMetroStation.latitude,
          activeMetroStation.longitude,
          a.latitude,
          a.longitude
        );
        const distB = calculateDistance(
          activeMetroStation.latitude,
          activeMetroStation.longitude,
          b.latitude,
          b.longitude
        );
        return distA - distB;
      });
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'nearest_metro') {
      result.sort((a, b) => a.nearestMetro.localeCompare(b.nearestMetro));
    } else {
      result.sort((a, b) => b.popularityScore - a.popularityScore);
    }

    return result;
  }, [
    initialPandals,
    metroReferenceMode,
    selectedMetroLine,
    metroStations,
    searchQuery,
    selectedRegion,
    selectedMetro,
    activeMetroStation,
    selectedCrowd,
    famousOnly,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRegion('ALL');
    setSelectedMetro('ALL');
    setSelectedMetroLine('ALL');
    setSelectedCrowd('ALL');
    setFamousOnly(false);
    setSortBy('popularity');
    setDisplayCount(32);
  };

  const visiblePandals = useMemo(() => {
    return filteredPandals.slice(0, displayCount);
  }, [filteredPandals, displayCount]);

  return (
    <div className="explore-layout">
      {/* Sticky Mobile View Switcher Dock - Always Accessible */}
      <div className="explore-mobile-switcher">
        <div className="explore-toggle-pill">
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className={`explore-toggle-btn ${mobileView === 'list' ? 'active' : ''}`}
          >
            📋 List View ({filteredPandals.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`explore-toggle-btn ${mobileView === 'map' ? 'active' : ''}`}
          >
            🗺️ Interactive Map
          </button>
        </div>
      </div>

      {/* Left List & Filter Panel */}
      <div className={`explore-list-panel ${mobileView === 'map' ? 'mobile-hidden' : ''}`}>
        {/* Campaign Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '20px',
            padding: '28px 24px',
            background: 'var(--dark-bg)',
            color: '#FFF',
            border: '1px solid var(--border-gold)',
            boxShadow: '0 8px 24px rgba(23,18,15,0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/images/durga/durga-10.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3,
              filter: 'contrast(1.15)',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(23,18,15,0.92) 0%, rgba(23,18,15,0.65) 100%)' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="eyebrow" style={{ color: 'var(--soft-gold)', marginBottom: '4px' }}>
              Verified Spatial Directory
            </div>
            <h1 style={{ color: '#FFF', fontSize: '1.85rem', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
              Explore 248 Kolkata Pandals
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--stone)', maxWidth: '480px' }}>
              Filter by locality, live crowd, or toggle <strong>Metro Reference View</strong> to hop station-by-station. Showing <strong>{filteredPandals.length}</strong> pandals.
            </p>
          </div>
        </div>

        {/* METRO REFERENCE VIEW TOGGLE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: metroReferenceMode ? 'rgba(179, 38, 30, 0.05)' : 'var(--warm-cream)',
            border: metroReferenceMode ? '1.5px solid #B3261E' : '1px solid var(--border-gold)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '18px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: metroReferenceMode ? '#B3261E' : '#155799',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
              }}
            >
              🚇
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--foreground)' }}>
                Explore by Metro Reference
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                {metroReferenceMode
                  ? 'Active: Pandals referenced with nearest station, walking time & Google Maps links'
                  : 'Toggle to organize pandals around Kolkata Metro stations'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextState = !metroReferenceMode;
              setMetroReferenceMode(nextState);
              if (nextState) {
                setSortBy('nearest_metro');
              } else {
                setSortBy('popularity');
              }
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: metroReferenceMode ? '1.5px solid #B3261E' : '1px solid var(--border)',
              background: metroReferenceMode ? '#B3261E' : '#FFF',
              color: metroReferenceMode ? '#FFF' : 'var(--foreground)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: metroReferenceMode ? '0 3px 10px rgba(179,38,30,0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {metroReferenceMode ? '✓ Active' : 'Turn ON'}
          </button>
        </div>

        {/* Metro Line Selector (shown when Metro Reference Mode is ON) */}
        {metroReferenceMode && (
          <div
            style={{
              background: '#FFF',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--taupe)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Filter by Metro Line:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Lines' },
                { id: 'BLUE', label: '🔵 Blue Line (North-South)' },
                { id: 'GREEN', label: '🟢 Green Line (East-West)' },
                { id: 'PURPLE', label: '🟣 Purple Line' },
                { id: 'ORANGE', label: '🟠 Orange Line' },
              ].map(line => {
                const isActive = selectedMetroLine === line.id;
                return (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => setSelectedMetroLine(line.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: isActive ? '1px solid #155799' : '1px solid var(--border)',
                      background: isActive ? '#E3F2FD' : '#FFF',
                      color: isActive ? '#155799' : 'var(--foreground)',
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {line.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="input-field-wrapper" style={{ background: '#FFF', padding: '10px 14px', marginBottom: '14px' }}>
          <IconSearch size={18} color="#B08D57" />
          <input
            type="text"
            placeholder={
              metroReferenceMode
                ? 'Search pandal or station (e.g. Kalighat, Shyambazar, Dum Dum)...'
                : 'Search pandal name, locality, theme, metro...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.86rem' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: '#888' }}>✕</button>
          )}
        </div>

        {/* Filters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          {/* Region */}
          <div className="input-field-group">
            <label className="input-field-label">Region</label>
            <div className="input-field-wrapper" style={{ padding: '6px 10px' }}>
              <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>
                <option value="ALL">All Regions</option>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Metro Station */}
          <div className="input-field-group">
            <label className="input-field-label">
              <IconMetro size={12} color="#155799" /> Near Metro
            </label>
            <div className="input-field-wrapper" style={{ padding: '6px 10px' }}>
              <select value={selectedMetro} onChange={e => setSelectedMetro(e.target.value)}>
                <option value="ALL">All Stations</option>
                {presentMetros.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Crowd Level */}
          <div className="input-field-group">
            <label className="input-field-label">Crowd Level</label>
            <div className="input-field-wrapper" style={{ padding: '6px 10px' }}>
              <select value={selectedCrowd} onChange={e => setSelectedCrowd(e.target.value)}>
                <option value="ALL">Any Crowd</option>
                <option value="Low">Low Crowd</option>
                <option value="Moderate">Moderate</option>
                <option value="High">Heavy Rush</option>
              </select>
            </div>
          </div>

          {/* Sort By */}
          <div className="input-field-group">
            <label className="input-field-label">Sort By</label>
            <div className="input-field-wrapper" style={{ padding: '6px 10px' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                <option value="popularity">Popularity Score</option>
                <option value="name">Name (A-Z)</option>
                <option value="nearest_metro">Nearest Metro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Toggle Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setFamousOnly(!famousOnly)}
            className={`badge ${famousOnly ? 'badge-famous' : 'badge-region'}`}
            style={{ cursor: 'pointer', padding: '5px 10px', border: famousOnly ? '1.5px solid #B08D57' : '1px solid var(--border)' }}
          >
            <IconSparkles size={12} color="#B08D57" /> Iconic Pujas Only
          </button>

          {(selectedRegion !== 'ALL' || selectedMetro !== 'ALL' || selectedMetroLine !== 'ALL' || selectedCrowd !== 'ALL' || famousOnly || searchQuery) && (
            <button
              onClick={resetFilters}
              style={{ fontSize: '0.74rem', color: 'var(--vermilion)', fontWeight: 600, marginLeft: 'auto', textDecoration: 'underline' }}
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Pandals Grid */}
        {filteredPandals.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', background: '#FFF', borderRadius: '6px', border: '1px dashed var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Pandals Match Your Filter</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '16px' }}>
              Try loosening your search terms or resetting the metro/region filters.
            </p>
            <button onClick={resetFilters} className="btn btn-primary btn-sm">
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {visiblePandals.map(pandal => {
              if (metroReferenceMode) {
                // In Metro Reference View, render an enhanced card with prominent Metro and Google Maps directions
                const walkMins = Math.max(1, Math.round(pandal.walkingDistanceM / 80));
                const isShortWalk = pandal.walkingDistanceM <= 800;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                  pandal.nearestMetro + ' Metro Station, Kolkata'
                )}&destination=${pandal.latitude},${pandal.longitude}`;

                return (
                  <div
                    key={pandal.id}
                    onClick={() => setSelectedPandalId(pandal.id)}
                    style={{
                      background: '#FFF',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 4px 14px rgba(23,18,15,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    className="card-luxury"
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <span className="badge badge-region" style={{ fontSize: '0.65rem' }}>
                          {pandal.region}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {pandal.famous && (
                            <span className="badge badge-famous" style={{ fontSize: '0.62rem', padding: '2px 5px' }}>
                              ★ Iconic
                            </span>
                          )}
                          <CrowdBadge level={pandal.crowdLevel} />
                        </div>
                      </div>

                      {/* Pandal Name */}
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2px 0 6px', fontFamily: 'var(--font-serif)' }}>
                        <Link href={`/pandal/${pandal.id}`} style={{ color: 'var(--foreground)' }}>
                          {pandal.name}
                        </Link>
                      </h4>

                      {/* Metro Proximity Pill */}
                      <div
                        style={{
                          background: 'rgba(21, 87, 153, 0.08)',
                          border: '1px solid rgba(21, 87, 153, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          margin: '6px 0 10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#155799', fontWeight: 700, fontSize: '0.78rem' }}>
                          <IconMetro size={13} color="#155799" />
                          <span>{pandal.nearestMetro} Metro Station</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#555', fontSize: '0.72rem', marginTop: '3px' }}>
                          <IconWalk size={12} />
                          <span>{formatDistance(pandal.walkingDistanceM)} ({isShortWalk ? `~${walkMins} mins walk` : 'Toto recommended'})</span>
                        </div>
                      </div>

                      {/* Theme */}
                      <p style={{ fontSize: '0.78rem', color: '#4A423B', margin: '4px 0 12px', lineHeight: 1.4 }}>
                        <strong>Theme:</strong> {pandal.theme || 'Traditional Sabeki Puja Pratima'}
                      </p>
                    </div>

                    {/* Bottom CTA Actions */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-vermilion btn-sm"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '6px 8px' }}
                          title={`Navigate from ${pandal.nearestMetro} Metro to ${pandal.name} on Google Maps`}
                        >
                          <IconNavigation size={12} /> Google Maps from Metro
                        </a>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link
                          href={`/pandal/${pandal.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '5px 8px' }}
                        >
                          <IconEye size={12} /> Details
                        </Link>
                        <Link
                          href={`/route?to=${pandal.id}&fromName=${encodeURIComponent(pandal.nearestMetro + ' Metro Station')}&lat=${pandal.latitude}&lon=${pandal.longitude}`}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '5px 8px' }}
                        >
                          <IconRoute size={12} /> Route
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard Pandal Card
              return (
                <div
                  key={pandal.id}
                  onClick={() => setSelectedPandalId(pandal.id)}
                >
                  <PandalCard pandal={pandal} />
                </div>
              );
            })}
          </div>

          {visiblePandals.length < filteredPandals.length && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                type="button"
                onClick={() => setDisplayCount(prev => prev + 32)}
                className="btn btn-secondary btn-lg"
                style={{
                  minWidth: '260px',
                  background: '#FFF',
                  borderColor: 'var(--border-gold)',
                  boxShadow: '0 4px 14px rgba(23,18,15,0.06)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Load More Pandals ({visiblePandals.length} of {filteredPandals.length})
              </button>
            </div>
          )}
        </>
      )}
      </div>

      {/* Right Map Panel */}
      <div className={`explore-map-panel ${mobileView === 'list' ? 'mobile-hidden' : ''}`}>
        <LeafletMap
          pandals={filteredPandals}
          metroStations={metroStations}
          selectedPandalId={selectedPandalId}
          onPandalSelect={p => setSelectedPandalId(p.id)}
          height="100%"
          userLocation={activeMetroStation ? [activeMetroStation.latitude, activeMetroStation.longitude] : undefined}
        />
      </div>
    </div>
  );
}
