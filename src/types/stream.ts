export type StreamFormat = 'MP3' | 'AAC' | 'AAC+' | 'HLS' | 'OGG' | 'UNKNOWN';

export type StreamStatus =
  | 'PLAYBACK_VERIFIED'   // AO VIVO: reprodução real confirmada no player
  | 'STREAM_AVAILABLE'    // ONLINE: servidor acessível e stream válido
  | 'STREAM_CHECKING'     // Em validação ativa
  | 'STREAM_NOT_FOUND'    // SEM STREAM: sem stream público (apenas receptor RF)
  | 'STREAM_UNAVAILABLE'  // INDISPONÍVEL: servidor inacessível ou timeout
  | 'PLAYBACK_ERROR'      // Erro na decodificação do áudio
  | 'DISCOVERED';         // Descoberta preliminar

export interface StationStream {
  id: string;
  station_id: string;
  stream_url: string;
  protocol?: string;
  codec?: string;
  content_type?: string;
  source_url?: string;
  status: StreamStatus;
  last_checked_at?: string;
  last_successful_playback?: string;
  error_message?: string;
}

export interface StreamValidationResult {
  streamUrl: string;
  isWorking: boolean;
  status: StreamStatus;
  httpStatus?: number;
  contentType?: string;
  format: StreamFormat;
  responseTimeMs: number;
  errorMessage?: string;
  testedAt: string;
}
