export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeocodedLocation {
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  displayName: string;
}

export interface UserLocationState {
  coords: Coordinates | null;
  geocoded: GeocodedLocation | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
  isManualSelection: boolean;
}

export interface CityCatalogItem {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
}
