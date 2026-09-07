'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Pandal, MetroStation } from '../lib/types';
import { GENERATED_FOOD_STALLS } from '../lib/generated-food';
import { GENERATED_PANDAL_EATERIES } from '../lib/generated-eateries';
import { formatDistance } from '../lib/format';
import { calculateDistance, estimateWalkMinutes } from '../lib/geo';
import { detectUserLocation } from '../lib/location-service';
import { useToast } from '../lib/toast-context';
import { useLanguage } from '../lib/language-context';
import {
  IconMetro,
  IconNavigation,
  IconSparkles,
  IconWalk,
  IconEye,
  IconRoute,
  IconChevronRight,
} from './Icons';
import CrowdBadge from './CrowdBadge';
import LeafletMap from './LeafletMap';
import PandalCard from './PandalCard';

interface MetroPujaPlannerProps {
  metroStations: MetroStation[];
  pandals: Pandal[];
  compact?: boolean;
}

export default function MetroPujaPlanner({ metroStations, pandals, compact = false }: MetroPujaPlannerProps) {
  const { language, tMetroName, tPandalName, tRegion, t } = useLanguage();
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<number>(() => {
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
    showToast(t('locating', 'Locating your position in Kolkata...'), 'info');
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

  const selectedStation = useMemo(() => {
    return metroStations.find(m => m.id === selectedStationId) || metroStations[0];
  }, [metroStations, selectedStationId]);

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

  const nearbyPandals = useMemo(() => {
    if (!selectedStation) return [];

    const items = pandals
      .map(p => {
        const distKm = calculateDistance(selectedStation.latitude, selectedStation.longitude, p.latitude, p.longitude);
        const distM = Math.round(distKm * 1000);
        const walkMins = estimateWalkMinutes(distM);
        const isExplicitStation = p.nearestMetro.toLowerCase().includes(selectedStation.name.toLowerCase());

        return {
          ...p,
          calculatedDistanceKm: distKm,
          calculatedDistanceM: distM,
          calculatedWalkMins: walkMins,
          isExplicitStation,
        };
      })
      .filter(item => item.calculatedDistanceKm <= maxDistanceKm || item.isExplicitStation);

    if (sortBy === 'famous') {
      items.sort((a, b) => {
        const aScore = (a.famous ? 100 : 0) + a.popularityScore;
        const bScore = (b.famous ? 100 : 0) + b.popularityScore;
        return bScore - aScore;
      });
    } else {
      items.sort((a, b) => a.calculatedDistanceM - b.calculatedDistanceM);
    }

    return items;
  }, [selectedStation, pandals, maxDistanceKm, sortBy]);

  const nearbyFoodStalls = useMemo(() => {
    if (!selectedStation) return [];
    const seenNames = new Set<string>();

    const mapped = GENERATED_PANDAL_EATERIES.filter(e => {
      const dist = calculateDistance(selectedStation.latitude, selectedStation.longitude, e.latitude, e.longitude);
      return dist <= maxDistanceKm;
    }).map(e => ({
      id: `eatery-${e.pandalId}-${e.cleanName}`,
      name: e.cleanName,
      category: e.cuisineType,
      famousDish: e.bestRecommendedItem,
      priceForTwo: `₹${e.budgetForTwo} for two`,
      distanceM: Math.round(calculateDistance(selectedStation.latitude, selectedStation.longitude, e.latitude, e.longitude) * 1000),
      latitude: e.latitude,
      longitude: e.longitude,
    }));

    const curated = GENERATED_FOOD_STALLS.filter(s => {
      const dist = calculateDistance(selectedStation.latitude, selectedStation.longitude, s.latitude, s.longitude);
      return dist <= maxDistanceKm || (s.nearestMetro && s.nearestMetro.toLowerCase().includes(selectedStation.name.toLowerCase()));
    }).map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      famousDish: s.famousDish,
      priceForTwo: s.priceForTwo,
      distanceM: Math.round(calculateDistance(selectedStation.latitude, selectedStation.longitude, s.latitude, s.longitude) * 1000),
      latitude: s.latitude,
      longitude: s.longitude,
    }));

    const combined = [];
    for (const item of [...mapped, ...curated]) {
      const key = item.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        combined.push(item);
      }
    }

    combined.sort((a, b) => a.distanceM - b.distanceM);
    return combined;
  }, [selectedStation, maxDistanceKm]);

  if (!selectedStation) return null;

  return (
    <section style={{ padding: compact ? '60px 0' : '40px 0 60px', background: compact ? '#FFFDF9' : 'transparent', borderTop: compact ? '1px solid var(--border-gold)' : 'none' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 36px' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            <IconMetro size={15} color="#155799" />
            <span>{t('metro_guide_title', 'Kolkata Metro Puja Network Guide')}</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
            {language === 'bn' ? 'মেট্রো স্টেশন নির্বাচন করে নিকটবর্তী প্যান্ডেল দেখুন' : 'Explore Pandals Accessible From Any Metro Station'}
          </h2>
          <p style={{ color: 'var(--taupe)', marginTop: '8px', fontSize: '0.95rem' }}>
            {t('metro_guide_subtitle', 'Complete station-by-station map, operational timings, interchange connections, and nearest famous pandals.')}
          </p>
        </div>

        {/* Line Filter & Auto GPS Locator Bar */}
        <div
          style={{
            background: '#FFF',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '28px',
            boxShadow: '0 4px 16px rgba(23,18,15,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Metro Lines Selector Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--taupe)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {language === 'bn' ? 'লাইন:' : 'Line:'}
            </span>
            {[
              { id: 'ALL', label: language === 'bn' ? 'সব লাইন (৪৬ স্টেশন)' : 'All Lines (46 Stations)' },
              { id: 'BLUE', label: language === 'bn' ? '🔵 ব্লু লাইন' : '🔵 Blue Line' },
              { id: 'GREEN', label: language === 'bn' ? '🟢 গ্রিন লাইন' : '🟢 Green Line' },
              { id: 'PURPLE', label: language === 'bn' ? '🟣 পার্পল লাইন' : '🟣 Purple Line' },
              { id: 'ORANGE', label: language === 'bn' ? '🟠 অরেঞ্জ লাইন' : '🟠 Orange Line' },
            ].map(line => {
              const isActive = selectedLine === line.id;
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setSelectedLine(line.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: isActive ? '1.5px solid #155799' : '1px solid var(--border)',
                    background: isActive ? '#155799' : '#FFF',
                    color: isActive ? '#FFF' : 'var(--foreground)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {line.label}
                </button>
              );
            })}
          </div>

          {/* Detect Nearest Station Button */}
          <button
            type="button"
            onClick={handleDetectNearestMetro}
            disabled={detectingLocation}
            className="btn btn-vermilion btn-sm"
            style={{ fontSize: '0.78rem', padding: '7px 14px' }}
          >
            <IconNavigation size={13} />
            <span>{detectingLocation ? (language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Locating...') : (language === 'bn' ? '📍 নিকটতম মেট্রো খুঁজুন' : 'Find Nearest Metro to Me')}</span>
          </button>
        </div>

        {/* Main Grid: Station Sidebar + Accessible Pandals Display */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
          {/* LEFT COLUMN: Station Picker Sidebar */}
          <div>
            <div
              style={{
                background: '#FFF',
                border: '1px solid var(--border-gold)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 16px rgba(23,18,15,0.04)',
                position: 'sticky',
                top: '90px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  {language === 'bn' ? 'মেট্রো স্টেশন নির্বাচন করুন' : 'Select Metro Station'} ({filteredStations.length})
                </div>
              </div>

              {/* Station Search Input */}
              <div className="input-field-wrapper" style={{ background: 'var(--warm-cream)', padding: '6px 12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'স্টেশনের নাম দিয়ে খুঁজুন (যেমন শ্যামবাজার)...' : 'Search station (e.g. Shyambazar)...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              {/* Scrollable List of Metro Stations */}
              <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '4px' }}>
                {filteredStations.map(st => {
                  const isSelected = st.id === selectedStationId;
                  const pandalsCount = stationPandalsCountMap.get(st.id) || 0;

                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(21, 87, 153, 0.08)' : '#FFF',
                        border: isSelected ? '1.5px solid #155799' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.86rem', color: isSelected ? '#155799' : 'var(--foreground)' }}>
                          {tMetroName(st)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--taupe)' }}>
                          {st.line} • {st.opensAt} - {st.closesAt}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          className="badge"
                          style={{
                            background: isSelected ? '#155799' : 'var(--warm-cream)',
                            color: isSelected ? '#FFF' : '#333',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                        >
                          {pandalsCount} {language === 'bn' ? 'পুজো' : 'Pujas'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Station Showcase */}
          <div style={{ gridColumn: 'span 2' }}>
            {/* Active Station Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #155799 0%, #0D3866 100%)',
                color: '#FFF',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(21,87,153,0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                    {selectedStation.line} Line
                  </span>
                  {selectedStation.isInterchange && (
                    <span className="badge" style={{ background: '#D99A25', color: '#FFF', fontSize: '0.7rem', fontWeight: 700 }}>
                      ⚡ {t('interchange', 'Interchange Station')}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.8rem', color: '#FFF', margin: '4px 0 4px', fontFamily: 'var(--font-serif)' }}>
                  {tMetroName(selectedStation)}
                </h3>

                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span>🕒 {t('first_train', 'First Train')}: <strong>{selectedStation.opensAt}</strong></span>
                  <span>🌙 {t('last_train', 'Last Train')}: <strong>{selectedStation.closesAt}</strong></span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4B77A' }}>
                  {nearbyPandals.length}
                </div>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)' }}>
                  {language === 'bn' ? 'নিকটবর্তী বিখ্যাত প্যান্ডেল' : 'Accessible Pandals'}
                </div>
              </div>
            </div>

            {/* Filter Tabs (Pandals vs Food) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '6px', background: '#EDE5DB', padding: '4px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setCategoryTab('pandals')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: categoryTab === 'pandals' ? '#FFF' : 'transparent',
                    color: categoryTab === 'pandals' ? 'var(--foreground)' : 'var(--taupe)',
                  }}
                >
                  🪔 {t('explore_pandals', 'Puja Pandals')} ({nearbyPandals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('food')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: categoryTab === 'food' ? '#FFF' : 'transparent',
                    color: categoryTab === 'food' ? 'var(--foreground)' : 'var(--taupe)',
                  }}
                >
                  🍢 {t('heritage_food_spots', 'Food Stalls')} ({nearbyFoodStalls.length})
                </button>
              </div>
            </div>

            {/* Category 1: Nearby Pandals List */}
            {categoryTab === 'pandals' && (
              <div>
                {nearbyPandals.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: '#FFF', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--taupe)', margin: 0 }}>
                      {language === 'bn' ? 'এই মেট্রো স্টেশনের ২.৫ কিমির মধ্যে কোনো প্যান্ডেল মিলেনি।' : 'No pandals found within 2.5km of this metro station.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                    {nearbyPandals.map(p => (
                      <PandalCard key={p.id} pandal={p} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category 2: Nearby Food Stalls List */}
            {categoryTab === 'food' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {nearbyFoodStalls.map(s => (
                    <div
                      key={s.id}
                      style={{
                        background: '#FFF',
                        border: '1px solid var(--border-gold)',
                        borderRadius: '8px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--taupe)', marginBottom: '8px' }}>
                        {s.category} • {formatDistance(s.distanceM)} {language === 'bn' ? 'হাঁটা' : 'walk'}
                      </div>
                      <div style={{ background: '#FFFDF9', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#B3261E' }}>
                          ★ Must Have: {s.famousDish}
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${selectedStation.latitude},${selectedStation.longitude}&destination=${s.latitude},${s.longitude}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem' }}
                      >
                        <IconNavigation size={12} /> Google Maps
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
