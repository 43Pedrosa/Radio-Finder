import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Play,
  RotateCw,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Radio,
  Activity,
  Layers,
  Save,
  Edit2,
  Trash2,
  Volume2,
} from 'lucide-react';
import { RadioStation } from '../../types/radio';
import { stationRepository } from '../../services/supabase/stationRepository';
import { isSupabaseConfigured } from '../../services/supabase/client';
import { validateStream } from '../../services/streamValidator/streamValidator';
import { StatusBadge } from '../../components/common/StatusBadge';
import { deduplicateStations } from '../../utils/deduplication';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

export const AdminPage: React.FC = () => {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'STATIONS' | 'NEW' | 'PROBER' | 'DUPLICATES'>('STATIONS');

  const { playStation, currentStation, isPlaying } = useAudioPlayer();

  // Stream prober state
  const [testUrl, setTestUrl] = useState('');
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  // Edit station modal state
  const [editingStation, setEditingStation] = useState<RadioStation | null>(null);

  // New station form state
  const [newStation, setNewStation] = useState<Partial<RadioStation>>({
    name: '',
    legal_name: '',
    city: 'Ipatinga',
    state: 'MG',
    country: 'BR',
    frequency: '93.1',
    band: 'FM',
    latitude: -19.4682,
    longitude: -42.5367,
    official_website: '',
    website: '',
    stream_url: '',
    stream_format: 'MP3',
    station_type: 'COMMERCIAL',
    genre: 'Variada',
    description: '',
    source_name: 'Cadastro Manual Verificado',
    stream_status: 'PLAYBACK_VERIFIED',
    verification_status: 'VERIFIED',
    is_active: true,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load catalog
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await stationRepository.getAll();
      setStations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered stations for admin table
  const filtered = stations.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.frequency.toLowerCase().includes(q) ||
      s.source_name.toLowerCase().includes(q)
    );
  });

  // Action: TESTAR STREAM
  const handleProbe = async (url: string) => {
    if (!url) return;
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await validateStream(url, 8000);
      setProbeResult(res);
    } catch (e: any) {
      setProbeResult({
        streamUrl: url,
        isWorking: false,
        status: 'STREAM_UNAVAILABLE',
        errorMessage: e?.message || 'Erro inesperado ao sondar stream.',
      });
    } finally {
      setProbing(false);
    }
  };

  // Revalidate an existing station stream
  const handleRevalidateStation = async (station: RadioStation) => {
    if (!station.stream_url) return;
    const res = await validateStream(station.stream_url, 7000);
    await stationRepository.updateStreamStatus(
      station.id,
      res.status,
      station.stream_url,
      res.isWorking
    );
    loadData();
  };

  // Handle save new station
  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.city || !newStation.frequency) return;

    const streamStatus = newStation.stream_url ? 'PLAYBACK_VERIFIED' : 'STREAM_NOT_FOUND';

    const stationToSave: RadioStation = {
      id: crypto.randomUUID(),
      name: newStation.name!,
      legal_name: newStation.legal_name || undefined,
      city: newStation.city!,
      state: (newStation.state || 'MG').toUpperCase(),
      country: newStation.country || 'BR',
      frequency: newStation.frequency!,
      band: (newStation.band as any) || 'FM',
      latitude: Number(newStation.latitude) || -19.4682,
      longitude: Number(newStation.longitude) || -42.5367,
      official_website: newStation.official_website || newStation.website || undefined,
      website: newStation.website || newStation.official_website || undefined,
      stream_url: newStation.stream_url || undefined,
      stream_format: (newStation.stream_format as any) || 'MP3',
      station_type: (newStation.station_type as any) || 'COMMERCIAL',
      genre: newStation.genre || 'Geral',
      description: newStation.description || undefined,
      source_name: newStation.source_name || 'Cadastro Manual Verificado',
      stream_status: streamStatus,
      verification_status: 'VERIFIED',
      is_active: true,
      last_checked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await stationRepository.saveStation(stationToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    loadData();
    setActiveTab('STATIONS');
  };

  // Save edited station
  const handleUpdateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    await stationRepository.saveStation(editingStation);
    setEditingStation(null);
    loadData();
  };

  // Check duplicate analysis
  const duplicates = React.useMemo(() => {
    const deduped = deduplicateStations(stations);
    return {
      rawCount: stations.length,
      dedupedCount: deduped.length,
      mergedCount: stations.length - deduped.length,
    };
  }, [stations]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">
            <Shield className="w-4 h-4" />
            <span>Auditoria e Gestão Técnica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Controle do catálogo de radiodifusão, testes de integridade de streams e validação de fontes.
          </p>
        </div>

        {/* Database Status Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <Database className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Banco:</span>
          {isSupabaseConfigured ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Supabase PostGIS Conectado</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-300 font-semibold">Catálogo PostGIS Local Auditado</span>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('STATIONS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'STATIONS'
              ? 'bg-rose-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Emissoras ({stations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('NEW')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'NEW'
              ? 'bg-rose-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Emissora</span>
        </button>

        <button
          onClick={() => setActiveTab('PROBER')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'PROBER'
              ? 'bg-rose-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Testador de Streams</span>
        </button>

        <button
          onClick={() => setActiveTab('DUPLICATES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'DUPLICATES'
              ? 'bg-rose-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Auditoria & Deduplicação</span>
        </button>
      </div>

      {/* Tab: Stations Catalog List */}
      {activeTab === 'STATIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nome, cidade ou frequência..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500 shadow-xs"
              />
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Catálogo</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b101b] shadow-xs">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Emissora</th>
                  <th className="py-3 px-4">Dial / Freq</th>
                  <th className="py-3 px-4">Município (UF)</th>
                  <th className="py-3 px-4">Fonte de Origem</th>
                  <th className="py-3 px-4">Status Stream</th>
                  <th className="py-3 px-4 text-right">Ações Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {filtered.map((station) => (
                  <tr key={station.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{station.name}</div>
                      {station.legal_name && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {station.legal_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 dark:text-rose-300 font-medium">
                      {station.frequency} {station.band}
                    </td>
                    <td className="py-3 px-4">
                      {station.city}, {station.state}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {station.source_name}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={station.stream_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {station.stream_url ? (
                          <>
                            <button
                              onClick={() => {
                                setTestUrl(station.stream_url!);
                                setActiveTab('PROBER');
                                handleProbe(station.stream_url!);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg transition-colors border border-rose-500/30"
                              title="Testar parâmetros técnicos e decodificação do stream"
                            >
                              TESTAR STREAM
                            </button>
                            <button
                              onClick={() => playStation(station, stations)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                              title="Ouvir no player"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Sem stream</span>
                        )}
                        <button
                          onClick={() => setEditingStation(station)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Editar informações"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Station Modal */}
      {editingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0b101b] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold font-display">Editar Emissora: {editingStation.name}</h3>
            <form onSubmit={handleUpdateStation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome:</label>
                <input
                  type="text"
                  value={editingStation.name}
                  onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Frequência:</label>
                  <input
                    type="text"
                    value={editingStation.frequency}
                    onChange={(e) => setEditingStation({ ...editingStation, frequency: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Banda:</label>
                  <select
                    value={editingStation.band}
                    onChange={(e) => setEditingStation({ ...editingStation, band: e.target.value as any })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="FM">FM</option>
                    <option value="AM">AM</option>
                    <option value="WEB">WEB</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">URL de Streaming:</label>
                <input
                  type="url"
                  value={editingStation.stream_url || ''}
                  onChange={(e) => setEditingStation({ ...editingStation, stream_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Site Oficial:</label>
                <input
                  type="url"
                  value={editingStation.official_website || editingStation.website || ''}
                  onChange={(e) =>
                    setEditingStation({
                      ...editingStation,
                      official_website: e.target.value,
                      website: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: New Station Manual Form */}
      {activeTab === 'NEW' && (
        <form onSubmit={handleSaveStation} className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 max-w-3xl shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Cadastrar Emissora Oficial / Manual</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre emissoras com dados físicos e de outorga, com ou sem stream online. Se não houver transmissão pela internet, o status será definido como SEM STREAM (STREAM_NOT_FOUND).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Nome Fantasia *</label>
              <input
                type="text"
                required
                value={newStation.name}
                onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                placeholder="Ex: Grande Vale FM"
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Razão Social / Outorga</label>
              <input
                type="text"
                value={newStation.legal_name || ''}
                onChange={(e) => setNewStation({ ...newStation, legal_name: e.target.value })}
                placeholder="Ex: Fundação Dom Lelis Lara..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Município *</label>
              <input
                type="text"
                required
                value={newStation.city}
                onChange={(e) => setNewStation({ ...newStation, city: e.target.value })}
                placeholder="Ex: Ipatinga"
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Estado (UF) *</label>
                <input
                  type="text"
                  maxLength={2}
                  required
                  value={newStation.state}
                  onChange={(e) => setNewStation({ ...newStation, state: e.target.value.toUpperCase() })}
                  placeholder="MG"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Banda</label>
                <select
                  value={newStation.band}
                  onChange={(e) => setNewStation({ ...newStation, band: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="FM">FM</option>
                  <option value="AM">AM</option>
                  <option value="WEB">WEB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Frequência *</label>
              <input
                type="text"
                required
                value={newStation.frequency}
                onChange={(e) => setNewStation({ ...newStation, frequency: e.target.value })}
                placeholder="Ex: 93.1"
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Tipo de Emissora</label>
              <select
                value={newStation.station_type || 'COMMERCIAL'}
                onChange={(e) => setNewStation({ ...newStation, station_type: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              >
                <option value="COMMERCIAL">Comercial</option>
                <option value="COMMUNITY">Comunitária</option>
                <option value="EDUCATIONAL">Educativa</option>
                <option value="PUBLIC">Pública</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">URL de Transmissão (Stream)</label>
              <input
                type="url"
                value={newStation.stream_url || ''}
                onChange={(e) => setNewStation({ ...newStation, stream_url: e.target.value })}
                placeholder="https://servidor.com:port/stream (deixe em branco se a rádio operar apenas via dial RF)"
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-mono text-[11px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Site Oficial</label>
              <input
                type="url"
                value={newStation.official_website || newStation.website || ''}
                onChange={(e) =>
                  setNewStation({
                    ...newStation,
                    official_website: e.target.value,
                    website: e.target.value,
                  })
                }
                placeholder="https://..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {saveSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1 font-medium">
                <CheckCircle className="w-4 h-4" />
                Emissora salva com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Gravar no Catálogo</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Stream Prober Tool */}
      {activeTab === 'PROBER' && (
        <div className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-5 max-w-3xl shadow-xs">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Sondador Técnico de Áudio (StreamValidator)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Testa resolução DNS, cabeçalhos HTTP, codec de áudio, conectividade e decodificação no navegador.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Cole a URL do stream (ex: https://sonicpanel.oficialserver.com:7001/stream)..."
              className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 text-xs font-mono"
            />
            <button
              onClick={() => handleProbe(testUrl)}
              disabled={probing || !testUrl}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {probing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>TESTAR STREAM</span>
            </button>
          </div>

          {probeResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                probeResult.isWorking
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {probeResult.isWorking ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>
                    {probeResult.isWorking ? 'Reprodução Confirmada (PLAYBACK_VERIFIED / AO VIVO)' : `Falha: ${probeResult.status}`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-300">
                  Latência: {probeResult.responseTimeMs} ms
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                URL Testada: {probeResult.streamUrl}
              </div>
              <div className="text-[11px]">
                Codec / Formato: <strong className="font-mono">{probeResult.format}</strong>
              </div>
              {probeResult.errorMessage && (
                <div className="text-[11px] text-rose-700 dark:text-rose-300 pt-1 border-t border-rose-200 dark:border-rose-900">
                  Diagnóstico Técnico: {probeResult.errorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Deduplication Analysis */}
      {activeTab === 'DUPLICATES' && (
        <div className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 max-w-3xl shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Auditoria de Duplicidades e Conformidade</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conforme a Seção 8 da especificação, as emissoras de diferentes diretórios são unificadas por frequência e município, distinguindo claramente emissoras com mesmo nome em cidades distintas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total de Registros Coletados</span>
              <strong className="text-lg text-slate-900 dark:text-white font-mono">{duplicates.rawCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Emissoras Físicas Únicas</span>
              <strong className="text-lg text-rose-600 dark:text-rose-300 font-mono">{duplicates.dedupedCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Duplicidades Harmonizadas</span>
              <strong className="text-lg text-emerald-600 dark:text-emerald-400 font-mono">{duplicates.mergedCount}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
