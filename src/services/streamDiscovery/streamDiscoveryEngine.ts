import { RadioStation } from '../../types/radio';
import { validateStream, detectStreamFormat } from '../streamValidator/streamValidator';
import { stationRepository } from '../supabase/stationRepository';
import { StreamStatus } from '../../types/stream';

export class StreamDiscoveryEngine {
  /**
   * Tests and validates the stream of a station.
   * If working, sets status to PLAYBACK_VERIFIED and persists the result.
   */
  public static async probeAndVerifyStation(
    station: RadioStation
  ): Promise<{
    station: RadioStation;
    testedUrl: string | undefined;
    isWorking: boolean;
    status: StreamStatus;
    format: string;
    errorMessage?: string;
  }> {
    if (!station.stream_url) {
      return {
        station: { ...station, stream_status: 'STREAM_NOT_FOUND' },
        testedUrl: undefined,
        isWorking: false,
        status: 'STREAM_NOT_FOUND',
        format: 'UNKNOWN',
        errorMessage: 'Nenhum endereço de áudio online associado a esta emissora.',
      };
    }

    const validation = await validateStream(station.stream_url);

    const updatedStation: RadioStation = {
      ...station,
      stream_status: validation.status,
      stream_format: validation.format,
      last_checked_at: validation.testedAt,
      last_successful_playback: validation.isWorking ? validation.testedAt : station.last_successful_playback,
    };

    // Persist status update
    await stationRepository.updateStreamStatus(
      station.id,
      validation.status,
      station.stream_url,
      validation.isWorking
    );

    return {
      station: updatedStation,
      testedUrl: station.stream_url,
      isWorking: validation.isWorking,
      status: validation.status,
      format: validation.format,
      errorMessage: validation.errorMessage,
    };
  }

  /**
   * Helper to normalize and validate a manual stream URL entered by an administrator.
   */
  public static async testManualStreamUrl(url: string) {
    const trimmed = url.trim();
    const format = detectStreamFormat(trimmed);
    const result = await validateStream(trimmed, 7000);
    return {
      url: trimmed,
      ...result,
      format: result.format || format,
    };
  }
}
