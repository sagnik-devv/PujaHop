'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { BusRoute, BusStop, Pandal, MetroStation } from '../../lib/types';
import LeafletMap from '../../components/LeafletMap';
import PandalCard from '../../components/PandalCard';
import {
  IconBus,
  IconMetro,
  IconSearch,
  IconMapPin,
  IconRoute,
  IconNavigation,
  IconSparkles,
  IconWalk,
} from '../../components/Icons';

interface BusPageClientProps {
  busRoutes: BusRoute[];
  busStops: BusStop[];
  pandals: Pandal[];
  metroStations: MetroStation[];
  initialBusNumber?: string;
  initialStopName?: string;
}

export default function BusPageClient({
  busRoutes,
  busStops,
  pandals,
  metroStations,
  initialBusNumber,
  initialStopName,
}: BusPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [operatorFilter, setOperatorFilter] = useState<'ALL' | 'HOT' | 'AC' | 'WBTC' | 'PRIVATE' | 'MINI'>('ALL');
  const [sortBy, setSortBy] = useState<'HOT' | 'TOTAL' | 'NUMBER'>('HOT');
  const [showIconicOnly, setShowIconicOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'routes' | 'stops' | 'map'>('routes');

  // Selected bus state
  const [selectedBusNumber, setSelectedBusNumber] = useState<string>(() => {
    if (initialBusNumber) {
      const found = busRoutes.find(b => b.busNumber.toLowerCase() === initialBusNumber.toLowerCase());
      if (found) return found.busNumber;
    }
    return busRoutes[0]?.busNumber || '47B';
  });

  // Selected stop state
  const [selectedStopId, setSelectedStopId] = useState<string>(() => {
    if (initialStopName) {
      const found = busStops.find(
        s =>
          s.name.toLowerCase().includes(initialStopName.toLowerCase()) ||
          s.cleanName.toLowerCase().includes(initialStopName.toLowerCase())
      );
      if (found) return found.id;
    }
    return busStops[0]?.id || 'bus-stop-1';
  });

  // Mobile view states for routes and stops
  const [mobileRouteView, setMobileRouteView] = useState<'list' | 'detail'>('detail');
  const [mobileStopView, setMobileStopView] = useState<'list' | 'detail'>('detail');

  // Top Hot Bus lines (ranked by iconic pandal count)
  const hotBuses = useMemo(() => {
    return [...busRoutes]
      .filter(r => (r.famousPandalCount || 0) > 0)
      .sort((a, b) => (b.famousPandalCount || 0) - (a.famousPandalCount || 0) || b.pandalIds.length - a.pandalIds.length)
      .slice(0, 12);
  }, [busRoutes]);

  // Filtered bus routes
  const filteredRoutes = useMemo(() => {
    const list = busRoutes.filter(route => {
      // Hot routes filter (buses with 8+ iconic pujas)
      if (operatorFilter === 'HOT' && !route.isHotRoute && (route.famousPandalCount || 0) < 8) return false;

      // Operator / AC filter
      if (operatorFilter === 'AC' && !route.isAc) return false;
      if (operatorFilter === 'WBTC' && !route.operatorType.toUpperCase().includes('WBTC')) return false;
      if (operatorFilter === 'MINI' && !route.operatorType.toUpperCase().includes('MINI') && !route.serviceVariant.toUpperCase().includes('MINI')) return false;
      if (operatorFilter === 'PRIVATE' && (!route.operatorType.toUpperCase().includes('PRIVATE') || route.operatorType.toUpperCase().includes('MINI'))) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        route.busNumber.toLowerCase().includes(q) ||
        route.origin.toLowerCase().includes(q) ||
        route.destination.toLowerCase().includes(q) ||
        route.routeStops.some(s => s.toLowerCase().includes(q)) ||
        route.matchedBusStops.some(s => s.toLowerCase().includes(q))
      );
    });

    // Sort order
    if (sortBy === 'HOT') {
      list.sort((a, b) => (b.famousPandalCount || 0) - (a.famousPandalCount || 0) || b.pandalIds.length - a.pandalIds.length);
    } else if (sortBy === 'TOTAL') {
      list.sort((a, b) => b.pandalIds.length - a.pandalIds.length);
    } else if (sortBy === 'NUMBER') {
      list.sort((a, b) => a.busNumber.localeCompare(b.busNumber, undefined, { numeric: true }));
    }

    return list;
  }, [busRoutes, operatorFilter, searchQuery, sortBy]);

  // Selected route object
  const activeRoute = useMemo(() => {
    return busRoutes.find(r => r.busNumber === selectedBusNumber) || filteredRoutes[0] || busRoutes[0];
  }, [busRoutes, selectedBusNumber, filteredRoutes]);

  // Pandals reachable via the selected route
  const activeRoutePandals = useMemo(() => {
    if (!activeRoute) return [];
    const pandalIdSet = new Set(activeRoute.pandalIds);
    return pandals.filter(p => pandalIdSet.has(p.id));
  }, [activeRoute, pandals]);

  // Filtered displayed pandals (Iconic only or all)
  const displayedPandals = useMemo(() => {
    if (showIconicOnly) {
      return activeRoutePandals.filter(p => p.famous);
    }
    return activeRoutePandals;
  }, [activeRoutePandals, showIconicOnly]);

  // Filtered stops
  const filteredStops = useMemo(() => {
    if (!searchQuery.trim()) return busStops;
    const q = searchQuery.toLowerCase().trim();
    return busStops.filter(
      s =>
        s.cleanName.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.busNumbers.some(no => no.toLowerCase().includes(q))
    );
  }, [busStops, searchQuery]);

  // Selected stop object
  const activeStop = useMemo(() => {
    return busStops.find(s => s.id === selectedStopId) || filteredStops[0] || busStops[0];
  }, [busStops, selectedStopId, filteredStops]);

  // Pandals reachable from active stop
  const activeStopPandals = useMemo(() => {
    if (!activeStop) return [];
    const pandalIdSet = new Set(activeStop.pandalIds);
    return pandals.filter(p => pandalIdSet.has(p.id));
  }, [activeStop, pandals]);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 1. HERO BANNER */}
      <section
        style={{
          position: 'relative',
          padding: '70px 0 50px',
          background: 'var(--dark-bg)',
          color: '#FFF',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-gold)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(23,18,15,0.78) 0%, rgba(23,18,15,0.92) 80%, rgba(23,18,15,0.98) 100%)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '880px' }}>
          {/* Transit Navigator Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(212,183,122,0.3)',
              borderRadius: '30px',
              padding: '4px',
              marginBottom: '20px',
            }}
          >
            <Link
              href="/metro"
              style={{
                padding: '6px 18px',
                borderRadius: '24px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--stone)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <IconMetro size={15} /> Metro Guide
            </Link>
            <div
              style={{
                padding: '6px 18px',
                borderRadius: '24px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: '#1B5E20',
                color: '#FFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(27,94,32,0.4)',
              }}
            >
              <IconBus size={15} /> Bus Routes Guide
            </div>
          </div>

          <h1
            style={{
              color: '#FFF',
              fontSize: 'clamp(2.3rem, 5vw, 3.4rem)',
              fontFamily: 'var(--font-serif)',
              margin: '0 0 16px',
              lineHeight: 1.15,
            }}
          >
            Kolkata Bus Durga Puja Route Navigator
          </h1>

          <div className="hero-accent-line" style={{ margin: '0 auto 20px' }} />

          <p
            style={{
              color: 'var(--stone)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              maxWidth: '740px',
              margin: '0 auto 32px',
            }}
          >
            Explore 180 verified Kolkata bus routes and 54 key transit hubs mapped directly to all 248 Durga Puja pandals. Search any bus number or corridor to view origin-to-destination stops and accessible pujas with direct walking directions.
          </p>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--soft-gold)' }}>180</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bus Routes</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF7043' }}>🔥 {hotBuses.length}+</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hot Hop Lines</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#81C784' }}>54</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bus Stop Hubs</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFB74D' }}>248</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pandals Connected</div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5. HOT BUS ROUTES SHOWCASE TRACK */}
      <section className="container" style={{ marginTop: '24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF8F5 100%)',
            border: '1px solid rgba(212, 183, 122, 0.45)',
            borderRadius: '10px',
            padding: '20px 22px',
            boxShadow: '0 4px 18px rgba(179, 38, 30, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#FFF3E0', color: '#D84315', padding: '6px 10px', borderRadius: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔥
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
                  Hot Bus Routes • Top Iconic Durga Puja Hopping Lines
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--taupe)', margin: '2px 0 0' }}>
                  Routes connecting the highest density of famous, award-winning pandals. Tap any line to inspect route stops & puja pandals.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setOperatorFilter(operatorFilter === 'HOT' ? 'ALL' : 'HOT');
                  setActiveTab('routes');
                }}
                style={{
                  background: operatorFilter === 'HOT' ? '#B3261E' : '#FFF',
                  color: operatorFilter === 'HOT' ? '#FFF' : '#B3261E',
                  border: '1.5px solid #B3261E',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{operatorFilter === 'HOT' ? 'Showing Hot Routes ✓' : 'Filter All Hot Buses (8+ Iconic)'}</span>
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Track of Top Hot Buses */}
          <div
            className="touch-scroll-track"
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '6px',
              paddingTop: '2px',
            }}
          >
            {hotBuses.map((route, idx) => {
              const isSelected = activeRoute?.busNumber === route.busNumber && activeTab === 'routes';
              const rankIcons = ['🥇', '🥈', '🥉'];
              const rankBadge = idx < 3 ? rankIcons[idx] : `#${idx + 1}`;
              return (
                <button
                  key={route.busNumber}
                  type="button"
                  onClick={() => {
                    setSelectedBusNumber(route.busNumber);
                    setActiveTab('routes');
                    setMobileRouteView('detail');
                  }}
                  style={{
                    flex: '0 0 auto',
                    width: '215px',
                    background: isSelected ? '#FDF3F2' : '#FFF',
                    border: isSelected ? '1.5px solid #B3261E' : '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(179,38,30,0.15)' : '0 1px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{rankBadge}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: isSelected ? '#B3261E' : 'var(--foreground)' }}>
                        Bus {route.busNumber}
                      </span>
                    </div>
                    {route.isAc && (
                      <span style={{ fontSize: '0.62rem', background: '#E0F2FE', color: '#0284C7', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                        AC
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FFF3E0', color: '#D84315', padding: '2px 7px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span>🔥 {route.famousPandalCount || 0} Iconic</span>
                    <span style={{ color: '#777', fontWeight: 500 }}>• {route.pandalIds.length} total</span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--taupe)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {route.origin} ➔ {route.destination}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. CONTROLS BAR: SEARCH, FILTERS, TABS */}
      <section className="container" style={{ marginTop: '28px' }}>
        <div
          style={{
            background: '#FFF',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--taupe)' }}>
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search bus number (e.g. 47B, 234/1, 21/1, AC54) or stop (Shyambazar, Esplanade)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Tab switchers: Routes vs Stops vs Map */}
            <div style={{ display: 'flex', background: 'var(--background)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('routes')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'routes' ? '#FFF' : 'transparent',
                  color: activeTab === 'routes' ? '#1B5E20' : 'var(--taupe)',
                  fontWeight: activeTab === 'routes' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'routes' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                🚌 Bus Lines ({filteredRoutes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stops')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'stops' ? '#FFF' : 'transparent',
                  color: activeTab === 'stops' ? '#1B5E20' : 'var(--taupe)',
                  fontWeight: activeTab === 'stops' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'stops' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                📍 Bus Hubs ({filteredStops.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'map' ? '#FFF' : 'transparent',
                  color: activeTab === 'map' ? '#1B5E20' : 'var(--taupe)',
                  fontWeight: activeTab === 'map' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'map' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                🗺️ Spatial Map
              </button>
            </div>
          </div>

          {/* Filter Pills & Sort for Route Tab */}
          {activeTab === 'routes' && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: 'var(--taupe)', fontWeight: 600, marginRight: '4px' }}>Filter:</span>
                {[
                  { label: '🔥 Hot Buses Only', val: 'HOT' },
                  { label: 'All Buses', val: 'ALL' },
                  { label: '❄️ AC Buses Only', val: 'AC' },
                  { label: 'WBTC (Govt)', val: 'WBTC' },
                  { label: 'Private Standard', val: 'PRIVATE' },
                  { label: 'Private Mini', val: 'MINI' },
                ].map(f => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setOperatorFilter(f.val as any)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: '16px',
                      border: operatorFilter === f.val 
                        ? f.val === 'HOT' ? '1.5px solid #B3261E' : '1px solid #1B5E20' 
                        : '1px solid var(--border)',
                      background: operatorFilter === f.val 
                        ? f.val === 'HOT' ? '#B3261E' : '#E8F5E9' 
                        : '#FFF',
                      color: operatorFilter === f.val 
                        ? f.val === 'HOT' ? '#FFF' : '#1B5E20' 
                        : 'var(--foreground)',
                      fontWeight: operatorFilter === f.val ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--taupe)', fontWeight: 600 }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    background: '#FFF',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="HOT">🔥 Most Iconic Pujas First</option>
                  <option value="TOTAL">Most Total Pandals</option>
                  <option value="NUMBER">Bus Number (A-Z)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. MAIN CONTENT: ROUTES TAB */}
      {activeTab === 'routes' && (
        <section className="container" style={{ marginTop: '24px' }}>
          {/* Mobile View Switcher between Route List and Route Detail */}
          <div className="bus-mobile-switcher">
            <div className="bus-toggle-pill">
              <button
                type="button"
                className={`bus-toggle-btn ${mobileRouteView === 'list' ? 'active' : ''}`}
                onClick={() => setMobileRouteView('list')}
              >
                📋 All Buses ({filteredRoutes.length})
              </button>
              <button
                type="button"
                className={`bus-toggle-btn ${mobileRouteView === 'detail' ? 'active' : ''}`}
                onClick={() => setMobileRouteView('detail')}
              >
                📍 Bus {activeRoute?.busNumber || ''} Stops & Pujas
              </button>
            </div>
          </div>

          <div className="bus-split-layout">
            {/* Left Column: List of bus route selector pills */}
            <div
              className={`bus-panel-list ${mobileRouteView === 'detail' ? 'bus-panel-mobile-hidden' : ''}`}
              style={{
                background: '#FFF',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '750px',
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--taupe)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Select Bus Route ({filteredRoutes.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredRoutes.map(route => {
                  const isSelected = activeRoute?.busNumber === route.busNumber;
                  return (
                    <button
                      key={route.busNumber}
                      type="button"
                      onClick={() => {
                        setSelectedBusNumber(route.busNumber);
                        setMobileRouteView('detail');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #1B5E20' : '1px solid var(--border-subtle)',
                        background: isSelected ? '#F1F8F4' : '#FFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: isSelected ? '#1B5E20' : 'var(--foreground)',
                          }}
                        >
                          Bus {route.busNumber}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {(route.famousPandalCount || 0) > 0 && (
                            <span style={{ fontSize: '0.66rem', background: '#FFF3E0', color: '#D84315', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                              🔥 {route.famousPandalCount}
                            </span>
                          )}
                          {route.isAc && (
                            <span style={{ fontSize: '0.66rem', background: '#E0F2FE', color: '#0284C7', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                              AC
                            </span>
                          )}
                          <span style={{ fontSize: '0.68rem', color: '#666', background: 'var(--background)', padding: '1px 5px', borderRadius: '3px' }}>
                            {route.pandalIds.length} pujas
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {route.origin} ➔ {route.destination}
                      </div>
                    </button>
                  );
                })}

                {filteredRoutes.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.88rem' }}>
                    No bus routes matched your filter.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Selected Route Inspector */}
            {activeRoute ? (
              <div className={`bus-panel-detail ${mobileRouteView === 'list' ? 'bus-panel-mobile-hidden' : ''}`}>
                {/* Quick Picker on Mobile */}
                <div className="bus-mobile-quick-picker">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--taupe)', textTransform: 'uppercase' }}>
                      🚌 Jump to Bus Route:
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileRouteView('list')}
                      style={{ background: 'none', border: 'none', color: '#1B5E20', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}
                    >
                      View All Directory ({filteredRoutes.length}) →
                    </button>
                  </div>
                  <select
                    value={activeRoute.busNumber}
                    onChange={e => setSelectedBusNumber(e.target.value)}
                    className="bus-mobile-select"
                  >
                    {filteredRoutes.map(r => (
                      <option key={r.busNumber} value={r.busNumber}>
                        Bus {r.busNumber} {(r.famousPandalCount || 0) > 0 ? `• 🔥 ${r.famousPandalCount} Iconic ` : ''}({r.origin} ➔ {r.destination}) • {r.pandalIds.length} pujas
                      </option>
                    ))}
                  </select>
                </div>

                {/* Route Header Card */}
                <div
                  style={{
                    background: '#FFF',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '24px 28px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            background: activeRoute.isAc ? '#E0F2FE' : '#1B5E20',
                            color: activeRoute.isAc ? '#0284C7' : '#FFF',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            padding: '4px 14px',
                            borderRadius: '6px',
                          }}
                        >
                          Bus {activeRoute.busNumber}
                        </span>
                        <span className="badge" style={{ background: '#F1F8F4', color: '#1B5E20', border: '1px solid #C8E6C9' }}>
                          {activeRoute.operatorType} {activeRoute.serviceVariant !== 'Standard' ? `• ${activeRoute.serviceVariant}` : ''}
                        </span>
                        {activeRoute.isAc && (
                          <span className="badge" style={{ background: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                            ❄️ Air Conditioned
                          </span>
                        )}
                        {(activeRoute.famousPandalCount || 0) >= 8 && (
                          <span className="badge" style={{ background: '#FFF3E0', color: '#D84315', border: '1px solid #FFE0B2', fontWeight: 700 }}>
                            🔥 Hot Route
                          </span>
                        )}
                      </div>

                      <h2 style={{ fontSize: '1.35rem', margin: '4px 0', fontFamily: 'var(--font-serif)' }}>
                        {activeRoute.origin} ➔ {activeRoute.destination}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {(activeRoute.famousPandalCount || 0) > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D84315', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                            <span>🔥</span> {activeRoute.famousPandalCount}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#D84315', textTransform: 'uppercase', fontWeight: 700 }}>
                            Iconic Pujas
                          </div>
                        </div>
                      )}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1B5E20' }}>
                          {activeRoutePandals.length}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--taupe)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Total Pandals
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Stops Sequence */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--taupe)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Sequential Route Stops ({activeRoute.routeStops.length} stops)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {activeRoute.routeStops.map((stop, index) => (
                        <React.Fragment key={stop + index}>
                          <span
                            style={{
                              background: '#F9FAF8',
                              border: '1px solid #E8EDE6',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              color: '#333',
                            }}
                          >
                            {stop}
                          </span>
                          {index < activeRoute.routeStops.length - 1 && (
                            <span style={{ color: '#BBB', fontSize: '0.75rem' }}>➔</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Accessible Pandals Grid */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                        Pandals along Bus {activeRoute.busNumber} ({displayedPandals.length})
                      </h3>
                      {showIconicOnly && (
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#D84315', fontWeight: 600 }}>
                          Showing only iconic, award-winning Kolkata Durga Pujas on this bus corridor.
                        </p>
                      )}
                    </div>

                    {(activeRoute.famousPandalCount || 0) > 0 && (
                      <div style={{ display: 'flex', gap: '6px', background: 'var(--background)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() => setShowIconicOnly(false)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.74rem',
                            fontWeight: !showIconicOnly ? 700 : 500,
                            background: !showIconicOnly ? '#FFF' : 'transparent',
                            color: !showIconicOnly ? '#1B5E20' : 'var(--taupe)',
                            boxShadow: !showIconicOnly ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          All Pandals ({activeRoutePandals.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowIconicOnly(true)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.74rem',
                            fontWeight: showIconicOnly ? 700 : 500,
                            background: showIconicOnly ? '#FFF3E0' : 'transparent',
                            color: showIconicOnly ? '#D84315' : 'var(--taupe)',
                            boxShadow: showIconicOnly ? '0 1px 3px rgba(216,67,21,0.15)' : 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>🔥 Iconic Only ({activeRoute.famousPandalCount})</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {displayedPandals.map(pandal => (
                      <PandalCard key={pandal.id} pandal={pandal} />
                    ))}
                  </div>

                  {displayedPandals.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', background: '#FFF', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--taupe)' }}>
                      {showIconicOnly ? (
                        <div>
                          <p style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>No iconic pandals specifically tagged on this corridor.</p>
                          <button
                            type="button"
                            onClick={() => setShowIconicOnly(false)}
                            style={{
                              padding: '6px 14px',
                              background: '#1B5E20',
                              color: '#FFF',
                              borderRadius: '4px',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Show All {activeRoutePandals.length} Pandals
                          </button>
                        </div>
                      ) : (
                        'No pandal records directly mapped to this specific bus corridor.'
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* 4. MAIN CONTENT: STOPS TAB */}
      {activeTab === 'stops' && (
        <section className="container" style={{ marginTop: '24px' }}>
          {/* Mobile View Switcher between Stops List and Stop Detail */}
          <div className="bus-mobile-switcher">
            <div className="bus-toggle-pill">
              <button
                type="button"
                className={`bus-toggle-btn ${mobileStopView === 'list' ? 'active' : ''}`}
                onClick={() => setMobileStopView('list')}
              >
                📍 Bus Hubs ({filteredStops.length})
              </button>
              <button
                type="button"
                className={`bus-toggle-btn ${mobileStopView === 'detail' ? 'active' : ''}`}
                onClick={() => setMobileStopView('detail')}
              >
                🏛️ {activeStop?.cleanName || ''} Pandals
              </button>
            </div>
          </div>

          <div className="bus-split-layout">
            {/* Left Column: Stops List */}
            <div
              className={`bus-panel-list ${mobileStopView === 'detail' ? 'bus-panel-mobile-hidden' : ''}`}
              style={{
                background: '#FFF',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '750px',
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--taupe)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Major Bus Hubs ({filteredStops.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredStops.map(stop => {
                  const isSelected = activeStop?.id === stop.id;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => {
                        setSelectedStopId(stop.id);
                        setMobileStopView('detail');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #1B5E20' : '1px solid var(--border-subtle)',
                        background: isSelected ? '#F1F8F4' : '#FFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#1B5E20' : 'var(--foreground)' }}>
                          {stop.cleanName}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#1B5E20', background: '#E8F5E9', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
                          {stop.busNumbers.length} buses
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--taupe)' }}>
                        {stop.pandalIds.length} reachable pandals
                        {stop.nearestMetro ? ` • Near ${stop.nearestMetro} Metro` : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Stop Details */}
            {activeStop ? (
              <div className={`bus-panel-detail ${mobileStopView === 'list' ? 'bus-panel-mobile-hidden' : ''}`}>
                {/* Quick Hub Picker on Mobile */}
                <div className="bus-mobile-quick-picker">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--taupe)', textTransform: 'uppercase' }}>
                      📍 Jump to Bus Hub:
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileStopView('list')}
                      style={{ background: 'none', border: 'none', color: '#1B5E20', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}
                    >
                      View All Hubs ({filteredStops.length}) →
                    </button>
                  </div>
                  <select
                    value={activeStop.id}
                    onChange={e => setSelectedStopId(e.target.value)}
                    className="bus-mobile-select"
                  >
                    {filteredStops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.cleanName} ({s.busNumbers.length} buses, {s.pandalIds.length} pujas)
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    background: '#FFF',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '24px 28px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div className="eyebrow" style={{ color: '#1B5E20' }}>
                        <IconBus size={14} color="#1B5E20" /> Kolkata Bus Junction
                      </div>
                      <h2 style={{ fontSize: '1.4rem', margin: '4px 0', fontFamily: 'var(--font-serif)' }}>
                        {activeStop.cleanName}
                      </h2>
                      {activeStop.nearestMetro && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '4px' }}>
                          🚇 Corresponds to {activeStop.nearestMetro} Metro Station
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1B5E20' }}>
                        {activeStop.busNumbers.length}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>
                        Connecting Bus Lines
                      </div>
                    </div>
                  </div>

                  {/* Connecting Buses Badges */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--taupe)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      All Buses Serving This Hub
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {activeStop.busNumbers.map(busNo => (
                        <button
                          key={busNo}
                          type="button"
                          onClick={() => {
                            setSelectedBusNumber(busNo);
                            setActiveTab('routes');
                          }}
                          style={{
                            background: '#F1F8F4',
                            border: '1px solid #C8E6C9',
                            color: '#1B5E20',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                          title={`Click to view Bus ${busNo} full route`}
                        >
                          {busNo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pandals near this Stop */}
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', fontWeight: 700 }}>
                    Pandals near {activeStop.cleanName} ({activeStopPandals.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {activeStopPandals.map(pandal => (
                      <PandalCard key={pandal.id} pandal={pandal} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* 5. MAIN CONTENT: SPATIAL MAP TAB */}
      {activeTab === 'map' && (
        <section className="container" style={{ marginTop: '24px' }}>
          <div
            style={{
              background: '#FFF',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Kolkata Transit Spatial Map
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '2px' }}>
                  Green pins indicate 54 major bus stops, blue pins denote Kolkata Metro stations, and red pins show 248 puja pandals.
                </p>
              </div>
            </div>

            <div style={{ height: 'clamp(420px, 62vh, 620px)', borderRadius: '6px', overflow: 'hidden' }}>
              <LeafletMap
                pandals={pandals}
                metroStations={metroStations}
                busStops={busStops}
                showMetro={true}
                showBusStops={true}
                zoom={12}
                height="100%"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
