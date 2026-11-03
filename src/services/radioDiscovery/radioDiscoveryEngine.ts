import { RadioStation, DiscoveryOptions } from '../../types/radio';
import { stationRepository } from '../supabase/stationRepository';
import { fetchFromRadioBrowserByCity } from './sources/radioBrowserSource';
import { fetchFromDialTunerByCity } from './sources/dialTunerSource';
import { deduplicateStations } from '../../utils/deduplication';
import { calculateDistanceMeters } from '../../utils/distance';

export class RadioDiscoveryEngine {
  /** Descobre emissoras por município; distância nunca é critério de exclusão. */
  public static async discoverNearby(options: DiscoveryOptions) {
    const startTime = Date.now();
    const { latitude, longitude, city, state } = options;
    const sourcesConsulted = ['Catálogo local'];

    if (!city?.trim()) {
      return { stations: [], totalFound: 0, withStreamCount: 0, streamNotFoundCount: 0, sourcesConsulted };
    }

    const localPromise = stationRepository.getByCity(city, state);
    const [localResult, radioBrowserResult, dialTunerResult] = await Promise.allSettled([
      localPromise,
      fetchFromRadioBrowserByCity(city, state, 'BR'),
      fetchFromDialTunerByCity(city, state),
    ]);

    const localStations = localResult.status === 'fulfilled' ? localResult.value : [];
    const browserStations = radioBrowserResult.status === 'fulfilled' ? radioBrowserResult.value : [];
    const dialTunerStations = dialTunerResult.status === 'fulfilled' ? dialTunerResult.value : [];

    sourcesConsulted.push('Radio Browser');
    sourcesConsulted.push('DialTuner API pública');
    if (localResult.status === 'rejected') console.warn('Catálogo local indisponível:', localResult.reason);
    if (radioBrowserResult.status === 'rejected') console.warn('Radio Browser indisponível:', radioBrowserResult.reason);
    if (dialTunerResult.status === 'rejected') console.warn('DialTuner indisponível:', dialTunerResult.reason);

    // Diretório de rádios online: outorgas FM/AM sem URL de áudio não entram na lista.
    const combined = deduplicateStations([...localStations, ...browserStations, ...dialTunerStations])
      .filter((station) => Boolean(station.stream_url))
      .filter((station) => {
        const stationCity = station.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const requested = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        return stationCity === requested;
      })
      .map((station) => ({
        ...station,
        distanceMeters: latitude != null && longitude != null && (latitude !== 0 || longitude !== 0) && station.latitude && station.longitude
          ? calculateDistanceMeters(latitude, longitude, station.latitude, station.longitude)
          : undefined,
      }))
      .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));

    const withStreamCount = combined.length;
    const streamNotFoundCount = 0;

    void stationRepository.logDiscovery({
      query_type: 'CITY_SEARCH',
      search_term: `${city}, ${state || ''}`,
      latitude,
      longitude,
      radius_meters: undefined,
      stations_found: combined.length,
      source_code: sourcesConsulted.join('; '),
      execution_time_ms: Date.now() - startTime,
    });

    return {
      stations: combined,
      totalFound: combined.length,
      withStreamCount,
      streamNotFoundCount,
      sourcesConsulted,
    };
  }
}
