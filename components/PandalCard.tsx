'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pandal } from '../lib/types';
import { formatDistance, formatDuration } from '../lib/format';
import { IconMetro, IconBus, IconWalk, IconRoute, IconSparkles } from './Icons';
import CrowdBadge from './CrowdBadge';
import FavoriteButton from './FavoriteButton';

interface PandalCardProps {
  pandal: Pandal;
  distanceUserKm?: number;
}

export default function PandalCard({ pandal, distanceUserKm }: PandalCardProps) {
  const [imageSrc, setImageSrc] = useState(
    pandal.imageUrl || `/images/pandals/pandal-${pandal.id}.jpg`
  );

  return (
    <article className="pandal-card">
      <div className="pandal-card-media">
        <Link href={`/pandal/${pandal.id}`}>
          <Image
            src={imageSrc}
            alt={pandal.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            onError={() => {
              setImageSrc(`/images/pandals/pandal-40.jpg`);
            }}
          />
        </Link>

        {/* Badges on top-left of image */}
        <div className="pandal-card-badge-top">
          {pandal.id === 40 && (
            <span className="badge" style={{ background: '#B3261E', color: '#FFF', fontWeight: 800, border: '1px solid #FF8A80', boxShadow: '0 2px 8px rgba(179,38,30,0.4)' }}>
              🔥 #1 Most Crowded
            </span>
          )}
          {pandal.id === 205 && (
            <span className="badge" style={{ background: '#0D47A1', color: '#FFF', fontWeight: 800, border: '1px solid #90CAF9' }}>
              🎨 Art Installation
            </span>
          )}
          {pandal.famous && pandal.id !== 40 && pandal.id !== 205 && (
            <span className="badge badge-famous">
              <IconSparkles size={12} color="#B08D57" /> Iconic Pandal
            </span>
          )}
          {distanceUserKm !== undefined && (
            <span className="badge badge-region">
              {distanceUserKm < 1
                ? `${Math.round(distanceUserKm * 1000)}m away`
                : `${distanceUserKm.toFixed(1)} km away`}
            </span>
          )}
        </div>

        {/* Favorite toggle button */}
        <FavoriteButton pandalId={pandal.id} pandalName={pandal.name} />
      </div>

      <div className="pandal-card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <span className="pandal-card-region">{pandal.region}</span>
          <CrowdBadge level={pandal.crowdLevel} />
        </div>

        <h3 className="pandal-card-title">
          <Link href={`/pandal/${pandal.id}`}>{pandal.name}</Link>
        </h3>

        <p className="pandal-card-theme" title={pandal.theme}>
          {pandal.theme || pandal.description}
        </p>

        {/* Transit Connectivity: Metro & Bus */}
        <div style={{ margin: '8px 0 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* Nearest Metro */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'var(--warm-cream)',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '0.76rem',
              color: '#3B3026',
            }}
          >
            <IconMetro size={15} color="#155799" />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pandal.nearestMetro}
            </span>
            <span style={{ color: '#8C8178' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', color: '#666' }}>
              <IconWalk size={12} color="#756D65" />
              {pandal.walkingTimeMinutes}m ({formatDistance(pandal.walkingDistanceM)})
            </span>
          </div>

          {/* Nearest Bus Stop & Routes */}
          {pandal.nearestBusStop && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: '#F1F8F4',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                color: '#1B5E20',
                border: '1px solid rgba(47, 125, 74, 0.15)',
              }}
            >
              <IconBus size={15} color="#2F7D4A" />
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pandal.nearestBusStop}
              </span>
              {pandal.topBuses && pandal.topBuses.length > 0 && (
                <>
                  <span style={{ color: '#A5D6A7' }}>•</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2E7D32', whiteSpace: 'nowrap' }}>
                    {pandal.topBuses.slice(0, 3).join(', ')}
                    {pandal.availableBusesCount && pandal.availableBusesCount > 3 ? ` +${pandal.availableBusesCount - 3}` : ''}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pandal-card-footer">
          <Link
            href={`/pandal/${pandal.id}`}
            style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.82rem' }}
          >
            Explore Pandal →
          </Link>
          <Link
            href={`/route?to=${pandal.id}`}
            className="btn btn-vermilion btn-sm"
            style={{ padding: '6px 12px', fontSize: '0.72rem' }}
          >
            <IconRoute size={14} /> Find Route
          </Link>
        </div>
      </div>
    </article>
  );
}
