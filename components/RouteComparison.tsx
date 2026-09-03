'use client';

import React, { useState } from 'react';
import { RouteOption } from '../lib/types';
import RouteCard from './RouteCard';
import { IconChevronRight, IconSparkles } from './Icons';

interface RouteComparisonProps {
  routes: RouteOption[];
  targetPandalName: string;
}

export default function RouteComparison({ routes, targetPandalName }: RouteComparisonProps) {
  const [showFormula, setShowFormula] = useState(false);

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {routes.length} Smart Travel Options
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>
            Ranked dynamically by festive transit efficiency, walking comfort and crowd resilience.
          </p>
        </div>

        <button
          onClick={() => setShowFormula(!showFormula)}
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--antique-gold)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--warm-cream)',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #E5D5C0',
          }}
        >
          <IconSparkles size={14} color="#B08D57" />
          <span>How Pujo Navigation Scores Routes</span>
          <span style={{ transform: showFormula ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
            <IconChevronRight size={14} />
          </span>
        </button>
      </div>

      {/* Expandable Scoring Formula Breakdown */}
      {showFormula && (
        <div
          style={{
            background: '#FAF7F2',
            border: '1px solid var(--border-gold)',
            borderRadius: '6px',
            padding: '20px 24px',
            marginBottom: '24px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginBottom: '8px' }}>
            Pujo Navigation Composite Route Scoring Model
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#4A423B', marginBottom: '14px', lineHeight: 1.5 }}>
            During Durga Puja, roads experience heavy police barricades, pedestrian-only zones, and massive vehicular gridlocks.
            Pujo Navigation calculates route viability using a weighted multi-factor penalty model:
          </p>

          <div
            style={{
              background: '#FFF',
              padding: '12px 16px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#B3261E',
              border: '1px solid #E5DED5',
              marginBottom: '14px',
            }}
          >
            Score = 100 - [ (Travel Time × 1.0) + (Fare × 0.4) + (Walking (m) / 100 × 1.5) + (Transfers × 8) + (Crowd Penalty × 2.0) + (Festive Traffic Penalty × 3.5) ]
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.78rem', color: 'var(--taupe)' }}>
            <div>🚇 <strong>Metro Priority:</strong> Zero traffic penalty + air-conditioned comfort.</div>
            <div>🚶 <strong>Walk Optimization:</strong> Penalizes walking distances &gt; 900m in peak humidity.</div>
            <div>🚗 <strong>Road Realism:</strong> Cabs incur heavy festive diversion penalties near famous pandals.</div>
          </div>
        </div>
      )}

      {/* Routes List */}
      <div>
        {routes.map(route => (
          <RouteCard
            key={route.id}
            route={route}
            targetPandalName={targetPandalName}
          />
        ))}
      </div>
    </div>
  );
}
