'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconEye,
  IconRoute,
  IconTransit,
  IconToilet,
  IconUsers,
  IconMetro,
  IconBus,
  IconClose,
  IconChevronRight,
} from './Icons';
import { useLanguage } from '../lib/language-context';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [transitSheetOpen, setTransitSheetOpen] = useState(false);

  // Close sheet on route change
  useEffect(() => {
    setTransitSheetOpen(false);
  }, [pathname]);

  const isExploreActive = pathname === '/explore' || pathname.startsWith('/explore');
  const isRouteActive = pathname === '/route' || pathname.startsWith('/route');
  const isTransitActive =
    pathname.startsWith('/metro') ||
    pathname.startsWith('/bus') ||
    pathname.startsWith('/transit');
  const isToiletsActive =
    pathname === '/nearby-toilets' || pathname.startsWith('/nearby-toilets');
  const isHopActive = pathname === '/hop' || pathname.startsWith('/hop');

  return (
    <>
      {/* Transit Chooser Sheet for Mobile */}
      {transitSheetOpen && (
        <>
          <div
            className="transit-sheet-overlay"
            onClick={() => setTransitSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            className="transit-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('transit_selector_title', 'Kolkata Public Transit')}
          >
            <div className="transit-sheet-handle" />
            <div className="transit-sheet-header">
              <div className="transit-sheet-title">
                <IconTransit size={20} color="var(--vermilion)" />
                <span>{t('transit_selector_title', 'Kolkata Public Transit')}</span>
              </div>
              <button
                type="button"
                className="transit-sheet-close"
                onClick={() => setTransitSheetOpen(false)}
                aria-label="Close transit sheet"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="transit-sheet-options">
              {/* Metro Option */}
              <Link
                href="/metro"
                className={`transit-sheet-card ${pathname.startsWith('/metro') ? 'active' : ''}`}
                onClick={() => setTransitSheetOpen(false)}
              >
                <div className="transit-card-icon metro">
                  <IconMetro size={24} />
                </div>
                <div className="transit-card-info">
                  <div className="transit-card-name">
                    <span>{t('nav_metro', 'Metro Guide')}</span>
                    <span className="transit-tag metro">45 Stations</span>
                  </div>
                  <p className="transit-card-desc">
                    {t('transit_metro_desc', '45 Stations • Blue, Green, Purple & Orange')}
                  </p>
                </div>
                <IconChevronRight size={18} color="#B08D57" />
              </Link>

              {/* Bus Option */}
              <Link
                href="/bus"
                className={`transit-sheet-card ${pathname.startsWith('/bus') ? 'active' : ''}`}
                onClick={() => setTransitSheetOpen(false)}
              >
                <div className="transit-card-icon bus">
                  <IconBus size={24} />
                </div>
                <div className="transit-card-info">
                  <div className="transit-card-name">
                    <span>{t('nav_bus', 'Bus Routes')}</span>
                    <span className="transit-tag bus">180+ Routes</span>
                  </div>
                  <p className="transit-card-desc">
                    {t('transit_bus_desc', '180+ Routes • 54 Transit Hubs')}
                  </p>
                </div>
                <IconChevronRight size={18} color="#B08D57" />
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Main 5-Button Bottom Nav */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* 1. Explore */}
        <Link
          href="/explore"
          className={`mobile-bottom-item ${isExploreActive ? 'active' : ''}`}
          aria-current={isExploreActive ? 'page' : undefined}
        >
          <div className="mobile-bottom-icon-wrap">
            <IconEye size={20} />
          </div>
          <span>{t('nav_explore', 'Explore')}</span>
        </Link>

        {/* 2. Route */}
        <Link
          href="/route"
          className={`mobile-bottom-item ${isRouteActive ? 'active' : ''}`}
          aria-current={isRouteActive ? 'page' : undefined}
        >
          <div className="mobile-bottom-icon-wrap">
            <IconRoute size={20} />
          </div>
          <span>{t('nav_route', 'Route')}</span>
        </Link>

        {/* 3. Transit (Combined Metro & Bus) */}
        <button
          type="button"
          onClick={() => setTransitSheetOpen(prev => !prev)}
          className={`mobile-bottom-item ${isTransitActive ? 'active' : ''}`}
          aria-expanded={transitSheetOpen}
          aria-label={t('nav_transit', 'Transit')}
        >
          <div className="mobile-bottom-icon-wrap">
            <IconTransit size={20} />
          </div>
          <span>{t('nav_transit', 'Transit')}</span>
        </button>

        {/* 4. Toilets */}
        <Link
          href="/nearby-toilets"
          className={`mobile-bottom-item ${isToiletsActive ? 'active' : ''}`}
          aria-current={isToiletsActive ? 'page' : undefined}
        >
          <div className="mobile-bottom-icon-wrap">
            <IconToilet size={20} />
          </div>
          <span>{t('nav_toilets', 'Toilets')}</span>
        </Link>

        {/* 5. Hop Room */}
        <Link
          href="/hop"
          className={`mobile-bottom-item ${isHopActive ? 'active' : ''}`}
          aria-current={isHopActive ? 'page' : undefined}
        >
          <div className="mobile-bottom-icon-wrap">
            <IconUsers size={20} />
          </div>
          <span>{t('nav_hop_room', 'Hop Room')}</span>
        </Link>
      </nav>
    </>
  );
}
