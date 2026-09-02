'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchPandals } from '../lib/api';
import { Pandal, MetroStation } from '../lib/types';
import { IconSearch, IconMetro, IconMapPin, IconSparkles } from './Icons';

interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
  onSelectPandal?: (pandal: Pandal) => void;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Search 248+ pandals, metro stations, areas...',
  initialValue = '',
  onSelectPandal,
  className = '',
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<{
    pandals: Pandal[];
    metroStations: MetroStation[];
    areas: string[];
  }>({ pandals: [], metroStations: [], areas: [] });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions({ pandals: [], metroStations: [], areas: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await searchPandals(query);
      setSuggestions(res);
      setIsOpen(res.pandals.length > 0 || res.metroStations.length > 0 || res.areas.length > 0);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} className={className}>
      <form onSubmit={handleSubmit}>
        <div
          className="input-field-wrapper"
          style={{
            background: '#FFF',
            padding: '12px 16px',
            border: '1px solid var(--border-gold)',
            boxShadow: '0 2px 8px rgba(23,18,15,0.04)',
          }}
        >
          <IconSearch size={20} color="#B08D57" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            style={{ fontSize: '0.95rem' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              style={{ color: '#8C8178', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          )}
          <button type="submit" className="btn btn-vermilion btn-sm" style={{ padding: '8px 14px' }}>
            Search
          </button>
        </div>
      </form>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#FFFDF9',
            border: '1px solid var(--border-gold)',
            borderRadius: '6px',
            boxShadow: '0 12px 32px rgba(23, 18, 15, 0.15)',
            zIndex: 1000,
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {/* Pandals Group */}
          {suggestions.pandals.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B3261E' }}>
                Puja Pandals
              </div>
              {suggestions.pandals.slice(0, 5).map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setIsOpen(false);
                    if (onSelectPandal) {
                      onSelectPandal(p);
                    } else {
                      router.push(`/pandal/${p.id}`);
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF7F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--foreground)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
                      {p.region} • 🚇 {p.nearestMetro}
                    </div>
                  </div>
                  {p.famous && (
                    <span className="badge badge-famous" style={{ fontSize: '0.65rem' }}>
                      <IconSparkles size={10} /> Iconic
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Metro Stations Group */}
          {suggestions.metroStations.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#155799' }}>
                Metro Stations
              </div>
              {suggestions.metroStations.slice(0, 3).map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/explore?nearestMetro=${encodeURIComponent(m.name)}`);
                  }}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF7F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <IconMetro size={18} color="#155799" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.name} Metro Station</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>{m.bengaliName} • {m.line}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Areas Group */}
          {suggestions.areas.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B08D57' }}>
                Kolkata Regions
              </div>
              {suggestions.areas.slice(0, 3).map(a => (
                <div
                  key={a}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/explore?region=${encodeURIComponent(a)}`);
                  }}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF7F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <IconMapPin size={16} color="#B08D57" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
