import React from 'react';
import { Heart, Radio, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StationCard } from '../../components/radio/StationCard';
import { useFavorites } from '../../hooks/useFavorites';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

export const FavoritesPage: React.FC = () => {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { currentStation, isPlaying, isLoading, playStation, togglePlay } = useAudioPlayer();

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-5 py-7 sm:space-y-8 sm:px-8 lg:py-9">
      <section className="apple-hero relative overflow-hidden rounded-[24px] border border-white/10 px-5 py-5 sm:px-9 sm:py-10">
        <div className="relative z-10 max-w-2xl"><div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-rose-300 sm:mb-3 sm:text-xs"><Heart className="h-4 w-4 fill-current"/>Sua biblioteca</div><h1 className="text-[30px] font-bold tracking-tight text-white sm:text-4xl">Favoritos</h1><p className="mt-1.5 max-w-lg text-[13px] leading-5 text-white/65 sm:mt-2 sm:text-sm sm:leading-6">As emissoras que você salvou, reunidas em um só lugar.</p><div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80 sm:mt-5 sm:py-1.5 sm:text-xs">{favorites.length} {favorites.length === 1 ? 'emissora salva' : 'emissoras salvas'}</div></div>
        <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full bg-rose-500/25 blur-3xl"/><div className="pointer-events-none absolute right-24 -bottom-32 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl"/>
      </section>
      {favorites.length ? <section className="space-y-4"><div className="flex items-end justify-between"><div><h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Sua coleção</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Toque em uma emissora para reproduzir.</p></div></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{favorites.map((station) => <StationCard key={station.id} station={station} isPlaying={currentStation?.id === station.id && isPlaying} isLoading={currentStation?.id === station.id && isLoading} isFavorite={isFavorite(station.id)} onPlay={(item) => playStation(item, favorites)} onTogglePlay={togglePlay} onToggleFavorite={toggleFavorite}/>)}</div></section> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-white/10 dark:bg-white/[.03]"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500"><Heart className="h-7 w-7"/></div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sua coleção começa aqui</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Toque no coração de qualquer emissora para guardá-la nesta biblioteca.</p><Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-400"><Radio className="h-4 w-4"/>Explorar rádios<ArrowRight className="h-4 w-4"/></Link></div>}
    </div>
  );
};
