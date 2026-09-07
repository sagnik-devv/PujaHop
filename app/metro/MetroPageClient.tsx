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
} from '../../components/Icons';
import { useLanguage } from '../../lib/language-context';

interface MetroPageClientProps {
  metroStations: MetroStation[];
  pandals: Pandal[];
  initialStationId?: number;
}

export default function MetroPageClient({
  metroStations,
  pandals,
}: MetroPageClientProps) {
  const { language, t } = useLanguage();

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
              <IconMetro size={15} /> {t('metro_guide', 'Metro Guide')}
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
              <IconBus size={15} /> {t('bus_routes', 'Bus Routes Guide')}
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
            {t('metro_guide_title', 'Kolkata Metro Durga Puja Guide')}
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
            {t('metro_guide_subtitle', 'During Durga Puja, vehicular roads across Kolkata are heavily barricaded by the police. Kolkata Metro is the fastest, crowd-free way to hop between legendary pandals. Tap any station to explore all pujas within walking distance with 1-click Google Maps navigation.')}
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
                {t('quick_stats_metros', 'Metro Stations')}
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
                {language === 'bn' ? '৪টি লাইন' : '4 Lines'}
              </div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone)', fontWeight: 600 }}>
                {language === 'bn' ? 'ব্লু, গ্রিন, পার্পল, অরেঞ্জ' : 'Blue, Green, Purple, Orange'}
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
                {t('quick_stats_pandals', 'Pandals Accessible')}
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
                {language === 'bn' ? 'সারারাত পূজা স্পেশাল ট্রেন' : 'All-Night Puja Special Trains'}
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
              {language === 'bn' ? 'মেট্রো পরিক্রমার নির্দেশিকা' : 'Essential Festive Transit Intelligence'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }}>
              {language === 'bn' ? 'পূজোতে কীভাবে সহজ করবেন মেট্রো সফর' : 'How to Master Kolkata Metro During Puja'}
            </h2>
            <p style={{ color: 'var(--taupe)', marginTop: '8px', fontSize: '0.92rem' }}>
              {language === 'bn' ? 'দুর্গাপূজার বিশেষ দিনগুলিতে মেট্রো রেল নাইট সার্ভিস পরিচালনা করে।' : 'Kolkata Metro runs special overnight schedules and high-frequency services across all festive days.'}
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
                  {language === 'bn' ? 'সারারাত স্পেশাল মেট্রো পরিষেবা' : 'All-Night Special Puja Service'}
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.5, marginBottom: '14px' }}>
                {language === 'bn' ? 'সপ্তমী, অষ্টমী ও নবমীতে রাতভর ট্রেন চলাচল করে ব্লু ও গ্রিন লাইনে।' : 'On Saptami, Ashtami, and Nabami, Kolkata Metro traditionally operates extended festive midnight services on the Blue (North-South) and Green (East-West) lines.'}
              </p>
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
                  {language === 'bn' ? 'প্রধান ইন্টারচেঞ্জ স্টেশনসমূহ' : 'Key Interchange Stations'}
                </h3>
              </div>
              <ul style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6, paddingLeft: '20px', margin: 0 }}>
                <li><strong>এসপ্ল্যানেড:</strong> {language === 'bn' ? 'ব্লু লাইন ও গ্রিন লাইনের সংযোগস্থল' : 'Connects Blue Line with Green Line'}</li>
                <li><strong>হাওড়া ময়দান:</strong> {language === 'bn' ? 'হাওড়া অঞ্চলের পুজো ও ট্রেন নেটওয়ার্ক' : 'Access iconic Howrah pandals & trains'}</li>
                <li><strong>শিয়ালদহ:</strong> {language === 'bn' ? 'মধ্য ও উত্তর কলকাতার ঐতিহ্যবাহী প্যান্ডেল' : 'Green Line gateway to heritage pandals'}</li>
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
                  {language === 'bn' ? 'লাইনের ভিড় এড়ানোর উপায়' : 'Bypass Token Queues'}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--foreground)' }}>
                <div>✅ {language === 'bn' ? 'মেট্রো স্মার্ট কার্ড ব্যবহার করুন।' : 'Use a Metro Smart Card.'}</div>
                <div>✅ {language === 'bn' ? 'Metro Ride Kolkata অ্যাপ দিয়ে QR টিকিট কাটুন।' : 'Book UPI QR tickets via Metro Ride Kolkata app.'}</div>
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
              <IconSparkles size={16} /> {t('plan_my_night', 'Plan Multi-Pandal Night Itinerary')}
            </Link>
            <Link href="/route" className="btn btn-secondary">
              <IconRoute size={16} /> {t('smart_route_calc', 'Open Smart Route Finder')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
