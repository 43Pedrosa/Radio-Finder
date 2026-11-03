import { StreamFormat, StreamStatus } from './stream';

export type RadioBand = 'FM' | 'AM' | 'WEB';

export type StationType = 'COMMERCIAL' | 'COMMUNITY' | 'EDUCATIONAL' | 'PUBLIC';

export type VerificationStatus = 'VERIFIED' | 'COMMUNITY' | 'PENDING_REVIEW';

export interface RadioStation {
  id: string;
  name: string;
  legal_name?: string;
  city: string;
  state: string;
  country: string;
  frequency: string;
  band: RadioBand;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  official_website?: string;
  website?: string; // alias for compatibility
  logo_url?: string;
  stream_url?: string;
  stream_format?: StreamFormat;
  station_type?: StationType;
  genre?: string;
  description?: string;
  source_name: string;
  source_url?: string;
  stream_status: StreamStatus;
  verification_status: VerificationStatus;
  is_active: boolean;
  last_checked_at?: string;
  last_successful_playback?: string;
  created_at?: string;
  updated_at?: string;
}

export type StationFilterTab = 'ALL' | 'FM' | 'AM' | 'ONLINE' | 'FAVORITES';

export interface DiscoveryOptions {
  latitude: number;
  longitude: number;
  radiusMeters?: number; // Legado: não é utilizado para filtrar resultados
  city?: string;
  state?: string;
  forceLiveFetch?: boolean;
}

export interface DiscoveryLogEntry {
  id: string;
  query_type: 'GEOLOCATION_RADIUS' | 'CITY_SEARCH' | 'MANUAL_IMPORT';
  search_term?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  stations_found: number;
  source_code: string;
  execution_time_ms: number;
  error_message?: string;
  created_at: string;
}
