'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pandal } from '../lib/types';
import { useLanguage } from '../lib/language-context';
import { IconSearch, IconClose, IconChevronDown, IconCheck, IconMetro, IconMapPin } from './Icons';

interface PandalSearchSelectProps {
  pandals: Pandal[];
  selectedId: number;
  onSelect: (pandalId: number) => void;
  variant?: 'hero' | 'light';
  placeholder?: string;
  disabled?: boolean;
}

export default function PandalSearchSelect({
  pandals,
  selectedId,
  onSelect,
  variant = 'hero',
  placeholder,
  disabled = false,
}: PandalSearchSelectProps) {
  const { language, tPandalName, tRegion, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected pandal object
  const selectedPandal = useMemo(() => {
    return pandals.find(p => p.id === selectedId) || pandals[0] || null;
  }, [pandals, selectedId]);

  // Available regions for quick filter tabs
  const regions = useMemo(() => {
    const set = new Set<string>();
    pandals.forEach(p => {
      if (p.region) set.add(p.region);
    });
    return Array.from(set);
  }, [pandals]);

  // Filter pandals by search query and region filter
  const filteredPandals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return pandals.filter(p => {
      // Region filter
      if (activeRegion === 'FAMOUS') {
        if (!p.famous) return false;
      } else if (activeRegion !== 'ALL' && p.region !== activeRegion) {
        return false;
      }

      // Search query filter
      if (!q) return true;

      const nameMatch = p.name.toLowerCase().includes(q);
      const bengaliMatch = p.bengaliName ? p.bengaliName.toLowerCase().includes(q) : false;
      const metroMatch = p.nearestMetro ? p.nearestMetro.toLowerCase().includes(q) : false;
      const regionMatch = p.region ? p.region.toLowerCase().includes(q) : false;
      const addressMatch = p.address ? p.address.toLowerCase().includes(q) : false;

      return nameMatch || bengaliMatch || metroMatch || regionMatch || addressMatch;
    });
  }, [pandals, searchQuery, activeRegion]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setActiveRegion('ALL');
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (pandal: Pandal) => {
    onSelect(pandal.id);
    setIsOpen(false);
  };

  const isHero = variant === 'hero';

  return (
    <div
      ref={containerRef}
      className={`pandal-select-container ${isHero ? 'pandal-select-hero' : 'pandal-select-light'}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`pandal-select-trigger ${isOpen ? 'active' : ''}`}
      >
        <div className="pandal-select-trigger-content">
          {selectedPandal ? (
            <>
              <div className="pandal-select-trigger-title">
                {tPandalName(selectedPandal)}
              </div>
              <div className="pandal-select-trigger-meta">
                <span>{tRegion(selectedPandal.region)}</span>
                <span className="dot-divider">•</span>
                <span className="metro-tag">
                  🚇 {selectedPandal.nearestMetro}
                </span>
                {selectedPandal.famous && (
                  <span className="famous-star" title="Must Visit Pandal">
                    ⭐
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="pandal-select-placeholder">
              {placeholder || (language === 'bn' ? 'প্যান্ডেল নির্বাচন করুন...' : 'Select Destination Pandal...')}
            </span>
          )}
        </div>

        <div className={`pandal-select-arrow ${isOpen ? 'open' : ''}`}>
          <IconChevronDown size={18} />
        </div>
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="pandal-select-popover" role="listbox">
          {/* Search Header */}
          <div className="pandal-select-header">
            <div className="pandal-select-searchbox">
              <IconSearch size={16} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'প্যান্ডেল, এলাকা বা মেট্রো স্টেশন খুঁজুন...'
                    : 'Search 248 pandals, areas, metro...'
                }
                className="pandal-select-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  <IconClose size={14} />
                </button>
              )}
            </div>

            <div className="pandal-select-stats">
              <span>
                {filteredPandals.length}{' '}
                {language === 'bn' ? 'টি প্যান্ডেল' : filteredPandals.length === 1 ? 'pandal' : 'pandals'}
              </span>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="pandal-select-filters">
            <button
              type="button"
              className={`filter-pill ${activeRegion === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveRegion('ALL')}
            >
              {language === 'bn' ? 'সকল' : 'All'} ({pandals.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${activeRegion === 'FAMOUS' ? 'active' : ''}`}
              onClick={() => setActiveRegion('FAMOUS')}
            >
              ⭐ {language === 'bn' ? 'জনপ্রিয়' : 'Must Visit'}
            </button>
            {regions.map(r => (
              <button
                key={r}
                type="button"
                className={`filter-pill ${activeRegion === r ? 'active' : ''}`}
                onClick={() => setActiveRegion(r)}
              >
                {tRegion(r)}
              </button>
            ))}
          </div>

          {/* Pandal List */}
          <div ref={listRef} className="pandal-select-list">
            {filteredPandals.length > 0 ? (
              filteredPandals.map(p => {
                const isSelected = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`pandal-select-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="pandal-select-item-icon">
                      {isSelected ? (
                        <div className="check-badge">
                          <IconCheck size={14} />
                        </div>
                      ) : (
                        <div className="bullet-indicator" />
                      )}
                    </div>

                    <div className="pandal-select-item-info">
                      <div className="pandal-select-item-name">
                        <span>{tPandalName(p)}</span>
                        {p.famous && <span className="mini-famous-badge">⭐ Top</span>}
                      </div>

                      <div className="pandal-select-item-details">
                        <span className="region-text">
                          <IconMapPin size={11} /> {tRegion(p.region)}
                        </span>
                        <span className="dot">•</span>
                        <span className="metro-text">
                          <IconMetro size={11} /> {p.nearestMetro}
                        </span>
                        {p.crowdLevel && (
                          <span className={`crowd-dot crowd-${p.crowdLevel.toLowerCase()}`} title={`Crowd: ${p.crowdLevel}`} />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="pandal-select-empty">
                <p>
                  {language === 'bn'
                    ? `"${searchQuery}" এর জন্য কোনো প্যান্ডেল পাওয়া যায়নি`
                    : `No pandals found matching "${searchQuery}"`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveRegion('ALL');
                  }}
                  className="btn-reset-search"
                >
                  {language === 'bn' ? 'ফিল্টার মুছুন' : 'Show All Pandals'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
