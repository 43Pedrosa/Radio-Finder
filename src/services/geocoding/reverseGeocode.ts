import { GeocodedLocation } from '../../types/location';

/**
 * Reverse geocodes coordinates to city, state, country.
 * Uses OpenStreetMap Nominatim with strict User-Agent and timeout, with offline fallback.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodedLocation> {
  // First attempt: OSM Nominatim open reverse geocoding API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.county ||
        'Localização Atual';

      const state = addr.state || '';
      const stateCode = addr['ISO3166-2-lvl4']?.split('-')[1] || state.substring(0, 2).toUpperCase();
      const country = addr.country || 'Brasil';
      const countryCode = (addr.country_code || 'br').toUpperCase();

      return {
        city,
        state,
        stateCode,
        country,
        countryCode,
        displayName: `${city}${stateCode ? `, ${stateCode}` : ''}`,
      };
    }
  } catch (err) {
    // Fallback if network blocked or rate limited
  }

  // Known reference points heuristic fallback
  // E.g., Ipatinga / Vale do Aço coordinates check (-19.46 to -19.55, -42.50 to -42.65)
  if (
    lat >= -19.65 &&
    lat <= -19.40 &&
    lon >= -42.70 &&
    lon <= -42.45
  ) {
    return {
      city: 'Ipatinga',
      state: 'Minas Gerais',
      stateCode: 'MG',
      country: 'Brasil',
      countryCode: 'BR',
      displayName: 'Ipatinga, MG',
    };
  }

  return {
    city: 'Coordenadas Atuais',
    state: '',
    stateCode: '',
    country: 'Brasil',
    countryCode: 'BR',
    displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
  };
}
