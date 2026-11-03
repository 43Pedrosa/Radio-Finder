import { useState, useEffect, useCallback } from 'react';
import { RadioStation } from '../types/radio';

const FAVORITES_STORAGE_KEY = 'radio_finder_favorites_v2';
const LEGACY_IDS_KEY = 'radio_finder_favorite_ids';

function readFavorites(): RadioStation[] {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as RadioStation[];
    }
  } catch { /* storage can be unavailable */ }
  return [];
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<RadioStation[]>(readFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      localStorage.setItem(LEGACY_IDS_KEY, JSON.stringify(favorites.map((station) => station.id)));
    } catch { /* Keep the app usable if localStorage is full or blocked. */ }
  }, [favorites]);

  const favoriteIds = favorites.map((station) => station.id);
  const isFavorite = useCallback(
    (stationId: string) => favoriteIds.includes(stationId),
    [favorites]
  );

  const toggleFavorite = useCallback((station: RadioStation) => {
    setFavorites((previous) => previous.some((item) => item.id === station.id)
      ? previous.filter((item) => item.id !== station.id)
      : [...previous, station]);
  }, []);

  return { favorites, favoriteIds, isFavorite, toggleFavorite };
}
