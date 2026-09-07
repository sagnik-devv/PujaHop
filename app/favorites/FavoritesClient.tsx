'use client';

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '../../lib/favorites-context';
import PandalCard from '../../components/PandalCard';
import { IconHeart, IconCalendar, IconEye } from '../../components/Icons';
import { useLanguage } from '../../lib/language-context';

export default function FavoritesClient() {
  const { favorites, favoritePandals, count, isLoaded, clearAllFavorites } = useFavorites();
  const { language, t } = useLanguage();
  const savedIdsString = favorites.join(',');
  const plannerUrl = favorites.length > 0 ? `/planner?fromSaved=true&ids=${savedIdsString}` : '/planner';

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '48px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
          <div>
            <div className="eyebrow">{language === 'bn' ? 'ব্যক্তিগত পছন্দসমূহ' : 'Personal Hop Wishlist'}</div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '6px' }}>
              {t('favorites_title')}
            </h1>
            <p style={{ color: 'var(--taupe)', fontSize: '0.95rem' }}>
              {language === 'bn' ? (
                <>আপনি আপনার পূজা পরিক্রমার জন্য <strong>{isLoaded ? count : 0}টি</strong> প্যান্ডেল সংরক্ষণ করেছেন।</>
              ) : (
                <>You have saved <strong>{isLoaded ? count : 0}</strong> pandals for your Durga Puja hopping night.</>
              )}
            </p>
          </div>

          {count > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href={plannerUrl} className="btn btn-vermilion">
                <IconCalendar size={16} /> {language === 'bn' ? `সংরক্ষিত প্যান্ডেল দিয়ে রুট প্ল্যান করুন (${count})` : `Plan Route With Saved (${count})`}
              </Link>
              <button
                onClick={clearAllFavorites}
                className="btn btn-secondary btn-sm"
                style={{ color: '#888' }}
              >
                {t('clear_favorites')}
              </button>
            </div>
          )}
        </div>

        {/* Saved List or Empty State */}
        {!isLoaded ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--taupe)' }}>
            {language === 'bn' ? 'পছন্দের তালিকা লোড হচ্ছে...' : 'Loading your saved wishlist...'}
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
              {t('no_favorites')}
            </h2>
            <p style={{ color: 'var(--taupe)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
              {t('no_favorites_sub')}
            </p>

            <Link href="/explore" className="btn btn-vermilion btn-lg">
              <IconEye size={16} /> {language === 'bn' ? '২৪৮টি প্যান্ডেল দেখা শুরু করুন' : 'Start Exploring 248 Pandals'}
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
