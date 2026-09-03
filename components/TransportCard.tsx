import React from 'react';
import { formatCurrency, formatDistance, formatDuration } from '../lib/format';
import { IconMetro, IconBus, IconCab, IconWalk } from './Icons';

interface TransportCardProps {
  mode: 'metro' | 'bus' | 'cab' | 'walk' | 'auto';
  title: string;
  subtitle: string;
  durationMinutes: number;
  distanceMeters: number;
  fare: number;
  statusText?: string;
  isRecommended?: boolean;
  notes?: string;
}

export default function TransportCard({
  mode,
  title,
  subtitle,
  durationMinutes,
  distanceMeters,
  fare,
  statusText,
  isRecommended = false,
  notes,
}: TransportCardProps) {
  const getIcon = () => {
    switch (mode) {
      case 'metro':
        return <IconMetro size={22} color="#155799" />;
      case 'bus':
        return <IconBus size={22} color="#2F7D4A" />;
      case 'cab':
      case 'auto':
        return <IconCab size={22} color="#D99A25" />;
      case 'walk':
      default:
        return <IconWalk size={22} color="#756D65" />;
    }
  };

  return (
    <div
      style={{
        background: '#FFF',
        border: isRecommended ? '1.5px solid #B3261E' : '1px solid var(--border)',
        borderRadius: '6px',
        padding: '18px 20px',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: isRecommended ? '0 4px 16px rgba(179,38,30,0.08)' : 'none',
      }}
    >
      {isRecommended && (
        <span
          style={{
            position: 'absolute',
            top: '-10px',
            right: '16px',
            background: '#B3261E',
            color: '#FFF',
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '2px 8px',
            borderRadius: '2px',
          }}
        >
          Pujo Navigation Top Choice
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              background: 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {getIcon()}
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>{subtitle}</p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
            {fare === 0 ? 'Free' : formatCurrency(fare)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>
            Estimated Fare
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '10px 0',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          color: '#3B3026',
        }}
      >
        <div>
          <strong>{formatDuration(durationMinutes)}</strong> travel time
        </div>
        <div>•</div>
        <div>
          <strong>{formatDistance(distanceMeters)}</strong> distance
        </div>
      </div>

      {notes && (
        <p style={{ fontSize: '0.76rem', color: 'var(--taupe)', marginTop: '8px', lineHeight: 1.4 }}>
          {notes}
        </p>
      )}
    </div>
  );
}
