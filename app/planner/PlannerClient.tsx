'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Pandal, MetroStation, ItineraryPlan, FoodStall } from '../../lib/types';
import { generateItinerary, findNearbyFoodStalls } from '../../lib/api';
import { PANDAL_EATERIES_MAP } from '../../lib/generated-eateries';
import { formatCurrency, formatDistance, formatDuration } from '../../lib/format';
import { detectUserLocation } from '../../lib/location-service';
import {
  IconCalendar,
  IconClock,
  IconMetro,
  IconWalk,
  IconCab,
  IconSparkles,
  IconShare,
  IconNavigation,
  IconHeart,
} from '../../components/Icons';
import CrowdBadge from '../../components/CrowdBadge';
import LeafletMap from '../../components/LeafletMap';
import { useFavorites } from '../../lib/favorites-context';
import { useToast } from '../../lib/toast-context';

interface PlannerClientProps {
  pandals: Pandal[];
  metroStations: MetroStation[];
  initialFromSaved?: boolean;
  initialIds?: number[];
}

function getInitialStartingPoint(ids: number[], pandalsList: Pandal[]): string {
  if (ids.length > 0) {
    const firstPandal = pandalsList.find(p => p.id === ids[0]);
    if (firstPandal?.nearestMetro) {
      return `${firstPandal.nearestMetro} Metro Station`;
    }
  }
  return 'Shyambazar Metro Station';
}

export default function PlannerClient({
  pandals,
  metroStations = [],
  initialFromSaved = false,
  initialIds,
}: PlannerClientProps) {
  const { showToast } = useToast();
  const { favorites, isFavorite } = useFavorites();

  const effectiveInitialIds = useMemo(() => {
    if (initialIds && initialIds.length > 0) {
      return initialIds;
    }
    return [1, 4, 120, 87]; // Default iconic 4
  }, [initialIds]);

  const [selectedPandalIds, setSelectedPandalIds] = useState<number[]>(effectiveInitialIds);
  const [isPlanningFromSaved, setIsPlanningFromSaved] = useState<boolean>(
    Boolean(initialFromSaved && initialIds && initialIds.length > 0)
  );
  const [startingPoint, setStartingPoint] = useState<string>(() =>
    getInitialStartingPoint(effectiveInitialIds, pandals)
  );
  const [startTime, setStartTime] = useState('17:00');
  const [budget, setBudget] = useState(250);
  const [transportPref, setTransportPref] = useState<'metro' | 'cab' | 'mixed' | 'budget'>('metro');
  const [searchPandalQuery, setSearchPandalQuery] = useState('');
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline');
  const [detectingPlannerLoc, setDetectingPlannerLoc] = useState(false);

  const handleDetectPlannerLocation = async () => {
    setDetectingPlannerLoc(true);
    showToast('Detecting your live location in Kolkata...', 'info');
    try {
      const loc = await detectUserLocation();
      const label = `My Location (${loc.landmark})`;
      setStartingPoint(label);
      handleGenerate(undefined, label);
      showToast(`📍 Starting point pinned to ${label}!`, 'success');
    } catch (err: any) {
      showToast('Could not detect location. Please type your starting point.', 'warning');
    } finally {
      setDetectingPlannerLoc(false);
    }
  };

  // Generate initial plan on load
  useEffect(() => {
    const initialStart = getInitialStartingPoint(effectiveInitialIds, pandals);
    handleGenerate(effectiveInitialIds, initialStart);
  }, []);

  // Sync if navigated with ?fromSaved=true but ids was not in searchParams
  const hasSyncedFavoritesRef = useRef(false);
  useEffect(() => {
    if (
      initialFromSaved &&
      (!initialIds || initialIds.length === 0) &&
      favorites.length > 0 &&
      !hasSyncedFavoritesRef.current
    ) {
      hasSyncedFavoritesRef.current = true;
      setSelectedPandalIds(favorites);
      setIsPlanningFromSaved(true);
      const startPt = getInitialStartingPoint(favorites, pandals);
      setStartingPoint(startPt);
      handleGenerate(favorites, startPt);
    }
  }, [favorites, initialFromSaved, initialIds]);

  const handleGenerate = async (overrideIds?: number[], overrideStart?: string) => {
    const idsToUse = overrideIds ?? selectedPandalIds;
    const startToUse = overrideStart ?? startingPoint;

    if (idsToUse.length === 0) {
      showToast('Please select at least 1 pandal for your itinerary', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const generated = await generateItinerary({
        startingPoint: startToUse,
        startTime,
        endTime: '23:00',
        budget,
        selectedPandalIds: idsToUse,
        transportPreference: transportPref,
        crowdPreference: 'any',
      });
      setPlan(generated);
      if (isPlanningFromSaved || (overrideIds && overrideIds.length === favorites.length && favorites.length > 0)) {
        showToast(`✨ Planned your day route with ${idsToUse.length} saved pandals!`, 'success');
      } else {
        showToast('✨ Smart Puja Hop Itinerary Generated!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate plan', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const togglePandalSelection = (id: number) => {
    setSelectedPandalIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        if (prev.length >= 15) {
          showToast('Maximum 15 pandals recommended for a single festive hopping route', 'warning');
          return prev;
        } else if (prev.length >= 8) {
          showToast('Hopping tip: 8+ pandals can cause fatigue with night crowd barricades', 'info');
        }
        return [...prev, id];
      }
    });
  };

  const handleApplySavedPandals = () => {
    if (favorites.length === 0) {
      showToast('You have no saved pandals yet. Explore and save your favorite pandals first.', 'info');
      return;
    }
    setSelectedPandalIds(favorites);
    setIsPlanningFromSaved(true);
    const newStart = getInitialStartingPoint(favorites, pandals);
    setStartingPoint(newStart);
    handleGenerate(favorites, newStart);
    showToast(`Loaded ${favorites.length} saved pandals into your itinerary planner!`, 'success');
  };

  const handleSharePlan = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Itinerary link copied to clipboard!', 'success');
    }
  };

  const handleSavePlan = () => {
    if (plan) {
      try {
        localStorage.setItem(`pujahop_plan_${plan.id}`, JSON.stringify(plan));
        showToast('Itinerary successfully saved to your device!', 'success');
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Filtered and prioritized pandal selector options
  const filteredOptions = useMemo(() => {
    const query = searchPandalQuery.toLowerCase().trim();
    const matches = pandals.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.region.toLowerCase().includes(query) ||
        p.nearestMetro.toLowerCase().includes(query)
    );

    if (!query) {
      // Prioritize user's saved favorites at the top
      return [...matches].sort((a, b) => {
        const aFav = isFavorite(a.id) ? 1 : 0;
        const bFav = isFavorite(b.id) ? 1 : 0;
        return bFav - aFav;
      });
    }
    return matches;
  }, [pandals, searchPandalQuery, isFavorite]);

  // Google Maps Multi-Stop Directions URL
  const googleMapsMultiStopUrl = useMemo(() => {
    if (!plan || plan.stops.length === 0) return null;
    const dest = plan.stops[plan.stops.length - 1].pandal;
    const origin = startingPoint ? `${startingPoint}, Kolkata` : `${plan.stops[0].pandal.name}, Kolkata`;
    const waypoints = plan.stops.length > 1
      ? plan.stops
          .slice(0, -1)
          .map(s => encodeURIComponent(`${s.pandal.name}, Kolkata`))
          .join('|')
      : '';
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(`${dest.name}, Kolkata`)}${waypoints ? `&waypoints=${waypoints}` : ''}`;
  }, [plan, startingPoint]);

  // Automatically discover famous food stalls/eateries around the planned/saved pandals
  const routeFoodStalls = useMemo(() => {
    if (!plan || plan.stops.length === 0) return [];
    const seenKeys = new Set<string>();
    const results: Array<{
      id: string;
      name: string;
      category: string;
      famousDish: string;
      recommendedItems: string[];
      priceForTwo: string;
      nearPandalName: string;
      nearestMetro?: string;
      distanceM: number;
      walkMins: number;
      latitude: number;
      longitude: number;
    }> = [];

    for (const stop of plan.stops) {
      // 1. First check verified CSV mapped eateries for this exact pandal
      const mappedEateries = PANDAL_EATERIES_MAP[stop.pandal.id] || [];
      for (const e of mappedEateries) {
        const key = e.cleanName.toLowerCase();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push({
            id: `csv-${e.pandalId}-${e.cleanName}`,
            name: e.cleanName,
            category: e.cuisineType,
            famousDish: e.bestRecommendedItem,
            recommendedItems: [e.bestRecommendedItem],
            priceForTwo: `₹${e.budgetForTwo} for two`,
            nearPandalName: stop.pandal.name,
            distanceM: e.distanceM,
            walkMins: Math.max(1, Math.round(e.distanceM / 80)),
            latitude: e.latitude,
            longitude: e.longitude,
          });
        }
      }

      // 2. Also supplement with curated food cabins
      const stalls = findNearbyFoodStalls(stop.pandal.latitude, stop.pandal.longitude, 1.2, 1);
      for (const s of stalls) {
        const key = s.name.toLowerCase();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push({
            id: s.id,
            name: s.name,
            category: s.category,
            famousDish: s.famousDish,
            recommendedItems: s.recommendedItems,
            priceForTwo: s.priceForTwo,
            nearPandalName: stop.pandal.name,
            nearestMetro: s.nearestMetro,
            distanceM: s.distanceM,
            walkMins: s.walkMins,
            latitude: s.latitude,
            longitude: s.longitude,
          });
        }
      }
    }
    return results;
  }, [plan]);

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div className="eyebrow">Intelligent Route Optimizer</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            Pandal Hopping Night Planner
          </h1>
          <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
            Select your dream pandals and starting time. PujaHop computes the shortest transit hops, minimum walking fatigue, and estimated timings.
          </p>
        </div>

        {/* 2-Column Planner Layout */}
        <div className="planner-responsive-layout">
          {/* Left Column: Configuration Controls */}
          <div
            className="planner-config-card"
            style={{
              background: '#FFFDF9',
              border: '1px solid var(--border-gold)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(23,18,15,0.06)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconCalendar size={18} color="#B08D57" />
              <span>Itinerary Parameters</span>
            </h2>

            {/* Starting Station */}
            <div className="input-field-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="input-field-label" style={{ margin: 0 }}>Starting Point / Metro Station</label>
                <button
                  type="button"
                  onClick={handleDetectPlannerLocation}
                  disabled={detectingPlannerLoc}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#B3261E',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 4px',
                  }}
                  title="Detect your current location and use as starting point"
                >
                  <IconNavigation size={12} color="#B3261E" />
                  <span>{detectingPlannerLoc ? 'Detecting...' : '📍 Use My Location'}</span>
                </button>
              </div>
              <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                <input
                  type="text"
                  value={startingPoint}
                  onChange={e => setStartingPoint(e.target.value)}
                  placeholder="e.g. Shyambazar Metro, Sealdah, Kalighat"
                />
              </div>
            </div>

            {/* Start Time & Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div className="input-field-group">
                <label className="input-field-label">Start Time</label>
                <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-field-group">
                <label className="input-field-label">Budget Limit (₹)</label>
                <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(parseInt(e.target.value, 10) || 100)}
                    min={50}
                    step={50}
                  />
                </div>
              </div>
            </div>

            {/* Transport Preference */}
            <div className="input-field-group" style={{ marginBottom: '20px' }}>
              <label className="input-field-label">Transit Preference</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'metro', label: '🚇 Metro First (Fastest)' },
                  { id: 'mixed', label: '🚶 Metro + Toto' },
                  { id: 'budget', label: '🚌 Budget Public' },
                  { id: 'cab', label: '🚗 Cab / Taxi' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTransportPref(opt.id as any)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: transportPref === opt.id ? '1.5px solid #B3261E' : '1px solid var(--border)',
                      background: transportPref === opt.id ? 'var(--warm-cream)' : '#FFF',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      color: transportPref === opt.id ? '#7F1712' : 'var(--foreground)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Pandals Picker */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <label className="input-field-label" style={{ margin: 0 }}>
                  Selected Pandals ({selectedPandalIds.length})
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {favorites.length > 0 && (
                    <button
                      type="button"
                      onClick={handleApplySavedPandals}
                      style={{
                        fontSize: '0.72rem',
                        color: '#B3261E',
                        fontWeight: 700,
                        background: 'rgba(179,38,30,0.08)',
                        border: '1px solid rgba(179,38,30,0.25)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Plan route with all your saved wishlisted pandals"
                    >
                      <IconHeart size={11} fill="#B3261E" /> Use Saved ({favorites.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPandalIds([1, 4, 120, 87, 101]);
                      setIsPlanningFromSaved(false);
                    }}
                    style={{ fontSize: '0.72rem', color: 'var(--antique-gold)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Pick Iconic 5
                  </button>
                </div>
              </div>

              {/* Search Pandals Input */}
              <div className="input-field-wrapper" style={{ background: '#FFF', padding: '8px 12px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Filter pandals to add or remove..."
                  value={searchPandalQuery}
                  onChange={e => setSearchPandalQuery(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Scrollable multi-select list */}
              <div
                style={{
                  maxHeight: '230px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  background: '#FFF',
                }}
              >
                {filteredOptions.slice(0, 40).map(p => {
                  const isSelected = selectedPandalIds.includes(p.id);
                  const isWishlisted = isFavorite(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePandalSelection(p.id)}
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--warm-cream)' : 'transparent',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div style={{ fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isSelected ? '✓ ' : ''}{p.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--taupe)' }}>
                          {p.region} • 🚇 {p.nearestMetro}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        {isWishlisted && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              color: '#B3261E',
                              background: 'rgba(179,38,30,0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            ♥ Saved
                          </span>
                        )}
                        {p.famous && (
                          <span className="badge badge-famous" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                            Iconic
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate CTA Button */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={generating}
              className="btn btn-vermilion"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              <IconSparkles size={18} />
              <span>{generating ? 'Optimizing Sequence...' : 'Generate My Puja Plan'}</span>
            </button>
          </div>

          {/* Right Column: Generated Itinerary Timeline or Map */}
          <div>
            {plan ? (
              <div>
                {/* Saved Pandals Personalized Notice */}
                {isPlanningFromSaved && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(179,38,30,0.08) 0%, rgba(176,141,87,0.12) 100%)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#B3261E',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconHeart size={16} fill="#FFF" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--foreground)' }}>
                          Custom Day Plan for Your {plan.totalPandals} Saved Pandals
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>
                          Optimized for shortest Kolkata transit hops, crowd windows, and minimum fatigue!
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/favorites"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      ← Edit Saved List
                    </Link>
                  </div>
                )}

                {/* Summary Banner */}
                <div
                  style={{
                    background: '#FFF',
                    border: '1px solid var(--border-gold)',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div className="eyebrow" style={{ margin: 0 }}>Generated Day Itinerary</div>
                      <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>{plan.title}</h2>
                      <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '2px' }}>
                        Start: <strong>{plan.startTime}</strong> • Est. Finish: <strong>{plan.endTime}</strong> • From: <strong>{startingPoint}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {googleMapsMultiStopUrl && (
                        <a
                          href={googleMapsMultiStopUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-vermilion btn-sm"
                          title="Open complete multi-stop hopping route in Google Maps"
                        >
                          <IconNavigation size={14} /> Full Route in Maps
                        </a>
                      )}
                      <button onClick={handleSavePlan} className="btn btn-secondary btn-sm" title="Save Plan">
                        <IconHeart size={14} /> Save
                      </button>
                      <button onClick={handleSharePlan} className="btn btn-secondary btn-sm" title="Share Plan">
                        <IconShare size={14} /> Share
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: '12px',
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle)',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700 }}>
                        {plan.totalPandals}
                      </div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--taupe)' }}>
                        Pandals
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--vermilion)' }}>
                        {formatDuration(plan.totalDurationMinutes)}
                      </div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--taupe)' }}>
                        Total Time
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700 }}>
                        {plan.totalDistanceKm} km
                      </div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--taupe)' }}>
                        Total Distance
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--antique-gold)' }}>
                        {formatCurrency(plan.totalEstimatedCost)}
                      </div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--taupe)' }}>
                        Est. Transit Cost
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Switcher Tabs (Timeline vs Map) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      background: '#EDE5DB',
                      padding: '4px',
                      borderRadius: '6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode('timeline')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: viewMode === 'timeline' ? '#FFF' : 'transparent',
                        color: viewMode === 'timeline' ? 'var(--foreground)' : 'var(--taupe)',
                        boxShadow: viewMode === 'timeline' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <IconClock size={14} /> Step-by-Step Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('map')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: viewMode === 'map' ? '#FFF' : 'transparent',
                        color: viewMode === 'map' ? 'var(--foreground)' : 'var(--taupe)',
                        boxShadow: viewMode === 'map' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <IconNavigation size={14} /> Route Map ({plan.stops.length} stops)
                    </button>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>
                    Sequence automatically sorted by geographic proximity
                  </div>
                </div>

                {/* Map View */}
                {viewMode === 'map' && (
                  <div
                    style={{
                      background: '#FFF',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '20px',
                      boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
                    }}
                  >
                    <LeafletMap
                      pandals={plan.stops.map(s => s.pandal)}
                      metroStations={metroStations}
                      height="400px"
                    />
                    <div style={{ padding: '16px 20px', background: '#FFFDF9', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
                        Hop Route Sequence:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        {plan.stops.map((stop, i) => (
                          <span
                            key={stop.pandal.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#FFF',
                              border: '1px solid var(--border)',
                              borderRadius: '16px',
                              padding: '4px 10px',
                              fontSize: '0.78rem',
                            }}
                          >
                            <strong style={{ color: 'var(--vermilion)' }}>#{stop.stopNumber}</strong>
                            <span>{stop.pandal.name}</span>
                            <span style={{ color: 'var(--taupe)', fontSize: '0.7rem' }}>({stop.arrivalTime})</span>
                            {i < plan.stops.length - 1 && <span style={{ color: '#C0B3A6', marginLeft: '2px' }}>→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Stops */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {plan.stops.map((stop) => (
                    <div key={stop.pandal.id}>
                      <div className="planner-timeline-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--dark-bg)',
                                color: '#FFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              {stop.stopNumber}
                            </span>
                            <div>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                                <Link href={`/pandal/${stop.pandal.id}`}>{stop.pandal.name}</Link>
                              </h3>
                              <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
                                {stop.pandal.region} • 🚇 {stop.pandal.nearestMetro}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--vermilion)', fontSize: '0.95rem' }}>
                              {stop.arrivalTime} – {stop.departureTime}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                              Stay: {stop.stayDurationMinutes} mins
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: '#4A423B', margin: '8px 0 12px' }}>
                          Theme: {stop.highlightTheme || stop.pandal.theme}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <CrowdBadge level={stop.crowdLevel} />
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${stop.pandal.latitude},${stop.pandal.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Open GPS navigation in Google Maps"
                            >
                              <IconNavigation size={12} /> Google Maps
                            </a>
                            <Link
                              href={`/route?to=${stop.pandal.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            >
                              Transit Details →
                            </Link>
                          </div>
                        </div>

                        {/* AUTO-RECOMMENDED FAMOUS FOOD STALL AROUND THIS PANDAL (CSV DATA + CURATED) */}
                        {(() => {
                          const mappedEateries = PANDAL_EATERIES_MAP[stop.pandal.id] || [];
                          const primaryEatery = mappedEateries[0];
                          const fallbackStall = findNearbyFoodStalls(stop.pandal.latitude, stop.pandal.longitude, 1.4, 1)[0];

                          const activeFood = primaryEatery ? {
                            name: primaryEatery.cleanName,
                            category: primaryEatery.cuisineType,
                            distanceM: primaryEatery.distanceM,
                            bestDish: primaryEatery.bestRecommendedItem,
                            otherOptions: mappedEateries.length > 1 ? mappedEateries.slice(1).map(m => m.cleanName) : [],
                            budget: `₹${primaryEatery.budgetForTwo} for two`,
                            latitude: primaryEatery.latitude,
                            longitude: primaryEatery.longitude,
                          } : fallbackStall ? {
                            name: fallbackStall.name,
                            category: fallbackStall.category,
                            distanceM: fallbackStall.distanceM,
                            bestDish: fallbackStall.famousDish,
                            otherOptions: fallbackStall.recommendedItems.slice(0, 2),
                            budget: fallbackStall.priceForTwo,
                            latitude: fallbackStall.latitude,
                            longitude: fallbackStall.longitude,
                          } : null;

                          if (!activeFood) return null;
                          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${stop.pandal.latitude},${stop.pandal.longitude}&destination=${activeFood.latitude},${activeFood.longitude}`;

                          return (
                            <div
                              style={{
                                marginTop: '12px',
                                background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF6EE 100%)',
                                border: '1px solid #E8D9C0',
                                borderRadius: '6px',
                                padding: '10px 14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.85rem' }}>🍢</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B08D57', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Famous Food Pitstop ({formatDistance(activeFood.distanceM)} walk • {activeFood.budget})
                                  </span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)', marginTop: '2px' }}>
                                  {activeFood.name} <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--taupe)' }}>({activeFood.category})</span>
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#555', marginTop: '2px' }}>
                                  <strong style={{ color: '#B3261E' }}>Must Have:</strong> {activeFood.bestDish}
                                  {activeFood.otherOptions.length > 0 && (
                                    <span style={{ color: 'var(--taupe)', marginLeft: '6px' }}>
                                      • Also nearby: {activeFood.otherOptions.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-vermilion btn-sm"
                                style={{ fontSize: '0.72rem', padding: '5px 10px', whiteSpace: 'nowrap' }}
                                title={`Directions from ${stop.pandal.name} to ${activeFood.name} in Google Maps`}
                              >
                                <IconNavigation size={11} /> Food in Google Maps
                              </a>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Transition leg to next stop */}
                      {stop.travelToNextMinutes && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            margin: '4px 0 4px 36px',
                            fontSize: '0.78rem',
                            color: 'var(--taupe)',
                            padding: '6px 12px',
                            background: 'var(--warm-cream)',
                            borderRadius: '4px',
                            width: 'fit-content',
                          }}
                        >
                          {stop.travelToNextMode === 'walk' && <IconWalk size={14} color="#756D65" />}
                          {stop.travelToNextMode === 'metro' && <IconMetro size={14} color="#155799" />}
                          {stop.travelToNextMode === 'cab' && <IconCab size={14} color="#D99A25" />}
                          <span>
                            Travel to Next: <strong>{formatDuration(stop.travelToNextMinutes)}</strong> (~{formatDistance(stop.travelToNextDistanceM || 0)}) • Est. Cost: {formatCurrency(stop.travelToNextCost || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* FULL FESTIVE FOOD TRAIL FOR THIS ITINERARY */}
                {routeFoodStalls.length > 0 && (
                  <div
                    style={{
                      marginTop: '24px',
                      background: '#FFF',
                      border: '1.5px solid #B08D57',
                      borderRadius: '8px',
                      padding: '24px',
                      boxShadow: '0 6px 20px rgba(176, 141, 87, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                      <div>
                        <div className="eyebrow" style={{ color: '#B08D57', margin: 0 }}>
                          Curated Festive Food Stops
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0 0', fontFamily: 'var(--font-serif)' }}>
                          Famous Food Stalls Along Your Route ({routeFoodStalls.length})
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
                          Authentic street food, heritage cabins, and mishti shops auto-recommended around your saved pandals.
                        </div>
                      </div>
                      <span className="badge" style={{ background: '#FFF8E1', color: '#B78103', border: '1px solid #FFE082', fontWeight: 700 }}>
                        🍢 Auto-Recommended
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      {routeFoodStalls.map(stall => (
                        <div
                          key={stall.id}
                          style={{
                            background: '#FFFDF9',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#155799', background: '#E3F2FD', padding: '2px 6px', borderRadius: '4px' }}>
                                Near {stall.nearPandalName}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--taupe)' }}>
                                {stall.priceForTwo}
                              </span>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: '0.98rem', marginTop: '4px' }}>
                              {stall.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--taupe)', marginBottom: '6px' }}>
                              {stall.nearestMetro ? `🚇 ${stall.nearestMetro} • ` : ''}🚶 {formatDistance(stall.distanceM)} walk
                            </div>

                            <div style={{ background: '#FFF', border: '1px solid #E8D9C0', borderRadius: '4px', padding: '8px', marginBottom: '10px' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B3261E' }}>
                                ★ Must Have: {stall.famousDish}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>
                                {stall.recommendedItems.slice(0, 2).join(' • ')}
                              </div>
                            </div>
                          </div>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${stall.latitude},${stall.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-vermilion btn-sm"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', padding: '6px 10px' }}
                            title={`Navigate to ${stall.name} in Google Maps`}
                          >
                            <IconNavigation size={12} /> Directions in Google Maps
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pro Festive Tips */}
                {plan.tips && plan.tips.length > 0 && (
                  <div style={{ marginTop: '32px', background: '#FFFDF9', border: '1px solid #E5DED5', borderRadius: '6px', padding: '20px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--vermilion)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconSparkles size={16} /> Puja Night Navigation Tips
                    </div>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', color: '#4A423B', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {plan.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', background: '#FFF', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <h3>Configure parameters and click Generate</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
