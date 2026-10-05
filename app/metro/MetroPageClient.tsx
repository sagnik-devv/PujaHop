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
      {/* 1. HERO BANNER WITH METRO ROUTE GUIDE IMAGE (MOBILE-PRIMARY) */}
      <section className="metro-hero-section">
        <div className="metro-hero-bg-art" />
        <div className="container metro-hero-grid">
          {/* Visual Showcase Card - On mobile devices (CSS order: -1), this is the FIRST/PRIMARY element */}
          <div className="metro-hero-visual-card">
            <img
              src="/images/metro-route-guide.png"
              alt="Kolkata Durga Puja Metro Route Guide"
              className="metro-hero-img"
            />

            {/* Glowing neon pin badge */}
            <div className="metro-hero-pin-badge">
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#EF4444',
                  boxShadow: '0 0 10px #EF4444',
                }}
              />
              <span>{language === 'bn' ? 'কলকাতা মেট্রো রুট গাইড' : 'Kolkata Metro Route Guide'}</span>
            </div>

            {/* Bottom info tag */}
            <div className="metro-hero-bottom-tag">
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  {language === 'bn' ? 'রবীন্দ্র সদন ও কবি সুভাষ – দক্ষিণেশ্বর করিডোর' : 'Rabindra Sadan & Blue-Green Corridors'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#E5D5C0' }}>
                  {language === 'bn' ? 'সারারাত ০৪:০০ AM পর্যন্ত পূজা স্পেশাল মেট্রো' : 'All-Night Puja Special Trains till 4:00 AM'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(23,18,15,0.7)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                <span style={{ color: '#90CAF9' }}>🚇</span>
                <span>{metroStations.length} Stations</span>
              </div>
            </div>
          </div>

          {/* Hero Content & Transit Switcher */}
          <div className="metro-hero-content">
            {/* Transit Navigator Switcher */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(212,183,122,0.3)',
                borderRadius: '30px',
                padding: '4px',
                marginBottom: '18px',
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
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                fontFamily: 'var(--font-serif)',
                margin: '0 0 14px',
                lineHeight: 1.18,
              }}
            >
              {language === 'bn' ? 'কলকাতা মেট্রো ' : 'Kolkata Metro '}
              <span className="vermilion-text">{language === 'bn' ? 'দুর্গাপূজা গাইড' : 'Puja Route Guide'}</span>
            </h1>

            <p
              style={{
                color: 'var(--stone)',
                fontSize: '0.98rem',
                lineHeight: 1.6,
                marginBottom: '22px',
              }}
            >
              {language === 'bn'
                ? 'যানজট মুক্ত সেরা পূজো ভ্রমণের জন্য কলকাতা মেট্রো ব্যবহার করুন। যেকোনো স্টেশন নির্বাচন করে হাঁটার দূরত্বের মধ্যে সব বিখ্যাত প্যান্ডেল দেখুন।'
                : 'Bypass road congestion and explore Kolkata’s legendary pandals via Blue, Green, Purple and Orange lines. Select any station to view walking distances.'}
            </p>

            {/* Quick Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                textAlign: 'center',
                marginBottom: '18px',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#90CAF9' }}>{metroStations.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('quick_stats_metros', 'Stations')}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#A5D6A7' }}>4 Lines</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Blue/Green</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFD54F' }}>{pandals.length}+</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{language === 'bn' ? 'প্যান্ডেল' : 'Pandals'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF8A80' }}>04:00 AM</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{language === 'bn' ? 'সারারাত' : 'All-Night'}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="metro-hero-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/route"
                className="btn btn-vermilion"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.85rem' }}
              >
                <IconRoute size={15} color="#FFF" />
                <span>{language === 'bn' ? 'স্মার্ট মেট্রো রুট প্ল্যানার' : 'Smart Route Planner'}</span>
              </Link>

              <Link
                href="/transit"
                className="btn btn-secondary"
                style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.3)', padding: '9px 15px', fontSize: '0.85rem' }}
              >
                {language === 'bn' ? 'মেট্রো ও বাস তুলনা' : 'Metro & Bus Switcher'}
              </Link>
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
