'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/language-context';

export default function PrivacyClient() {
  const { language, t } = useLanguage();

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '60px 0 90px' }}>
      <div className="container container-narrow">
        <div style={{ marginBottom: '36px' }}>
          <div className="eyebrow">{language === 'bn' ? 'বিশ্বাস ও স্বচ্ছতা' : 'Trust & Transparency'}</div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
            {language === 'bn' ? 'গোপনীয়তা ও জিপিএস নীতি' : 'Privacy & Geolocation Policy'}
          </h1>
          <p style={{ color: 'var(--taupe)' }}>{language === 'bn' ? 'সর্বশেষ আপডেট: সেপ্টেম্বর ২০২৬' : 'Last updated: September 2026'}</p>
        </div>

        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '40px',
            lineHeight: 1.8,
            fontSize: '0.95rem',
            color: '#3B322A',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>
            {language === 'bn' ? '১. জিপিএস তথ্যের ব্যবহার' : '1. Use of Geolocation Data'}
          </h2>
          <p style={{ marginBottom: '20px' }}>
            {language === 'bn'
              ? 'পূজো নেভিগেশন আপনার ব্রাউজারের জিপিএস (`navigator.geolocation`) শুধুমাত্র নিকটের প্যান্ডেল এবং পরিবহন রুট হিসাব করতে ব্যবহার করে। আপনার লোকেশন শুধুমাত্র ব্রাউজারে ব্যবহৃত হয় এবং কখনও সংরক্ষণ বা অন্য কারও সাথে শেয়ার করা হয় না।'
              : 'Pujo Navigation utilizes browser-based geolocation (`navigator.geolocation`) exclusively to compute distances to nearby pandals and suggest verified starting transit points. Your location data is processed locally in your browser and is never stored, sold, or shared with third-party advertisers.'}
          </p>

          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>
            {language === 'bn' ? '২. লোকাল স্টোরেজ ও বুকমার্ক' : '2. Local Storage & Bookmarks'}
          </h2>
          <p style={{ marginBottom: '20px' }}>
            {language === 'bn'
              ? 'আপনার পছন্দের প্যান্ডেল এবং প্ল্যানগুলো ব্রাউজারের `localStorage`-এ সুরক্ষিত থাকে। আপনি যেকোনো সময় পছন্দের পেজ বা ব্রাউজার সেটিং থেকে এটি মুছতে পারেন।'
              : 'Saved favorite pandals and custom itinerary itineraries are saved locally on your device via HTML5 `localStorage`. You can clear this data at any time through the Saved Pandals page or your browser settings.'}
          </p>

          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>
            {language === 'bn' ? '৩. ওপেন-স্ট্রিট-ম্যাপ ও ম্যাপ প্রদানকারী' : '3. OpenStreetMap & Tile Attribution'}
          </h2>
          <p style={{ marginBottom: '28px' }}>
            {language === 'bn'
              ? 'আমাদের ম্যাপ ব্যবস্থা কার্টোডিবি এবং ওপেন-স্ট্রিট-ম্যাপ প্রোভাইডারের ডাটা ব্যবহার করে।'
              : 'Map views and spatial routing interfaces utilize open tiles from CartoDB and OpenStreetMap contributors under Open Database License (ODbL).'}
          </p>

          <Link href="/" className="btn btn-secondary btn-sm">
            {language === 'bn' ? '← হোমপেজে ফিরে যান' : '← Return to Homepage'}
          </Link>
        </div>
      </div>
    </div>
  );
}
