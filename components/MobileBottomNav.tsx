'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconSearch,
  IconHeart,
  IconRoute,
  IconCalendar,
  IconEye,
} from './Icons';
import { useFavorites } from '../lib/favorites-context';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count, isLoaded } = useFavorites();

  const items = [
    { label: 'Explore', href: '/explore', icon: <IconEye size={20} /> },
    { label: 'Route', href: '/route', icon: <IconRoute size={20} /> },
    { label: 'Planner', href: '/planner', icon: <IconCalendar size={20} /> },
    { label: 'Search', href: '/search', icon: <IconSearch size={20} /> },
    {
      label: 'Saved',
      href: '/favorites',
      icon: (
        <div style={{ position: 'relative' }}>
          <IconHeart size={20} fill={count > 0 ? '#B3261E' : 'none'} color={count > 0 ? '#B3261E' : 'currentColor'} />
          {isLoaded && count > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -8,
                background: '#B3261E',
                color: '#FFF',
                fontSize: '0.6rem',
                fontWeight: 700,
                height: '14px',
                minWidth: '14px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 2px',
              }}
            >
              {count}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {items.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
