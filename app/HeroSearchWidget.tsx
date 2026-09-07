'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pandal } from '../lib/types';
import { IconMapPin, IconRoute, IconNavigation } from '../components/Icons';
import { useToast } from '../lib/toast-context';
import { detectUserLocation } from '../lib/location-service';
import { useLanguage } from '../lib/language-context';

interface HeroSearchWidgetProps {
  pandals: Pandal[];
}

export default function HeroSearchWidget({ pandals }: HeroSearchWidgetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { language, tPandalName, tRegion, t } = useLanguage();

  const [fromOption, setFromOption] = useState(language === 'bn' ? 'বর্তমান অবস্থান' : 'Current Location');
  const [selectedPandalId, setSelectedPandalId] = useState<number>(
    pandals.length > 0 ? pandals[0].id : 1
  );
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const handleGetLocation = async () => {
    setLocating(true);
    showToast(t('locating', 'Detecting your location in Kolkata...'), 'info');

    try {
      const loc = await detectUserLocation();
      setUserCoords({ lat: loc.lat, lon: loc.lon });
      setFromOption(language === 'bn' ? `আমার অবস্থান (${loc.landmark})` : `My Location (${loc.landmark})`);
      showToast(`📍 ${t('location_detected', 'Location pinned')}: ${loc.landmark}!`, 'success');
    } catch (err) {
      console.warn('Geo error', err);
      showToast('Could not access GPS. Using Central Kolkata / Esplanade as origin.', 'warning');
      setFromOption(language === 'bn' ? 'মধ্য কলকাতা (এসপ্ল্যানেড)' : 'Central Kolkata (Esplanade)');
    } finally {
      setLocating(false);
    }
  };

  const handleFindRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPandalId) {
      showToast('Please select a destination pandal', 'warning');
      return;
    }

    let url = `/route?to=${selectedPandalId}`;
    if (userCoords) {
      url += `&lat=${userCoords.lat}&lon=${userCoords.lon}&fromName=My+Location`;
    } else {
      url += `&fromName=${encodeURIComponent(fromOption)}`;
    }

    router.push(url);
  };

  return (
    <div className="hero-search-card">
      <form onSubmit={handleFindRoute}>
        <div className="search-inputs-grid">
          {/* FROM FIELD */}
          <div className="input-field-group">
            <label className="input-field-label">
              <IconMapPin size={13} color="#B08D57" /> {t('origin', 'From (Origin)')}
            </label>
            <div className="input-field-wrapper">
              <input
                type="text"
                value={fromOption}
                onChange={e => setFromOption(e.target.value)}
                placeholder={language === 'bn' ? 'বর্তমান অবস্থান / মেট্রো স্টেশন' : 'Current Location / Metro Station'}
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="badge badge-region"
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', border: 'none' }}
                title="Detect GPS Location"
              >
                <IconNavigation size={12} /> {locating ? (language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Locating...') : 'GPS'}
              </button>
            </div>
          </div>

          {/* TO FIELD */}
          <div className="input-field-group">
            <label className="input-field-label">
              <IconRoute size={13} color="#B3261E" /> {t('destination', 'To (Destination Pandal)')}
            </label>
            <div className="input-field-wrapper">
              <select
                value={selectedPandalId}
                onChange={e => setSelectedPandalId(parseInt(e.target.value, 10))}
                style={{ cursor: 'pointer' }}
              >
                {pandals.map(p => (
                  <option key={p.id} value={p.id}>
                    {tPandalName(p)} ({tRegion(p.region)}) • 🚇 {p.nearestMetro}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SUBMIT ACTION */}
          <div>
            <button
              type="submit"
              className="btn btn-vermilion"
              style={{ height: '46px', width: '100%', whiteSpace: 'nowrap' }}
            >
              <IconRoute size={16} /> {t('calculate_route', 'Find Best Route')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
