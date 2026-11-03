import React, { useState } from 'react';
import { Compass, Search, MapPin, Radio, Sparkles, Filter } from 'lucide-react';
import { RadioStation } from '../../types/radio';
import { StationCard } from '../../components/radio/StationCard';
import { RadioDiscoveryEngine } from '../../services/radioDiscovery/radioDiscoveryEngine';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useFavorites } from '../../hooks/useFavorites';

const POPULAR_SEARCHES = [
  { city: 'Ipatinga', state: 'MG', lat: -19.4682, lon: -42.5367 },
  { city: 'Coronel Fabriciano', state: 'MG', lat: -19.5186, lon: -42.6311 },
  { city: 'Timóteo', state: 'MG', lat: -19.5817, lon: -42.6439 },
  { city: 'Belo Horizonte', state: 'MG', lat: -19.9208, lon: -43.9378 },
  { city: 'São Paulo', state: 'SP', lat: -23.5505, lon: -46.6333 },
  { city: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lon: -43.1729 },
];

export const ExplorePage: React.FC = () => {
  const [cityName, setCityName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMeta, setSearchMeta] = useState<any>(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentStation, isPlaying, isLoading, playStation, togglePlay } = useAudioPlayer();

  const handleSearch = async (
    targetCity: string,
    targetState: string,
    coordsOverride?: { lat: number; lon: number }
  ) => {
    if (!targetCity.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const lat = coordsOverride ? coordsOverride.lat : 0;
      const lon = coordsOverride ? coordsOverride.lon : 0;

      const result = await RadioDiscoveryEngine.discoverNearby({
        latitude: lat,
        longitude: lon,
        city: targetCity,
        state: targetState,
        forceLiveFetch: true,
      });

      setStations(result.stations);
      setSearchMeta({
        city: targetCity,
        state: targetState,
        total: result.totalFound,
        withStream: result.withStreamCount,
        streamNotFound: result.streamNotFoundCount,
        sources: result.sourcesConsulted,
      });
    } catch (e) {
      console.error('Erro na exploração por cidade:', e);
    } finally {
      setIsSearching(false);
    }
  };


  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:py-9 space-y-7">
      <div className="pb-6 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2 text-xs font-medium text-rose-500 dark:text-rose-400 mb-1.5">
          <Compass className="w-4 h-4" />
          <span>Navegação Municipal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
          Explorar Emissoras por Município
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Pesquise qualquer cidade do Brasil para acionar o motor de descoberta, encontrar emissoras com transmissão online e ouvi-las no player.
        </p>
      </div>

      {/* Search Bar & Options */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200/80 dark:border-white/[.08] rounded-[20px] p-5 sm:p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,.025)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(cityName, selectedState);
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Digite o nome da cidade (ex: Ipatinga)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#111113] border border-slate-200/80 dark:border-white/[.08] focus:border-rose-400 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-[#111113] border border-slate-200/80 dark:border-white/[.08] focus:border-rose-400 rounded-2xl text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">UF (opcional)</option>
              <option value="MG">Minas Gerais (MG)</option>
              <option value="SP">São Paulo (SP)</option>
              <option value="RJ">Rio de Janeiro (RJ)</option>
              <option value="ES">Espírito Santo (ES)</option>
              <option value="BA">Bahia (BA)</option>
              <option value="PR">Paraná (PR)</option>
              <option value="RS">Rio Grande do Sul (RS)</option>
              <option value="SC">Santa Catarina (SC)</option>
              <option value="GO">Goiás (GO)</option>
              <option value="DF">Distrito Federal (DF)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSearching || !cityName.trim()}
              className="w-full py-2 px-4 rounded-2xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isSearching ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Descobrir</span>
            </button>
          </div>
        </form>

        {/* Quick Click Preset Cities */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Atalhos rápidos:</span>
          {POPULAR_SEARCHES.map((item) => (
            <button
              key={`${item.city}-${item.state}`}
              onClick={() => {
                setCityName(item.city);
                setSelectedState(item.state);
                handleSearch(item.city, item.state, { lat: item.lat, lon: item.lon });
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors"
            >
              {item.city} ({item.state})
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {searchMeta && (
        <div className="bg-slate-100 dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>
              Resultados para <strong>{searchMeta.city}, {searchMeta.state}</strong>:
            </span>
            <span className="font-mono text-rose-500 dark:text-rose-400 font-semibold">{searchMeta.total} emissoras encontradas</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>Online: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{searchMeta.withStream}</strong></span>
            <span>Apenas RF: <strong className="text-slate-600 dark:text-slate-300 font-mono">{searchMeta.streamNotFound}</strong></span>
          </div>
        </div>
      )}

      {/* Stations List */}
      {isSearching ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Executando varredura multi-fonte para o município...</p>
        </div>
      ) : stations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              isPlaying={currentStation?.id === station.id && isPlaying}
              isLoading={currentStation?.id === station.id && isLoading}
              isFavorite={isFavorite(station.id)}
              onPlay={(st) => playStation(st, stations)}
              onTogglePlay={togglePlay}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : hasSearched ? (
        <div className="py-16 text-center bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-white/5 rounded-2xl p-8">
          <Radio className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Nenhuma emissora identificada nesta região</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Não há emissoras cadastradas para este município nas fontes consultadas. Tente outra cidade ou atualize as fontes de descoberta.
          </p>
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-slate-500 dark:text-slate-400 text-xs">
          Digite o nome de uma cidade acima ou selecione um atalho para visualizar as emissoras da região.
        </div>
      )}
    </div>
  );
};
