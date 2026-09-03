'use client';

import React from 'react';
import Link from 'next/link';
import { MetroStation, Pandal } from '../../lib/types';
import MetroPujaPlanner from '../../components/MetroPujaPlanner';
import {
  IconMetro,
  IconBus,
  IconSparkles,
  IconRoute,
  IconShield,
  IconCalendar,
  IconMapPin,
  IconWalk,
} from '../../components/Icons';

interface MetroPageClientProps {
  metroStations: MetroStation[];
  pandals: Pandal[];
  initialStationId?: number;
}

export default function MetroPageClient({
  metroStations,
  pandals,
  initialStationId,
}: MetroPageClientProps) {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 1. HERO BANNER */}
      <section
        style={{
          position: 'relative',
          padding: '70px 0 60px',
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
            backgroundImage: 'url(/images/durga/durga-1.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            opacity: 0.22,
            filter: 'contrast(1.2) brightness(0.7)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(23,18,15,0.7) 0%, rgba(23,18,15,0.92) 80%, rgba(23,18,15,0.98) 100%)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '840px' }}>
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
            <div
              style={{
                padding: '6px 18px',
                borderRadius: '24px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: '#155799',
                color: '#FFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(21,87,153,0.4)',
              }}
            >
              <IconMetro size={15} /> Metro Guide
            </div>
            <Link
              href="/bus"
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
              <IconBus size={15} /> Bus Routes Guide (180 Lines)
            </Link>
          </div>

          <h1
            style={{
              color: '#FFF',
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
              fontFamily: 'var(--font-serif)',
              margin: '0 0 16px',
              lineHeight: 1.15,
            }}
          >
            Kolkata Metro Durga Puja Guide
          </h1>

          <div className="hero-accent-line" style={{ margin: '0 auto 20px' }} />

          <p
            style={{
              color: 'var(--stone)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              maxWidth: '720px',
              margin: '0 auto 32px',
            }}
          >
            During Durga Puja, vehicular roads across Kolkata are heavily barricaded by the police. Kolkata Metro is the fastest, crowd-free way to hop between legendary pandals. Tap any station to explore all pujas within walking distance with 1-click Google Maps navigation.
          </p>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '16px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 700, color: '#90CAF9' }}>
                {metroStations.length}
              </div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone)', fontWeight: 600 }}>
                Metro Stations
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '16px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 700, color: '#A5D6A7' }}>
                4 Lines
              </div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone)', fontWeight: 600 }}>
                Blue, Green, Purple, Orange
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '16px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 700, color: '#FFD54F' }}>
                {pandals.length}+
              </div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone)', fontWeight: 600 }}>
                Pandals Accessible
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '16px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 700, color: '#FF8A80' }}>
                04:00 AM
              </div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone)', fontWeight: 600 }}>
                All-Night Puja Special Trains
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FULL EXPANDED METRO PUJA PLANNER COMPONENT */}
      <MetroPujaPlanner
        metroStations={metroStations}
        pandals={pandals}
        compact={false}
      />

      {/* 3. FESTIVE METRO MOBILITY & TRAVEL HACKS GUIDE */}
      <section style={{ padding: '70px 0 30px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>
              Essential Festive Transit Intelligence
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }}>
              How to Master Kolkata Metro During Puja
            </h2>
            <p style={{ color: 'var(--taupe)', marginTop: '8px', fontSize: '0.92rem' }}>
              Kolkata Metro runs special overnight schedules and high-frequency services across all festive days.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
            {/* Guide Card 1: Special Timetable */}
            <div
              style={{
                background: '#FFF',
                border: '1px solid var(--border-gold)',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🌙</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  All-Night Special Puja Service
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.5, marginBottom: '14px' }}>
                On <strong>Saptami, Ashtami, and Nabami</strong>, Kolkata Metro traditionally operates extended festive midnight services on the Blue (North-South) and Green (East-West) lines. Standard schedules apply on Panchami, Sasthi, and Dashami.
              </p>
              <div style={{ fontSize: '0.78rem', background: '#F9F6F0', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                💡 <em>Timings follow Metro Railway Kolkata official festive circulars. Blue Line connects Dakshineswar to Kavi Subhash, and Green Line connects Howrah Maidan to Sealdah.</em>
              </div>
            </div>

            {/* Guide Card 2: Key Interchange Junctions */}
            <div
              style={{
                background: '#FFF',
                border: '1px solid var(--border-gold)',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🔄</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Key Interchange Stations
                </h3>
              </div>
              <ul style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6, paddingLeft: '20px', margin: 0 }}>
                <li><strong>Esplanade:</strong> Connects Blue Line (North-South) with Green Line (East-West under the river to Howrah).</li>
                <li><strong>Howrah Maidan:</strong> Access iconic Howrah pandals & Eastern/South Eastern train networks.</li>
                <li><strong>Sealdah:</strong> Green Line gateway to Central & North-East heritage pandals.</li>
                <li><strong>Kavi Subhash:</strong> Interchange between Blue Line and Orange Line (Ruby).</li>
              </ul>
            </div>

            {/* Guide Card 3: Queue Bypass Hacks */}
            <div
              style={{
                background: '#FFF',
                border: '1px solid var(--border-gold)',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎫</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Bypass 45-Min Token Queues
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.5, marginBottom: '14px' }}>
                Token ticket counters at Kalighat, Shyambazar, and Sovabazar experience heavy lines during peak evenings.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--foreground)' }}>
                <div>✅ Use a rechargeable <strong>Kolkata Metro Smart Card</strong>.</div>
                <div>✅ Book UPI QR tickets instantly via the <strong>Metro Ride Kolkata</strong> app.</div>
                <div>✅ Keep ₹20–₹30 balance topped up before 5:00 PM.</div>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div
            style={{
              marginTop: '40px',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/planner" className="btn btn-gold">
              <IconSparkles size={16} /> Plan Multi-Pandal Night Itinerary
            </Link>
            <Link href="/route" className="btn btn-secondary">
              <IconRoute size={16} /> Open Smart Route Finder
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
