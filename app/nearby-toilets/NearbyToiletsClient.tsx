'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Toilet } from '../../lib/types';
import { useLanguage } from '../../lib/language-context';
import { IconMapPin, IconDroplet } from '../../components/Icons';

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
  const d = R * c; // Distance in km
  return d;
}

interface NearbyToiletsClientProps {
  toilets: Toilet[];
  initialLat?: number;
  initialLon?: number;
}

export default function NearbyToiletsClient({ toilets, initialLat, initialLon }: NearbyToiletsClientProps) {
  const { language, t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(
    initialLat && initialLon ? { lat: initialLat, lon: initialLon } : null
  );
  const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5 km
  const [loadingLocation, setLoadingLocation] = useState(!userLocation);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!userLocation) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
            setLoadingLocation(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            setErrorMsg('Could not detect location. Please allow location access or select a default view.');
            setLoadingLocation(false);
          }
        );
      } else {
        setErrorMsg('Geolocation is not supported by your browser.');
        setLoadingLocation(false);
      }
    }
  }, [userLocation]);

  const filteredToilets = useMemo(() => {
    if (!userLocation) return [];
    
    return toilets
      .map(toilet => {
        const distKm = calculateDistance(userLocation.lat, userLocation.lon, toilet.latitude, toilet.longitude);
        return { ...toilet, distKm };
      })
      .filter(t => t.distKm <= searchRadius)
      .sort((a, b) => a.distKm - b.distKm);
  }, [toilets, userLocation, searchRadius]);

  const renderStars = (score: number) => {
    const filledStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - filledStars - (hasHalfStar ? 1 : 0);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', color: '#F59E0B', fontSize: '1rem' }}>
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
      {/* Header Section */}
      <section style={{ background: 'var(--dark-bg)', color: '#FFF', padding: '60px 0 40px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginBottom: '16px' }}>
            <IconDroplet size={32} color="#D4B77A" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 16px' }}>
            {language === 'bn' ? 'নিকটবর্তী পাবলিক টয়লেট' : 'Nearby Public Toilets'}
          </h1>
          <p style={{ color: 'var(--stone)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            {language === 'bn' ? 'আপনার বর্তমান অবস্থান থেকে 1-50 কিমির মধ্যে পাবলিক টয়লেট খুঁজুন।' : 'Find safe, clean public facilities within 1-50 km of your current location.'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container" style={{ marginTop: '40px', paddingBottom: '80px' }}>
        {loadingLocation ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p>{language === 'bn' ? 'আপনার অবস্থান খোঁজা হচ্ছে...' : 'Locating your position...'}</p>
          </div>
        ) : errorMsg ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)' }}>
            <p>{errorMsg}</p>
            {/* Fallback to Kolkata center */}
            <button 
              className="btn btn-vermilion" 
              style={{ marginTop: '16px' }}
              onClick={() => setUserLocation({ lat: 22.5726, lon: 88.3639 })}
            >
              Use Central Kolkata
            </button>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div style={{ 
              background: '#FFF', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>
                    {language === 'bn' ? 'অনুসন্ধান ব্যাসার্ধ' : 'Search Radius'}: {searchRadius} km
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--taupe)' }}>
                    {filteredToilets.length} {language === 'bn' ? 'টি টয়লেট পাওয়া গেছে' : 'facilities found in this area'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '200px', maxWidth: '400px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>1 km</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    step="1"
                    value={searchRadius} 
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--vermilion)' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>50 km</span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {filteredToilets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', background: '#FFF', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <p style={{ color: 'var(--taupe)', fontSize: '1.1rem' }}>
                  {language === 'bn' ? 'এই ব্যাসার্ধের মধ্যে কোনো টয়লেট পাওয়া যায়নি।' : 'No toilets found within this radius. Try increasing the search distance.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredToilets.map((toilet) => {
                  const isFemaleFriendly = toilet.femaleFriendly === 'Yes' || toilet.genderAccess === 'Female';
                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${toilet.latitude},${toilet.longitude}`;
                  
                  return (
                    <div
                      key={toilet.id}
                      style={{
                        background: '#FFF',
                        padding: '20px',
                        borderRadius: '12px',
                        border: isFemaleFriendly ? '2px solid #F9A8D4' : '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'var(--foreground)' }}>
                            {toilet.toiletName}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
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
                              padding: '6px 10px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Female Friendly
                          </span>
                        )}
                      </div>
                      
                      <div style={{ background: 'var(--background)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--taupe)' }}>Cleanliness</span>
                          {renderStars(toilet.cleanlinessScore)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--taupe)' }}>Access</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{toilet.genderAccess}</span>
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
                          borderColor: isFemaleFriendly ? '#FBCFE8' : 'var(--border)'
                        }}
                      >
                        <IconMapPin size={18} /> {t('google_maps', 'Open in Google Maps')}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
