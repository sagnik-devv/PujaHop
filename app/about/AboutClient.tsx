'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconSparkles, IconShield, IconMetro } from '../../components/Icons';
import { useLanguage } from '../../lib/language-context';

export default function AboutClient() {
  const { language, t } = useLanguage();

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '60px 0 90px' }}>
      <div className="container container-narrow">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            {language === 'bn' ? 'ঐতিহ্য ও প্রযুক্তি' : 'Heritage & Technology'}
          </div>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>
            {t('about_title')}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--taupe)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            {t('about_description')}
          </p>
        </div>

        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(23,18,15,0.06)',
            lineHeight: 1.8,
            fontSize: '0.98rem',
            color: '#3B322A',
          }}
        >
          <h2 style={{ fontSize: '1.6rem', marginBottom: '16px', color: 'var(--foreground)' }}>
            {language === 'bn' ? 'প্যান্ডেল পরিক্রমার বৈশিষ্ট্য' : 'The Essence of Pandal Hopping'}
          </h2>
          <p style={{ marginBottom: '20px' }}>
            {language === 'bn' 
              ? 'প্রতি শরতে তিলোত্তমা কলকাতা পরিণত হয় বিশ্বের বৃহত্তম উন্মুক্ত শিল্প প্রদর্শনীতে। লক্ষ লক্ষ দর্শনার্থী উত্তর, দক্ষিণ, মধ্য ও পূর্ব কলকাতার শত শত প্যান্ডেল দর্শন করেন। কিন্তু উৎসবের দিনে যানজট ও ভিড় এড়িয়ে চলাচল করা একটি বড় চ্যালেঞ্জ।'
              : 'Every autumn, the City of Joy transforms into the world’s largest open-air art gallery. Millions of devotees and visitors navigate hundreds of creative pandals spread across North, South, Central, and Eastern Kolkata. However, navigating the city during festive rush with road closures, pedestrian barricades, and massive queues has always been a complex challenge.'}
          </p>
          <p style={{ marginBottom: '28px' }}>
            <strong>{language === 'bn' ? 'পূজো নেভিগেশন' : 'Pujo Navigation'}</strong> {language === 'bn' ? 'তৈরি করা হয়েছে সঠিক ভৌগোলিক ডাটা, ডিজিটাল রুট মডেল এবং কলকাতা মেট্রো নেটওয়ার্কের সম্পূর্ণ সংযোগের মাধ্যমে এই অভিজ্ঞতা সহজ করতে।' : 'was built to solve this challenge through verified geographic datasets, spatial routing models, and deep integration with Kolkata’s high-frequency Metro railway network.'}
          </p>

          <div className="durga-eye-divider" />

          <h2 style={{ fontSize: '1.6rem', marginBottom: '16px', color: 'var(--foreground)' }}>
            {language === 'bn' ? 'আমাদের তথ্য ও ডেটা নীতি' : 'Our Core Data Philosophy'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', margin: '24px 0 32px' }}>
            <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--vermilion)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconShield size={16} /> {language === 'bn' ? '১০০% সঠিক জিও-ট্যাগ ডাটা' : '100% Real Geo-Tagged Data'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--taupe)' }}>
                {language === 'bn' ? 'আমাদের ২৪৮টি প্যান্ডেল এবং ৪৫টি মেট্রো স্টেশনের প্রতিটি নিখুঁত অক্ষাংশ/দ্রাঘিমাংশ সহ যাচাইকৃত।' : 'Every single one of our 248 pandals and 45 Metro stations is verified with exact latitude/longitude coordinates. We never fabricate locations.'}
              </p>
            </div>

            <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: '#155799', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMetro size={16} /> {language === 'bn' ? 'ডায়নামিক মেট্রো রুট' : 'Dynamic Metro Routing'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--taupe)' }}>
                {language === 'bn' ? 'নিকটবর্তী মেট্রো স্টেশন এবং হাঁটার সময় গাণিতিকভাবে হ্যাভারসাইন ফর্মুলায় হিসাব করা হয়েছে।' : 'Nearest Metro stations and walking times are mathematically calculated using the Haversine formula, ensuring reliable festive navigation.'}
              </p>
            </div>
          </div>

          <div className="durga-eye-divider" />

          <h2 style={{ fontSize: '1.6rem', marginBottom: '16px', color: 'var(--foreground)' }}>
            {language === 'bn' ? 'উৎসবের নান্দনিক ঐতিহ্য' : 'Festive Visual Heritage'}
          </h2>
          <p style={{ marginBottom: '20px', color: 'var(--taupe)' }}>
            {language === 'bn' ? 'মা দুর্গার নয়ন, খাঁটি সিঁদুর, সনাতনী সোনার অলঙ্কার এবং কুমারটুলির মৃৎশিল্পীদের অনন্য কারুকার্য থেকে অনুপ্রাণিত।' : 'Inspired by the expressive eyes of Maa Durga, authentic vermilion sindoor, antique gold ornamentation, and the sacred artistry of Kumartuli clay masters.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '14px', margin: '20px 0 32px' }}>
            {['/images/durga/durga-1.png', '/images/durga/durga-2.png', '/images/durga/durga-3.jpg', '/images/durga/durga-4.png', '/images/durga/durga-5.jpg', '/images/durga/durga-6.jpg'].map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-gold)',
                  boxShadow: '0 4px 12px rgba(23,18,15,0.06)',
                }}
              >
                <Image
                  src={img}
                  alt={`Durga Artistry ${idx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/explore" className="btn btn-vermilion btn-lg">
              <IconSparkles size={18} /> {language === 'bn' ? '২৪৮টি প্যান্ডেল দেখুন' : 'Explore the 248 Pandals'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
