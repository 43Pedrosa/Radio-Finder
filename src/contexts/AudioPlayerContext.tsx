import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import Hls from 'hls.js';
import { RadioStation } from '../types/radio';
import { stationRepository } from '../services/supabase/stationRepository';

interface AudioPlayerContextType {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  stationQueue: RadioStation[];
  playStation: (station: RadioStation, queue?: RadioStation[]) => void;
  togglePlay: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextStation: () => void;
  prevStation: () => void;
  retryPlayback: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [stationQueue, setStationQueue] = useState<RadioStation[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('radio_finder_volume');
      return saved ? parseFloat(saved) : 0.85;
    } catch (e) {
      return 0.85;
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentStationRef = useRef<RadioStation | null>(null);
  currentStationRef.current = currentStation;

  // Initialize persistent single Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = volume;
    audioRef.current = audio;

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
      // Confirm PLAYBACK_VERIFIED
      if (currentStationRef.current?.id) {
        stationRepository.updateStreamStatus(
          currentStationRef.current.id,
          'PLAYBACK_VERIFIED',
          currentStationRef.current.stream_url,
          true
        );
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      const mediaErr = audio.error;
      let msg = 'Erro ao conectar à transmissão desta emissora.';
      if (mediaErr?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        msg = 'O stream desta emissora utiliza formato não suportado ou bloqueio de conexão no servidor.';
      } else if (mediaErr?.code === MediaError.MEDIA_ERR_NETWORK) {
        msg = 'Falha de rede ao conectar com o servidor da emissora.';
      }
      setError(msg);

      if (currentStationRef.current?.id) {
        stationRepository.updateStreamStatus(
          currentStationRef.current.id,
          'STREAM_UNAVAILABLE',
          currentStationRef.current.stream_url
        );
      }
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      audio.pause();
    };
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    try {
      localStorage.setItem('radio_finder_volume', clamped.toString());
    } catch (e) {
      // Ignore
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const updateMediaSession = useCallback((station: RadioStation) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: `${station.frequency} ${station.band} · ${station.city}, ${station.state}`,
        album: 'Radio Finder',
        artwork: station.logo_url
          ? [{ src: station.logo_url, sizes: '192x192', type: 'image/png' }]
          : [{ src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play().catch(console.error);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
      });
    }
  }, []);

  const playStation = useCallback(
    async (station: RadioStation, queue?: RadioStation[]) => {
      if (!audioRef.current) return;

      if (!station.stream_url || station.stream_status === 'STREAM_NOT_FOUND') {
        setError('Esta emissora opera apenas via dial RF e não possui transmissão online.');
        setCurrentStation(station);
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      setError(null);
      setIsLoading(true);
      setCurrentStation(station);
      if (queue) {
        setStationQueue(queue);
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const audio = audioRef.current;
      const isHls =
        station.stream_format === 'HLS' ||
        station.stream_url.toLowerCase().includes('.m3u8');

      try {
        if (isHls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current = hls;
          hls.loadSource(station.stream_url);
          hls.attachMedia(audio);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            audio.play().then(() => {
              setIsPlaying(true);
              setIsLoading(false);
              updateMediaSession(station);
            }).catch((err) => {
              console.warn('Falha ao iniciar HLS:', err);
              setIsLoading(false);
              setIsPlaying(false);
              setError('O navegador não conseguiu iniciar esta transmissão.');
            });
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              hls.destroy();
              hlsRef.current = null;
              setError(data.type === Hls.ErrorTypes.NETWORK_ERROR
                ? 'Não foi possível acessar o stream HLS (rede, URL ou CORS).'
                : 'O stream HLS foi recebido, mas o áudio não pôde ser decodificado.');
              setIsPlaying(false);
              setIsLoading(false);
            }
          });
        } else {
          // Safari e alguns navegadores reproduzem HLS nativamente sem hls.js.
          audio.src = station.stream_url;
          audio.load();
          await audio.play();
          setIsPlaying(true);
          setIsLoading(false);
          updateMediaSession(station);
        }
      } catch (err: any) {
        console.warn('Erro ao reproduzir stream:', err);
        setIsLoading(false);
        setIsPlaying(false);
        setError('Não foi possível iniciar a transmissão desta emissora.');
      }
    },
    [updateMediaSession]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!currentStation || !audioRef.current) return;

    if (isPlaying) {
      pause();
    } else {
      if (currentStation.stream_url) {
        playStation(currentStation);
      }
    }
  }, [currentStation, isPlaying, pause, playStation]);

  const retryPlayback = useCallback(() => {
    if (currentStation) {
      playStation(currentStation);
    }
  }, [currentStation, playStation]);

  const nextStation = useCallback(() => {
    if (!currentStation || stationQueue.length <= 1) return;
    // Navega pela fila atual da tela (cidade pesquisada ou favoritos).
    // Streams descobertos também podem ser testados; não exigir validação prévia.
    const playableStations = stationQueue.filter((station) => Boolean(station.stream_url));
    if (playableStations.length === 0) return;

    const playIndex = playableStations.findIndex((station) => station.id === currentStation.id);
    const nextIndex = playIndex < 0 ? 0 : (playIndex + 1) % playableStations.length;
    playStation(playableStations[nextIndex], stationQueue);
  }, [currentStation, stationQueue, playStation]);

  const prevStation = useCallback(() => {
    if (!currentStation || stationQueue.length <= 1) return;
    const playableStations = stationQueue.filter((station) => Boolean(station.stream_url));
    if (playableStations.length === 0) return;

    const playIndex = playableStations.findIndex((station) => station.id === currentStation.id);
    const prevIndex = playIndex < 0 ? playableStations.length - 1 : (playIndex - 1 + playableStations.length) % playableStations.length;
    playStation(playableStations[prevIndex], stationQueue);
  }, [currentStation, stationQueue, playStation]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentStation,
        isPlaying,
        isLoading,
        error,
        volume,
        isMuted,
        stationQueue,
        playStation,
        togglePlay,
        pause,
        setVolume,
        toggleMute,
        nextStation,
        prevStation,
        retryPlayback,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer deve ser usado dentro de um AudioPlayerProvider');
  }
  return context;
}
