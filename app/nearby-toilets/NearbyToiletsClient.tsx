'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Toilet } from '../../lib/types';
import { useLanguage } from '../../lib/language-context';
import { IconMapPin, IconDroplet, IconToilet, IconSearch, IconSparkles } from '../../components/Icons';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

interface NearbyToiletsClientProps {
  toilets: Toilet[];
  initialLat?: number;
  initialLon?: number;
}

export default function NearbyToiletsClient({ toilets, initialLat, initialLon }: NearbyToiletsClientProps) {
  const { language, t } = useLanguage();
  
  // Default to central Kolkata if coordinates not yet provided
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number }>({
    lat: initialLat || 22.5726,
    lon: initialLon || 88.3639
  });
  
  const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5 km
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'female' | 'clean'>('all');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Attempt auto-geolocation on initial load
  useEffect(() => {
    if (!initialLat || !initialLon) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude
            });
            setLocationSuccess(true);
          },
          (err) => {
            console.log('Location access not granted, using central Kolkata default:', err.message);
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      }
    }
  }, [initialLat, initialLon]);

  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationError(language === 'bn' ? 'ব্রাউজারে লোকেশন সমর্থিত নয়।' : 'Geolocation not supported by browser.');
      return;
    }

    setDetectingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setDetectingLocation(false);
        setLocationSuccess(true);
      },
      (err) => {
        console.error('Geo error:', err);
        setDetectingLocation(false);
        setLocationError(
          language === 'bn' 
            ? 'লোকেশন পাওয়া যায়নি। অনুগ্রহ করে ব্রাউজার পারমিশন দিন।' 
            : 'Could not access GPS. Please allow location permissions.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const filteredToilets = useMemo(() => {
    return toilets
      .map(toilet => {
        const distKm = calculateDistance(userLocation.lat, userLocation.lon, toilet.latitude, toilet.longitude);
        return { ...toilet, distKm };
      })
      .filter(t => {
        // Radius filter
        if (t.distKm > searchRadius) return false;

        // Category filter
        if (filterType === 'female') {
          const isFemale = t.femaleFriendly === 'Yes' || t.genderAccess === 'Female';
          if (!isFemale) return false;
        } else if (filterType === 'clean') {
          if (t.cleanlinessScore < 4.0) return false;
        }

        // Text search filter
        if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          const matchName = t.toiletName.toLowerCase().includes(query);
          const matchPandal = t.nearestPandal.toLowerCase().includes(query);
          const matchAddr = t.locationAddress.toLowerCase().includes(query);
          if (!matchName && !matchPandal && !matchAddr) return false;
        }

        return true;
      })
      .sort((a, b) => a.distKm - b.distKm);
  }, [toilets, userLocation, searchRadius, filterType, searchQuery]);

  const renderStars = (score: number) => {
    const filledStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - filledStars - (hasHalfStar ? 1 : 0);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', color: '#F59E0B', fontSize: '0.95rem' }}>
          {[...Array(filledStars)].map((_, i) => (
            <span key={`f-${i}`}>★</span>
          ))}
          {hasHalfStar && (
            <span style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', overflow: 'hidden', width: '50%', color: '#F59E0B' }}>★</span>
              <span style={{ color: '#E5E7EB' }}>★</span>
            </span>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <span key={`e-${i}`} style={{ color: '#E5E7EB' }}>★</span>
          ))}
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {score.toFixed(1)} / 5
        </span>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '80vh', background: 'var(--background)' }}>
      {/* 1. HERO SECTION WITH TOILET.PNG PRIMARY FOR MOBILE */}
      <section className="toilet-hero-section">
        <div className="toilet-hero-bg-art" />
        <div className="container toilet-hero-grid">
          {/* Visual Showcase Card - On mobile devices (CSS order: -1), this is the FIRST/PRIMARY element */}
          <div className="toilet-hero-visual-card">
            <img
              src="/images/toilet.png"
              alt="Illuminated Kolkata Durga Puja Public Toilet Pod"
              className="toilet-hero-img"
            />
            
            {/* Glowing neon pin badge */}
            <div className="toilet-hero-pin-badge">
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#EF4444', 
                  boxShadow: '0 0 10px #EF4444' 
                }} 
              />
              <span>{language === 'bn' ? 'আলোকিত স্মার্ট টয়লেট পড' : 'Illuminated Puja Smart Pod'}</span>
            </div>

            {/* Bottom info tag */}
            <div className="toilet-hero-bottom-tag">
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  {language === 'bn' ? '২৪x৭ নিরাপত্তা ও বায়ো-টয়লেট' : '24x7 Night Lit & Bio-Sanitation'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#E5D5C0' }}>
                  {language === 'bn' ? 'কেএমসি ও পুজো কমিটি যাচাইকৃত নেটওয়ার্ক' : 'KMC & Kolkata Police Verified Grid'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(23,18,15,0.7)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                <span style={{ color: '#F59E0B' }}>★</span>
                <span>4.0+</span>
              </div>
            </div>
          </div>

          {/* Hero Content & Location Action */}
          <div className="toilet-hero-content">
            <div className="eyebrow hero-eyebrow" style={{ color: 'var(--soft-gold)', marginBottom: '8px' }}>
              <IconDroplet size={14} color="#D4B77A" />
              <span>{language === 'bn' ? 'কলকাতা পৌরসংস্থা ও পুজো নেভিগেশন' : 'KMC & Pujo Navigation Grid'}</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', margin: '0 0 14px', lineHeight: 1.2 }}>
              {language === 'bn' ? 'নিকটবর্তী পাবলিক ' : 'Nearby Public '}
              <span className="vermilion-text">{language === 'bn' ? 'টয়লেট সুবিধা' : 'Toilets'}</span>
            </h1>

            <p style={{ color: 'var(--stone)', fontSize: '0.98rem', lineHeight: 1.5, marginBottom: '22px' }}>
              {language === 'bn'
                ? 'উৎসবের ভিড়ে নিরাপদ, পরিচ্ছন্ন এবং মহিলাদের উপযোগী বায়ো-টয়লেট সহজেই খুঁজে বের করুন। ১-৫০ কিমি ব্যাসার্ধের মধ্যে যেকোনো সুবিধা চিহ্নিত করুন।'
                : 'Instantly find safe, clean, and female-friendly public sanitation pods across Kolkata’s pandal corridors. Search facilities within 1 to 50 km.'}
            </p>

            <div className="toilet-hero-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-vermilion"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
              >
                <IconMapPin size={16} color="#FFF" />
                <span>
                  {detectingLocation 
                    ? (language === 'bn' ? 'অবস্থান খোঁজা হচ্ছে...' : 'Locating GPS...') 
                    : (locationSuccess 
                        ? (language === 'bn' ? '✓ বর্তমান লোকেশন সক্রিয়' : '✓ Live Location Active') 
                        : (language === 'bn' ? 'আমার বর্তমান অবস্থান চিহ্নিত করুন' : 'Locate Nearest Toilets'))
                  }
                </span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setUserLocation({ lat: 22.5726, lon: 88.3639 });
                  setLocationSuccess(false);
                }}
                style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.3)', padding: '10px 16px' }}
              >
                {language === 'bn' ? 'মধ্য কলকাতা কেন্দ্র' : 'Central Kolkata View'}
              </button>
            </div>

            {locationError && (
              <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#FCA5A5' }}>
                {locationError}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. CONTROLS & FILTER SECTION */}
      <section className="container" style={{ marginTop: '28px', paddingBottom: '80px' }}>
        <div 
          style={{ 
            background: '#FFF', 
            padding: '20px 24px', 
            borderRadius: '16px', 
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Top row: search & radius */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--taupe)', pointerEvents: 'none' }}>
                <IconSearch size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'টয়লেট বা নিকটবর্তী প্যান্ডেল দিয়ে খুঁজুন...' : 'Search by toilet name, area or nearby pandal...'}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: 'var(--background)'
                }}
              />
            </div>

            {/* Radius Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px', flex: '1', maxWidth: '380px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--taupe)' }}>1 km</span>
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                value={searchRadius} 
                onChange={(e) => setSearchRadius(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: 'var(--vermilion)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--taupe)' }}>50 km</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '55px', textAlign: 'right', color: 'var(--vermilion)' }}>
                {searchRadius} km
              </span>
            </div>
          </div>

          {/* Bottom row: Filter pills & count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`toilet-filter-pill ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                <IconToilet size={15} />
                <span>{language === 'bn' ? 'সব সুবিধা' : 'All Facilities'}</span>
              </button>

              <button
                type="button"
                className={`toilet-filter-pill ${filterType === 'female' ? 'active' : ''}`}
                onClick={() => setFilterType('female')}
              >
                <span>🚺</span>
                <span>{language === 'bn' ? 'মহিলাদের জন্য উপযোগী' : 'Female Friendly'}</span>
              </button>

              <button
                type="button"
                className={`toilet-filter-pill ${filterType === 'clean' ? 'active' : ''}`}
                onClick={() => setFilterType('clean')}
              >
                <span>⭐</span>
                <span>{language === 'bn' ? 'পরিচ্ছন্নতা ৪.০+' : 'Top Rated (4.0+)'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
              {filteredToilets.length} {language === 'bn' ? 'টি টয়লেট উপলব্ধ' : 'toilets found'}
            </div>
          </div>
        </div>

        {/* 3. RESULTS GRID */}
        {filteredToilets.length === 0 ? (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              background: '#FFF', 
              borderRadius: '16px', 
              border: '1px dashed var(--border)' 
            }}
          >
            <div style={{ marginBottom: '14px', color: 'var(--vermilion)' }}>
              <IconToilet size={44} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
              {language === 'bn' ? 'এই ব্যাসার্ধে কোনো টয়লেট পাওয়া যায়নি' : 'No facilities found within this filter'}
            </h3>
            <p style={{ color: 'var(--taupe)', fontSize: '0.92rem', maxWidth: '420px', margin: '0 auto 20px' }}>
              {language === 'bn' 
                ? 'অনুসন্ধান ব্যাসার্ধ বাড়ান অথবা ফিল্টার রিসেট করুন।' 
                : 'Try increasing the search radius to 15-30 km or clearing your filters.'}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchRadius(25);
                setFilterType('all');
                setSearchQuery('');
              }}
            >
              {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Search & Expand'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
            {filteredToilets.map((toilet) => {
              const isFemaleFriendly = toilet.femaleFriendly === 'Yes' || toilet.genderAccess === 'Female';
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${toilet.latitude},${toilet.longitude}`;
              
              return (
                <div
                  key={toilet.id}
                  style={{
                    background: '#FFF',
                    padding: '20px',
                    borderRadius: '14px',
                    border: isFemaleFriendly ? '2px solid #F9A8D4' : '1px solid var(--border)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--foreground)', lineHeight: 1.3 }}>
                        {toilet.toiletName}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--vermilion)', fontWeight: 700 }}>
                        <IconMapPin size={14} color="var(--vermilion)" />
                        {toilet.distKm.toFixed(1)} km {language === 'bn' ? 'দূরে' : 'away'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '4px' }}>
                        {language === 'bn' ? 'নিকটবর্তী প্যান্ডেল:' : 'Near:'} <strong>{toilet.nearestPandal}</strong>
                      </div>
                    </div>
                    {isFemaleFriendly && (
                      <span
                        style={{
                          background: '#FCE7F3',
                          color: '#BE185D',
                          border: '1px solid #FBCFE8',
                          padding: '4px 9px',
                          borderRadius: '16px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Female Friendly
                      </span>
                    )}
                  </div>
                  
                  <div style={{ background: 'var(--background)', padding: '12px 14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--taupe)' }}>
                        {language === 'bn' ? 'পরিচ্ছন্নতা' : 'Cleanliness'}
                      </span>
                      {renderStars(toilet.cleanlinessScore)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--taupe)' }}>
                        {language === 'bn' ? 'অ্যাক্সেস' : 'Access Type'}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)' }}>
                        {toilet.genderAccess}
                      </span>
                    </div>
                  </div>

                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ 
                      marginTop: 'auto', 
                      width: '100%', 
                      justifyContent: 'center',
                      background: isFemaleFriendly ? '#FDF2F8' : '#FFF',
                      color: isFemaleFriendly ? '#BE185D' : 'var(--foreground)',
                      borderColor: isFemaleFriendly ? '#FBCFE8' : 'var(--border)',
                      gap: '8px',
                      padding: '10px 14px',
                      fontSize: '0.86rem'
                    }}
                  >
                    <IconMapPin size={16} /> 
                    <span>{t('google_maps', 'Open in Google Maps')}</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
