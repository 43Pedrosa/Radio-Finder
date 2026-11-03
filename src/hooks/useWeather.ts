import { useEffect, useState } from 'react';
import { Coordinates } from '../types/location';

export interface WeatherSnapshot {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
}

const WEATHER_LABELS: Record<number, string> = {
  0: 'Céu limpo', 1: 'Predominantemente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Neblina', 48: 'Neblina com geada', 51: 'Garoa leve', 53: 'Garoa moderada',
  55: 'Garoa intensa', 56: 'Garoa congelante', 57: 'Garoa congelante intensa',
  61: 'Chuva fraca', 63: 'Chuva moderada', 65: 'Chuva forte', 66: 'Chuva congelante',
  67: 'Chuva congelante intensa', 71: 'Neve fraca', 73: 'Neve moderada', 75: 'Neve forte',
  77: 'Grãos de neve', 80: 'Pancadas fracas', 81: 'Pancadas moderadas', 82: 'Pancadas fortes',
  85: 'Pancadas de neve', 86: 'Pancadas fortes de neve', 95: 'Trovoada',
  96: 'Trovoada com granizo', 99: 'Trovoada forte com granizo',
};

export function useWeather(coords: Coordinates | null) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) {
      setWeather(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setWeather(null);
    setLoading(true);
    const cacheKey = `radio_finder_weather_${coords.latitude.toFixed(2)}_${coords.longitude.toFixed(2)}`;
    let cached: string | null = null;
    try { cached = sessionStorage.getItem(cacheKey); } catch { /* storage may be unavailable */ }
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.savedAt < 15 * 60 * 1000) {
          setWeather(parsed.value);
          setLoading(false);
          return () => controller.abort();
        }
      } catch { /* ignore invalid cache */ }
    }

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          latitude: String(coords.latitude), longitude: String(coords.longitude),
          current: 'temperature_2m,weather_code,is_day', timezone: 'auto',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Weather API ${response.status}`);
        const data = await response.json();
        const current = data.current;
        const code = Number(current.weather_code);
        const value: WeatherSnapshot = {
          temperature: Math.round(Number(current.temperature_2m)),
          weatherCode: code,
          isDay: Boolean(current.is_day),
          description: WEATHER_LABELS[code] || 'Condição atual',
        };
        setWeather(value);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ value, savedAt: Date.now() })); } catch { /* cache is optional */ }
      } catch (error) {
        if (!controller.signal.aborted) setWeather(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [coords?.latitude, coords?.longitude]);

  return { weather, loading };
}
