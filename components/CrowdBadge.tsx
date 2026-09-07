'use client';

import React from 'react';
import { CrowdLevel } from '../lib/types';
import { getCrowdBadgeStyle } from '../lib/format';
import { useLanguage } from '../lib/language-context';

interface CrowdBadgeProps {
  level: CrowdLevel;
  isLive?: boolean;
  showDetails?: boolean;
}

export default function CrowdBadge({ level, isLive = false, showDetails = false }: CrowdBadgeProps) {
  const style = getCrowdBadgeStyle(level);
  const { language, tCrowd } = useLanguage();

  const labelText = language === 'bn' ? tCrowd(level) : style.label;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '3px',
        backgroundColor: style.bgColor,
        border: `1px solid ${style.borderColor}`,
        color: style.color,
        fontSize: '0.74rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: style.dotColor,
          display: 'inline-block',
        }}
      />
      <span>{labelText}</span>
      {isLive ? (
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#B3261E', fontWeight: 700 }}>
          {language === 'bn' ? 'লাইভ' : 'LIVE'}
        </span>
      ) : (
        <span
          style={{
            fontSize: '0.62rem',
            color: '#756D65',
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '1px 4px',
            borderRadius: '2px',
          }}
          title={language === 'bn' ? 'ঐতিহাসিক উপাত্তের ভিত্তিতে ভিড়ের অনুমান' : 'Crowd data is estimated based on historical festive traffic patterns'}
        >
          {language === 'bn' ? 'আনুমানিক' : 'Estimated'}
        </span>
      )}
    </div>
  );
}
