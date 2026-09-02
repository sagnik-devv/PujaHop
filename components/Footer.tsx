import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconShield, IconSparkles } from './Icons';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Cultural Top Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '32px', marginBottom: '40px', borderBottom: '1px solid rgba(176, 141, 87, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Image src="/images/logo.png" alt="PujaHop Logo" width={36} height={36} />
            <div>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>
                PUJAHOP
              </span>
              <span className="bengali-accent" style={{ marginLeft: '12px', fontSize: '0.95rem' }}>
                শারদোৎসব ২০২৬
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--soft-gold)' }}>
            <IconShield size={16} color="#D4B77A" />
            <span>Official Kolkata Durga Puja Smart Navigation Guide</span>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="footer-grid">
          {/* Brand Col */}
          <div>
            <div className="footer-brand-title">Your Puja. Your Route.</div>
            <p className="footer-brand-desc">
              Kolkata’s premier festival navigation platform. Discover 248+ verified pandals, calculate dynamic Metro routes, understand crowd trends, and build your perfect pandal-hopping night.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Link href="/planner" className="btn btn-gold btn-sm">
                <IconSparkles size={14} /> Plan My Route
              </Link>
              <Link href="/emergency" className="btn btn-outline-gold btn-sm">
                Emergency Desk
              </Link>
            </div>
          </div>

          {/* Discovery Links */}
          <div>
            <div className="footer-column-title">Discovery</div>
            <ul className="footer-links-list">
              <li><Link href="/explore" className="footer-link">All 248 Pandals</Link></li>
              <li><Link href="/explore?region=North+Kolkata" className="footer-link">North Kolkata Heritage</Link></li>
              <li><Link href="/explore?region=South+Kolkata" className="footer-link">South Kolkata Art & Decor</Link></li>
              <li><Link href="/explore?region=East+Kolkata" className="footer-link">Salt Lake & East Hubs</Link></li>
              <li><Link href="/explore?filter=famous" className="footer-link">Iconic & Trending Pujas</Link></li>
            </ul>
          </div>

          {/* Smart Mobility */}
          <div>
            <div className="footer-column-title">Smart Transit</div>
            <ul className="footer-links-list">
              <li><Link href="/route" className="footer-link">Smart Route Finder</Link></li>
              <li><Link href="/planner" className="footer-link">Pandal Hopping Planner</Link></li>
              <li><Link href="/nearby" className="footer-link">Puja Near My Location</Link></li>
              <li><Link href="/explore?sort=nearest_metro" className="footer-link">Metro-Connected Pandals</Link></li>
              <li><Link href="/emergency" className="footer-link">Traffic & Road Advisory</Link></li>
            </ul>
          </div>

          {/* Safety & Legal */}
          <div>
            <div className="footer-column-title">Safety & Support</div>
            <ul className="footer-links-list">
              <li><Link href="/emergency" className="footer-link" style={{ color: '#E57373', fontWeight: 600 }}>Police & Medical Helplines</Link></li>
              <li><Link href="/about" className="footer-link">About PujaHop</Link></li>
              <li><Link href="/privacy" className="footer-link">Privacy & Location Policy</Link></li>
              <li><a href="tel:1090" className="footer-link">Kolkata Police: 1090</a></li>
              <li><a href="tel:112" className="footer-link">National Emergency: 112</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} PUJAHOP • Built with pride for Kolkata Durga Puja • Geo-tagged with OpenStreetMap.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/about" className="footer-link">About</Link>
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/emergency" className="footer-link">Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
