import { RadioStation } from '../../../types/radio';
import { detectStreamFormat } from '../../streamValidator/streamValidator';

const RADIO_BROWSER_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
  ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

/**
 * Radio Browser não possui campo municipal padronizado: o campo `state` representa
 * uma subdivisão/área e frequentemente contém o estado, não a cidade. Por isso
 * consultamos pelo estado e só aceitamos o resultado quando a cidade aparece nos
 * metadados textuais do registro. A fonte complementar DialTuner cobre buscas com
 * campo municipal próprio.
 */
export async function fetchFromRadioBrowserByCity(city: string, stateCode?: string, countryCode = 'BR'): Promise<RadioStation[]> {
  const requestedCity = normalize(city);
  if (!requestedCity) return [];
  const stateName = STATE_NAMES[String(stateCode || '').toUpperCase()];
  const all: RadioStation[] = [];

  for (const mirror of RADIO_BROWSER_MIRRORS) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    try {
      const params = new URLSearchParams({
        countrycode: countryCode,
        hidebroken: 'true',
        limit: '10000',
        order: 'votes',
        reverse: 'true',
      });
      if (stateName) params.set('state', stateName);
      const response = await fetch(`${mirror}/json/stations/search?${params}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) continue;
      const data: any = await response.json();
      if (!Array.isArray(data)) continue;

      const matching = data.filter((item: any) => {
        const searchable = normalize([
          item.state, item.name, item.tags, item.homepage, item.favicon,
          item.url, item.url_resolved,
        ].filter(Boolean).join(' '));
        return searchable.includes(requestedCity);
      });

      for (const item of matching) {
        const streamUrl = String(item.url_resolved || item.url || '').trim();
        if (!streamUrl) continue;
        const lat = Number(item.geo_lat);
        const lon = Number(item.geo_long);
        const frequencyMatch = String(item.name || '').match(/\b(\d{2,3}(?:[.,]\d)?)\s*(?:FM|AM)\b/i);
        const tags = Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags || 'Rádio online');
        const name = String(item.name || 'Rádio online');
        const isAm = /\bAM\b/i.test(`${name} ${tags}`);
        all.push({
          id: `radiobrowser-${item.stationuuid || streamUrl}`,
          name,
          city,
          state: stateCode || String(item.state || ''),
          country: countryCode,
          frequency: frequencyMatch?.[1]?.replace(',', '.') || 'Online',
          band: frequencyMatch ? (isAm ? 'AM' : 'FM') : 'WEB',
          latitude: Number.isFinite(lat) ? lat : 0,
          longitude: Number.isFinite(lon) ? lon : 0,
          website: item.homepage || undefined,
          official_website: item.homepage || undefined,
          logo_url: item.favicon || undefined,
          stream_url: streamUrl,
          stream_format: detectStreamFormat(streamUrl, item.codec),
          genre: tags,
          description: 'Encontrada no catálogo comunitário Radio Browser. A reprodução será confirmada pelo player.',
          source_name: 'Radio Browser',
          source_url: item.stationuuid ? `${mirror}/json/stations/byuuid/${item.stationuuid}` : mirror,
          stream_status: 'DISCOVERED',
          verification_status: 'COMMUNITY',
          is_active: true,
          last_checked_at: item.lastchecktime || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      if (all.length) break;
    } catch {
      // Tenta outro espelho.
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return all;
}
