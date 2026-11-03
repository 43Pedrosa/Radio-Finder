import React, { useState } from 'react';
import { X, MapPin, Navigation, Search, Check } from 'lucide-react';
import { Coordinates } from '../../types/location';

interface CityOption {
  city: string;
  state: string;
  stateCode: string;
  coords: Coordinates;
  isPopular?: boolean;
}

const PRESET_CITIES: CityOption[] = [
  {
    city: 'Ipatinga',
    state: 'Minas Gerais',
    stateCode: 'MG',
    coords: { latitude: -19.4682, longitude: -42.5367 },
    isPopular: true,
  },
  {
    city: 'Coronel Fabriciano',
    state: 'Minas Gerais',
    stateCode: 'MG',
    coords: { latitude: -19.5186, longitude: -42.6311 },
    isPopular: true,
  },
  {
    city: 'Timóteo',
    state: 'Minas Gerais',
    stateCode: 'MG',
    coords: { latitude: -19.5817, longitude: -42.6439 },
    isPopular: true,
  },
  {
    city: 'Belo Horizonte',
    state: 'Minas Gerais',
    stateCode: 'MG',
    coords: { latitude: -19.9208, longitude: -43.9378 },
    isPopular: true,
  },
  {
    city: 'São Paulo',
    state: 'São Paulo',
    stateCode: 'SP',
    coords: { latitude: -23.5505, longitude: -46.6333 },
    isPopular: true,
  },
  {
    city: 'Rio de Janeiro',
    state: 'Rio de Janeiro',
    stateCode: 'RJ',
    coords: { latitude: -22.9068, longitude: -43.1729 },
    isPopular: true,
  },
  {
    city: 'Curitiba',
    state: 'Paraná',
    stateCode: 'PR',
    coords: { latitude: -25.4284, longitude: -49.2733 },
    isPopular: false,
  },
  {
    city: 'Governador Valadares',
    state: 'Minas Gerais',
    stateCode: 'MG',
    coords: { latitude: -18.8511, longitude: -41.9495 },
    isPopular: false,
  },
];

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity?: string;
  onSelectCity: (city: string, stateCode: string, coords: Coordinates) => void;
  onUseGps: () => void;
  isGpsLoading: boolean;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  onSelectCity,
  onUseGps,
  isGpsLoading,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = PRESET_CITIES.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.city.toLowerCase().includes(q) ||
      item.state.toLowerCase().includes(q) ||
      item.stateCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#0d131f] border border-slate-800 shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold font-display">Definir Localização</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS automatic locator button */}
        <div className="mt-4">
          <button
            onClick={() => {
              onUseGps();
              onClose();
            }}
            disabled={isGpsLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-medium text-xs transition-colors"
          >
            {isGpsLoading ? (
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>Usar minha localização GPS exata</span>
          </button>
        </div>

        {/* Search input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar município..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-white placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Cities list */}
        <div className="mt-3 max-h-60 overflow-y-auto space-y-1 pr-1">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const isSelected = currentCity?.toLowerCase().includes(item.city.toLowerCase());
              return (
                <button
                  key={`${item.city}-${item.stateCode}`}
                  onClick={() => {
                    onSelectCity(item.city, item.stateCode, item.coords);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-800/80 text-cyan-200'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-white">{item.city}</span>
                    <span className="text-slate-400 ml-1.5 font-mono text-[11px]">— {item.stateCode}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              );
            })
          ) : (
            <p className="py-6 text-center text-xs text-slate-500">
              Nenhum município cadastrado na lista rápida.
            </p>
          )}
        </div>

        {/* Radius note */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
          Ao escolher uma cidade, o sistema buscará as rádios cadastradas nesse município, sem limite de distância.
        </div>
      </div>
    </div>
  );
};
