'use client';

import React from 'react';
import { IconHeart } from './Icons';
import { useFavorites } from '../lib/favorites-context';
import { useToast } from '../lib/toast-context';

interface FavoriteButtonProps {
  pandalId: number;
  pandalName?: string;
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function FavoriteButton({
  pandalId,
  pandalName,
  size = 20,
  className = '',
  showText = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const { showToast } = useToast();

  const active = isLoaded ? isFavorite(pandalId) : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(pandalId);
    if (!active) {
      showToast(`Saved "${pandalName || 'Pandal'}" to your Puja Hop favorites!`, 'success');
    } else {
      showToast(`Removed from favorites`, 'info');
    }
  };

  if (showText) {
    return (
      <button
        onClick={handleClick}
        className={`btn ${active ? 'btn-vermilion' : 'btn-secondary'} ${className}`}
        aria-label={active ? 'Remove from favorites' : 'Save to favorites'}
      >
        <IconHeart
          size={size}
          fill={active ? '#FFF' : 'none'}
          color={active ? '#FFF' : 'currentColor'}
        />
        <span>{active ? 'Saved to List' : 'Save Pandal'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`pandal-card-fav-btn ${className}`}
      aria-label={active ? 'Remove from favorites' : 'Save to favorites'}
      title={active ? 'Remove from favorites' : 'Save to favorites'}
    >
      <IconHeart
        size={size}
        fill={active ? '#B3261E' : 'none'}
        color={active ? '#B3261E' : '#756D65'}
      />
    </button>
  );
}
