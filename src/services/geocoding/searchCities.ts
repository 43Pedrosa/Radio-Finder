import { Coordinates, GeocodedLocation } from '../../types/location';

export interface CitySearchResult {
  city: string;
  state: string;
  stateCode: string;
  country: string;
  coords: Coordinates;
  displayName: string;
}

const STATE_CODES: Record<string, string> = {
  Acre: 'AC', Alagoas: 'AL', Amapá: 'AP', Amazonas: 'AM', Bahia: 'BA',
  Ceará: 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', Goiás: 'GO',
  Maranhão: 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', Pará: 'PA', Paraíba: 'PB', Paraná: 'PR', Pernambuco: 'PE',
  Piauí: 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', Rondônia: 'RO', Roraima: 'RR', 'Santa Catarina': 'SC',
  'São Paulo': 'SP', Sergipe: 'SE', Tocantins: 'TO',
};

function normalizeCityResult(item: any): CitySearchResult | null {
  if (item.country_code !== 'BR' || !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return null;
  const state = item.admin1 || '';
  const stateCode = item.admin1_code?.split('-').pop()?.toUpperCase() || STATE_CODES[state] || '';
  const city = item.name || item.admin2 || item.admin3;
  if (!city) return null;
  return {
    city,
    state,
    stateCode,
    country: 'Brasil',
    coords: { latitude: Number(item.latitude), longitude: Number(item.longitude) },
    displayName: `${city}${stateCode ? `, ${stateCode}` : ''}`,
  };
}

export async function searchBrazilianCities(query: string, signal?: AbortSignal): Promise<CitySearchResult[]> {
  const stateFilter = query.trim().match(/,\s*([A-Za-z]{2})$/)?.[1]?.toUpperCase();
  const term = query.trim().replace(/,\s*[A-Za-z]{2}$/, '').trim();
  if (term.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name: term, count: '10', language: 'pt', format: 'json', countryCode: 'BR' }).toString();
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Falha na busca de cidades (${response.status})`);
  const data = await response.json();
  let results = (data.results || [])
    .map(normalizeCityResult)
    .filter((item: CitySearchResult | null): item is CitySearchResult => Boolean(item));

  // Fallback for smaller Brazilian municipalities not indexed by the primary geocoder.
  // This is a user-triggered request, debounced by the search UI.
  if (results.length === 0) {
    const fallbackUrl = new URL('https://nominatim.openstreetmap.org/search');
    fallbackUrl.search = new URLSearchParams({
      q: `${term}, Brasil`, format: 'jsonv2', addressdetails: '1', limit: '8', countrycodes: 'br',
    }).toString();
    const fallbackResponse = await fetch(fallbackUrl, {
      signal,
      headers: { Accept: 'application/json', 'Accept-Language': 'pt-BR,pt;q=0.9' },
    });
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      results = (fallbackData || []).map((item: any): CitySearchResult | null => {
        const address = item.address || {};
        const cityName = address.city || address.town || address.municipality || address.village || address.county || item.name;
        const state = address.state || '';
        const stateCode = address['ISO3166-2-lvl4']?.split('-').pop()?.toUpperCase() || STATE_CODES[state] || '';
        if (!cityName || !Number.isFinite(Number(item.lat)) || !Number.isFinite(Number(item.lon))) return null;
        return {
          city: cityName, state, stateCode, country: 'Brasil',
          coords: { latitude: Number(item.lat), longitude: Number(item.lon) },
          displayName: `${cityName}${stateCode ? `, ${stateCode}` : ''}`,
        };
      }).filter((item: CitySearchResult | null): item is CitySearchResult => Boolean(item));
    }
  }

  if (stateFilter) results = results.filter((item) => item.stateCode === stateFilter);

  const unique = new Map<string, CitySearchResult>();
  for (const item of results) unique.set(`${item.city.toLowerCase()}-${item.stateCode}`, item);
  return [...unique.values()].slice(0, 8);
}

export function toGeocodedLocation(city: CitySearchResult): GeocodedLocation {
  return {
    city: city.city,
    state: city.state,
    stateCode: city.stateCode,
    country: city.country,
    countryCode: 'BR',
    displayName: city.displayName,
  };
}
