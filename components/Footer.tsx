'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconShield, IconSparkles } from './Icons';
import { useLanguage } from '../lib/language-context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        {/* Cultural Top Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '32px', marginBottom: '40px', borderBottom: '1px solid rgba(176, 141, 87, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Image src="/images/logo.png" alt="Pujo Navigation Logo" width={36} height={36} style={{ objectFit: 'contain' }} />
            <div>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>
                PUJO NAVIGATION
              </span>
              <span className="bengali-accent" style={{ marginLeft: '12px', fontSize: '0.95rem' }}>
                শারদোৎসব ২০২৬
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--soft-gold)' }}>
            <IconShield size={16} color="#D4B77A" />
            <span>{t('hero_subtitle', 'Official Kolkata Durga Puja Smart Navigation Guide')}</span>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="footer-grid">
          {/* Brand Col */}
          <div>
            <div className="footer-brand-title">Your Puja. Your Route.</div>
            <p className="footer-brand-desc">
              {t('footer_tagline', 'Kolkata’s premier festival navigation platform. Discover 248+ verified pandals, calculate dynamic Metro routes, understand crowd trends, and build your perfect pandal-hopping night.')}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Link href="/planner" className="btn btn-gold btn-sm">
                <IconSparkles size={14} /> {t('plan_my_night', 'Plan My Route')}
              </Link>
              <Link href="/emergency" className="btn btn-outline-gold btn-sm">
                {t('emergency_title', 'Emergency Desk')}
              </Link>
            </div>
          </div>

          {/* Discovery Links */}
          <div>
            <div className="footer-column-title">{t('explore_pandals', 'Discovery')}</div>
            <ul className="footer-links-list">
              <li><Link href="/explore" className="footer-link">{t('explore_pandals', 'All 248 Pandals')}</Link></li>
              <li><Link href="/explore?region=North+Kolkata" className="footer-link">{t('North Kolkata', 'North Kolkata Heritage')}</Link></li>
              <li><Link href="/explore?region=South+Kolkata" className="footer-link">{t('South Kolkata', 'South Kolkata Art & Decor')}</Link></li>
              <li><Link href="/explore?region=East+Kolkata" className="footer-link">{t('East Kolkata & Salt Lake', 'Salt Lake & East Hubs')}</Link></li>
              <li><Link href="/explore?filter=famous" className="footer-link">{t('famous_badge', 'Iconic & Trending Pujas')}</Link></li>
            </ul>
          </div>

          {/* Smart Mobility */}
          <div>
            <div className="footer-column-title">{t('smart_route', 'Smart Transit')}</div>
            <ul className="footer-links-list">
              <li><Link href="/metro" className="footer-link">{t('metro_guide', 'Kolkata Metro Guide')}</Link></li>
              <li><Link href="/bus" className="footer-link">{t('bus_routes', 'Kolkata Bus Routes')}</Link></li>
              <li><Link href="/route" className="footer-link">{t('smart_route_calc', 'Smart Route Finder')}</Link></li>
              <li><Link href="/planner" className="footer-link">{t('hop_planner', 'Pandal Hopping Planner')}</Link></li>
              <li><Link href="/nearby" className="footer-link">{t('near_me', 'Puja Near My Location')}</Link></li>
            </ul>
          </div>

          {/* Safety & Legal */}
          <div>
            <div className="footer-column-title">{t('safety_essentials', 'Safety & Support')}</div>
            <ul className="footer-links-list">
              <li><Link href="/emergency" className="footer-link" style={{ color: '#E57373', fontWeight: 600 }}>{t('emergency_title', 'Police & Medical Helplines')}</Link></li>
              <li><Link href="/about" className="footer-link">{t('about_pujo_nav', 'About Pujo Navigation')}</Link></li>
              <li><Link href="/privacy" className="footer-link">{t('privacy_policy', 'Privacy & Location Policy')}</Link></li>
              <li><a href="tel:1090" className="footer-link">Kolkata Police: 1090</a></li>
              <li><a href="tel:112" className="footer-link">National Emergency: 112</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} PUJO NAVIGATION • {t('copyright', 'Built with pride for Kolkata Durga Puja')}
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/about" className="footer-link">{t('home', 'About')}</Link>
            <Link href="/privacy" className="footer-link">{t('privacy_policy', 'Privacy')}</Link>
            <Link href="/emergency" className="footer-link">{t('safety_essentials', 'Safety')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
