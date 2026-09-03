import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '60px 0 90px' }}>
      <div className="container container-narrow">
        <div style={{ marginBottom: '36px' }}>
          <div className="eyebrow">Trust & Transparency</div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
            Privacy & Geolocation Policy
          </h1>
          <p style={{ color: 'var(--taupe)' }}>Last updated: September 2026</p>
        </div>

        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '40px',
            lineHeight: 1.8,
            fontSize: '0.95rem',
            color: '#3B322A',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>1. Use of Geolocation Data</h2>
          <p style={{ marginBottom: '20px' }}>
            Pujo Navigation utilizes browser-based geolocation (`navigator.geolocation`) exclusively to compute distances to nearby pandals and suggest verified starting transit points. Your location data is processed locally in your browser and is never stored, sold, or shared with third-party advertisers.
          </p>

          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>2. Local Storage & Bookmarks</h2>
          <p style={{ marginBottom: '20px' }}>
            Saved favorite pandals and custom itinerary itineraries are saved locally on your device via HTML5 `localStorage`. You can clear this data at any time through the Saved Pandals page or your browser settings.
          </p>

          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>3. OpenStreetMap & Tile Attribution</h2>
          <p style={{ marginBottom: '28px' }}>
            Map views and spatial routing interfaces utilize open tiles from CartoDB and OpenStreetMap contributors under Open Database License (ODbL).
          </p>

          <Link href="/" className="btn btn-secondary btn-sm">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
