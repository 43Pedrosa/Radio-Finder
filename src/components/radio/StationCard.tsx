import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { RadioStation } from '../../types/radio';

interface StationCardProps {
  station: RadioStation;
  isPlaying: boolean;
  isLoading: boolean;
  isFavorite?: boolean;
  onPlay: (station: RadioStation) => void;
  onTogglePlay: () => void;
  onToggleFavorite?: (station: RadioStation) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  isPlaying,
  isLoading,
  onPlay,
  onTogglePlay,
  isFavorite = false,
  onToggleFavorite,
}) => {
  // DISCOVERED significa que há uma URL candidata, ainda não validada.
  // Permite ao usuário testá-la; não a apresenta falsamente como 'Ao vivo'.
  const hasStream = Boolean(
    station.stream_url && station.stream_status !== 'STREAM_NOT_FOUND'
  );
  const isVerified = station.stream_status === 'PLAYBACK_VERIFIED' || station.stream_status === 'STREAM_AVAILABLE';

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onTogglePlay();
    } else {
      onPlay(station);
    }
  };

  return (
    <div
      onClick={hasStream ? handlePlayClick : undefined}
      className={`station-card group relative rounded-[18px] px-4 py-[18px] transition-all duration-200 border flex items-center justify-between gap-3 ${
        hasStream ? 'cursor-pointer' : 'cursor-default'
      } ${
        isPlaying
          ? 'bg-rose-50/90 dark:bg-[#281b20] border-rose-300/80 dark:border-rose-400/30 shadow-[0_8px_28px_rgba(190,24,93,.08)]'
          : 'bg-white dark:bg-[#1c1c1e] hover:bg-slate-50 dark:hover:bg-[#242427] border-slate-200/75 dark:border-white/[.075] shadow-[0_2px_12px_rgba(0,0,0,.025)] hover:shadow-[0_8px_24px_rgba(0,0,0,.06)]'
      }`}
    >
      {/* Station Information */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
            {station.name}
          </h3>
          {isPlaying && (
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
        </div>

        {/* Frequency · City · Status */}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
            {station.frequency} {station.band}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span className="truncate">{station.city}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>

          {isVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Áudio confirmado</span>
            </span>
          ) : hasStream ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400">Stream encontrado · testar</span>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Sem stream
            </span>
          )}
        </div>
      </div>

      {/* Favorite + Play controls */}
      <div className="shrink-0 flex items-center gap-2">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onToggleFavorite(station); }}
            aria-label={isFavorite ? `Remover ${station.name} dos favoritos` : `Adicionar ${station.name} aos favoritos`}
            aria-pressed={isFavorite}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${isFavorite ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10'}`}
          >
            <Heart className={`h-[18px] w-[18px] ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
        {hasStream ? (
          <button
            onClick={handlePlayClick}
            disabled={isLoading}
            aria-label={isPlaying ? `Pausar ${station.name}` : `Testar reprodução de ${station.name}`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm ${
              isPlaying
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 hover:bg-rose-500 text-slate-700 hover:text-white dark:bg-white/[.08] dark:hover:bg-rose-500 dark:text-slate-200 dark:hover:text-white'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2 py-1 select-none">
            Sem stream
          </span>
        )}
      </div>
    </div>
  );
};
