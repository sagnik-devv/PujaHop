import React from 'react';
import { getEmergencyServices } from '../../lib/api';
import { IconShield, IconSparkles } from '../../components/Icons';

export default async function EmergencyPage() {
  const services = await getEmergencyServices();

  const activeServices = services.filter(s => s.isLiveFeed);
  const futureServices = services.filter(s => !s.isLiveFeed);

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '48px 0 80px' }}>
      <div className="container container-narrow">
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>
            Safety & Essential Services
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            Kolkata Puja Helplines & Emergency Desk
          </h1>
          <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
            Verified 24x7 government helplines, police control rooms, trauma hospitals, and traffic assistance for pandal hoppers.
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
                    Call Now
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
              Live Civic Amenities (Drinking Water, Toilets, Parking)
            </h3>
          </div>

          <p style={{ color: 'var(--taupe)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '20px' }}>
            In compliance with Pujo Navigation data integrity standards, we do not fabricate public toilet or parking locations. Real-time geo-feeds from Kolkata Municipal Corporation (KMC) and Kolkata Traffic Police will integrate during Phase 2.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { title: 'Public Toilets & Restrooms', status: 'KMC Geo-Feed • Coming Soon' },
              { title: 'Free Drinking Water Kiosks', status: 'Puja Hub Feed • Coming Soon' },
              { title: 'Designated Pandal Parking', status: 'Traffic Police Advisory • Coming Soon' },
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
