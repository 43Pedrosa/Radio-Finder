import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Radio, PlayCircle } from 'lucide-react';
import { StreamStatus } from '../../types/stream';

interface StatusBadgeProps {
  status: StreamStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'PLAYBACK_VERIFIED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium ${className}`}
          title="Transmissão testada e reprodução confirmada"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>AO VIVO</span>
        </span>
      );
    case 'STREAM_AVAILABLE':
    case 'DISCOVERED':
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs text-cyan-400 font-medium ${className}`}
          title="Stream localizado e servidor acessível"
        >
          <Wifi className="w-3 h-3 text-cyan-400" />
          <span>ONLINE</span>
        </span>
      );
    case 'STREAM_CHECKING':
      return (
        <span className={`inline-flex items-center gap-1 text-xs text-cyan-300 font-medium ${className}`}>
          <div className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>VALIDANDO</span>
        </span>
      );
    case 'STREAM_NOT_FOUND':
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs text-slate-400 font-medium ${className}`}
          title="Outorga regular no espectro RF, sem stream público na internet"
        >
          <Radio className="w-3 h-3 text-slate-500" />
          <span>SEM STREAM (Sintonize no receptor FM)</span>
        </span>
      );
    case 'STREAM_UNAVAILABLE':
    case 'PLAYBACK_ERROR':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs text-rose-400 font-medium ${className}`}
          title="Servidor de áudio inacessível ou com falha de conexão"
        >
          <WifiOff className="w-3 h-3 text-rose-400" />
          <span>INDISPONÍVEL</span>
        </span>
      );
  }
};
