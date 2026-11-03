import React from 'react';
import { Search } from 'lucide-react';
import { StationFilterTab } from '../../types/radio';

interface StationFiltersProps {
  activeFilter: StationFilterTab;
  onSelectFilter: (tab: StationFilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    fm: number;
    am: number;
    online: number;
    favorites: number;
  };
}

export const StationFilters: React.FC<StationFiltersProps> = ({
  activeFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  const tabs: { id: StationFilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'Todas', count: counts.all },
    { id: 'FM', label: 'FM', count: counts.fm },
    { id: 'AM', label: 'AM', count: counts.am },
    { id: 'ONLINE', label: 'Com Stream', count: counts.online },
    { id: 'FAVORITES', label: 'Favoritas', count: counts.favorites },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Segmented Filter Control */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono ${
                  isActive ? 'text-slate-900/80 font-bold' : 'text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Instant Search Filter */}
      <div className="relative min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filtrar por nome ou dial..."
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 placeholder:text-slate-400 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
};
