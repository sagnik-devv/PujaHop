'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pandal } from '../lib/types';
import { formatDistance, formatDuration } from '../lib/format';
import { IconMetro, IconWalk, IconRoute, IconSparkles } from './Icons';
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

        {/* Nearest Metro Transit Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--warm-cream)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '0.78rem',
            margin: '8px 0 16px',
            color: '#3B3026',
          }}
        >
          <IconMetro size={16} color="#155799" />
          <span style={{ fontWeight: 600 }}>{pandal.nearestMetro}</span>
          <span style={{ color: '#8C8178' }}>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <IconWalk size={13} color="#756D65" />
            {formatDistance(pandal.walkingDistanceM)} ({formatDuration(pandal.walkingTimeMinutes)})
          </span>
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
