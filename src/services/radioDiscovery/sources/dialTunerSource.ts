import { RadioStation } from '../../../types/radio';
import { detectStreamFormat } from '../../streamValidator/streamValidator';

const API_BASE = '/api/dialtuner';

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();

const STATE_CODES: Record<string, string> = { 'acre':'AC','alagoas':'AL','amapa':'AP','amazonas':'AM','bahia':'BA','ceara':'CE','distrito federal':'DF','espirito santo':'ES','goias':'GO','maranhao':'MA','mato grosso':'MT','mato grosso do sul':'MS','minas gerais':'MG','para':'PA','paraiba':'PB','parana':'PR','pernambuco':'PE','piaui':'PI','rio de janeiro':'RJ','rio grande do norte':'RN','rio grande do sul':'RS','rondonia':'RO','roraima':'RR','santa catarina':'SC','sao paulo':'SP','sergipe':'SE','tocantins':'TO' };

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
};

/**
 * DialTuner publica uma API de consulta de rádios brasileiras por nome/cidade.
 * A busca é feita por município e os resultados são filtrados novamente para
 * evitar misturar emissoras de cidades vizinhas ou apenas do mesmo estado.
 */
export async function fetchFromDialTunerByCity(city: string, stateCode?: string): Promise<RadioStation[]> {
  const requestedCity = normalize(city);
  if (!requestedCity) return [];

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('q', city);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`DialTuner respondeu ${response.status}`);

    const payload = await response.json();
    const rows: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results) ? payload.results
      : Array.isArray(payload?.stations) ? payload.stations
      : Array.isArray(payload?.data) ? payload.data
      : [];

    return rows.flatMap((item): RadioStation[] => {
      const stationCity = firstString(item.city, item.municipality, item.location_city, item.locality);
      const stationState = firstString(item.state_code, item.uf, item.state, item.region);
      if (!stationCity || normalize(stationCity) !== requestedCity) return [];
      if (stateCode && stationState) {
        const normalizedState = normalize(stationState);
        const resolvedCode = STATE_CODES[normalizedState] || normalizedState.toUpperCase();
        if (resolvedCode !== stateCode.toUpperCase()) return [];
      }

      const streamUrl = firstString(item.stream_url, item.stream, item.url_stream, item.audio_url, item.url);
      if (!streamUrl) return [];
      let parsedUrl: URL;
      try { parsedUrl = new URL(streamUrl); } catch { return []; }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) return [];

      const name = firstString(item.name, item.station_name, item.title) || 'Rádio online';
      const frequency = firstString(item.frequency, item.freq) || 'Online';
      const id = String(item.id ?? item.station_id ?? `dialtuner-${normalize(name)}-${requestedCity}`);
      const website = firstString(item.website, item.homepage, item.site);
      const logo = firstString(item.logo, item.logo_url, item.favicon, item.image);
      const codec = firstString(item.codec, item.format);
      const lat = Number(item.latitude ?? item.lat);
      const lon = Number(item.longitude ?? item.lon ?? item.lng);

      return [{
        id: `dialtuner-${id}`,
        name,
        city: stationCity,
        state: stateCode || STATE_CODES[normalize(stationState)] || stationState || '',
        country: 'BR',
        frequency,
        band: /\d{2,3}(?:[.,]\d)?/.test(frequency) ? 'FM' : 'WEB',
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lon) ? lon : 0,
        official_website: website,
        website,
        logo_url: logo,
        stream_url: streamUrl,
        stream_format: detectStreamFormat(streamUrl, codec),
        genre: firstString(item.genre, item.category, item.style) || 'Rádio online',
        description: 'Emissora encontrada no diretório público DialTuner. A reprodução será confirmada pelo player.',
        source_name: 'DialTuner API pública',
        source_url: `https://www.dialtuner.com.br/`,
        stream_status: 'DISCOVERED',
        verification_status: 'COMMUNITY',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    });
  } finally {
    window.clearTimeout(timeout);
  }
}
