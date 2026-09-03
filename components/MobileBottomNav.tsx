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

export default function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { label: 'Explore', href: '/explore', icon: <IconEye size={20} /> },
    { label: 'Route', href: '/route', icon: <IconRoute size={20} /> },
    { label: 'Metro', href: '/metro', icon: <IconMetro size={20} /> },
    { label: 'Bus', href: '/bus', icon: <IconBus size={20} /> },
    { label: 'Hop', href: '/hop', icon: <IconUsers size={20} /> },
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
