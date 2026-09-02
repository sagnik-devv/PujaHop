import React from 'react';

export default function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="pandal-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="pandal-card"
          style={{
            animation: 'pulse 1.5s infinite ease-in-out',
            minHeight: '340px',
            background: '#F5EFE6',
          }}
        >
          <div style={{ aspectRatio: '4/3', background: '#EAE1D5' }} />
          <div style={{ padding: '20px' }}>
            <div style={{ width: '40%', height: '12px', background: '#EAE1D5', marginBottom: '10px' }} />
            <div style={{ width: '80%', height: '20px', background: '#E0D4C5', marginBottom: '14px' }} />
            <div style={{ width: '100%', height: '14px', background: '#EAE1D5', marginBottom: '6px' }} />
            <div style={{ width: '60%', height: '14px', background: '#EAE1D5' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
