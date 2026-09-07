'use client';

import React from 'react';
import { EmergencyService } from '../../lib/types';
import { IconShield, IconSparkles } from '../../components/Icons';
import { useLanguage } from '../../lib/language-context';

interface EmergencyClientProps {
  services: EmergencyService[];
}

export default function EmergencyClient({ services }: EmergencyClientProps) {
  const { language, t } = useLanguage();

  const activeServices = services.filter(s => s.isLiveFeed);

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '48px 0 80px' }}>
      <div className="container container-narrow">
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>
            {t('safety_essentials')}
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {t('emergency_title')}
          </h1>
          <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
            {t('emergency_subtitle')}
          </p>
        </div>

        {/* Emergency SOS Numbers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {activeServices.map(srv => (
            <div
              key={srv.id}
              style={{
                background: '#FFF',
                border: '1px solid var(--border)',
                borderLeft: '4px solid #B3261E',
                borderRadius: '6px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(23,18,15,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', fontWeight: 700, marginBottom: '6px' }}>
                  <IconShield size={14} color="#B3261E" /> {srv.category.toUpperCase()}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
                  {srv.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '16px' }}>
                  {srv.address} • {srv.area}
                </p>
              </div>

              {srv.phone && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    {srv.phone}
                  </span>
                  <a
                    href={`tel:${srv.phone.split('/')[0].trim()}`}
                    className="btn btn-vermilion btn-sm"
                    style={{ padding: '6px 14px' }}
                  >
                    {language === 'bn' ? 'এখনই কল করুন' : 'Call Now'}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Public Amenities & Infrastructure Feeds */}
        <div
          style={{
            background: '#FFFDF9',
            border: '1px dashed var(--border-gold)',
            borderRadius: '8px',
            padding: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <IconSparkles size={18} color="#B08D57" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {language === 'bn' ? 'লাইভ নাগরিক পরিষেবা (পানীয় জল, টয়লেট, পার্কিং)' : 'Live Civic Amenities (Drinking Water, Toilets, Parking)'}
            </h3>
          </div>

          <p style={{ color: 'var(--taupe)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
            {language === 'bn' 
              ? 'পূজো নেভিগেশন ডাটা নীতি অনুসারে, কোনো ভুল অবস্থান দেখানো হয় না। কেএমসি এবং কলকাতা ট্রাফিক পুলিশের লাইভ ডাটা শীঘ্রই সংযুক্ত হবে।'
              : 'In compliance with Pujo Navigation data integrity standards, we do not fabricate public toilet or parking locations. Real-time geo-feeds from Kolkata Municipal Corporation (KMC) and Kolkata Traffic Police will integrate during Phase 2.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { 
                title: language === 'bn' ? 'পাবলিক টয়লেট ও শৌচাগার' : 'Public Toilets & Restrooms', 
                status: language === 'bn' ? 'কেএমসি জিও-ফিড • শীঘ্রই আসছে' : 'KMC Geo-Feed • Coming Soon' 
              },
              { 
                title: language === 'bn' ? 'বিনামূল্যে পানীয় জল কিয়স্ক' : 'Free Drinking Water Kiosks', 
                status: language === 'bn' ? 'পূজা হাব ফিড • শীঘ্রই আসছে' : 'Puja Hub Feed • Coming Soon' 
              },
              { 
                title: language === 'bn' ? 'নির্দিষ্ট প্যান্ডেল পার্কিং' : 'Designated Pandal Parking', 
                status: language === 'bn' ? 'ট্রাফিক পুলিশ নির্দেশিকা • শীঘ্রই আসছে' : 'Traffic Police Advisory • Coming Soon' 
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--background)',
                  padding: '14px 16px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--taupe)', marginTop: '4px' }}>{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
