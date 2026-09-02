'use client';

import React, { useState } from 'react';
import { RouteOption } from '../lib/types';
import { formatCurrency, formatDistance, formatDuration } from '../lib/format';
import {
  IconMetro,
  IconWalk,
  IconCab,
  IconBus,
  IconNavigation,
  IconChevronRight,
  IconSparkles,
} from './Icons';

interface RouteCardProps {
  route: RouteOption;
  targetPandalName: string;
  onSelect?: () => void;
}

export default function RouteCard({ route, targetPandalName, onSelect }: RouteCardProps) {
  const [expanded, setExpanded] = useState(route.isRecommended);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'metro':
        return <IconMetro size={16} color="#155799" />;
      case 'cab':
      case 'auto':
        return <IconCab size={16} color="#D99A25" />;
      case 'bus':
        return <IconBus size={16} color="#2F7D4A" />;
      case 'walk':
      default:
        return <IconWalk size={16} color="#756D65" />;
    }
  };

  return (
    <div className={`route-card ${route.isRecommended ? 'recommended' : ''}`}>
      {/* Header */}
      <div className="route-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{route.title}</h3>
            {route.badge && (
              <span className="badge" style={{ backgroundColor: route.isRecommended ? '#B3261E' : 'var(--warm-cream)', color: route.isRecommended ? '#FFF' : '#5A4838' }}>
                {route.isRecommended && <IconSparkles size={11} color="#FFF" />} {route.badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>{route.tagline}</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
            {formatDuration(route.totalTimeMinutes)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
            {route.estimatedFare === 0 ? 'Free' : formatCurrency(route.estimatedFare)} • {route.totalDistanceKm} km
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="route-stats-row">
        <div className="route-stat-item">
          <span className="route-stat-val">{formatDuration(route.totalTimeMinutes)}</span>
          <span className="route-stat-lbl">Travel Time</span>
        </div>
        <div className="route-stat-item">
          <span className="route-stat-val">{formatCurrency(route.estimatedFare)}</span>
          <span className="route-stat-lbl">Est. Fare</span>
        </div>
        <div className="route-stat-item">
          <span className="route-stat-val">{formatDistance(route.walkingDistanceMeters)}</span>
          <span className="route-stat-lbl">Walking</span>
        </div>
        <div className="route-stat-item">
          <span className="route-stat-val">{route.transfersCount}</span>
          <span className="route-stat-lbl">Transfers</span>
        </div>
        <div className="route-stat-item" style={{ marginLeft: 'auto' }}>
          <span className="route-stat-val" style={{ color: 'var(--antique-gold)' }}>
            {route.compositeScore}/10
          </span>
          <span className="route-stat-lbl">Smart Score</span>
        </div>
      </div>

      {/* Summary steps chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
        {route.segments.map((seg, idx) => (
          <React.Fragment key={seg.id}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--background)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {getModeIcon(seg.mode)}
              <span>{seg.from.split('(')[0].trim()}</span>
            </div>
            {idx < route.segments.length - 1 && (
              <span style={{ color: 'var(--antique-gold)' }}>→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Expand / Collapse Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--antique-gold)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{expanded ? 'Hide Step-by-Step Directions' : 'View Step-by-Step Directions'}</span>
          <span style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
            <IconChevronRight size={15} />
          </span>
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(route.segments[0]?.from || 'Kolkata')}&destination=${encodeURIComponent(`${targetPandalName}, Kolkata`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-vermilion btn-sm"
          title={`Navigate from ${route.segments[0]?.from || 'origin'} to ${targetPandalName} in Google Maps`}
        >
          <IconNavigation size={14} /> Start Navigation
        </a>
      </div>

      {/* Detailed Segment Timeline */}
      {expanded && (
        <div className="route-timeline">
          {route.segments.map((seg, i) => (
            <div
              key={seg.id}
              className={`timeline-step ${seg.mode === 'metro' ? 'active-metro' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {seg.instructions}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--taupe)', marginTop: '2px' }}>
                    {seg.from} → {seg.to}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--taupe)' }}>
                  <div>{formatDuration(seg.durationMinutes)}</div>
                  <div>{formatDistance(seg.distanceMeters)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
