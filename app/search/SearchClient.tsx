'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchResultGroup } from '../../lib/types';
import { searchPandals } from '../../lib/api';
import PandalCard from '../../components/PandalCard';
import { IconSearch, IconMetro, IconMapPin, IconSparkles } from '../../components/Icons';
import { useLanguage } from '../../lib/language-context';

interface SearchClientProps {
  initialQuery: string;
  initialResults: SearchResultGroup;
}

export default function SearchClient({
  initialQuery,
  initialResults,
}: SearchClientProps) {
  const router = useRouter();
  const { language, t, tRegion, tMetroName } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultGroup>(initialResults);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ pandals: [], metroStations: [], areas: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchPandals(query);
      setResults(res);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const totalMatches = results.pandals.length + results.metroStations.length + results.areas.length;

  const suggestions = language === 'bn'
    ? ['শ্রীভূমি', 'হরিদেবপুর আদর্শ সমিতি', 'বাগবাজার', 'একডালিয়া', 'কুমারটুলি', 'শ্যামবাজার মেট্রো']
    : ['Shreebhumi', 'Haridevpur Adarsha Samity', 'Baghbazar', 'Ekdalia', 'Kumartuli', 'Shyambazar Metro'];

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', padding: '40px 0 80px' }}>
      <div className="container container-narrow">
        {/* Search Bar Banner */}
        <div style={{ marginBottom: '36px' }}>
          <div className="eyebrow">{language === 'bn' ? 'গ্লোবাল সার্চ' : 'Universal Query'}</div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
            {t('quick_search')}
          </h1>

          <form onSubmit={handleSearch}>
            <div
              className="input-field-wrapper"
              style={{
                background: '#FFF',
                padding: '14px 18px',
                border: '1.5px solid var(--border-gold)',
                boxShadow: '0 4px 16px rgba(23,18,15,0.06)',
                borderRadius: '6px',
              }}
            >
              <IconSearch size={22} color="#B08D57" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('search_pandals_placeholder')}
                autoFocus
                style={{ fontSize: '1.05rem' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  style={{ color: '#8C8178', fontSize: '1rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Quick Filter Tag Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--taupe)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, alignSelf: 'center' }}>
              {t('popular_searches')}
            </span>
            {suggestions.map(term => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="badge badge-region"
                style={{ cursor: 'pointer', padding: '4px 10px' }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Results Sections */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--taupe)' }}>
            {language === 'bn' ? 'কলকাতা ডাটাবেস খোঁজা হচ্ছে...' : 'Searching Kolkata database...'}
          </div>
        ) : query && totalMatches === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#FFF', borderRadius: '8px', border: '1px dashed var(--border)' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
              {language === 'bn' ? `"${query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি` : `No Results Found for "${query}"`}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--taupe)' }}>
              {language === 'bn' ? 'অন্য কোনো অঞ্চলের নাম (যেমন "উত্তর কলকাতা", "সল্টলেক") বা মেট্রো স্টেশন দিয়ে খুঁজুন।' : 'Try searching by a famous locality (e.g. "North Kolkata", "Salt Lake") or Metro station.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* 1. Metro Stations Match Group */}
            {results.metroStations.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <IconMetro size={18} color="#155799" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {language === 'bn' ? `সংযুক্ত মেট্রো স্টেশন (${results.metroStations.length})` : `Matching Metro Stations (${results.metroStations.length})`}
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {results.metroStations.map(m => (
                    <Link
                      key={m.id}
                      href={`/explore?nearestMetro=${encodeURIComponent(m.name)}`}
                      style={{
                        background: '#FFF',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'border-color 0.2s',
                      }}
                      className="card-luxury"
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#155799' }}>
                          {tMetroName(m.name, m.bengaliName)} {language === 'bn' ? 'মেট্রো স্টেশন' : 'Metro Station'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>
                          {m.line}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--vermilion)', fontWeight: 600 }}>
                        {language === 'bn' ? 'প্যান্ডেল দেখুন →' : 'View Pandals →'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Areas Match Group */}
            {results.areas.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <IconMapPin size={18} color="#B08D57" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {language === 'bn' ? `সংযুক্ত কলকাতা অঞ্চল (${results.areas.length})` : `Matching Kolkata Regions (${results.areas.length})`}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {results.areas.map(area => (
                    <Link
                      key={area}
                      href={`/explore?region=${encodeURIComponent(area)}`}
                      className="badge badge-region"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      <IconMapPin size={14} color="#B08D57" /> {language === 'bn' ? `${tRegion(area)} দেখুন` : `Explore ${area}`}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Pandals Match Group */}
            {results.pandals.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <IconSparkles size={18} color="#B3261E" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {language === 'bn' ? `সংযুক্ত পূজা প্যান্ডেল (${results.pandals.length})` : `Matching Puja Pandals (${results.pandals.length})`}
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {results.pandals.map(p => (
                    <PandalCard key={p.id} pandal={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
