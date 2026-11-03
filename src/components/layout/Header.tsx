import React from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, LocateFixed, MapPin, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Coordinates, GeocodedLocation } from '../../types/location';
import { WeatherSnapshot } from '../../hooks/useWeather';

interface HeaderProps {
  coords: Coordinates | null;
  location: GeocodedLocation | null;
  locationLoading: boolean;
  isManualSelection: boolean;
  weather: WeatherSnapshot | null;
  weatherLoading: boolean;
  onUseCurrentLocation: () => void;
}

function WeatherIcon({ code, isDay }: { code: number; isDay: boolean }) {
  const props = { className: 'h-4 w-4 text-cyan-500 dark:text-cyan-300', strokeWidth: 1.8 };
  if (code >= 95) return <CloudLightning {...props} />;
  if (code >= 80 && code <= 82) return <CloudDrizzle {...props} />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return <CloudSnow {...props} />;
  if (code >= 51 && code <= 67) return <CloudRain {...props} />;
  if (code >= 45 && code <= 48) return <CloudFog {...props} />;
  if (code >= 1 && code <= 3) return <Cloud {...props} />;
  return isDay ? <Sun {...props} /> : <Moon {...props} />;
}

export const Header: React.FC<HeaderProps> = ({
  coords, location, locationLoading, isManualSelection, weather, weatherLoading, onUseCurrentLocation,
}) => {
  const { theme, toggleTheme } = useTheme();
  const cityLabel = location
    ? `${location.city}${location.stateCode ? `, ${location.stateCode}` : ''}`
    : locationLoading ? 'Localizando...' : 'Selecione uma cidade';

  return (
    <header className="app-header sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-2xl transition-colors dark:border-white/[.07] dark:bg-[#101012]/85">
      <div className="mx-auto grid min-h-[72px] max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2 justify-self-start transition-opacity hover:opacity-85" aria-label="Radio Finder - início">
          <span className="header-brand-mark"><span className="text-white text-[15px]">♫</span></span>
          <span className="whitespace-nowrap text-[15px] font-bold tracking-[-0.045em] text-slate-950 dark:text-white md:hidden">
            Radio Finder
          </span>
        </Link>

        <div className="flex min-w-0 items-center justify-center justify-self-center">
          <div className="location-pill flex max-w-[min(60vw,480px)] items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2 dark:border-white/[.08] dark:bg-white/[.045]">
            <MapPin className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">{cityLabel}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                {weather ? <><span title="Dados meteorológicos: Open-Meteo"><WeatherIcon code={weather.weatherCode} isDay={weather.isDay} /></span><span>{weather.temperature}°C</span><span className="hidden sm:inline">· {weather.description}</span></> : <span>{weatherLoading ? 'Atualizando clima…' : coords ? 'Clima indisponível' : 'Busque uma cidade para começar'}</span>}
              </div>
            </div>
            {(isManualSelection || !coords) && (
              <button onClick={onUseCurrentLocation} title="Voltar à minha localização atual" aria-label="Voltar à minha localização atual" className="ml-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-cyan-600 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
                <LocateFixed className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className="header-icon-button flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-slate-200/80 bg-slate-100/80 text-slate-600 transition-colors hover:bg-slate-200 dark:border-white/[.08] dark:bg-white/[.05] dark:text-slate-300 dark:hover:bg-white/10"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
