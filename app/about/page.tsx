import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconSparkles, IconShield, IconMetro, IconRoute } from '../../components/Icons';

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '60px 0 90px' }}>
      <div className="container container-narrow">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Heritage & Technology</div>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>
            About PUJAHOP
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--taupe)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Kolkata’s dedicated travel-tech and festival navigation platform, born to make Durga Puja pandal hopping effortless, elegant, and intelligent.
          </p>
        </div>

        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(23,18,15,0.06)',
            lineHeight: 1.8,
            fontSize: '0.98rem',
            color: '#3B322A',
          }}
        >
          <h2 style={{ fontSize: '1.6rem', marginBottom: '16px', color: 'var(--foreground)' }}>
            The Essence of Pandal Hopping
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Every autumn, the City of Joy transforms into the world’s largest open-air art gallery. Millions of devotees and visitors navigate hundreds of creative pandals spread across North, South, Central, and Eastern Kolkata. However, navigating the city during festive rush with road closures, pedestrian barricades, and massive queues has always been a complex challenge.
          </p>
          <p style={{ marginBottom: '28px' }}>
            <strong>PUJAHOP</strong> was built to solve this challenge through verified geographic datasets, spatial routing models, and deep integration with Kolkata’s high-frequency Metro railway network.
          </p>

          <div className="durga-eye-divider" />

          <h2 style={{ fontSize: '1.6rem', marginBottom: '16px', color: 'var(--foreground)' }}>
            Our Core Data Philosophy
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', margin: '24px 0 32px' }}>
            <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--vermilion)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconShield size={16} /> 100% Real Geo-Tagged Data
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--taupe)' }}>
                Every single one of our 248 pandals and 45 Metro stations is verified with exact latitude/longitude coordinates. We never fabricate locations.
              </p>
            </div>

            <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: '#155799', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMetro size={16} /> Dynamic Metro Routing
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--taupe)' }}>
                Nearest Metro stations and walking times are mathematically calculated using the Haversine formula, ensuring reliable festive navigation.
              </p>
            </div>
          </div>

          <div className="durga-eye-divider" />

          <h2 style={{ fontSize: '1.6rem', marginBottom: '16px', color: 'var(--foreground)' }}>
            Festive Visual Heritage
          </h2>
          <p style={{ marginBottom: '20px', color: 'var(--taupe)' }}>
            Inspired by the expressive eyes of Maa Durga, authentic vermilion sindoor, antique gold ornamentation, and the sacred artistry of Kumartuli clay masters.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', margin: '20px 0 32px' }}>
            {['/images/durga/durga-1.png', '/images/durga/durga-2.png', '/images/durga/durga-3.jpg', '/images/durga/durga-4.png', '/images/durga/durga-5.jpg', '/images/durga/durga-6.jpg'].map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-gold)',
                  boxShadow: '0 4px 12px rgba(23,18,15,0.06)',
                }}
              >
                <Image
                  src={img}
                  alt={`Durga Artistry ${idx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/explore" className="btn btn-vermilion btn-lg">
              <IconSparkles size={18} /> Explore the 248 Pandals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
