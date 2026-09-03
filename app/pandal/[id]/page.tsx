import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getPandalById,
  getPandals,
  getMetroStations,
  getNearestMetroForPandal,
  getNearbyPandalsAPI,
  getCrowdData,
  getEateriesForPandal,
  getPandalArtDetails,
} from '../../../lib/api';
import { formatDistance, formatDuration, formatCurrency } from '../../../lib/format';
import {
  IconMetro,
  IconWalk,
  IconRoute,
  IconMapPin,
  IconCalendar,
  IconSparkles,
  IconClock,
  IconNavigation,
  IconFacebook,
  IconInstagram,
  IconAward,
  IconPalette,
} from '../../../components/Icons';
import CrowdBadge from '../../../components/CrowdBadge';
import FavoriteButton from '../../../components/FavoriteButton';
import TransportCard from '../../../components/TransportCard';
import PandalCard from '../../../components/PandalCard';
import LeafletMap from '../../../components/LeafletMap';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const pandals = await getPandals();
  return pandals.map(p => ({ id: p.id.toString() }));
}

export default async function PandalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pandal = await getPandalById(id);

  if (!pandal) {
    notFound();
  }

  const metroStations = await getMetroStations();
  const nearestMetroInfo = await getNearestMetroForPandal(pandal.id);
  const nearbyPandals = await getNearbyPandalsAPI(pandal.latitude, pandal.longitude, 2.5, 4, pandal.id);
  const crowdInfo = await getCrowdData(pandal.id);
  const nearbyEateries = await getEateriesForPandal(pandal.id);
  const artDetails = await getPandalArtDetails(pandal.id);

  const nearestMetro = nearestMetroInfo?.metro;
  const walkingMeters = nearestMetroInfo?.walkingMeters || pandal.walkingDistanceM;
  const walkingMinutes = nearestMetroInfo?.walkingMinutes || pandal.walkingTimeMinutes;

  return (
    <div style={{ background: 'var(--background)', paddingBottom: '80px' }}>
      {/* 1. EDITORIAL HEADER & MEDIA HERO */}
      <section style={{ background: 'var(--dark-bg)', color: '#FFF', padding: '60px 0 48px', position: 'relative' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--stone)', marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'var(--soft-gold)' }}>Home</Link>
            <span>/</span>
            <Link href="/explore" style={{ color: 'var(--soft-gold)' }}>Pandals</Link>
            <span>/</span>
            <span>{pandal.region}</span>
          </div>

          <div className="pandal-hero-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span className="badge badge-region" style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--soft-gold)', borderColor: 'rgba(176,141,87,0.3)' }}>
                  {pandal.region}
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
                    🔥 #1 Most Crowded in Kolkata
                  </span>
                )}
                {pandal.id === 205 && (
                  <span className="badge" style={{ background: '#0D47A1', color: '#FFF', fontWeight: 800, border: '1px solid #90CAF9' }}>
                    🎨 Famous Haridevpur Installation
                  </span>
                )}
                {pandal.famous && (
                  <span className="badge badge-famous">
                    <IconSparkles size={12} /> Iconic Kolkata Puja
                  </span>
                )}
                <CrowdBadge level={pandal.crowdLevel} isLive={false} />
              </div>

              <h1 style={{ color: '#FFF', fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', lineHeight: 1.15, marginBottom: '14px' }}>
                {pandal.name}
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
                  <IconNavigation size={18} /> Find Smart Route
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
                  <IconMapPin size={16} /> Open in Google Maps
                </a>

                {artDetails?.facebookPageUrl && (
                  <a
                    href={artDetails.facebookPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-lg"
                    style={{ color: '#FFF', borderColor: 'rgba(24, 119, 242, 0.6)', background: 'rgba(24, 119, 242, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Official Facebook Page"
                  >
                    <IconFacebook size={16} color="#60A5FA" /> Facebook
                  </a>
                )}

                {artDetails?.instagramHandle && (
                  <a
                    href={`https://instagram.com/${artDetails.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-lg"
                    style={{ color: '#FFF', borderColor: 'rgba(225, 48, 108, 0.6)', background: 'rgba(225, 48, 108, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Official Instagram"
                  >
                    <IconInstagram size={16} color="#F472B6" /> {artDetails.instagramHandle}
                  </a>
                )}
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
                alt={pandal.name}
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
              🚇 Nearest Kolkata Metro
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#155799' }}>
              {nearestMetro ? nearestMetro.name : pandal.nearestMetro}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              {formatDistance(walkingMeters)} walk (~{formatDuration(walkingMinutes)})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '4px' }}>
              👥 Crowd & Queue Status
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>
              {crowdInfo.statusText}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              Peak Rush: {crowdInfo.peakHours}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '4px' }}>
              ⏰ Timings & Darshan
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>
              {pandal.openingTime} – {pandal.closingTime}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              Best Hours: {pandal.bestTimeToVisit}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '4px' }}>
              🚆 Nearest Rail Terminal
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>
              {pandal.nearestRailwayStation || 'Sealdah Railway Station'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              Connected via local suburban grid
            </div>
          </div>
        </div>
      </section>

      {/* 2.5. ART, PHILOSOPHY & CULTURAL HERITAGE (ENHANCED VIEW MORE SHOWCASE) */}
      {artDetails && (
        <section className="container" style={{ marginTop: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconPalette size={14} color="#B08D57" />
                <span>Curated Cultural & Art Dossier</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', margin: '4px 0 0' }}>
                Art, Architecture & Philosophy
              </h2>
            </div>

            {/* Social Channels Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {artDetails.facebookPageUrl && (
                <a
                  href={artDetails.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: '#1877F2',
                    color: '#FFF',
                    borderColor: '#1877F2',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <IconFacebook size={14} color="#FFF" />
                  <span>Facebook Page</span>
                </a>
              )}

              {artDetails.instagramHandle && (
                <a
                  href={`https://instagram.com/${artDetails.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#FFF',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <IconInstagram size={14} color="#FFF" />
                  <span>{artDetails.instagramHandle}</span>
                </a>
              )}
            </div>
          </div>

          <p style={{ color: 'var(--taupe)', fontSize: '0.94rem', marginBottom: '28px' }}>
            Comprehensive thematic narrative, master artisans, and creative vision behind {pandal.name}.
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
              ✦ Creative Philosophy & Mandap Vision
            </div>
            <div style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)', fontFamily: 'var(--font-serif)', lineHeight: 1.6, color: '#FFFDF8', fontStyle: 'italic', maxWidth: '900px' }}>
              "{artDetails.artPhilosophy}"
            </div>
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', fontSize: '0.82rem', color: '#D5CEC5' }}>
              <div><strong>Genre:</strong> {artDetails.pandalArtType}</div>
              <div>•</div>
              <div><strong>Heritage Era:</strong> {artDetails.establishedEra}</div>
              {pandal.id === 40 && (
                <>
                  <div>•</div>
                  <div style={{ color: '#FF8A80', fontWeight: 700 }}>🔥 #1 Most Crowded Spectacle in Kolkata</div>
                </>
              )}
              {pandal.id === 205 && (
                <>
                  <div>•</div>
                  <div style={{ color: '#81D4FA', fontWeight: 700 }}>🎨 Signature Haridevpur Social Awakening Installation</div>
                </>
              )}
            </div>
          </div>

          {/* Grid: Themes, Sculptures, Craftsmanship & Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Card 1: Themes (Current & Past) */}
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
                  Recent & Past Themes
                </h3>
              </div>
              
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '6px' }}>
                  Current & Landmark Editions
                </div>
                <div style={{ fontSize: '0.9rem', color: '#2B2520', lineHeight: 1.55 }}>
                  {artDetails.recentAndCurrentThemes}
                </div>
              </div>

              {artDetails.pastNotableThemes && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '6px' }}>
                    Historical Legacy Themes
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#554D45', lineHeight: 1.5 }}>
                    {artDetails.pastNotableThemes}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Sculpture & Divine Idol */}
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
                  Pratima & Divine Sculpture
                </h3>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#2B2520', lineHeight: 1.6, marginBottom: '18px' }}>
                {artDetails.idolSculptureStyle}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 700, marginBottom: '6px' }}>
                  Craftsmanship & Materials Used
                </div>
                <div style={{ fontSize: '0.86rem', color: '#554D45', lineHeight: 1.55 }}>
                  {artDetails.craftsmanshipAndMaterials}
                </div>
              </div>
            </div>

            {/* Card 3: Detailed Cultural Narrative & Neighborhood Legacy */}
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
                  Cultural Story & Community
                </h3>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#2B2520', lineHeight: 1.6, marginBottom: '18px' }}>
                {artDetails.detailedCulturalDescription}
              </div>

              {artDetails.awardsAndAccolades && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8D5B00', fontWeight: 700, marginBottom: '6px' }}>
                    <IconAward size={13} color="#B08D57" />
                    <span>Awards & Honors</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#3E342B', fontWeight: 600 }}>
                    {artDetails.awardsAndAccolades}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Special Attractions & Visitor Tips Box */}
          <div
            style={{
              background: '#FFFDF9',
              border: '1.5px solid var(--border-gold)',
              borderRadius: '10px',
              padding: '28px 32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '28px',
              boxShadow: '0 4px 20px rgba(176,141,87,0.08)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B3261E', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                <span>✨ Must-See Special Attractions</span>
              </div>
              <p style={{ color: '#3A322B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {artDetails.specialAttractions}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8D5B00', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                <span>💡 Curator’s Visitor Tips & Timing</span>
              </div>
              <p style={{ color: '#3A322B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {artDetails.visitorTipsAndTiming}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. HOW TO REACH & SMART TRANSIT CARDS */}
      <section className="container" style={{ marginTop: '56px' }}>
        <div className="eyebrow">Smart Mobility Guide</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
          How to Reach {pandal.name}
        </h2>
        <p style={{ color: 'var(--taupe)', fontSize: '0.92rem', marginBottom: '28px' }}>
          Calculated from real geographic coordinates and festive road closure parameters.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Metro Card */}
          <TransportCard
            mode="metro"
            title={`${nearestMetro ? nearestMetro.name : pandal.nearestMetro} Metro`}
            subtitle={nearestMetro ? `${nearestMetro.line} • Opens: ${nearestMetro.opensAt}` : 'Kolkata Metro'}
            durationMinutes={walkingMinutes}
            distanceMeters={walkingMeters}
            fare={10}
            isRecommended={true}
            notes={`Fastest and most dependable festive arrival. Exit station and walk ${formatDistance(walkingMeters)} along the pedestrian corridor.`}
          />

          {/* Pedestrian Card */}
          <TransportCard
            mode="walk"
            title="Pedestrian Pandal Lane"
            subtitle="From nearest main road crossing"
            durationMinutes={walkingMinutes}
            distanceMeters={walkingMeters}
            fare={0}
            notes="Follow Kolkata Police bamboo barricades directly to the entry gate."
          />

          {/* Cab Card */}
          <TransportCard
            mode="cab"
            title="Yellow Taxi / App Cab"
            subtitle="Drop at designated police barricade point"
            durationMinutes={Math.max(25, Math.round(walkingMinutes * 2.5))}
            distanceMeters={walkingMeters + 3000}
            fare={120}
            notes="Festive vehicular congestion may cause delays. Private vehicles not allowed beyond perimeter."
          />
        </div>
      </section>

      {/* 4. INTERACTIVE MAP & SURROUNDINGS */}
      <section className="container" style={{ marginTop: '64px' }}>
        <div className="pandal-map-grid">
          {/* Map Container */}
          <div>
            <div className="eyebrow">Spatial Coordinates</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '14px' }}>
              Interactive Location & Metro Stations
            </h3>
            <LeafletMap
              pandals={[pandal, ...nearbyPandals]}
              metroStations={metroStations}
              center={[pandal.latitude, pandal.longitude]}
              zoom={15}
              selectedPandalId={pandal.id}
              height="440px"
            />
          </div>

          {/* Theme & Cultural Story */}
          <div>
            <div className="eyebrow">Artisanal Story</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '14px' }}>
              Mandap Theme & Significance
            </h3>
            <div
              style={{
                background: '#FFF',
                padding: '24px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                lineHeight: 1.6,
                fontSize: '0.92rem',
              }}
            >
              <h4 style={{ color: 'var(--vermilion)', marginBottom: '8px' }}>
                {pandal.theme || 'Traditional Sabeki Bengal Heritage'}
              </h4>
              <p style={{ color: '#4A423B', marginBottom: '16px' }}>
                {pandal.description}
              </p>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', fontSize: '0.8rem', color: 'var(--taupe)' }}>
                <div><strong>Location Category:</strong> {pandal.region} Cultural Hub</div>
                <div style={{ marginTop: '4px' }}><strong>Geographic Coordinates:</strong> {pandal.latitude.toFixed(6)}, {pandal.longitude.toFixed(6)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* 4.8. NEARBY FAMOUS EATERIES & CABINS (FROM VERIFIED CSV DATA) */}
      {nearbyEateries.length > 0 && (
        <section className="container" style={{ marginTop: '72px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
            <div>
              <div className="eyebrow" style={{ color: '#B08D57' }}>Puja Food &amp; Heritage Cabins</div>
              <h2 style={{ fontFamily: 'var(--font-serif)' }}>
                Famous Eateries near {pandal.name} ({nearbyEateries.length})
              </h2>
              <p style={{ color: 'var(--taupe)', fontSize: '0.88rem' }}>
                Iconic street food counters, sweet shops, and heritage cabins within walking distance of this pandal.
              </p>
            </div>
            <span className="badge" style={{ background: '#FFF8E1', color: '#B78103', border: '1px solid #FFE082', fontWeight: 700 }}>
              🍢 Verified Food Pitstops
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {nearbyEateries.map((eatery, idx) => {
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pandal.latitude},${pandal.longitude}&destination=${eatery.latitude},${eatery.longitude}`;

              return (
                <div
                  key={idx}
                  style={{
                    background: '#FFF',
                    border: '1px solid #B08D57',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 4px 16px rgba(23,18,15,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  className="card-luxury"
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span
                        className="badge"
                        style={{
                          background: '#FFF8E1',
                          color: '#B78103',
                          border: '1px solid #FFE082',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}
                      >
                        🍢 {eatery.cuisineType}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--taupe)', fontWeight: 600 }}>
                        ₹{eatery.budgetForTwo} for two
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.18rem', fontWeight: 700, margin: '2px 0 6px', fontFamily: 'var(--font-serif)' }}>
                      {eatery.cleanName}
                    </h4>

                    {/* Walking distance */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(21, 87, 153, 0.08)',
                        color: '#155799',
                        border: '1px solid rgba(21, 87, 153, 0.2)',
                        padding: '3px 8px',
                        borderRadius: '14px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        margin: '4px 0 12px',
                      }}
                    >
                      <IconWalk size={12} />
                      <span>
                        {formatDistance(eatery.distanceM)} from pandal (~{Math.max(1, Math.round(eatery.distanceM / 80))} mins walk)
                      </span>
                    </div>

                    {/* What to have box */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF6EE 100%)',
                        border: '1px solid #E8D9C0',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#B3261E', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <span>★</span>
                        <span>Must Have:</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)', marginTop: '2px' }}>
                        {eatery.bestRecommendedItem}
                      </div>
                    </div>
                  </div>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-vermilion btn-sm"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '7px 12px' }}
                    title={`Get walking directions from ${pandal.name} to ${eatery.cleanName} in Google Maps`}
                  >
                    <IconNavigation size={13} /> Food Directions in Google Maps
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. NEARBY PANDALS SECTION */}
      {nearbyPandals.length > 0 && (
        <section className="container" style={{ marginTop: '72px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <div className="eyebrow">Walkable Hopping</div>
              <h2 style={{ fontFamily: 'var(--font-serif)' }}>
                Nearby Pandals (Within 2.5 km)
              </h2>
              <p style={{ color: 'var(--taupe)', fontSize: '0.88rem' }}>
                Combine these adjacent pandals into a single walking hop without boarding another cab.
              </p>
            </div>

            <Link href={`/planner`} className="btn btn-gold btn-sm">
              <IconCalendar size={14} /> Add to Hop Planner
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {nearbyPandals.map(np => (
              <PandalCard key={np.id} pandal={np} distanceUserKm={np.distanceKm} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
