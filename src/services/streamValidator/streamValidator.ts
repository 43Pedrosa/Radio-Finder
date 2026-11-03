import { StreamFormat, StreamStatus, StreamValidationResult } from '../../types/stream';

// Cache to avoid aggressive re-validation within short timeframes (5 minutes)
const validationCache = new Map<string, StreamValidationResult>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function detectStreamFormat(url: string, contentType?: string): StreamFormat {
  const lowerUrl = url.toLowerCase();
  const lowerType = (contentType || '').toLowerCase();

  if (
    lowerUrl.includes('.m3u8') ||
    lowerType.includes('application/x-mpegurl') ||
    lowerType.includes('vnd.apple.mpegurl')
  ) {
    return 'HLS';
  }
  if (
    lowerUrl.includes('.aac') ||
    lowerType.includes('audio/aac') ||
    lowerType.includes('audio/aacp')
  ) {
    return lowerType.includes('aacp') ? 'AAC+' : 'AAC';
  }
  if (lowerUrl.includes('.ogg') || lowerType.includes('audio/ogg')) {
    return 'OGG';
  }
  if (lowerUrl.includes('.mp3') || lowerType.includes('audio/mpeg')) {
    return 'MP3';
  }
  return 'MP3';
}

/**
 * StreamValidator: performs technical validation of live audio streams.
 * Tests network availability, audio player decodability, latency and browser compatibility.
 */
export async function validateStream(
  streamUrl: string,
  timeoutMs = 7000
): Promise<StreamValidationResult> {
  if (!streamUrl || typeof streamUrl !== 'string' || !streamUrl.trim()) {
    return {
      streamUrl: '',
      isWorking: false,
      status: 'STREAM_NOT_FOUND',
      format: 'UNKNOWN',
      responseTimeMs: 0,
      errorMessage: 'Nenhum endereço de áudio online associado a esta emissora.',
      testedAt: new Date().toISOString(),
    };
  }

  const cleanUrl = streamUrl.trim();

  // Check recent cache
  const cached = validationCache.get(cleanUrl);
  if (cached && Date.now() - new Date(cached.testedAt).getTime() < CACHE_TTL_MS) {
    return cached;
  }

  const startTime = Date.now();
  const detectedFormat = detectStreamFormat(cleanUrl);

  return new Promise((resolve) => {
    let settled = false;
    const testAudio = new Audio();
    testAudio.preload = 'auto';
    testAudio.muted = true; // Muted to allow browser autoplay probe policies

    const finish = (result: StreamValidationResult) => {
      if (settled) return;
      settled = true;

      try {
        testAudio.pause();
        testAudio.removeAttribute('src');
        testAudio.load();
      } catch (e) {
        // Ignore cleanup errors
      }

      validationCache.set(cleanUrl, result);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        streamUrl: cleanUrl,
        isWorking: false,
        status: 'STREAM_UNAVAILABLE',
        format: detectedFormat,
        responseTimeMs: Date.now() - startTime,
        errorMessage: 'Tempo limite esgotado ao tentar estabelecer conexão com o servidor de áudio (Timeout > 7s).',
        testedAt: new Date().toISOString(),
      });
    }, timeoutMs);

    testAudio.oncanplay = () => {
      clearTimeout(timer);
      finish({
        streamUrl: cleanUrl,
        isWorking: true,
        status: 'PLAYBACK_VERIFIED',
        format: detectedFormat,
        responseTimeMs: Date.now() - startTime,
        testedAt: new Date().toISOString(),
      });
    };

    testAudio.onloadeddata = () => {
      clearTimeout(timer);
      finish({
        streamUrl: cleanUrl,
        isWorking: true,
        status: 'PLAYBACK_VERIFIED',
        format: detectedFormat,
        responseTimeMs: Date.now() - startTime,
        testedAt: new Date().toISOString(),
      });
    };

    testAudio.onerror = () => {
      clearTimeout(timer);
      const mediaError = testAudio.error;
      let msg = 'Erro ao decodificar fluxo de áudio.';
      let status: StreamStatus = 'PLAYBACK_ERROR';

      if (mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        msg = 'Formato ou protocolo não suportado nativamente pelo navegador, ou restrição de CORS.';
        status = 'STREAM_UNAVAILABLE';
      } else if (mediaError?.code === MediaError.MEDIA_ERR_NETWORK) {
        msg = 'Falha de rede ao conectar com o endpoint de transmissão da emissora.';
        status = 'STREAM_UNAVAILABLE';
      }

      finish({
        streamUrl: cleanUrl,
        isWorking: false,
        status,
        format: detectedFormat,
        responseTimeMs: Date.now() - startTime,
        errorMessage: msg,
        testedAt: new Date().toISOString(),
      });
    };

    try {
      testAudio.src = cleanUrl;
      testAudio.load();
    } catch (err: any) {
      clearTimeout(timer);
      finish({
        streamUrl: cleanUrl,
        isWorking: false,
        status: 'STREAM_UNAVAILABLE',
        format: detectedFormat,
        responseTimeMs: Date.now() - startTime,
        errorMessage: err?.message || 'Falha de inicialização no mecanismo de áudio.',
        testedAt: new Date().toISOString(),
      });
    }
  });
}
