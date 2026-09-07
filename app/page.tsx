'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getTrendingPandals,
  getMetroStations,
  getPandals,
} from '../lib/api';
import { Pandal, MetroStation } from '../lib/types';
import PandalCard from '../components/PandalCard';
import TransportCard from '../components/TransportCard';
import {
  IconEye,
  IconRoute,
  IconCalendar,
  IconMapPin,
  IconSparkles,
  IconShield,
} from '../components/Icons';
import HeroSearchWidget from './HeroSearchWidget';
import MetroPujaPlanner from '../components/MetroPujaPlanner';
import { useLanguage } from '../lib/language-context';

export default function HomePage() {
  const { language, t } = useLanguage();
  const [trendingPandals, setTrendingPandals] = useState<Pandal[]>([]);
  const [allPandals, setAllPandals] = useState<Pandal[]>([]);
  const [metroStations, setMetroStations] = useState<MetroStation[]>([]);

  useEffect(() => {
    async function loadData() {
      const tp = await getTrendingPandals(6);
      const ap = await getPandals();
      const ms = await getMetroStations();
      setTrendingPandals(tp);
      setAllPandals(ap);
      setMetroStations(ms);
    }
    loadData();
  }, []);

  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        {/* Mobile Background Image (JPEG) */}
        <img
          src="/images/hero-mobile.jpg"
          alt="Durga Puja 2026"
          className="hero-mobile-img"
        />

        {/* Cinematic Durga Video Background (Desktop) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="hero-video"
          poster="/images/hero-mobile.jpg"
        >
          <source src="/videos/hero-video.mov" type="video/mp4" />
          <source src="/videos/hero-video.mov" type="video/quicktime" />
        </video>
        <div className="hero-background-art" />
        <div className="hero-bg-overlay" />

        <div className="container hero-content">
          <div className="eyebrow hero-eyebrow">
            {t('hero_subtitle', 'Kolkata’s Premier Festival Transit & Discovery')}
          </div>

          <h1 className="hero-title">
            {language === 'bn' ? 'আপনার পুজো। আপনার রুট। ' : 'Your Puja. Your Route. '}
            <span className="vermilion-text">{language === 'bn' ? 'আপনার পরিক্রমা।' : 'Your Hop.'}</span>
          </h1>

          <div className="hero-accent-line" />

          <p className="hero-subtitle">
            {t('hero_title', 'Discover Kolkata’s 248+ verified pandals, calculate the smartest Metro and walking routes, beat the festive rush, and curate your dream Puja night.')}
          </p>

          {/* Interactive Route Search Widget */}
          <HeroSearchWidget pandals={allPandals} />

          {/* Quick Action Chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '28px',
            }}
          >
            <Link href="/explore" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFF' }}>
              <IconEye size={15} color="#D4B77A" /> {t('explore_now', 'Explore 248 Pandals')}
            </Link>
            <Link href="/planner" className="btn btn-gold btn-sm">
              <IconCalendar size={15} /> {t('plan_my_night', 'Plan Puja Itinerary')}
            </Link>
            <Link href="/nearby" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFF' }}>
              <IconMapPin size={15} color="#D4B77A" /> {t('near_me', 'Pandals Near Me')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS & CULTURAL METRICS BAR */}
      <section style={{ background: '#FFF', borderBottom: '1px solid var(--border)', padding: '28px 0' }}>
        <div className="container home-stats-grid">
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--foreground)' }}>
              ২৪৮+
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 600 }}>
              {t('quick_stats_pandals', 'Geo-Tagged Pandals')}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: '#155799' }}>
              {metroStations.length || 46}
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 600 }}>
              {t('quick_stats_metros', 'Kolkata Metro Stations')}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--vermilion)' }}>
              ০%
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 600 }}>
              {language === 'bn' ? 'মেট্রো এক্সপ্রেসের সাথে যানজট মুক্ত' : 'Traffic Delay with Metro Express'}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--antique-gold)' }}>
              ১০০%
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 600 }}>
              {language === 'bn' ? 'যাচাইকৃত ভৌগোলিক উপাত্ত' : 'Verified Geographic Data'}
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRENDING & ICONIC PANDALS SECTION */}
      <section style={{ padding: '80px 0', background: 'var(--background)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
            <div>
              <div className="eyebrow">{language === 'bn' ? 'সেরা নির্বাচন' : 'Iconic Selections'}</div>
              <h2 style={{ fontFamily: 'var(--font-serif)' }}>
                {t('trending_pandals', 'Trending & Famous Pandals')}
              </h2>
              <p style={{ color: 'var(--taupe)', fontSize: '0.92rem', marginTop: '6px' }}>
                {language === 'bn' ? 'ঐতিহ্যবাহী মৃৎশিল্প, ঐতিহ্য স্থাপত্য এবং জাঁকজমক আলোকসজ্জা সমৃদ্ধ ঐতিহ্যবাহী ক্লাব পূজো।' : 'Kolkata’s legendary club pujas with artisanal clay craft, heritage architecture and grand illumination.'}
              </p>
            </div>

            <Link href="/explore?filter=famous" className="btn btn-secondary btn-sm">
              {t('view_all', 'View All Iconic Pandals')} →
            </Link>
          </div>

          <div className="pandal-grid">
            {trendingPandals.map(pandal => (
              <PandalCard key={pandal.id} pandal={pandal} />
            ))}
          </div>
        </div>
      </section>

      {/* 3.5. EDITORIAL FESTIVE VISUAL SHOWCASE */}
      <section style={{ padding: '80px 0', background: 'var(--dark-bg)', color: '#FFF', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 20% 30%, #B08D57 0%, transparent 60%)' }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 48px' }}>
            <div className="eyebrow hero-eyebrow" style={{ justifyContent: 'center' }}>
              {language === 'bn' ? 'পবিত্র দৃশ্যমান ঐতিহ্য' : 'The Sacred Visual Heritage'}
            </div>
            <h2 style={{ color: '#FFF', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)' }}>
              {language === 'bn' ? 'কলকাতার শিল্পকলা, মাটি ও সিঁদুর' : 'The Artistry, Clay & Sindoor of Kolkata'}
            </h2>
            <div className="hero-accent-line" style={{ margin: '16px auto 20px' }} />
            <p style={{ color: 'var(--stone)', fontSize: '1rem', lineHeight: 1.6 }}>
              {language === 'bn' ? 'কুমারটুলির গঙ্গার পলিমাটি দিয়ে প্রতিমা গড়া থেকে শুরু করে রাতের ঢাকের তাল ও সিঁদুর খেলা—বাংলার সাংস্কৃতিক রূপ দেখুন।' : 'From the sacred clay shaping along the riverbanks of Kumartuli to the radiant vermilion sindoor and all-night dhaak rhythms, experience the divine cultural soul of Bengal.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Card 1: Expressive Divine Eyes */}
            <div
              style={{
                position: 'relative',
                height: '380px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-gold)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '24px',
              }}
              className="card-luxury"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'url(/images/durga/durga-1.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  transition: 'transform 0.6s ease',
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(23,18,15,0.92) 100%)' }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span className="badge badge-famous" style={{ marginBottom: '8px' }}>
                  <IconSparkles size={11} /> {language === 'bn' ? 'দেবী রূপ' : 'Divine Expression'}
                </span>
                <h3 style={{ color: '#FFF', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  {language === 'bn' ? 'চক্ষুদান ও দেবী নয়ন' : 'Chokkhu Daan & Divine Eyes'}
                </h3>
                <p style={{ color: 'var(--stone)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {language === 'bn' ? 'মহালয়ার প্রভাতে শিল্পীদের তুলিতে প্রতিমার চোখ আঁকার মহিমান্বিত মুহূর্ত।' : 'The sacred ritual where master artisans paint the expressive, all-seeing eyes on Mahalaya morning.'}
                </p>
              </div>
            </div>

            {/* Card 2: Golden Sabeki Pratima */}
            <div
              style={{
                position: 'relative',
                height: '380px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-gold)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '24px',
              }}
              className="card-luxury"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'url(/images/durga/durga-2.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.6s ease',
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(23,18,15,0.92) 100%)' }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span className="badge badge-famous" style={{ marginBottom: '8px' }}>
                  <IconSparkles size={11} /> {language === 'bn' ? 'সাবেকি ঐতিহ্য' : 'Sabeki Heritage'}
                </span>
                <h3 style={{ color: '#FFF', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  {language === 'bn' ? 'শোভাবাজার রাজবাড়ীর ঐতিহ্য' : 'Shobhabazar & Rajbari Glory'}
                </h3>
                <p style={{ color: 'var(--stone)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {language === 'bn' ? 'ডাকের সাজে সজ্জিত সাবেকি একচালা প্রতিমা এবং রাজবাড়ির ঐতিহ্যবাহী পুজো।' : 'Antique daker saaj gold ornamentation, traditional chalchitra backdrops, and centuries of aristocratic warmth.'}
                </p>
              </div>
            </div>

            {/* Card 3: Kumartuli Clay Artistry */}
            <div
              style={{
                position: 'relative',
                height: '380px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-gold)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '24px',
              }}
              className="card-luxury"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'url(/images/durga/durga-5.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.6s ease',
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(23,18,15,0.92) 100%)' }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span className="badge badge-famous" style={{ marginBottom: '8px' }}>
                  <IconSparkles size={11} /> {language === 'bn' ? 'কুমারটুলির মৃৎশিল্পী' : 'Kumartuli Potters'}
                </span>
                <h3 style={{ color: '#FFF', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  {language === 'bn' ? 'গঙ্গার মাটি ও খড়ের ভাস্কর্য' : 'Ganga Clay & Straw Sculpting'}
                </h3>
                <p style={{ color: 'var(--stone)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {language === 'bn' ? 'গঙ্গার পবিত্র পলিমাটি ও বাঁশের কাঠামো দিয়ে মৃৎশিল্পীদের হাতে গড়া মা দুর্গার রূপ।' : 'Meticulously hand-sculpted using holy Ganga alluvial clay, bamboo framing, and organic natural pigments.'}
                </p>
              </div>
            </div>

            {/* Card 4: Night Illumination & Dhunuchi */}
            <div
              style={{
                position: 'relative',
                height: '380px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-gold)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '24px',
              }}
              className="card-luxury"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'url(/images/durga/durga-6.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.6s ease',
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(23,18,15,0.92) 100%)' }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span className="badge badge-famous" style={{ marginBottom: '8px' }}>
                  <IconSparkles size={11} /> {language === 'bn' ? 'সারারাত প্যান্ডেল হপিং' : 'All-Night Hopping'}
                </span>
                <h3 style={{ color: '#FFF', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  {language === 'bn' ? 'ধুনুচি নাচ ও আলোকসজ্জা' : 'Dhunuchi Dance & Chandernagore Lights'}
                </h3>
                <p style={{ color: 'var(--stone)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {language === 'bn' ? 'ঢাকের আওয়াজ, ধুনোর সুবাস এবং চন্দননগরের আলোয় রঙিন পূজোর রাত।' : 'Rhythmic dhaak pulses, aromatic dhuno smoke, and dazzling light gates guiding nocturnal hoppers.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SMART FESTIVE TRANSIT COMPARISON */}
      <section style={{ padding: '80px 0', background: 'var(--warm-white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>{language === 'bn' ? 'পরিবহন তুলনা' : 'Festive Mobility Breakdown'}</div>
            <h2>{language === 'bn' ? 'ক্যাব বা গাড়ির চেয়ে মেট্রো + হাঁটা কেন সেরা?' : 'Why Metro + Walk Beats Road Cabs'}</h2>
            <p style={{ color: 'var(--taupe)', marginTop: '8px' }}>
              {language === 'bn' ? 'পূজোর ব্যস্ত দিনগুলোতে (সন্ধ্যা ৬টা – রাত ৩টে) যানজট এড়িয়ে কীভাবে সহজেই প্যান্ডেলে পৌঁছাবেন।' : 'During Durga Puja peak evenings (6 PM – 3 AM), Kolkata Police closes major arteries to vehicles. Here is how transit modes compare in real festive conditions.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '24px' }}>
            <TransportCard
              mode="metro"
              title={language === 'bn' ? 'কলকাতা মেট্রো এক্সপ্রেস' : 'Kolkata Metro Express'}
              subtitle={language === 'bn' ? 'উত্তর-দক্ষিণ ব্লু ও পূর্ব-পশ্চিম গ্রিন লাইন' : 'North-South Blue & East-West Green Lines'}
              durationMinutes={18}
              distanceMeters={6500}
              fare={10}
              isRecommended={true}
              notes={language === 'bn' ? 'রাস্তার তীব্র যানজট এড়ায়। পূজোর রাতে ট্রেন চলে নির্দিষ্ট সময় পর্যন্ত।' : 'Bypasses all surface road blocks. Trains run every 6-8 mins till late night during Puja.'}
            />

            <TransportCard
              mode="walk"
              title={language === 'bn' ? 'পদব্রজে প্যান্ডেল হপ' : 'Designated Pedestrian Hop'}
              subtitle={language === 'bn' ? 'আশেপাশের প্রতিবেশী প্যান্ডেলের মধ্যে' : 'Between adjacent neighborhood pandals'}
              durationMinutes={12}
              distanceMeters={900}
              fare={0}
              notes={language === 'bn' ? 'শ্যামবাজার, বাগবাজার এবং হাতিবাগানের ঐতিহ্যবাহী পুজোর জন্য সবচেয়ে সুবিধাজনক।' : 'Best suited inside heritage clusters like Shyambazar, Baghbazar, and Hatibagan.'}
            />

            <TransportCard
              mode="cab"
              title={language === 'bn' ? 'হলুদ ট্যাক্সি / অ্যাপ ক্যাব' : 'Yellow Taxi / App Cab'}
              subtitle={language === 'bn' ? 'পূজোর ট্রাফিক ডাইভারশন সাপেক্ষ' : 'Subject to heavy Puja police diversions'}
              durationMinutes={58}
              distanceMeters={7200}
              fare={240}
              notes={language === 'bn' ? 'বিখ্যাত প্যান্ডেল থেকে ৩০০-৮০০ মিটার দূরে গাড়ি আটকানো হয়।' : 'Vehicles blocked 300-800m away from famous pandals. Expect 3x festive congestion.'}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/route" className="btn btn-primary">
              <IconRoute size={16} /> {t('smart_route_calc', 'Open Smart Route Finder')}
            </Link>
          </div>
        </div>
      </section>

      {/* 4.5. PLAN PUJA WITH KOLKATA METRO SECTION (COMPACT PREVIEW) */}
      <MetroPujaPlanner metroStations={metroStations} pandals={allPandals} compact={true} />

      {/* 5. HOP PLANNER PROMO BANNER */}
      <section style={{ padding: '90px 0', background: 'var(--dark-bg)', color: '#FFF', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/durga/durga-4.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.22,
            filter: 'contrast(1.2) brightness(0.8)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(23,18,15,0.95) 0%, rgba(23,18,15,0.85) 60%, rgba(23,18,15,0.95) 100%)' }} />
        
        <div className="container responsive-split-grid" style={{ position: 'relative', zIndex: 10, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--soft-gold)' }}>
              {language === 'bn' ? 'স্মার্ট রুট জেনারেটর' : 'Intelligent Itinerary Generator'}
            </div>
            <h2 style={{ color: '#FFF', fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '18px' }}>
              {language === 'bn' ? '৬০ সেকেন্ডে তৈরি করুন সেরা পূজা প্ল্যান' : 'Plan Your Ultimate Puja Night in 60 Seconds'}
            </h2>
            <p style={{ color: 'var(--stone)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
              {language === 'bn' ? 'পছন্দের প্যান্ডেল, শুরুর স্টেশন ও সময় নির্বাচন করুন। পূজো নেভিগেশন আপনার জন্য সেরা ভ্রমণক্রম তৈরি করবে।' : 'Select your favourite pandals, starting station, and budget. Pujo Navigation calculates the best estimated visiting sequence, timing milestones, and transit transfers so you spend less walking and more time celebrating.'}
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/planner" className="btn btn-gold btn-lg">
                <IconSparkles size={18} /> {t('plan_my_night', 'Generate My Puja Plan')}
              </Link>
              <Link href="/explore" className="btn btn-secondary btn-lg" style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.4)' }}>
                {t('explore_pandals', 'Browse All Pandals')}
              </Link>
            </div>
          </div>

          {/* Timeline Visual Mockup Card */}
          <div style={{ background: '#FFFDF9', color: 'var(--foreground)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-gold)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{language === 'bn' ? 'নমুনা ৪-প্যান্ডেল ভ্রমণ রুট' : 'Sample 4-Pandal Evening Plan'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>{language === 'bn' ? 'উত্তর কলকাতা ঐতিহ্যবাহী রুট • ৪.২ কিমি' : 'North Kolkata Heritage Trail • 4.2 km'}</div>
              </div>
              <span className="badge badge-famous">{language === 'bn' ? 'সেরা রুট' : 'Best Route'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: 'var(--vermilion)', minWidth: '46px' }}>17:30</span>
                <div>
                  <strong>{language === 'bn' ? 'বাগবাজার সর্বজনীন' : 'Baghbazar Sarbojanin'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>{language === 'bn' ? 'শ্যামবাজার মেট্রো (৪০০ মি হাঁটা)' : 'Shyambazar Metro (400m walk)'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: 'var(--vermilion)', minWidth: '46px' }}>18:45</span>
                <div>
                  <strong>{language === 'bn' ? 'কুমারটুলী পার্ক সর্বজনীন' : 'Kumartuli Park Sarbojanin'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>{language === 'bn' ? '৭০০ মি হাঁটা কুমারটুলী গলি দিয়ে' : '700m Walk via Kumartuli Ghat lane'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: 'var(--vermilion)', minWidth: '46px' }}>20:00</span>
                <div>
                  <strong>{language === 'bn' ? 'আহিরীটোলা যুবক বৃন্দ' : 'Ahiritola Jubak Brinda'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>{language === 'bn' ? 'শোভাবাজার মেট্রো নিকটবর্তী' : 'Shobhabazar Metro exit'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--taupe)' }}>
              <span>{language === 'bn' ? 'মোট আনুমানিক খরচ: ₹৩০' : 'Total Est. Fare: ₹30'}</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ {language === 'bn' ? 'কম যানজট বিলম্ব' : 'Low Traffic Delay'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EMERGENCY HELPLINE TICKER BANNER */}
      <section style={{ padding: '36px 0', background: 'var(--warm-cream)', borderTop: '1px solid #E5D5C0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--vermilion)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <IconShield size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('police_helpline', 'Kolkata Police & Puja Safety Helpline')}: 1090 / 112</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>{language === 'bn' ? '২৪x৭ সক্রিয় কন্ট্রোল রুম, মেডিকেল রেসপন্স ও সহায়তা ডেক্স' : '24x7 Active Control Rooms, Medical Response & Lost and Found Desks.'}</div>
            </div>
          </div>

          <Link href="/emergency" className="btn btn-vermilion btn-sm">
            {t('emergency_title', 'View All Helplines & Safety Contacts')} →
          </Link>
        </div>
      </section>
    </>
  );
}
