import { useState, useEffect, useCallback } from 'react';
import { Coordinates, GeocodedLocation, UserLocationState } from '../types/location';
import { getBrowserLocation, DEFAULT_RADIO_DISCOVERY_RADIUS } from '../services/geolocation/geolocationService';
import { reverseGeocode } from '../services/geocoding/reverseGeocode';

const STORAGE_KEY_LOCATION = 'radio_finder_cached_location';
const STORAGE_KEY_RADIUS = 'radio_finder_radius_meters';

export function useLocation() {
  const [state, setState] = useState<UserLocationState>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          coords: parsed.coords,
          geocoded: parsed.geocoded,
          // Cache é temporário: a localização real será atualizada pelo GPS.
          loading: true,
          error: null,
          permissionStatus: 'granted',
          isManualSelection: false,
        };
      }
    } catch (e) {
      // Ignore
    }

    return {
      coords: null,
      geocoded: null,
      loading: true,
      error: null,
      permissionStatus: 'prompt',
      isManualSelection: false,
    };
  });

  const [radiusMeters, setRadiusMetersState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RADIUS);
      return saved ? parseInt(saved, 10) : DEFAULT_RADIO_DISCOVERY_RADIUS;
    } catch (e) {
      return DEFAULT_RADIO_DISCOVERY_RADIUS;
    }
  });

  const setRadiusMeters = useCallback((radius: number) => {
    setRadiusMetersState(radius);
    try {
      localStorage.setItem(STORAGE_KEY_RADIUS, radius.toString());
    } catch (e) {
      // Ignore
    }
  }, []);

  const requestGpsLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const res = await getBrowserLocation();

    if (res.error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: res.error.message,
        permissionStatus: res.error.type === 'PERMISSION_DENIED' ? 'denied' : 'unavailable',
        // Never substitute a fixed city for the user's real location. Keep a valid cached location if one exists.
        coords: prev.coords,
        geocoded: prev.geocoded,
      }));
      return;
    }

    const { latitude, longitude } = res.coords;
    const geocoded = await reverseGeocode(latitude, longitude);

    const newState: UserLocationState = {
      coords: res.coords,
      geocoded,
      loading: false,
      error: null,
      permissionStatus: 'granted',
      isManualSelection: false,
    };

    setState(newState);

    try {
      localStorage.setItem(
        STORAGE_KEY_LOCATION,
        JSON.stringify({
          coords: res.coords,
          geocoded,
          isManualSelection: false,
        })
      );
    } catch (e) {
      // Ignore
    }
  }, []);

  // Manual city selection (e.g. for testing Ipatinga, Belo Horizonte, São Paulo, etc.)
  const setManualLocation = useCallback(
    (city: string, stateCode: string, coords: Coordinates, stateName?: string) => {
      const geocoded: GeocodedLocation = {
        city,
        state: stateName || stateCode,
        stateCode,
        country: 'Brasil',
        countryCode: 'BR',
        displayName: `${city}, ${stateCode}`,
      };

      const newState: UserLocationState = {
        coords,
        geocoded,
        loading: false,
        error: null,
        permissionStatus: 'granted',
        isManualSelection: true,
      };

      setState(newState);

      try {
        localStorage.setItem(
          STORAGE_KEY_LOCATION,
          JSON.stringify({
            coords,
            geocoded,
            isManualSelection: true,
          })
        );
      } catch (e) {
        // Ignore
      }
    },
    []
  );

  // Auto-request location on first load if no cached location exists
  useEffect(() => {
    if (state.loading) {
      requestGpsLocation();
    }
  }, [state.loading, requestGpsLocation]);

  return {
    coords: state.coords,
    geocoded: state.geocoded,
    loading: state.loading,
    error: state.error,
    permissionStatus: state.permissionStatus,
    isManualSelection: state.isManualSelection,
    radiusMeters,
    setRadiusMeters,
    requestGpsLocation,
    setManualLocation,
  };
}
