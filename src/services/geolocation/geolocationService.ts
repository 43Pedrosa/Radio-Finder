import { Coordinates } from '../../types/location';

// Legacy compatibility value. Radio discovery no longer filters by radius.
export const DEFAULT_RADIO_DISCOVERY_RADIUS = Number.MAX_SAFE_INTEGER;

export interface GeolocationResult {
  coords: Coordinates;
  error?: undefined;
}

export interface GeolocationErrorResult {
  coords?: undefined;
  error: {
    code: number;
    message: string;
    type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
  };
}

/**
 * Retrieves current browser coordinates using the Geolocation API.
 * Uses high accuracy with a 10s timeout.
 */
export async function getBrowserLocation(): Promise<GeolocationResult | GeolocationErrorResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    const insecureOrigin = typeof window !== 'undefined' && !window.isSecureContext;
    return {
      error: {
        code: 0,
        message: insecureOrigin
          ? 'O GPS exige HTTPS. Acesse o aplicativo por localhost ou configure HTTPS no endereço da rede local.'
          : 'A API de Geolocalização não é suportada por este navegador.',
        type: 'NOT_SUPPORTED',
      },
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        });
      },
      (err) => {
        let errorType: GeolocationErrorResult['error']['type'] = 'POSITION_UNAVAILABLE';
        let msg = 'Não foi possível determinar sua localização atual.';

        if (err.code === err.PERMISSION_DENIED) {
          errorType = 'PERMISSION_DENIED';
          msg = 'Permissão de acesso à localização foi negada. Selecione sua cidade manualmente.';
        } else if (err.code === err.TIMEOUT) {
          errorType = 'TIMEOUT';
          msg = 'Tempo limite esgotado ao buscar localização GPS.';
        }

        resolve({
          error: {
            code: err.code,
            message: msg,
            type: errorType,
          },
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 min cache
      }
    );
  });
}
