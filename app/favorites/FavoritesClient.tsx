'use client';

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '../../lib/favorites-context';
import PandalCard from '../../components/PandalCard';
import { IconHeart, IconCalendar, IconEye } from '../../components/Icons';

export default function FavoritesClient() {
  const { favorites, favoritePandals, count, isLoaded, clearAllFavorites } = useFavorites();
  const savedIdsString = favorites.join(',');
  const plannerUrl = favorites.length > 0 ? `/planner?fromSaved=true&ids=${savedIdsString}` : '/planner';

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '48px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
          <div>
            <div className="eyebrow">Personal Hop Wishlist</div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '6px' }}>
              Your Saved Pandals
            </h1>
            <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
              You have saved <strong>{isLoaded ? count : 0}</strong> pandals for your Durga Puja hopping night.
            </p>
          </div>

          {count > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href={plannerUrl} className="btn btn-vermilion">
                <IconCalendar size={16} /> Plan Route With Saved ({count})
              </Link>
              <button
                onClick={clearAllFavorites}
                className="btn btn-secondary btn-sm"
                style={{ color: '#888' }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Saved List or Empty State */}
        {!isLoaded ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--taupe)' }}>
            Loading your saved wishlist...
          </div>
        ) : count === 0 ? (
          <div
            style={{
              background: '#FFFDF9',
              border: '1px dashed var(--border-gold)',
              borderRadius: '8px',
              padding: '80px 24px',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '40px auto',
              boxShadow: '0 4px 20px rgba(23,18,15,0.04)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--warm-cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#B08D57',
              }}
            >
              <IconHeart size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
              Your Saved List is Empty
            </h2>
            <p style={{ color: 'var(--taupe)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Tap the heart icon on any pandal card while exploring to bookmark it here and generate a custom hopping route.
            </p>

            <Link href="/explore" className="btn btn-vermilion btn-lg">
              <IconEye size={16} /> Start Exploring 248 Pandals
            </Link>
          </div>
        ) : (
          <div className="pandal-grid">
            {favoritePandals.map(pandal => (
              <PandalCard key={pandal.id} pandal={pandal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
