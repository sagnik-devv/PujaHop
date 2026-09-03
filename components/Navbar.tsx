'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconSearch,
  IconHeart,
  IconMapPin,
  IconUser,
  IconMenu,
  IconClose,
  IconChevronRight,
  IconRoute,
  IconSparkles,
} from './Icons';
import { useFavorites } from '../lib/favorites-context';
import { useToast } from '../lib/toast-context';
import { detectUserLocation } from '../lib/location-service';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, isLoaded } = useFavorites();
  const { showToast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleLocateMe = async () => {
    showToast('Locating your position in Kolkata...', 'info');
    try {
      const loc = await detectUserLocation();
      showToast(`📍 Location detected: ${loc.landmark}!`, 'success');
      router.push(`/nearby?lat=${loc.lat}&lon=${loc.lon}`);
    } catch (err) {
      console.warn('Geolocation error:', err);
      showToast('Could not access location. Showing default Kolkata view.', 'warning');
      router.push('/nearby');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Explore Pandals', href: '/explore' },
    { name: 'Smart Route', href: '/route' },
    { name: 'Hop Planner', href: '/planner' },
    { name: 'Metro Guide', href: '/metro' },
    { name: 'Near Me', href: '/nearby' },
  ];

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Brand Logo */}
          <Link href="/" className="navbar-brand">
            <Image
              src="/images/logo.png"
              alt="Pujo Navigation Logo"
              width={38}
              height={38}
              className="navbar-logo-img"
              style={{ objectFit: 'contain' }}
              priority
            />
            <span className="navbar-brand-text">
              PUJO NAVIGATION
              <span className="navbar-brand-dot" />
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="navbar-links" aria-label="Main Navigation">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="navbar-actions">
            {/* Quick Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="nav-action-btn"
              title="Search Pandals & Metro"
              aria-label="Search"
            >
              <IconSearch size={19} />
            </button>

            {/* Quick Locate */}
            <button
              onClick={handleLocateMe}
              className="nav-action-btn"
              title="Puja Near Me"
              aria-label="Locate me"
            >
              <IconMapPin size={19} />
            </button>

            {/* Saved Favorites */}
            <Link
              href="/favorites"
              className="nav-action-btn"
              title="Saved Pandals"
              aria-label="Saved favorites"
            >
              <IconHeart size={19} fill={count > 0 ? '#B3261E' : 'none'} color={count > 0 ? '#B3261E' : 'currentColor'} />
              {isLoaded && count > 0 && (
                <span className="fav-badge-count">{count}</span>
              )}
            </Link>

            {/* Account / Login */}
            <Link
              href="/login"
              className="nav-action-btn desktop-only"
              title="Sign In / Account"
              aria-label="Account"
            >
              <IconUser size={19} />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="nav-action-btn mobile-menu-toggle"
              aria-label="Open menu"
            >
              <IconMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Overlay */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 18, 15, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '100px',
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            style={{
              background: '#FAF7F2',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '640px',
              padding: '28px',
              border: '1px solid #B08D57',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="eyebrow" style={{ margin: 0 }}>Instant Kolkata Puja Search</div>
              <button onClick={() => setSearchOpen(false)} style={{ color: '#756D65' }}>
                <IconClose size={22} />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit}>
              <div className="input-field-wrapper" style={{ padding: '14px 16px', background: '#FFF' }}>
                <IconSearch size={22} color="#B08D57" />
                <input
                  type="text"
                  placeholder="Search Sreebhumi, Baghbazar, Shyambazar Metro, theme..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{ fontSize: '1.05rem' }}
                />
                <button type="submit" className="btn btn-vermilion btn-sm">
                  Search
                </button>
              </div>
            </form>

            <div style={{ marginTop: '20px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#756D65', fontWeight: 600 }}>
                Popular Searches:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {['Shreebhumi Sporting', 'Haridevpur Adarsha Samity', 'Baghbazar Sarbojanin', 'Ekdalia Evergreen', 'Shyambazar Metro', 'Kumartuli Park'].map(term => (
                  <button
                    key={term}
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(term)}`);
                      setSearchOpen(false);
                    }}
                    className="badge badge-region"
                    style={{ cursor: 'pointer', padding: '6px 12px' }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={`mobile-drawer-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`mobile-drawer ${drawerOpen ? 'open' : ''}`} aria-label="Mobile Navigation">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image src="/images/logo.png" alt="Pujo Navigation Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700 }}>
              PUJO NAVIGATION
            </span>
          </div>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <IconClose size={24} />
          </button>
        </div>

        <ul className="mobile-nav-links">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span>{link.name}</span>
                  <IconChevronRight size={18} color="#B08D57" />
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/emergency" className="mobile-nav-link">
              <span>Safety & Essentials</span>
              <IconChevronRight size={18} color="#B08D57" />
            </Link>
          </li>
          <li>
            <Link href="/about" className="mobile-nav-link">
              <span>About Pujo Navigation</span>
              <IconChevronRight size={18} color="#B08D57" />
            </Link>
          </li>
          <li>
            <Link href="/login" className="mobile-nav-link">
              <span>Sign In / My Account</span>
              <IconChevronRight size={18} color="#B08D57" />
            </Link>
          </li>
        </ul>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <Link
            href="/planner"
            className="btn btn-vermilion"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
          >
            <IconSparkles size={16} /> Plan My Puja Night
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--taupe)', textAlign: 'center' }}>
            Kolkata Durga Puja Navigation & Discovery
          </div>
        </div>
      </aside>
    </>
  );
}
