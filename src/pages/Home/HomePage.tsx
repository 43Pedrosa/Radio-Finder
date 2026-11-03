import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { StationCard } from '../../components/radio/StationCard';
import { useNearbyStations } from '../../hooks/useNearbyStations';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useFavorites } from '../../hooks/useFavorites';
import { Coordinates, GeocodedLocation } from '../../types/location';
import { CitySearchResult, searchBrazilianCities } from '../../services/geocoding/searchCities';

interface HomePageProps {
  coords: Coordinates | null;
  geocoded: GeocodedLocation | null;
  radiusMeters: number;
  locationLoading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  coords,
  geocoded,
  radiusMeters,
  locationLoading,
}) => {
  const { currentStation, isPlaying, isLoading, playStation, togglePlay } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([]);
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState<string | null>(null);
  const [showCityResults, setShowCityResults] = useState(false);
  const [selectedSearchCity, setSelectedSearchCity] = useState<CitySearchResult | null>(null);

  // A cidade pesquisada controla somente a descoberta de rádios. GPS e clima
  // continuam vinculados exclusivamente à localização real do aparelho.
  const discoveryCoords = selectedSearchCity?.coords ?? coords;
  const discoveryCity = selectedSearchCity?.city ?? geocoded?.city;
  const discoveryState = selectedSearchCity?.stateCode ?? geocoded?.stateCode;

  const { stations, loading, error } = useNearbyStations({
    coords: discoveryCoords,
    radiusMeters,
    city: discoveryCity,
    state: discoveryState,
  });

  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 3 || /\b(r[aá]dio|fm|am|web)\b/i.test(term) || /\d{2,3}[.,]\d/.test(term)) {
      setCityResults([]);
      setCitySearchLoading(false);
      setCitySearchError(null);
      return;
    }

    const controller = new AbortController();
    setCityResults([]);
    setCitySearchLoading(false);
    const timeout = window.setTimeout(async () => {
      setCitySearchLoading(true);
      setCitySearchError(null);
      try {
        const results = await searchBrazilianCities(term, controller.signal);
        setCityResults(results);
      } catch (err) {
        if (!controller.signal.aborted) {
          setCityResults([]);
          setCitySearchError('Não foi possível pesquisar municípios agora.');
        }
      } finally {
        if (!controller.signal.aborted) setCitySearchLoading(false);
      }
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  const displayedStations = useMemo(() => {
    // Município selecionado: mostrar a lista completa daquela cidade.
    if (selectedSearchCity) return stations;
    const q = searchQuery.toLowerCase().trim().replace(',', '.');
    if (!q) return stations;
    return stations.filter((station) =>
      station.name.toLowerCase().includes(q) ||
      station.frequency.toLowerCase().includes(q) ||
      station.city.toLowerCase().includes(q)
    );
  }, [stations, searchQuery, selectedSearchCity]);

  const selectCity = (city: CitySearchResult) => {
    setSelectedSearchCity(city);
    setSearchQuery(city.city);
    setCityResults([]);
    setShowCityResults(false);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') setShowCityResults(false);
    if (event.key === 'Enter' && cityResults.length === 1) selectCity(cityResults[0]);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7 px-5 py-7 sm:px-8 lg:py-9">
      <div className="relative z-20">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowCityResults(true)}
            onChange={(event) => { setSearchQuery(event.target.value); setSelectedSearchCity(null); setShowCityResults(true); }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar rádio ou cidade..."
            aria-label="Buscar rádio ou cidade em qualquer estado do Brasil"
            aria-expanded={showCityResults && cityResults.length > 0}
            className="w-full rounded-full border border-white/[.10] bg-[#242426] py-3.5 pl-11 pr-11 text-[14px] text-white shadow-[0_2px_12px_rgba(0,0,0,.12)] transition-all placeholder:text-slate-400 focus:border-rose-400 focus:bg-[#242426] focus:outline-none focus:ring-4 focus:ring-rose-500/10"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSelectedSearchCity(null); setShowCityResults(false); }} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showCityResults && (cityResults.length > 0 || citySearchLoading || citySearchError) && (
          <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_50px_rgba(0,0,0,.12)] dark:border-white/[.08] dark:bg-[#242427]">
            <div className="border-b border-slate-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">Cidades brasileiras</div>
            {citySearchLoading && <div className="px-4 py-3 text-xs text-slate-500">Pesquisando municípios…</div>}
            {citySearchError && <div className="px-4 py-3 text-xs text-rose-500">{citySearchError}</div>}
            {!citySearchLoading && cityResults.map((city) => (
              <button key={`${city.city}-${city.stateCode}-${city.coords.latitude}`} onClick={() => selectCity(city)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70">
                <MapPin className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{city.city}</span>
                  <span className="block truncate text-xs text-slate-500">{city.state}{city.stateCode ? ` · ${city.stateCode}` : ''}</span>
                </span>
                <span className="text-[10px] text-rose-500 dark:text-rose-400">Ver rádios</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!coords && !locationLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          Não foi possível obter sua localização. Pesquise uma cidade brasileira para encontrar as rádios online daquele município.
        </div>
      )}

      {loading || locationLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-rose-500/20 border-t-rose-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{locationLoading ? 'Identificando sua localização…' : 'Buscando emissoras do município…'}</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">{error}</div>
      ) : displayedStations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {displayedStations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              isPlaying={currentStation?.id === station.id && isPlaying}
              isLoading={currentStation?.id === station.id && isLoading}
              isFavorite={isFavorite(station.id)}
              onToggleFavorite={toggleFavorite}
              onPlay={(st) => playStation(st, displayedStations)}
              onTogglePlay={togglePlay}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
          {selectedSearchCity
            ? `Nenhuma rádio online encontrada para ${selectedSearchCity.city}, ${selectedSearchCity.stateCode}.`
            : searchQuery.trim()
              ? `Nenhuma rádio encontrada para "${searchQuery}". Se a busca for por cidade, selecione uma opção na lista.`
              : coords ? `Nenhuma emissora cadastrada para ${geocoded?.city || 'esta localização'}.` : 'Pesquise uma cidade para começar.'}
        </div>
      )}
    </div>
  );
};
