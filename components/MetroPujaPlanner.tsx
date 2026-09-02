'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Pandal, MetroStation, FoodStall } from '../lib/types';
import { GENERATED_FOOD_STALLS } from '../lib/generated-food';
import { GENERATED_PANDAL_EATERIES } from '../lib/generated-eateries';
import { formatDistance } from '../lib/format';
import { calculateDistance, estimateWalkMinutes } from '../lib/geo';
import { detectUserLocation } from '../lib/location-service';
import { useToast } from '../lib/toast-context';
import {
  IconMetro,
  IconNavigation,
  IconSparkles,
  IconWalk,
  IconEye,
  IconRoute,
  IconMapPin,
  IconChevronRight,
} from './Icons';
import CrowdBadge from './CrowdBadge';
import LeafletMap from './LeafletMap';

interface MetroPujaPlannerProps {
  metroStations: MetroStation[];
  pandals: Pandal[];
  compact?: boolean;
}

export default function MetroPujaPlanner({ metroStations, pandals, compact = false }: MetroPujaPlannerProps) {
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<number>(() => {
    // Default to Shyambazar (famous North Kolkata hub) or Kalighat
    const defaultStation = metroStations.find(m => m.name.toLowerCase().includes('shyambazar')) || metroStations[0];
    return defaultStation?.id || 1;
  });
  const [categoryTab, setCategoryTab] = useState<'pandals' | 'food'>('pandals');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(compact ? 2.5 : 2.5);
  const [sortBy, setSortBy] = useState<'distance' | 'famous'>('distance');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { showToast } = useToast();

  const handleDetectNearestMetro = async () => {
    setDetectingLocation(true);
    showToast('Locating your position in Kolkata...', 'info');
    try {
      const loc = await detectUserLocation();
      setSelectedStationId(loc.nearestMetroId);
      setSelectedLine('ALL');
      showToast(`📍 Nearest Metro found: ${loc.nearestMetroName} (~${formatDistance(loc.nearestMetroDistanceM)})`, 'success');
    } catch (err: any) {
      showToast('Could not detect location. Please select your station from the list.', 'warning');
    } finally {
      setDetectingLocation(false);
    }
  };

  // Filter stations by selected metro line and search query
  const filteredStations = useMemo(() => {
    return metroStations.filter(m => {
      const matchesLine =
        selectedLine === 'ALL' ||
        (selectedLine === 'BLUE' && m.lineCode === 'BLUE') ||
        (selectedLine === 'GREEN' && m.lineCode === 'GREEN') ||
        (selectedLine === 'PURPLE' && m.lineCode === 'PURPLE') ||
        (selectedLine === 'ORANGE' && m.lineCode === 'ORANGE');

      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        m.bengaliName.toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchesLine && matchesSearch;
    });
  }, [metroStations, selectedLine, searchQuery]);

  // Selected station object
  const selectedStation = useMemo(() => {
    return metroStations.find(m => m.id === selectedStationId) || metroStations[0];
  }, [metroStations, selectedStationId]);

  // Pre-calculate surrounding pandals count for all stations
  const stationPandalsCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const station of metroStations) {
      const count = pandals.filter(p => {
        const dist = calculateDistance(station.latitude, station.longitude, p.latitude, p.longitude);
        return dist <= 2.5 || p.nearestMetro.toLowerCase().includes(station.name.toLowerCase());
      }).length;
      map.set(station.id, count);
    }
    return map;
  }, [metroStations, pandals]);

  // Calculate nearby pandals for the selected station
  const nearbyPandals = useMemo(() => {
    if (!selectedStation) return [];

    const list = pandals
      .map(p => {
        const directDistKm = calculateDistance(
          selectedStation.latitude,
          selectedStation.longitude,
          p.latitude,
          p.longitude
        );
        const distanceM = Math.round(directDistKm * 1000);
        const walkMins = estimateWalkMinutes(distanceM);
        const isOfficiallyNearest = p.nearestMetro.toLowerCase().includes(selectedStation.name.toLowerCase());

        return {
          ...p,
          directDistKm,
          distanceM,
          walkMins,
          isOfficiallyNearest,
        };
      })
      .filter(p => p.directDistKm <= maxDistanceKm || p.isOfficiallyNearest);

    if (sortBy === 'distance') {
      list.sort((a, b) => a.distanceM - b.distanceM);
    } else {
      list.sort((a, b) => {
        if (a.famous && !b.famous) return -1;
        if (!a.famous && b.famous) return 1;
        return a.distanceM - b.distanceM;
      });
    }

    return list;
  }, [selectedStation, pandals, maxDistanceKm, sortBy]);

  // Calculate nearby famous food stalls and CSV eateries for the selected station
  const nearbyFoodStalls = useMemo(() => {
    if (!selectedStation) return [];

    const seenNames = new Set<string>();
    const list: Array<{
      id: string;
      name: string;
      bengaliName?: string;
      category: string;
      famousDish: string;
      recommendedItems: string[];
      description?: string;
      priceForTwo: string;
      latitude: number;
      longitude: number;
      distanceM: number;
      walkMins: number;
    }> = [];

    // 1. Add curated food stalls & cabins
    for (const stall of GENERATED_FOOD_STALLS) {
      const directDistKm = calculateDistance(
        selectedStation.latitude,
        selectedStation.longitude,
        stall.latitude,
        stall.longitude
      );
      const distanceM = Math.round(directDistKm * 1000);
      const walkMins = estimateWalkMinutes(distanceM);
      const isNamedMetro = stall.nearestMetro.toLowerCase().includes(selectedStation.name.toLowerCase());

      if (distanceM <= 2800 || isNamedMetro) {
        const key = stall.name.toLowerCase().trim();
        seenNames.add(key);
        list.push({
          id: stall.id,
          name: stall.name,
          bengaliName: stall.bengaliName,
          category: stall.category,
          famousDish: stall.famousDish,
          recommendedItems: stall.recommendedItems,
          description: stall.description,
          priceForTwo: stall.priceForTwo,
          latitude: stall.latitude,
          longitude: stall.longitude,
          distanceM,
          walkMins,
        });
      }
    }

    // 2. Add all unique eateries from the CSV dataset within 2.5 km
    for (const eatery of GENERATED_PANDAL_EATERIES) {
      const key = eatery.cleanName.toLowerCase().trim();
      if (seenNames.has(key)) continue;

      const directDistKm = calculateDistance(
        selectedStation.latitude,
        selectedStation.longitude,
        eatery.latitude,
        eatery.longitude
      );
      const distanceM = Math.round(directDistKm * 1000);
      if (distanceM <= 2500) {
        seenNames.add(key);
        list.push({
          id: `csv-${eatery.pandalId}-${eatery.cleanName}`,
          name: eatery.cleanName,
          bengaliName: '',
          category: eatery.cuisineType,
          famousDish: eatery.bestRecommendedItem,
          recommendedItems: [eatery.bestRecommendedItem],
          description: `Popular dining destination located near ${eatery.pandalName}.`,
          priceForTwo: `₹${eatery.budgetForTwo} for two`,
          latitude: eatery.latitude,
          longitude: eatery.longitude,
          distanceM,
          walkMins: estimateWalkMinutes(distanceM),
        });
      }
    }

    list.sort((a, b) => a.distanceM - b.distanceM);
    return list;
  }, [selectedStation]);

  const displayedPandals = compact ? nearbyPandals.slice(0, 4) : nearbyPandals;
  const displayedFoodStalls = compact ? nearbyFoodStalls.slice(0, 4) : nearbyFoodStalls;

  const getLineBadgeColor = (code: string) => {
    switch (code) {
      case 'BLUE':
        return { bg: '#E3F2FD', text: '#155799', border: '#90CAF9' };
      case 'GREEN':
        return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
      case 'PURPLE':
        return { bg: '#F3E5F5', text: '#7B1FA2', border: '#CE93D8' };
      case 'ORANGE':
        return { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' };
      default:
        return { bg: '#FAF7F2', text: '#756D65', border: '#E5DED5' };
    }
  };

  const selectedLineBadge = selectedStation ? getLineBadgeColor(selectedStation.lineCode) : null;

  return (
    <section
      id="metro-planner-section"
      style={{
        padding: compact ? '64px 0' : '80px 0',
        background: '#FAF7F2',
        borderTop: '1px solid var(--border-gold)',
        borderBottom: '1px solid var(--border-gold)',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: compact ? '720px' : '840px', margin: '0 auto 28px' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            {compact ? 'Fast Festive Transit' : 'Station-by-Station Hopping Guide'}
          </div>
          <h2 style={{ fontSize: compact ? 'clamp(1.8rem, 3.5vw, 2.4rem)' : 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>
            Plan Puja with Kolkata Metro
          </h2>
          <div className="hero-accent-line" style={{ margin: '10px auto 14px' }} />
          <p style={{ color: 'var(--taupe)', fontSize: compact ? '0.9rem' : '0.98rem', lineHeight: 1.5 }}>
            {compact
              ? 'Tap the Metro station you are on to discover nearest pandals and famous food stalls within walking distance with direct Google Maps navigation.'
              : 'Select the Metro station you are currently at or arriving in. Instantly discover iconic pandals and legendary food cabins with curated "What to Have" dishes and direct Google Maps directions.'}
          </p>
        </div>

        {/* Metro Line Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          {[
            { id: 'ALL', label: `All Metros (${metroStations.length})` },
            { id: 'BLUE', label: '🔵 Blue Line (North-South)' },
            { id: 'GREEN', label: '🟢 Green Line (East-West)' },
            { id: 'PURPLE', label: '🟣 Purple Line' },
            { id: 'ORANGE', label: '🟠 Orange Line' },
          ].map(line => {
            const isActive = selectedLine === line.id;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => setSelectedLine(line.id)}
                style={{
                  padding: compact ? '6px 14px' : '8px 16px',
                  borderRadius: '20px',
                  border: isActive ? '1.5px solid #B3261E' : '1px solid var(--border)',
                  background: isActive ? '#B3261E' : '#FFF',
                  color: isActive ? '#FFF' : 'var(--foreground)',
                  fontWeight: 600,
                  fontSize: compact ? '0.75rem' : '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(179,38,30,0.25)' : 'none',
                }}
              >
                {line.label}
              </button>
            );
          })}

          {/* Nearest Metro to User Location Button */}
          <button
            type="button"
            onClick={handleDetectNearestMetro}
            disabled={detectingLocation}
            style={{
              padding: compact ? '6px 14px' : '8px 16px',
              borderRadius: '20px',
              border: '1.5px solid #B08D57',
              background: '#FFFDF9',
              color: '#8D5B00',
              fontWeight: 700,
              fontSize: compact ? '0.75rem' : '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(176,141,87,0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            <IconNavigation size={12} color="#B3261E" />
            <span>{detectingLocation ? 'Locating...' : '📍 Nearest Metro to Me'}</span>
          </button>
        </div>

        {/* Search Bar for Stations */}
        {!compact && (
          <div style={{ maxWidth: '540px', margin: '0 auto 24px' }}>
            <div className="input-field-wrapper" style={{ background: '#FFF', padding: '10px 16px', borderRadius: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <IconMetro size={16} color="#155799" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search station (e.g. Kalighat, Shyambazar, Sovabazar, Dum Dum, Sealdah)..."
                style={{ fontSize: '0.88rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable / Grid Metro Stations Selector */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: '20px',
            scrollbarWidth: 'thin',
          }}
        >
          {filteredStations.map(station => {
            const isSelected = station.id === selectedStationId;
            const count = stationPandalsCountMap.get(station.id) || 0;
            const badgeStyle = getLineBadgeColor(station.lineCode);

            return (
              <button
                key={station.id}
                type="button"
                onClick={() => setSelectedStationId(station.id)}
                style={{
                  flex: '0 0 auto',
                  minWidth: compact ? '150px' : '170px',
                  padding: compact ? '8px 12px' : '10px 14px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #B3261E' : '1px solid var(--border)',
                  background: isSelected ? '#FFFDF9' : '#FFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? '0 4px 14px rgba(179,38,30,0.15)'
                    : '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: badgeStyle.text,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: count > 0 ? 'rgba(179,38,30,0.08)' : '#F0EDE8',
                      color: count > 0 ? '#B3261E' : 'var(--taupe)',
                    }}
                  >
                    {count} {count === 1 ? 'Puja' : 'Pujas'}
                  </span>
                </div>

                <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: compact ? '0.84rem' : '0.9rem', color: isSelected ? '#7F1712' : 'var(--foreground)' }}>
                  {station.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--taupe)', marginTop: '1px' }}>
                  {station.bengaliName}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Selected Station Banner */}
        {selectedStation && (
          <div
            style={{
              background: '#FFF',
              border: '1px solid var(--border-gold)',
              borderRadius: '8px',
              padding: compact ? '16px 20px' : '22px 24px',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: compact ? '38px' : '44px',
                    height: compact ? '38px' : '44px',
                    borderRadius: '50%',
                    background: selectedLineBadge?.bg || '#E3F2FD',
                    color: selectedLineBadge?.text || '#155799',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: compact ? '1rem' : '1.2rem',
                    fontWeight: 900,
                    border: `1.5px solid ${selectedLineBadge?.border || '#90CAF9'}`,
                  }}
                >
                  🚇
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: compact ? '1.2rem' : '1.35rem', fontWeight: 700, margin: 0 }}>
                      {selectedStation.name} Metro Station
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                      ({selectedStation.bengaliName})
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: selectedLineBadge?.bg,
                        color: selectedLineBadge?.text,
                        border: `1px solid ${selectedLineBadge?.border}`,
                      }}
                    >
                      {selectedStation.line}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--taupe)', marginTop: '3px' }}>
                    First Train: <strong>{selectedStation.opensAt}</strong> • Last Train:{' '}
                    <strong>{selectedStation.closesAt}</strong> • Found{' '}
                    <strong style={{ color: 'var(--vermilion)' }}>{nearbyPandals.length} pandals</strong> &amp;{' '}
                    <strong style={{ color: '#B08D57' }}>{nearbyFoodStalls.length} famous food stalls</strong>
                  </div>
                </div>
              </div>

              {/* View & Filter Actions (Full mode) or Simple link (Compact mode) */}
              {!compact ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Distance Filter */}
                  {categoryTab === 'pandals' && (
                    <select
                      value={maxDistanceKm}
                      onChange={e => setMaxDistanceKm(parseFloat(e.target.value))}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: '#FFF',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={1.0}>🚶 Walking Only (≤ 1.0 km)</option>
                      <option value={2.5}>🚶 + 🛺 Walking &amp; Toto (≤ 2.5 km)</option>
                      <option value={4.0}>🌐 Extended Radius (≤ 4.0 km)</option>
                    </select>
                  )}

                  {/* View Mode Toggle */}
                  {categoryTab === 'pandals' && (
                    <div style={{ display: 'flex', background: '#F0EDE8', padding: '3px', borderRadius: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setViewMode('cards')}
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: viewMode === 'cards' ? '#FFF' : 'transparent',
                          color: viewMode === 'cards' ? 'var(--foreground)' : 'var(--taupe)',
                          boxShadow: viewMode === 'cards' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        📋 Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('map')}
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: viewMode === 'map' ? '#FFF' : 'transparent',
                          color: viewMode === 'map' ? 'var(--foreground)' : 'var(--taupe)',
                          boxShadow: viewMode === 'map' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        🗺️ Map
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={`/metro?station=${selectedStation.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.76rem', padding: '6px 12px' }}
                >
                  View All on Metro Guide →
                </Link>
              )}
            </div>

            {/* TAB SWITCHER: PANDALS VS FOOD STALLS */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setCategoryTab('pandals')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: categoryTab === 'pandals' ? '1.5px solid #B3261E' : '1px solid var(--border)',
                  background: categoryTab === 'pandals' ? '#B3261E' : '#FFF',
                  color: categoryTab === 'pandals' ? '#FFF' : 'var(--foreground)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: categoryTab === 'pandals' ? '0 3px 8px rgba(179,38,30,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🪔</span>
                <span>Nearby Pandals ({nearbyPandals.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryTab('food')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: categoryTab === 'food' ? '1.5px solid #B08D57' : '1px solid var(--border)',
                  background: categoryTab === 'food' ? '#B08D57' : '#FFF',
                  color: categoryTab === 'food' ? '#FFF' : 'var(--foreground)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: categoryTab === 'food' ? '0 3px 8px rgba(176,141,87,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🍢</span>
                <span>Famous Food Stalls &amp; Cabins ({nearbyFoodStalls.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. VIEW: PANDALS (CARDS OR MAP) */}
        {categoryTab === 'pandals' && (
          <>
            {!compact && viewMode === 'map' && selectedStation && (
              <div
                style={{
                  background: '#FFF',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '28px',
                  boxShadow: '0 6px 24px rgba(23,18,15,0.06)',
                }}
              >
                <LeafletMap
                  pandals={nearbyPandals}
                  metroStations={[selectedStation]}
                  center={[selectedStation.latitude, selectedStation.longitude]}
                  zoom={15}
                  height="460px"
                  userLocation={[selectedStation.latitude, selectedStation.longitude]}
                />
                <div style={{ padding: '14px 20px', background: '#FFFDF9', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--taupe)' }}>
                  Blue pin indicates <strong>{selectedStation.name} Metro Station</strong>. Red and gold pins indicate surrounding pandals with clickable Google Maps directions.
                </div>
              </div>
            )}

            {displayedPandals.length === 0 ? (
              <div
                style={{
                  background: '#FFF',
                  border: '1px dashed var(--border-gold)',
                  borderRadius: '8px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--taupe)',
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                  No pandals found within {maxDistanceKm} km of {selectedStation?.name}
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                  Try selecting &quot;Walking &amp; Toto (≤ 2.5 km)&quot; or &quot;Extended Radius (≤ 4.0 km)&quot;.
                </p>
                {!compact && (
                  <button
                    type="button"
                    onClick={() => setMaxDistanceKm(4.0)}
                    className="btn btn-secondary btn-sm"
                  >
                    Expand Radius to 4.0 km
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: compact
                    ? 'repeat(auto-fit, minmax(260px, 1fr))'
                    : 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: compact ? '16px' : '24px',
                }}
              >
                {displayedPandals.map(p => {
                  const isShortWalk = p.distanceM <= 900;
                  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    selectedStation.name + ' Metro Station, Kolkata'
                  )}&destination=${p.latitude},${p.longitude}`;

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: '#FFF',
                        border: '1px solid var(--border-gold)',
                        borderRadius: '8px',
                        padding: compact ? '16px' : '20px',
                        boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      className="card-luxury"
                    >
                      <div>
                        {/* Card Top: Region & Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="badge badge-region" style={{ fontSize: '0.65rem' }}>
                            {p.region}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {p.famous && (
                              <span className="badge badge-famous" style={{ fontSize: '0.62rem', padding: '2px 5px' }}>
                                ★ Iconic
                              </span>
                            )}
                            <CrowdBadge level={p.crowdLevel} />
                          </div>
                        </div>

                        {/* Pandal Name */}
                        <h4 style={{ fontSize: compact ? '1.05rem' : '1.18rem', fontWeight: 700, margin: '2px 0 4px', fontFamily: 'var(--font-serif)' }}>
                          <Link href={`/pandal/${p.id}`} style={{ color: 'var(--foreground)' }}>
                            {p.name}
                          </Link>
                        </h4>

                        {/* Walking Distance / Duration Highlight */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: isShortWalk ? 'rgba(46, 125, 50, 0.08)' : 'rgba(217, 154, 37, 0.08)',
                            color: isShortWalk ? '#1B5E20' : '#8D5B00',
                            border: `1px solid ${isShortWalk ? 'rgba(46, 125, 50, 0.2)' : 'rgba(217, 154, 37, 0.2)'}`,
                            padding: '3px 8px',
                            borderRadius: '14px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            margin: '4px 0 8px',
                          }}
                        >
                          {isShortWalk ? <IconWalk size={12} /> : <IconNavigation size={12} />}
                          <span>
                            {formatDistance(p.distanceM)} ({isShortWalk ? `~${p.walkMins}m walk` : 'Toto/Auto'})
                          </span>
                        </div>

                        {/* Theme */}
                        <p style={{ fontSize: '0.78rem', color: '#4A423B', margin: '4px 0 12px', lineHeight: 1.4 }}>
                          <strong>Theme:</strong> {p.theme || 'Traditional Sabeki Pratima'}
                        </p>
                      </div>

                      {/* Card Bottom CTA Actions */}
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: compact ? '0' : '6px' }}>
                          <a
                            href={googleMapsNavUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-vermilion btn-sm"
                            style={{ flex: '1 1 auto', justifyContent: 'center', fontSize: '0.72rem', padding: '6px 10px' }}
                            title={`Navigate from ${selectedStation.name} Metro to ${p.name} in Google Maps`}
                          >
                            <IconNavigation size={12} /> Directions in Google Maps
                          </a>

                          {compact && (
                            <Link
                              href={`/pandal/${p.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '6px 8px' }}
                              title="View Pandal"
                            >
                              <IconEye size={12} />
                            </Link>
                          )}
                        </div>

                        {!compact && (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                            <Link
                              href={`/pandal/${p.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '5px 8px' }}
                            >
                              <IconEye size={12} /> View Details
                            </Link>

                            <Link
                              href={`/route?to=${p.id}&fromName=${encodeURIComponent(selectedStation.name + ' Metro Station')}&lat=${selectedStation.latitude}&lon=${selectedStation.longitude}`}
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '5px 8px' }}
                            >
                              <IconRoute size={12} /> Transit Route
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 2. VIEW: FAMOUS FOOD STALLS */}
        {categoryTab === 'food' && (
          <div>
            {displayedFoodStalls.length === 0 ? (
              <div
                style={{
                  background: '#FFF',
                  border: '1px dashed var(--border-gold)',
                  borderRadius: '8px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--taupe)',
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                  No famous food stalls registered within 2.5 km of {selectedStation?.name}
                </div>
                <p style={{ fontSize: '0.85rem' }}>
                  Try exploring heritage stations like <strong>Sovabazar, Shyambazar, College Street / MG Road, Esplanade, or Kalighat</strong> for historic food stalls.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: compact
                    ? 'repeat(auto-fit, minmax(260px, 1fr))'
                    : 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: compact ? '16px' : '24px',
                }}
              >
                {displayedFoodStalls.map(stall => {
                  const googleMapsFoodUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    selectedStation.name + ' Metro Station, Kolkata'
                  )}&destination=${stall.latitude},${stall.longitude}`;

                  return (
                    <div
                      key={stall.id}
                      style={{
                        background: '#FFF',
                        border: '1px solid #B08D57',
                        borderRadius: '8px',
                        padding: compact ? '16px' : '20px',
                        boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      className="card-luxury"
                    >
                      <div>
                        {/* Stall Header: Category & Price */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span
                            className="badge"
                            style={{
                              background: '#FFF8E1',
                              color: '#B78103',
                              border: '1px solid #FFE082',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                            }}
                          >
                            🍢 {stall.category}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--taupe)', fontWeight: 600 }}>
                            {stall.priceForTwo}
                          </span>
                        </div>

                        {/* Stall Name */}
                        <h4 style={{ fontSize: compact ? '1.08rem' : '1.22rem', fontWeight: 700, margin: '2px 0', fontFamily: 'var(--font-serif)' }}>
                          {stall.name}
                        </h4>
                        {stall.bengaliName && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--taupe)', marginBottom: '6px' }}>
                            {stall.bengaliName}
                          </div>
                        )}

                        {/* Distance from Station */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(21, 87, 153, 0.08)',
                            color: '#155799',
                            border: '1px solid rgba(21, 87, 153, 0.2)',
                            padding: '3px 8px',
                            borderRadius: '14px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            margin: '4px 0 10px',
                          }}
                        >
                          <IconWalk size={12} />
                          <span>
                            {formatDistance(stall.distanceM)} from {selectedStation.name} (~{stall.walkMins}m walk)
                          </span>
                        </div>

                        {/* WHAT TO HAVE / RECOMMENDED ITEMS BOX */}
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF6EE 100%)',
                            border: '1px solid #E8D9C0',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            margin: '6px 0 12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#B3261E', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <span>★</span>
                            <span>Must Have:</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)', marginTop: '2px' }}>
                            {stall.famousDish}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#666', marginTop: '4px', lineHeight: 1.4 }}>
                            <strong>Also try:</strong> {stall.recommendedItems.slice(0, 3).join(' • ')}
                          </div>
                        </div>

                        {/* Description & Vibe */}
                        <p style={{ fontSize: '0.78rem', color: '#4A423B', margin: '4px 0 12px', lineHeight: 1.4 }}>
                          {stall.description}
                        </p>
                      </div>

                      {/* Card Bottom CTA Actions */}
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '6px' }}>
                        <a
                          href={googleMapsFoodUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-vermilion btn-sm"
                          style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '7px 12px' }}
                          title={`Navigate from ${selectedStation.name} Metro to ${stall.name} in Google Maps`}
                        >
                          <IconNavigation size={13} /> Directions to Stall in Google Maps
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom Banner */}
        {compact ? (
          <div
            style={{
              marginTop: '32px',
              background: '#FFF',
              border: '1.5px solid var(--border-gold)',
              borderRadius: '8px',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 4px 16px rgba(176,141,87,0.1)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--foreground)' }}>
                Showing top near {selectedStation?.name} Metro ({nearbyPandals.length} Pujas • {nearbyFoodStalls.length} Food Stalls)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
                Discover all 45+ Kolkata Metro stations, famous food cabins, and all-night Puja schedules.
              </div>
            </div>

            <Link
              href={`/metro?station=${selectedStation?.id}`}
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 700 }}
            >
              <IconMetro size={15} /> Explore Full Metro Hopping &amp; Food Guide →
            </Link>
          </div>
        ) : (
          <div
            style={{
              marginTop: '44px',
              background: 'linear-gradient(135deg, rgba(179,38,30,0.06) 0%, rgba(176,141,87,0.1) 100%)',
              border: '1px solid var(--border-gold)',
              borderRadius: '8px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>
                Want to combine pandal hopping with Kolkata’s famous food cabins in one night?
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginTop: '4px' }}>
                Our Intelligent Hop Planner automatically includes famous food stalls and pitstops around your saved pandals.
              </div>
            </div>

            <Link href="/planner" className="btn btn-gold btn-sm">
              <IconSparkles size={14} /> Open Multi-Pandal &amp; Food Planner
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
