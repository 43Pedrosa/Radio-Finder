import React from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, RotateCw, SkipBack, SkipForward } from 'lucide-react';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

export const PersistentPlayer: React.FC = () => {
  const { currentStation, isPlaying, isLoading, error, volume, isMuted, togglePlay, setVolume, toggleMute, retryPlayback, nextStation, prevStation, stationQueue } = useAudioPlayer();
  if (!currentStation) return null;
  const hasQueue = stationQueue.filter((station) => Boolean(station.stream_url)).length > 1;

  return (
    <aside aria-label="Player de áudio" className="apple-player fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#171719]/90 text-white shadow-[0_-8px_36px_rgba(0,0,0,.22)] backdrop-blur-2xl">
      {error && <div className="flex items-center justify-between gap-3 border-b border-rose-400/20 bg-rose-950/70 px-4 py-2 text-xs text-rose-100"><div className="flex min-w-0 items-center gap-2 truncate"><AlertCircle className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{error}</span></div><button onClick={retryPlayback} className="flex shrink-0 items-center gap-1 text-rose-200 hover:text-white"><RotateCw className="h-3 w-3"/>Reconectar</button></div>}
      <div className="mx-auto grid h-[82px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 shadow-lg shadow-rose-950/20 sm:flex"><span className="text-lg font-black text-white">♫</span></div>
          <div className="min-w-0"><h4 className="truncate text-[13px] font-semibold tracking-tight text-white">{currentStation.name}</h4><p className="truncate text-[11px] text-white/55">{currentStation.frequency} {currentStation.band} <span className="px-1">·</span>{currentStation.city}{currentStation.state ? `, ${currentStation.state}` : ''}</p></div>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <button onClick={prevStation} disabled={!hasQueue} aria-label="Rádio anterior" title="Rádio anterior" className="player-skip"><SkipBack className="h-[18px] w-[18px] fill-current"/></button>
          <button onClick={togglePlay} disabled={isLoading} aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#17171b] shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-60">{isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/> : isPlaying ? <Pause className="h-5 w-5 fill-current"/> : <Play className="ml-0.5 h-5 w-5 fill-current"/>}</button>
          <button onClick={nextStation} disabled={!hasQueue} aria-label="Próxima rádio" title="Próxima rádio" className="player-skip"><SkipForward className="h-[18px] w-[18px] fill-current"/></button>
        </div>
        <div className="flex items-center justify-end gap-2"><button onClick={toggleMute} aria-label={isMuted ? 'Ativar som' : 'Desativar som'} className="text-white/60 transition hover:text-white">{isMuted || volume === 0 ? <VolumeX className="h-4 w-4"/> : <Volume2 className="h-4 w-4"/>}</button><input type="range" min="0" max="1" step="0.02" value={isMuted ? 0 : volume} onChange={(event) => setVolume(parseFloat(event.target.value))} className="h-1 w-16 cursor-pointer accent-rose-400 sm:w-24" aria-label="Controle de volume"/></div>
      </div>
    </aside>
  );
};
