'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pandal } from '../lib/types';
import { useLanguage } from '../lib/language-context';
import {
  IconSearch,
  IconClose,
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconMetro,
  IconMapPin,
  IconSparkles,
} from './Icons';

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
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

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

  // Reset highlighted index when filter or search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, activeRegion]);

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredPandals.length - 1));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPandals[highlightedIndex]) {
        handleSelect(filteredPandals[highlightedIndex]);
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('.pandal-select-item');
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = (pandal: Pandal) => {
    onSelect(pandal.id);
    setIsOpen(false);
  };

  const isHero = variant === 'hero';

  const getCrowdLabel = (crowd?: string) => {
    if (!crowd) return null;
    const c = crowd.toLowerCase();
    if (c === 'low') return { text: language === 'bn' ? 'স্বল্প ভিড়' : 'Low Crowd', color: '#34D399' };
    if (c === 'moderate') return { text: language === 'bn' ? 'মাঝারি ভিড়' : 'Moderate', color: '#FBBF24' };
    return { text: language === 'bn' ? 'প্রচণ্ড ভিড়' : 'Heavy Rush', color: '#F87171' };
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`pandal-select-container ${isHero ? 'pandal-select-hero' : 'pandal-select-light'} ${
        isOpen ? 'popover-active' : ''
      }`}
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
                <span className="trigger-tag tag-region">
                  <IconMapPin size={11} /> {tRegion(selectedPandal.region)}
                </span>
                <span className="trigger-tag tag-metro">
                  🚇 {selectedPandal.nearestMetro}
                </span>
                {selectedPandal.famous && (
                  <span className="trigger-tag tag-famous">
                    ⭐ {language === 'bn' ? 'জনপ্রিয়' : 'Top Pandal'}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="pandal-select-placeholder">
              {placeholder || (language === 'bn' ? 'গন্তব্য প্যান্ডেল খুঁজুন...' : 'Select Destination Pandal...')}
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
              <IconSearch size={17} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'প্যান্ডেল, মেট্রো বা অঞ্চল খুঁজুন...'
                    : 'Search 248 pandals, metro, or area...'
                }
                className="pandal-select-search-input"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  <IconClose size={14} />
                </button>
              ) : (
                <span className="kbd-shortcut-hint">Esc</span>
              )}
            </div>
          </div>

          {/* Subheader: Category Segmented Filters & Count */}
          <div className="pandal-select-filter-bar">
            <div className="pandal-select-filters">
              <button
                type="button"
                className={`filter-pill ${activeRegion === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveRegion('ALL')}
              >
                {language === 'bn' ? 'সকল' : 'All'}
              </button>
              <button
                type="button"
                className={`filter-pill ${activeRegion === 'FAMOUS' ? 'active' : ''}`}
                onClick={() => setActiveRegion('FAMOUS')}
              >
                ⭐ {language === 'bn' ? 'সেরা আকর্ষণ' : 'Top Hits'}
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

            <div className="pandal-select-stats">
              <span>
                {filteredPandals.length}{' '}
                {language === 'bn' ? 'টি' : filteredPandals.length === 1 ? 'pandal' : 'pandals'}
              </span>
            </div>
          </div>

          {/* Pandal List */}
          <div ref={listRef} className="pandal-select-list">
            {filteredPandals.length > 0 ? (
              filteredPandals.map((p, index) => {
                const isSelected = p.id === selectedId;
                const isHighlighted = index === highlightedIndex;
                const crowd = getCrowdLabel(p.crowdLevel);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`pandal-select-item ${isSelected ? 'selected' : ''} ${
                      isHighlighted ? 'highlighted' : ''
                    }`}
                  >
                    {/* Left Icon Badge */}
                    <div className="pandal-select-item-icon">
                      {isSelected ? (
                        <div className="check-badge">
                          <IconCheck size={14} />
                        </div>
                      ) : (
                        <div className="pin-badge">
                          <IconMapPin size={13} />
                        </div>
                      )}
                    </div>

                    {/* Central Content */}
                    <div className="pandal-select-item-info">
                      <div className="pandal-select-item-name-row">
                        <span className="pandal-item-name">{tPandalName(p)}</span>
                        {p.famous && (
                          <span className="mini-famous-badge">
                            <IconSparkles size={10} /> {language === 'bn' ? 'জনপ্রিয়' : 'Top'}
                          </span>
                        )}
                      </div>

                      <div className="pandal-select-item-details">
                        <span className="tag-chip tag-chip-region">
                          {tRegion(p.region)}
                        </span>
                        <span className="tag-chip tag-chip-metro">
                          🚇 {p.nearestMetro}
                        </span>
                        {crowd && (
                          <span className="tag-chip tag-chip-crowd" style={{ color: crowd.color }}>
                            <span className="crowd-dot" style={{ backgroundColor: crowd.color }} />
                            {crowd.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Hover Arrow */}
                    <div className="pandal-select-item-arrow">
                      <IconChevronRight size={15} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="pandal-select-empty">
                <div className="empty-search-icon">🔍</div>
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
                  {language === 'bn' ? 'সব প্যান্ডেল দেখুন' : 'Show All 248 Pandals'}
                </button>
              </div>
            )}
          </div>

          {/* Bottom Footer Info */}
          <div className="pandal-select-footer">
            <span className="footer-tip">
              💡 {language === 'bn' ? 'যেকোনো প্যান্ডেলে ক্লিক করে সরাসরি রুট দেখুন' : 'Select any pandal for direct transit & metro routing'}
            </span>
            <span className="footer-counter">
              ২৪৮ {language === 'bn' ? 'টি প্যান্ডেল' : 'Pandals'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
