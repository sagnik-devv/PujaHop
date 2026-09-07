'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconEye,
  IconRoute,
  IconMetro,
  IconBus,
  IconUsers,
} from './Icons';
import { useLanguage } from '../lib/language-context';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { label: t('explore_now', 'Explore'), href: '/explore', icon: <IconEye size={20} /> },
    { label: t('smart_route', 'Route'), href: '/route', icon: <IconRoute size={20} /> },
    { label: t('metro_guide', 'Metro'), href: '/metro', icon: <IconMetro size={20} /> },
    { label: t('bus_routes', 'Bus'), href: '/bus', icon: <IconBus size={20} /> },
    { label: t('hop_room', 'Hop'), href: '/hop', icon: <IconUsers size={20} /> },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {items.map(item => {
        const isActive =
          pathname === item.href ||
          (item.href === '/bus' && pathname.startsWith('/bus')) ||
          (item.href === '/metro' && pathname.startsWith('/metro')) ||
          (item.href === '/explore' && pathname.startsWith('/explore')) ||
          (item.href === '/hop' && pathname.startsWith('/hop')) ||
          (item.href === '/route' && pathname.startsWith('/route'));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="mobile-bottom-icon-wrap">
              {item.icon}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
