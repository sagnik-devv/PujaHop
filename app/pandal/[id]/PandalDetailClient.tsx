'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pandal, MetroStation, BusStop, PandalBusConnectivity, CrowdInfo, PandalEatery, PandalArtDetails } from '../../../lib/types';
import { formatDistance, formatDuration } from '../../../lib/format';
import {
  IconMetro,
  IconBus,
  IconWalk,
  IconMapPin,
  IconCalendar,
  IconSparkles,
  IconNavigation,
  IconAward,
  IconPalette,
} from '../../../components/Icons';
import CrowdBadge from '../../../components/CrowdBadge';
import FavoriteButton from '../../../components/FavoriteButton';
import TransportCard from '../../../components/TransportCard';
import PandalCard from '../../../components/PandalCard';
import LeafletMap from '../../../components/LeafletMap';
import { useLanguage } from '../../../lib/language-context';

interface PandalDetailClientProps {
  pandal: Pandal;
  metroStations: MetroStation[];
  busStops: BusStop[];
  busConnectivity: PandalBusConnectivity | null;
  nearestMetroInfo: any;
  nearbyPandals: Pandal[];
  crowdInfo: CrowdInfo;
  nearbyEateries: PandalEatery[];
  artDetails: PandalArtDetails | null;
}

export default function PandalDetailClient({
  pandal,
  metroStations,
  busStops,
  busConnectivity,
  nearestMetroInfo,
  nearbyPandals,
  crowdInfo,
  nearbyEateries,
  artDetails,
}: PandalDetailClientProps) {
  const { language, tPandalName, tRegion, t } = useLanguage();

  const nearestMetro = nearestMetroInfo?.metro;
  const walkingMeters = nearestMetroInfo?.walkingMeters || pandal.walkingDistanceM;
  const walkingMinutes = nearestMetroInfo?.walkingMinutes || pandal.walkingTimeMinutes;

  const displayName = tPandalName(pandal);
  const displayRegion = tRegion(pandal.region);

  return (
    <div style={{ background: 'var(--background)', paddingBottom: '80px' }}>
      {/* 1. EDITORIAL HEADER & MEDIA HERO */}
      <section style={{ background: 'var(--dark-bg)', color: '#FFF', padding: '60px 0 48px', position: 'relative' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--stone)', marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'var(--soft-gold)' }}>{t('home', 'Home')}</Link>
            <span>/</span>
            <Link href="/explore" style={{ color: 'var(--soft-gold)' }}>{t('explore_pandals', 'Pandals')}</Link>
            <span>/</span>
            <span>{displayRegion}</span>
          </div>

          <div className="pandal-hero-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span className="badge badge-region" style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--soft-gold)', borderColor: 'rgba(176,141,87,0.3)' }}>
                  {displayRegion}
                </span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#D4B77A', borderColor: 'rgba(212,183,122,0.3)', fontSize: '0.74rem' }}>
                  ✓ Verified for 2026
                </span>
                {artDetails?.establishedEra && (
                  <span className="badge" style={{ background: 'rgba(176,141,87,0.18)', color: 'var(--soft-gold)', borderColor: 'rgba(176,141,87,0.4)', fontSize: '0.74rem' }}>
                    Est. {artDetails.establishedEra}
                  </span>
                )}
                {artDetails?.pandalArtType && (
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#E8E2D9', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.74rem' }}>
                    {artDetails.pandalArtType}
                  </span>
                )}
                {pandal.id === 40 && (
                  <span className="badge" style={{ background: '#B3261E', color: '#FFF', fontWeight: 800, border: '1px solid #FF8A80', boxShadow: '0 2px 10px rgba(179,38,30,0.5)' }}>
                    🔥 {language === 'bn' ? '#১ সর্বাধিক ভিড়' : '#1 Most Crowded in Kolkata'}
                  </span>
                )}
                {pandal.id === 205 && (
                  <span className="badge" style={{ background: '#0D47A1', color: '#FFF', fontWeight: 800, border: '1px solid #90CAF9' }}>
                    🎨 {language === 'bn' ? 'আর্ট ইন্সটলেশন' : 'Famous Haridevpur Installation'}
                  </span>
                )}
                {pandal.famous && (
                  <span className="badge badge-famous">
                    <IconSparkles size={12} /> {t('famous_badge', 'Iconic Kolkata Puja')}
                  </span>
                )}
                <CrowdBadge level={pandal.crowdLevel} isLive={false} />
              </div>

              <h1 style={{ color: '#FFF', fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', lineHeight: 1.15, marginBottom: '14px' }}>
                {displayName}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stone)', fontSize: '0.88rem', marginBottom: '24px' }}>
                <IconMapPin size={16} color="#D4B77A" />
                <span>{pandal.address}</span>
              </div>

              {/* Action Buttons Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  href={`/route?to=${pandal.id}`}
                  className="btn btn-vermilion btn-lg"
                >
                  <IconNavigation size={18} /> {t('calculate_route', 'Find Smart Route')}
                </Link>

                <FavoriteButton
                  pandalId={pandal.id}
                  pandalName={pandal.name}
                  showText={true}
                  className="btn-lg"
                />

                <a
                  href={pandal.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-lg"
                  style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  <IconMapPin size={16} /> {t('google_maps', 'Open in Google Maps')}
                </a>
              </div>
            </div>

            {/* Pandal Hero Image */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '16/10',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-gold)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              }}
            >
              <Image
                src={pandal.imageUrl || `/images/pandals/pandal-${pandal.id}.jpg`}
                alt={displayName}
                fill
                priority
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PANDAL CORE METRICS & THEME DETAILS */}
      <section className="container" style={{ marginTop: '-24px', position: 'relative', zIndex: 10 }}>
        <div
          className="pandal-metrics-grid"
          style={{
            background: '#FFFDF9',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(23,18,15,0.08)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '4px' }}>
              🚇 {t('nearest_metro', 'Nearest Kolkata Metro')}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#155799' }}>
              {nearestMetro ? nearestMetro.name : pandal.nearestMetro}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              {formatDistance(walkingMeters)} {language === 'bn' ? 'হাঁটা' : 'walk'} (~{formatDuration(walkingMinutes)})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '4px' }}>
              👥 {t('crowd_level', 'Crowd & Queue Status')}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>
              {crowdInfo.statusText}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              {language === 'bn' ? 'ব্যস্ত সময়:' : 'Peak Rush:'} {crowdInfo.peakHours}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '4px' }}>
              ⏰ {t('opening_hours', 'Timings & Darshan')}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>
              {pandal.openingTime} – {pandal.closingTime}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              {language === 'bn' ? 'সেরা সময়:' : 'Best Hours:'} {pandal.bestTimeToVisit}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '4px' }}>
              🚆 {language === 'bn' ? 'নিকটবর্তী রেল স্টেশন' : 'Nearest Rail Terminal'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>
              {pandal.nearestRailwayStation || 'Sealdah Railway Station'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              {language === 'bn' ? 'লোকাল ট্রেন নেটওয়ার্ক সংযুক্ত' : 'Connected via local suburban grid'}
            </div>
          </div>
        </div>
      </section>

      {/* 2.5. ART, PHILOSOPHY & CULTURAL HERITAGE */}
      {artDetails && (
        <section className="container" style={{ marginTop: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconPalette size={14} color="#B08D57" />
                <span>{t('art_culture', 'Curated Cultural & Art Dossier')}</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', margin: '4px 0 0' }}>
                {language === 'bn' ? 'শিল্পকলা, স্থাপত্য ও থিম ভাবনা' : 'Art, Architecture & Philosophy'}
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--taupe)', fontSize: '0.94rem', marginBottom: '28px' }}>
            {displayName} {language === 'bn' ? 'মণ্ডপের শৈল্পিক ভাবনা ও কারুশিল্প।' : 'thematic narrative, master artisans, and creative vision.'}
          </p>

          {/* Artistic Philosophy Highlight Banner */}
          <div
            className="philosophy-quote-banner"
            style={{
              background: 'linear-gradient(135deg, #2B1810 0%, #17120F 100%)',
              borderRadius: '12px',
              color: '#FFF',
              border: '1px solid rgba(176,141,87,0.35)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              marginBottom: '32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, fontSize: '10rem', fontFamily: 'serif', pointerEvents: 'none' }}>
              “
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D4B77A', fontWeight: 700, marginBottom: '8px' }}>
              ✦ {t('philosophy', 'Creative Philosophy & Mandap Vision')}
            </div>
            <div style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)', fontFamily: 'var(--font-serif)', lineHeight: 1.6, color: '#FFFDF8', fontStyle: 'italic', maxWidth: '900px' }}>
              "{artDetails.artPhilosophy}"
            </div>
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', fontSize: '0.82rem', color: '#D5CEC5' }}>
              <div><strong>{language === 'bn' ? 'শিল্পের ধরন:' : 'Genre:'}</strong> {artDetails.pandalArtType}</div>
              <div>•</div>
              <div><strong>{language === 'bn' ? 'প্রতিষ্ঠার সময়:' : 'Heritage Era:'}</strong> {artDetails.establishedEra}</div>
            </div>
          </div>

          {/* Grid: Themes, Sculptures, Craftsmanship & Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Card 1: Themes */}
            <div
              style={{
                background: '#FFF',
                border: '1px solid var(--border-gold)',
                borderRadius: '10px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <IconCalendar size={18} color="#B3261E" />
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
                  {language === 'bn' ? 'সাম্প্রতিক ও বিগত থিমসমূহ' : 'Recent & Past Themes'}
                </h3>
              </div>
              
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '6px' }}>
                  {language === 'bn' ? 'বর্তমান সংস্করণ' : 'Current Edition'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#2B2520', lineHeight: 1.55 }}>
                  {artDetails.recentAndCurrentThemes}
                </div>
              </div>

              {artDetails.pastNotableThemes && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '6px' }}>
                    {language === 'bn' ? 'ঐতিহাসিক থিমসমূহ' : 'Historical Themes'}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#554D45', lineHeight: 1.5 }}>
                    {artDetails.pastNotableThemes}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Sculpture */}
            <div
              style={{
                background: '#FFF',
                border: '1px solid var(--border-gold)',
                borderRadius: '10px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <IconSparkles size={18} color="#B08D57" />
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
                  {language === 'bn' ? 'প্রতিমা ও রূপায়ণ' : 'Pratima & Divine Sculpture'}
                </h3>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#2B2520', lineHeight: 1.6, marginBottom: '18px' }}>
                {artDetails.idolSculptureStyle}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '6px' }}>
                  {t('craftsmanship', 'Craftsmanship & Materials Used')}
                </div>
                <div style={{ fontSize: '0.86rem', color: '#554D45', lineHeight: 1.55 }}>
                  {artDetails.craftsmanshipAndMaterials}
                </div>
              </div>
            </div>

            {/* Card 3: Cultural Story */}
            <div
              style={{
                background: '#FFF',
                border: '1px solid var(--border-gold)',
                borderRadius: '10px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <IconMapPin size={18} color="#B3261E" />
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
                  {language === 'bn' ? 'সাংস্কৃতিক পটভূমি ও ইতিহাস' : 'Cultural Story & Community'}
                </h3>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#2B2520', lineHeight: 1.6, marginBottom: '18px' }}>
                {artDetails.detailedCulturalDescription}
              </div>

              {artDetails.awardsAndAccolades && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8D5B00', fontWeight: 700, marginBottom: '6px' }}>
                    <IconAward size={13} color="#B08D57" />
                    <span>{t('awards', 'Awards & Honors')}</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#3E342B', fontWeight: 600 }}>
                    {artDetails.awardsAndAccolades}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. HOW TO REACH & TRANSIT CARDS */}
      <section className="container" style={{ marginTop: '56px' }}>
        <div className="eyebrow">{language === 'bn' ? 'যাতায়াত ব্যবস্থা' : 'Smart Mobility Guide'}</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
          {language === 'bn' ? `কীভাবে পৌঁছাবেন ${displayName}-এ` : `How to Reach ${displayName}`}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
          <TransportCard
            mode="metro"
            title={`${nearestMetro ? nearestMetro.name : pandal.nearestMetro} Metro Station`}
            subtitle={nearestMetro ? `${nearestMetro.line} Line` : 'Kolkata Metro Network'}
            durationMinutes={walkingMinutes}
            distanceMeters={walkingMeters}
            fare={10}
            isRecommended={true}
            notes={language === 'bn' ? 'মেট্রো স্টেশন থেকে হাঁটার দূরত্বের মধ্যে।' : 'Recommended transit stop. Direct walking route available.'}
          />

          {busConnectivity && (
            <TransportCard
              mode="bus"
              title={`${busConnectivity.cleanStopName || pandal.nearestBusStop} Bus Stop`}
              subtitle={`${busConnectivity.busCount} connecting bus lines`}
              durationMinutes={5}
              distanceMeters={250}
              fare={15}
              notes={`Available buses: ${busConnectivity.buses.slice(0, 4).map(b => b.busNumber).join(', ')}`}
            />
          )}
        </div>
      </section>

      {/* 4. MAP & NEARBY EATERIES */}
      <section className="container" style={{ marginTop: '56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Map */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>
              📍 {language === 'bn' ? 'প্যান্ডেলের অবস্থান ম্যাপ' : 'Interactive Map Location'}
            </h3>
            <div style={{ height: '360px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-gold)' }}>
              <LeafletMap
                pandals={[pandal]}
                selectedPandalId={pandal.id}
                height="100%"
                center={[pandal.latitude, pandal.longitude]}
                zoom={16}
              />
            </div>
          </div>

          {/* Nearby Heritage Food */}
          {nearbyEateries.length > 0 && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>
                🍔 {t('nearby_food', 'Heritage Eateries Nearby')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {nearbyEateries.slice(0, 4).map((e, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFF',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.eateryName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--taupe)' }}>
                        {e.cuisineType} • {formatDistance(e.distanceM)}
                      </div>
                    </div>
                    {e.bestRecommendedItem && (
                      <span className="badge badge-region" style={{ fontSize: '0.68rem' }}>
                        ★ {e.bestRecommendedItem}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. NEARBY PANDALS */}
      {nearbyPandals.length > 0 && (
        <section className="container" style={{ marginTop: '56px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '20px' }}>
            ✨ {t('nearby_pujo_spots', 'Nearby Puja Pandals')}
          </h3>
          <div className="pandal-grid">
            {nearbyPandals.map(p => (
              <PandalCard key={p.id} pandal={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
