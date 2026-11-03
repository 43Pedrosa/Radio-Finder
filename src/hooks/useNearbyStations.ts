import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RadioStation, StationFilterTab } from '../types/radio';
import { Coordinates } from '../types/location';
import { RadioDiscoveryEngine } from '../services/radioDiscovery/radioDiscoveryEngine';

interface UseNearbyStationsOptions {
  coords: Coordinates | null;
  radiusMeters: number;
  city?: string;
  state?: string;
  favoriteIds?: string[];
}

export function useNearbyStations({
  coords,
  radiusMeters,
  city,
  state,
  favoriteIds = [],
}: UseNearbyStationsOptions) {
  const [stations, setStations] = useState<RadioStation[]>([]);
  // Identifica a requisição mais recente para ignorar respostas antigas.
  const requestSequence = useRef(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StationFilterTab>('ALL');
  const [sourcesConsulted, setSourcesConsulted] = useState<string[]>([]);
  const [discoveryStats, setDiscoveryStats] = useState({
    totalFound: 0,
    withStreamCount: 0,
    streamNotFoundCount: 0,
  });

  const fetchNearby = useCallback(
    async (forceLive = false) => {
      const requestId = ++requestSequence.current;
      if (!coords) {
        setStations([]);
        setSourcesConsulted([]);
        setDiscoveryStats({ totalFound: 0, withStreamCount: 0, streamNotFoundCount: 0 });
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await RadioDiscoveryEngine.discoverNearby({
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusMeters,
          city,
          state,
          forceLiveFetch: forceLive,
        });

        if (requestId !== requestSequence.current) return;
        setStations(result.stations);
        setSourcesConsulted(result.sourcesConsulted);
        setDiscoveryStats({
          totalFound: result.totalFound,
          withStreamCount: result.withStreamCount,
          streamNotFoundCount: result.streamNotFoundCount,
        });
      } catch (err: unknown) {
        if (requestId !== requestSequence.current) return;
        console.error('Erro na descoberta de estações próximas:', err);
        setError('Ocorreu um erro ao pesquisar emissoras na sua região.');
      } finally {
        if (requestId === requestSequence.current) setLoading(false);
      }
    },
    [coords, radiusMeters, city, state]
  );

  useEffect(() => {
    fetchNearby(false);
    return () => {
      requestSequence.current += 1;
    };
  }, [fetchNearby]);

  // Apply active tab filters
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      if (activeFilter === 'FM') return station.band === 'FM';
      if (activeFilter === 'AM') return station.band === 'AM';
      if (activeFilter === 'ONLINE') {
        return (
          (station.stream_status === 'PLAYBACK_VERIFIED' || station.stream_status === 'STREAM_AVAILABLE') &&
          Boolean(station.stream_url)
        );
      }
      if (activeFilter === 'FAVORITES') return favoriteIds.includes(station.id);
      return true; // 'ALL'
    });
  }, [stations, activeFilter, favoriteIds]);

  return {
    stations: filteredStations,
    rawStations: stations,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    refreshDiscovery: () => fetchNearby(true),
    sourcesConsulted,
    discoveryStats,
  };
}
