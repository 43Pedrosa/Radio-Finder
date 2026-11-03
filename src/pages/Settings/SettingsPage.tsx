import React from 'react';
import {
  Settings as SettingsIcon,
  MapPin,
  Volume2,
  ShieldCheck,
  Radio,
  FileText,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

export const SettingsPage: React.FC = () => {
  const {
    geocoded,
    isManualSelection,
    requestGpsLocation,
    loading: locationLoading,
  } = useLocation();
  const { volume, setVolume } = useAudioPlayer();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="pb-6 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
          <SettingsIcon className="w-4 h-4" />
          <span>Preferências e Conformidade</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
          Configurações do Radio Finder
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gerencie a localização, reprodução e preferências do aplicativo.
        </p>
      </div>

      {/* Geolocation & Radius Settings */}
      <section className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Localização e descoberta por município</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A localização GPS identifica o município. As emissoras cadastradas nesse município são listadas sem limite fixo de distância.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Localização atual: </span>
              <strong className="text-slate-900 dark:text-white">
                {geocoded ? geocoded.displayName : 'Não identificada'}
              </strong>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">
                ({isManualSelection ? 'Seleção Manual' : 'GPS Automático'})
              </span>
            </div>
            <button
              onClick={requestGpsLocation}
              disabled={locationLoading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            >
              Recalibrar GPS
            </button>
          </div>
        </div>
      </section>

      {/* Audio Playback Settings */}
      <section className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Áudio e Transmissão</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controles de decodificação e volume padrão.
            </p>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 mb-2">
              <span>Volume Inicial Padrão</span>
              <span className="font-mono text-rose-600 dark:text-rose-300">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>
      </section>

      {/* Legal & Compliance (Section 14) */}
      <section className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Segurança, LGPD e Direitos de Radiodifusão</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conformidade jurídica com a Seção 14 da especificação do Radio Finder.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Transmissões Oficiais e Sem Retransmissão Própria</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              O Radio Finder atua exclusivamente como sintonizador e indexador de descoberta geográfica. O áudio é reproduzido diretamente dos servidores oficiais autorizados pelas emissoras ou entidades outorgadas. A aplicação <strong>não armazena, retransmite ou altera</strong> conteúdos protegidos por direitos autorais ou direitos conexos (Lei 9.610/98).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Bases Públicas e Dados Governamentais</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              As informações de concessão, razão social, frequência e localização das antenas transmissoras têm como base fontes públicas governamentais (Anatel / Ministério das Comunicações — Sistema de Radiodifusão SRD) e diretórios abertos.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Canal Direto para Emissoras (Remoção e Atualização)</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Representantes legais de emissoras de rádio podem solicitar a atualização de logotipo, fluxo de streaming ou exclusão imediata do catálogo entrando em contato pelo e-mail <strong>suporte@radiofinder.app</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
