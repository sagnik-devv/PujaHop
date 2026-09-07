'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Pandal, MetroStation, ItineraryPlan } from '../../lib/types';
import { generateItinerary, findNearbyFoodStalls } from '../../lib/api';
import { PANDAL_EATERIES_MAP } from '../../lib/generated-eateries';
import { formatDistance } from '../../lib/format';
import { detectUserLocation } from '../../lib/location-service';
import {
  IconCalendar,
  IconClock,
  IconWalk,
  IconSparkles,
  IconShare,
  IconNavigation,
  IconHeart,
} from '../../components/Icons';
import CrowdBadge from '../../components/CrowdBadge';
import LeafletMap from '../../components/LeafletMap';
import { useFavorites } from '../../lib/favorites-context';
import { useToast } from '../../lib/toast-context';
import { useLanguage } from '../../lib/language-context';
import { useSearchParams } from 'next/navigation';

interface PlannerClientProps {
  pandals: Pandal[];
  metroStations?: MetroStation[];
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
  const { language, tPandalName, tRegion, t } = useLanguage();
  const searchParams = useSearchParams();

  const urlIdsParam = searchParams?.get('ids');
  const urlFromSaved = searchParams?.get('fromSaved') === 'true' || initialFromSaved;

  const effectiveInitialIds = useMemo(() => {
    if (urlIdsParam) {
      const parsed = urlIdsParam
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n > 0);
      if (parsed.length > 0) return parsed;
    }
    if (initialIds && initialIds.length > 0) {
      return initialIds;
    }
    return [];
  }, [urlIdsParam, initialIds]);

  const [selectedPandalIds, setSelectedPandalIds] = useState<number[]>(effectiveInitialIds);
  const [isPlanningFromSaved, setIsPlanningFromSaved] = useState<boolean>(
    Boolean(urlFromSaved && effectiveInitialIds.length > 0)
  );
  const [startingPoint, setStartingPoint] = useState<string>(() =>
    effectiveInitialIds.length > 0 ? getInitialStartingPoint(effectiveInitialIds, pandals) : ''
  );
  const [startTime, setStartTime] = useState('17:00');
  const [searchPandalQuery, setSearchPandalQuery] = useState('');
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline');
  const [detectingPlannerLoc, setDetectingPlannerLoc] = useState(false);
  const [startCoords, setStartCoords] = useState<{ lat: number; lon: number } | null>(null);

  const handleDetectPlannerLocation = async () => {
    setDetectingPlannerLoc(true);
    showToast(t('locating', 'Detecting your live position via GPS...'), 'info');
    try {
      const loc = await detectUserLocation();
      const coords = { lat: loc.lat, lon: loc.lon };
      setStartCoords(coords);

      const locationLabel = loc.landmark || 'Current Location';
      setStartingPoint(locationLabel);
      showToast(`📍 ${t('location_detected', 'Location detected')}: ${locationLabel}!`, 'success');

      if (selectedPandalIds.length > 0) {
        handleGenerate(selectedPandalIds, locationLabel, coords);
      }
    } catch (err: any) {
      console.warn('Geolocation detection error:', err);
      showToast('Could not access live GPS. Please enter your starting point manually.', 'warning');
    } finally {
      setDetectingPlannerLoc(false);
    }
  };

  const handleGenerate = async (
    overrideIds?: number[],
    overrideStart?: string,
    overrideCoords?: { lat: number; lon: number }
  ) => {
    const idsToUse = overrideIds ?? selectedPandalIds;

    if (idsToUse.length === 0) {
      showToast('Please select at least 1 pandal for your itinerary', 'warning');
      return;
    }

    let startToUse = overrideStart ?? startingPoint;
    if (!startToUse || !startToUse.trim()) {
      startToUse = getInitialStartingPoint(idsToUse, pandals);
      setStartingPoint(startToUse);
    }
    const coordsToUse = overrideCoords ?? (startCoords || undefined);

    setGenerating(true);
    try {
      const generated = await generateItinerary({
        startingPoint: startToUse,
        startCoords: coordsToUse,
        startTime,
        endTime: '23:00',
        budget: 500,
        selectedPandalIds: idsToUse,
        transportPreference: 'metro',
        crowdPreference: 'any',
      });
      setPlan(generated);
      if (isPlanningFromSaved || (overrideIds && overrideIds.length === favorites.length && favorites.length > 0)) {
        showToast(`✨ Planned your route with ${idsToUse.length} saved pandals!`, 'success');
      } else {
        showToast('✨ Pujo Hopping Route Generated!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate plan', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const plannedIdsKeyRef = useRef<string>('');
  useEffect(() => {
    if (effectiveInitialIds.length > 0) {
      const key = effectiveInitialIds.join(',');
      if (plannedIdsKeyRef.current !== key) {
        plannedIdsKeyRef.current = key;
        setSelectedPandalIds(effectiveInitialIds);
        const initialStart = getInitialStartingPoint(effectiveInitialIds, pandals);
        setStartingPoint(initialStart);
        handleGenerate(effectiveInitialIds, initialStart);
      }
    }
  }, [effectiveInitialIds, pandals]);

  const hasSyncedFavoritesRef = useRef(false);
  useEffect(() => {
    if (
      urlFromSaved &&
      effectiveInitialIds.length === 0 &&
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
  }, [favorites, urlFromSaved, effectiveInitialIds, pandals]);

  const togglePandalSelection = (id: number) => {
    setSelectedPandalIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleApplySavedPandals = () => {
    if (favorites.length === 0) {
      showToast('You have no saved pandals in your wishlist yet', 'info');
      return;
    }
    setSelectedPandalIds(favorites);
    setIsPlanningFromSaved(true);
    const newStart = getInitialStartingPoint(favorites, pandals);
    setStartingPoint(newStart);
    handleGenerate(favorites, newStart);
    showToast(`Loaded ${favorites.length} saved pandals!`, 'success');
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

  const filteredOptions = useMemo(() => {
    const query = searchPandalQuery.toLowerCase().trim();
    const matches = pandals.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        (p.bengaliName && p.bengaliName.toLowerCase().includes(query)) ||
        p.region.toLowerCase().includes(query) ||
        p.nearestMetro.toLowerCase().includes(query)
    );

    if (!query) {
      return [...matches].sort((a, b) => {
        const aFav = isFavorite(a.id) ? 1 : 0;
        const bFav = isFavorite(b.id) ? 1 : 0;
        return bFav - aFav;
      });
    }
    return matches;
  }, [pandals, searchPandalQuery, isFavorite]);

  const googleMapsMultiStopUrl = useMemo(() => {
    if (!plan || plan.stops.length === 0) return null;

    const stops = plan.stops.map(s => s.pandal);
    const lastPandal = stops[stops.length - 1];
    const destParam = `${lastPandal.latitude.toFixed(6)},${lastPandal.longitude.toFixed(6)}`;

    let originParam = '';
    const hasCustomStart = Boolean(startingPoint && startingPoint.trim());

    if (startCoords?.lat && startCoords?.lon) {
      originParam = `${startCoords.lat.toFixed(6)},${startCoords.lon.toFixed(6)}`;
    } else if (hasCustomStart) {
      originParam = encodeURIComponent(`${startingPoint.trim()}, Kolkata`);
    } else {
      originParam = `${stops[0].latitude.toFixed(6)},${stops[0].longitude.toFixed(6)}`;
    }

    const isFirstPandalOrigin = !hasCustomStart || startingPoint.toLowerCase().includes(stops[0].name.toLowerCase());
    const intermediatePandals = isFirstPandalOrigin ? stops.slice(1, -1) : stops.slice(0, -1);

    const waypointsParam = intermediatePandals
      .map(p => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
      .join('%7C');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=walking`;
    if (waypointsParam) {
      url += `&waypoints=${waypointsParam}`;
    }
    return url;
  }, [plan, startingPoint, startCoords]);

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
            nearPandalName: tPandalName(stop.pandal),
            distanceM: e.distanceM,
            walkMins: Math.max(1, Math.round(e.distanceM / 80)),
            latitude: e.latitude,
            longitude: e.longitude,
          });
        }
      }

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
            nearPandalName: tPandalName(stop.pandal),
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
  }, [plan, tPandalName]);

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div className="eyebrow">{language === 'bn' ? 'স্মার্ট রুট প্ল্যানিং' : 'Smart Route Planning'}</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {t('hop_planner_title', 'Pandal Hopping Night Planner')}
          </h1>
          <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
            {t('hop_planner_subtitle', 'Select your dream pandals and starting time. Pujo Navigation computes the best transit hops, walking guidance, and estimated timings.')}
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
              <span>{language === 'bn' ? 'পরিক্রমার বিবরণ' : 'Itinerary Parameters'}</span>
            </h2>

            {/* Starting Station */}
            <div className="input-field-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="input-field-label" style={{ margin: 0 }}>{t('start_point', 'Starting Point / Metro Station')}</label>
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
                  <span>{detectingPlannerLoc ? (language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Detecting...') : (language === 'bn' ? '📍 আমার অবস্থান ব্যবহার করুন' : '📍 Use My Location')}</span>
                </button>
              </div>
              <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                <input
                  type="text"
                  value={startingPoint}
                  onChange={e => {
                    setStartingPoint(e.target.value);
                    setStartCoords(null);
                  }}
                  placeholder={language === 'bn' ? 'যেমন: শ্যামবাজার মেট্রো, শিয়ালদহ, কালীঘাট' : 'e.g. Shyambazar Metro, Sealdah, Kalighat'}
                />
              </div>
            </div>

            {/* Start Time */}
            <div className="input-field-group" style={{ marginBottom: '20px' }}>
              <label className="input-field-label">{t('start_time', 'Preferred Start Time')}</label>
              <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
            </div>

            {/* Selected Pandals Picker */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <label className="input-field-label" style={{ margin: 0 }}>
                  {language === 'bn' ? `নির্বাচিত প্যান্ডেলসমূহ (${selectedPandalIds.length})` : `Selected Pandals (${selectedPandalIds.length})`}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {favorites.length > 0 && (
                    <button
                      type="button"
                      onClick={handleApplySavedPandals}
                      style={{
                        fontSize: '0.74rem',
                        color: '#FFF',
                        fontWeight: 700,
                        background: 'var(--vermilion)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(179,38,30,0.2)',
                      }}
                      title="Plan route with all your saved wishlisted pandals"
                    >
                      <IconHeart size={12} fill="#FFF" /> {language === 'bn' ? `সংরক্ষিত (${favorites.length})` : `Plan With Saved (${favorites.length})`}
                    </button>
                  )}
                  {selectedPandalIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPandalIds([]);
                        setPlan(null);
                      }}
                      style={{ fontSize: '0.72rem', color: 'var(--taupe)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {language === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>

              {/* Search Pandals Input */}
              <div className="input-field-wrapper" style={{ background: '#FFF', padding: '8px 12px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যোগ বা বাদ দিতে প্যান্ডেল খুঁজুন...' : 'Filter pandals to add or remove...'}
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
                      role="button"
                      tabIndex={0}
                      onClick={() => togglePandalSelection(p.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          togglePandalSelection(p.id);
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--warm-cream)' : 'transparent',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          style={{ accentColor: 'var(--vermilion)', cursor: 'pointer', width: '15px', height: '15px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected ? 'var(--vermilion)' : 'var(--foreground)' }}>
                            {tPandalName(p)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--taupe)' }}>
                            {tRegion(p.region)} • 🚇 {p.nearestMetro}
                          </div>
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
                            ♥ {t('saved', 'Saved')}
                          </span>
                        )}
                        {p.famous && (
                          <span className="badge badge-famous" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                            {t('famous_badge', 'Iconic')}
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
              disabled={generating || selectedPandalIds.length === 0}
              className="btn btn-vermilion"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                opacity: selectedPandalIds.length === 0 ? 0.65 : 1,
                cursor: selectedPandalIds.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <IconSparkles size={18} />
              <span>
                {generating
                  ? (language === 'bn' ? 'রুট তৈরি হচ্ছে...' : 'Planning Route...')
                  : selectedPandalIds.length === 0
                  ? (language === 'bn' ? 'রুট প্ল্যানের জন্য প্যান্ডেল বেছে নিন' : 'Select Pandals to Plan Route')
                  : (language === 'bn' ? `রুট তৈরি করুন (${selectedPandalIds.length}টি প্যান্ডেল)` : `Plan Route (${selectedPandalIds.length} Pandals)`)}
              </span>
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
                          {language === 'bn' ? `আপনার সংরক্ষিত ${plan.totalPandals}টি প্যান্ডেলের কাস্টম প্ল্যান` : `Custom Day Plan for Your ${plan.totalPandals} Saved Pandals`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>
                          {language === 'bn' ? 'সেরা প্যান্ডেল হপিং সিকোয়েন্স!' : 'Optimized pandal hopping sequence for Kolkata Durga Puja!'}
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/favorites"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      ← {language === 'bn' ? 'সংরক্ষিত তালিকা সম্পাদনা' : 'Edit Saved List'}
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
                      <div className="eyebrow" style={{ margin: 0 }}>{t('your_itinerary', 'Generated Day Itinerary')}</div>
                      <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>{plan.title}</h2>
                      <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '2px' }}>
                        {startingPoint ? (
                          <>{t('origin', 'From')}: <strong>{startingPoint}</strong> • </>
                        ) : null}
                        <span><strong>{plan.totalPandals} {language === 'bn' ? 'টি প্যান্ডেল' : 'Pandals'}</strong> {language === 'bn' ? 'পরিক্রমা ক্রমে' : 'in Hopping Sequence'}</span>
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
                          <IconNavigation size={14} /> Google Maps
                        </a>
                      )}
                      <button onClick={handleSavePlan} className="btn btn-secondary btn-sm" title="Save Plan">
                        <IconHeart size={14} /> {t('save_favorite', 'Save')}
                      </button>
                      <button onClick={handleSharePlan} className="btn btn-secondary btn-sm" title="Share Plan">
                        <IconShare size={14} /> {t('share', 'Share')}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🪷</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                        {plan.totalPandals} {language === 'bn' ? 'পরিকল্পিত প্যান্ডেল' : 'Planned Pandals'}
                      </span>
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
                      <IconClock size={14} /> {language === 'bn' ? 'ধাপে ধাপে টাইমলাইন' : 'Step-by-Step Timeline'}
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
                      <IconNavigation size={14} /> {language === 'bn' ? 'রুট ম্যাপ' : 'Route Map'} ({plan.stops.length})
                    </button>
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
                        {language === 'bn' ? 'পরিক্রমা ক্রম:' : 'Hop Route Sequence:'}
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
                            <span>{tPandalName(stop.pandal)}</span>
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
                  {plan.initialTravel && plan.initialTravel.distanceM > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        margin: '0 0 2px 4px',
                        fontSize: '0.78rem',
                        color: 'var(--taupe)',
                        padding: '6px 14px',
                        background: 'var(--warm-cream)',
                        borderRadius: '4px',
                        width: 'fit-content',
                        border: '1px dashed #D0C3B4',
                      }}
                    >
                      <IconWalk size={14} color="#756D65" />
                      <span>
                        {t('origin', 'Starting from')} <strong>{plan.initialTravel.from}</strong> • {language === 'bn' ? 'প্রথম গন্তব্য:' : 'Heading to Stop 1:'} <strong>{tPandalName(plan.stops[0]?.pandal)}</strong>
                      </span>
                    </div>
                  )}

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
                                <Link href={`/pandal/${stop.pandal.id}`}>{tPandalName(stop.pandal)}</Link>
                              </h3>
                              <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
                                {tRegion(stop.pandal.region)} • 🚇 {stop.pandal.nearestMetro}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--vermilion)', fontSize: '0.95rem' }}>
                              {stop.arrivalTime} – {stop.departureTime}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                              {t('stay_duration', 'Stay')}: {stop.stayDurationMinutes} {language === 'bn' ? 'মিঃ' : 'mins'}
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: '#4A423B', margin: '8px 0 12px' }}>
                          {t('theme', 'Theme')}: {stop.highlightTheme || stop.pandal.theme}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <CrowdBadge level={stop.crowdLevel} />
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${stop.pandal.latitude},${stop.pandal.longitude}&travelmode=walking`}
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
                              {t('view_details', 'Transit Details')} →
                            </Link>
                          </div>
                        </div>
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
                          <IconWalk size={14} color="#756D65" />
                          <span>
                            {t('next_stop', 'Next in sequence')}: <strong>{tPandalName(plan.stops[stop.stopNumber]?.pandal) || 'Next Pandal'}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* FULL FESTIVE FOOD TRAIL */}
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
                          {t('heritage_food_spots', 'Curated Festive Food Stops')}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0 0', fontFamily: 'var(--font-serif)' }}>
                          {language === 'bn' ? `আপনার রুটের বিখ্যাত খাবারের দোকান (${routeFoodStalls.length})` : `Famous Food Stalls Along Your Route (${routeFoodStalls.length})`}
                        </h3>
                      </div>
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
                              {stall.nearestMetro ? `🚇 ${stall.nearestMetro} • ` : ''}🚶 {formatDistance(stall.distanceM)} {language === 'bn' ? 'হাঁটা' : 'walk'}
                            </div>

                            <div style={{ background: '#FFF', border: '1px solid #E8D9C0', borderRadius: '4px', padding: '8px', marginBottom: '10px' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B3261E' }}>
                                ★ {t('famous_dish', 'Must Have')}: {stall.famousDish}
                              </div>
                            </div>
                          </div>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${stall.latitude},${stall.longitude}&travelmode=walking`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-vermilion btn-sm"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', padding: '6px 10px' }}
                            title={`Navigate to ${stall.name} in Google Maps`}
                          >
                            <IconNavigation size={12} /> Google Maps
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '60px 24px',
                  textAlign: 'center',
                  background: '#FFFDF9',
                  borderRadius: '12px',
                  border: '1.5px dashed var(--border-gold)',
                  boxShadow: '0 8px 30px rgba(23,18,15,0.04)',
                }}
              >
                <div style={{ fontSize: '42px', marginBottom: '14px' }}>🪷</div>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: '0 0 10px', color: 'var(--foreground)' }}>
                  {t('hop_planner_title', 'Plan Your Puja Hopping Route')}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--taupe)', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  {language === 'bn' ? 'বাঁদিক থেকে প্যান্ডেল বাছাই করুন এবং "রুট তৈরি করুন" বাটনে ক্লিক করুন।' : 'Select pandals from the left, or save your favorite pandals while exploring and tap "Plan With Saved" to generate your optimized hopping route.'}
                </p>

                {favorites.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleApplySavedPandals}
                    className="btn btn-vermilion"
                    style={{ margin: '0 auto', padding: '12px 24px', fontSize: '0.9rem' }}
                  >
                    <IconHeart size={16} fill="#FFF" /> {language === 'bn' ? `সংরক্ষিত ${favorites.length}টি প্যান্ডেল দিয়ে প্ল্যান তৈরি করুন` : `Plan Route With Saved (${favorites.length} Pandals)`}
                  </button>
                ) : (
                  <Link
                    href="/explore"
                    className="btn btn-secondary"
                    style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span>🔍</span>
                    <span>{t('explore_pandals', 'Explore Pandals')}</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
