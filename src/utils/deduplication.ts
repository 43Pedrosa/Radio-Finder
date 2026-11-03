import { RadioStation } from '../types/radio';

/**
 * Normalizes text for robust comparison (removes accents, punctuation, extra spaces, lowercases).
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes frequency string (e.g. "97.1 FM", "97,1", "97.10" -> "97.1")
 */
export function normalizeFrequency(freq?: string): string {
  if (!freq) return '';
  const cleaned = freq.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? freq.trim() : num.toFixed(1);
}

/**
 * Calculates similarity coefficient between two station names (0 to 1).
 * Uses token overlap and Levenshtein distance.
 */
export function calculateNameSimilarity(nameA: string, nameB: string): number {
  const normA = normalizeText(nameA);
  const normB = normalizeText(nameB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const tokensA = new Set(normA.split(' '));
  const tokensB = new Set(normB.split(' '));

  let shared = 0;
  tokensA.forEach((token) => {
    if (token.length > 2 && tokensB.has(token)) {
      shared++;
    }
  });

  const maxTokens = Math.max(tokensA.size, tokensB.size);
  const jaccard = maxTokens > 0 ? shared / maxTokens : 0;

  // Exact substring check
  if (normA.includes(normB) || normB.includes(normA)) {
    return Math.max(jaccard, 0.85);
  }

  return jaccard;
}

/**
 * Checks if two stations represent the exact same physical radio station.
 * Strict rules to avoid false mergers across different frequencies or municipalities.
 */
export function isDuplicateStation(a: RadioStation, b: RadioStation): boolean {
  if (a.id === b.id) return true;

  const freqA = normalizeFrequency(a.frequency);
  const freqB = normalizeFrequency(b.frequency);

  // If frequencies exist and are clearly different, they are DIFFERENT stations
  if (freqA && freqB && freqA !== freqB) {
    return false;
  }

  const cityA = normalizeText(a.city);
  const cityB = normalizeText(b.city);
  const stateA = (a.state || '').trim().toUpperCase();
  const stateB = (b.state || '').trim().toUpperCase();

  // If both have states and they differ, they are in different states
  if (stateA && stateB && stateA !== stateB) {
    return false;
  }

  // Same frequency and matching city -> highly likely duplicate
  const sameCity = cityA === cityB || cityA.includes(cityB) || cityB.includes(cityA);
  const nameSim = calculateNameSimilarity(a.name, b.name);

  if (freqA && freqB && freqA === freqB && sameCity) {
    return nameSim >= 0.5; // High confidence duplicate
  }

  // Same exact stream URL
  if (a.stream_url && b.stream_url && a.stream_url.trim() === b.stream_url.trim()) {
    return true;
  }

  // Same official website and city
  if (
    a.website &&
    b.website &&
    normalizeText(a.website) === normalizeText(b.website) &&
    sameCity
  ) {
    return true;
  }

  return false;
}

/**
 * Merges duplicate stations, keeping the richest verified metadata and active stream.
 */
export function deduplicateStations(stations: RadioStation[]): RadioStation[] {
  const result: RadioStation[] = [];

  for (const station of stations) {
    const existingIndex = result.findIndex((item) => isDuplicateStation(item, station));

    if (existingIndex === -1) {
      result.push({ ...station });
    } else {
      const existing = result[existingIndex];
      // Merge best attributes
      const isExistingLive =
        existing.stream_status === 'PLAYBACK_VERIFIED' || existing.stream_status === 'STREAM_AVAILABLE';
      const isIncomingLive =
        station.stream_status === 'PLAYBACK_VERIFIED' || station.stream_status === 'STREAM_AVAILABLE';

      const preferredStream =
        isExistingLive && existing.stream_url
          ? existing.stream_url
          : station.stream_url || existing.stream_url;

      const preferredStatus =
        existing.stream_status === 'PLAYBACK_VERIFIED'
          ? 'PLAYBACK_VERIFIED'
          : station.stream_status === 'PLAYBACK_VERIFIED'
          ? 'PLAYBACK_VERIFIED'
          : isExistingLive
          ? existing.stream_status
          : isIncomingLive
          ? station.stream_status
          : existing.stream_status;

      result[existingIndex] = {
        ...existing,
        legal_name: existing.legal_name || station.legal_name,
        website: existing.website || station.website,
        logo_url: existing.logo_url || station.logo_url,
        genre: existing.genre || station.genre,
        description: existing.description || station.description,
        stream_url: preferredStream,
        stream_format: existing.stream_format || station.stream_format,
        stream_status: preferredStatus,
        verification_status:
          existing.verification_status === 'VERIFIED' || station.verification_status === 'VERIFIED'
            ? 'VERIFIED'
            : existing.verification_status,
      };
    }
  }

  return result;
}
