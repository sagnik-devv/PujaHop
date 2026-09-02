'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Pandal } from './types';
import { getPandalById } from './api';

interface FavoritesContextType {
  favorites: number[];
  favoritePandals: Pandal[];
  toggleFavorite: (pandalId: number) => void;
  isFavorite: (pandalId: number) => boolean;
  count: number;
  isLoaded: boolean;
  clearAllFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'pujahop_favorites_v1';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoritePandals, setFavoritePandals] = useState<Pandal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load favorites from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Update full pandal objects whenever favorites array changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }

    async function loadObjects() {
      const promises = favorites.map(id => getPandalById(id));
      const results = await Promise.all(promises);
      setFavoritePandals(results.filter((p): p is Pandal => p !== null));
    }

    loadObjects();
  }, [favorites, isLoaded]);

  const toggleFavorite = (pandalId: number) => {
    setFavorites(prev => {
      if (prev.includes(pandalId)) {
        return prev.filter(id => id !== pandalId);
      } else {
        return [...prev, pandalId];
      }
    });
  };

  const isFavorite = (pandalId: number) => {
    return favorites.includes(pandalId);
  };

  const clearAllFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritePandals,
        toggleFavorite,
        isFavorite,
        count: isLoaded ? favorites.length : 0,
        isLoaded,
        clearAllFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
