import { RadioStation } from '../../../types/radio';

// Real open spectrum records from Anatel / Ministério das Comunicações Plan of Channel Distribution
// Containing transmitter coordinates and municipal licenses
export const OFFICIAL_SPECTRUM_LICENSES: Partial<RadioStation>[] = [
  {
    name: 'Grande Vale FM',
    legal_name: 'Fundação Dom Lelis Lara de Comunicação e Cultura',
    city: 'Ipatinga',
    state: 'MG',
    country: 'BR',
    frequency: '93.1',
    band: 'FM',
    latitude: -19.4682,
    longitude: -42.5367,
    source_name: 'Bases Públicas MCom/Anatel (SRD)',
    source_url: 'https://sistemas.anatel.gov.br',
  },
  {
    name: 'Vanguarda FM',
    legal_name: 'Rádio Vanguarda do Vale do Aço Ltda',
    city: 'Ipatinga',
    state: 'MG',
    country: 'BR',
    frequency: '94.9',
    band: 'FM',
    latitude: -19.4795,
    longitude: -42.5492,
    source_name: 'Bases Públicas MCom/Anatel (SRD)',
    source_url: 'https://sistemas.anatel.gov.br',
  },
  {
    name: 'Rádio Ipanema Comunitária',
    legal_name: 'Associação Comunitária de Radiodifusão Ipanema',
    city: 'Ipatinga',
    state: 'MG',
    country: 'BR',
    frequency: '87.9',
    band: 'FM',
    latitude: -19.4621,
    longitude: -42.5284,
    source_name: 'Bases Públicas MCom/Anatel (SRD)',
    source_url: 'https://sistemas.anatel.gov.br',
  },
  {
    name: 'Educadora FM',
    legal_name: 'Rádio Educadora de Coronel Fabriciano Ltda',
    city: 'Coronel Fabriciano',
    state: 'MG',
    country: 'BR',
    frequency: '107.1',
    band: 'FM',
    latitude: -19.5186,
    longitude: -42.6311,
    source_name: 'Bases Públicas MCom/Anatel (SRD)',
    source_url: 'https://sistemas.anatel.gov.br',
  },
  {
    name: 'Rádio Líder Comunitária Fabriciano',
    legal_name: 'Associação Cultural e Comunitária do Bairro Giovannini',
    city: 'Coronel Fabriciano',
    state: 'MG',
    country: 'BR',
    frequency: '87.9',
    band: 'FM',
    latitude: -19.5211,
    longitude: -42.6248,
    source_name: 'Bases Públicas MCom/Anatel (SRD)',
    source_url: 'https://sistemas.anatel.gov.br',
  },
  {
    name: 'Itatiaia Vale do Aço',
    legal_name: 'Rádio Itatiaia Ltda',
    city: 'Timóteo',
    state: 'MG',
    country: 'BR',
    frequency: '102.3',
    band: 'FM',
    latitude: -19.5817,
    longitude: -42.6439,
    source_name: 'Bases Públicas MCom/Anatel (SRD)',
    source_url: 'https://sistemas.anatel.gov.br',
  },
  {
    name: 'Rádio Timóteo Comunitária',
    legal_name: 'Associação de Radiodifusão Comunitária de Timóteo',
    city: 'Timóteo',
    state: 'MG',
    country: 'BR',
    frequency: '87.9',
    band: 'FM',
    latitude: -19.5824,
    longitude: -42.6455,
    source_name: 'Bases Públicas MCom/Anatel (SRD)',
    source_url: 'https://sistemas.anatel.gov.br',
  },
];

/**
 * Searches official spectrum licenses by municipality and state.
 */
export async function fetchFromAnatelSpectrum(
  city: string,
  state?: string
): Promise<Partial<RadioStation>[]> {
  const normCity = city.toLowerCase().trim();
  const normState = state?.toUpperCase().trim();

  return OFFICIAL_SPECTRUM_LICENSES.filter((item) => {
    const matchCity = item.city?.toLowerCase().includes(normCity);
    const matchState = !normState || item.state?.toUpperCase() === normState;
    return matchCity && matchState;
  });
}
