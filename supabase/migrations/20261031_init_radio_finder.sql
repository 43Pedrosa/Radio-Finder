-- ==============================================================================
-- RADIO FINDER — SUPABASE / POSTGRESQL + POSTGIS PRODUCTION MIGRATION
-- Migration: 20261031_init_radio_finder.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. RADIO DISCOVERY SOURCES
CREATE TABLE IF NOT EXISTS public.radio_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID,
    source_name TEXT NOT NULL,
    source_url TEXT,
    code TEXT UNIQUE,
    base_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT FALSE,
    rate_limit_per_min INTEGER DEFAULT 60,
    terms_compliance_notes TEXT,
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed recognized sources
INSERT INTO public.radio_sources (code, source_name, base_url, is_active, terms_compliance_notes)
VALUES
    ('radios_com_br', 'Portal Radios.com.br', 'https://www.radios.com.br', TRUE, 'Diretório e playlists públicas brasileiras (.pls / .m3u).'),
    ('tudoradio', 'Tudo Rádio (Dial Brasil)', 'https://tudoradio.com', TRUE, 'Mapeamento de dial e dados técnicos do rádio brasileiro.'),
    ('anatel_srd', 'Bases Públicas MCom/Anatel (SRD)', 'https://sistemas.anatel.gov.br', TRUE, 'Dados abertos governamentais do plano de distribuição de canais.'),
    ('radio_browser', 'Community Radio Browser API', 'https://de1.api.radio-browser.info', TRUE, 'API aberta comunitária CC0 / dados públicos.'),
    ('direct_station', 'Site Oficial da Emissora', NULL, TRUE, 'Stream e dados oficiais divulgados pela própria emissora.')
ON CONFLICT (code) DO NOTHING;

-- 3. CITIES CATALOG WITH GEOGRAPHY
CREATE TABLE IF NOT EXISTS public.radio_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    state VARCHAR(2) NOT NULL,
    country VARCHAR(2) DEFAULT 'BR',
    ibge_code VARCHAR(10),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_cities_location ON public.radio_cities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_radio_cities_state_name ON public.radio_cities (state, name);

-- 4. RADIO STATIONS (MAIN CATALOG ALIGNED WITH SECTION 7)
CREATE TABLE IF NOT EXISTS public.radio_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_name TEXT,
    frequency TEXT NOT NULL,
    band VARCHAR(10) DEFAULT 'FM', -- 'FM', 'AM', 'WEB'
    city TEXT NOT NULL,
    state VARCHAR(2) NOT NULL,
    country VARCHAR(2) DEFAULT 'BR',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326),
    official_website TEXT,
    website TEXT,
    logo_url TEXT,
    stream_url TEXT,
    stream_format VARCHAR(20) DEFAULT 'MP3', -- 'MP3', 'AAC', 'AAC+', 'HLS', 'OGG'
    station_type VARCHAR(30) DEFAULT 'COMMERCIAL', -- 'COMMERCIAL', 'COMMUNITY', 'EDUCATIONAL', 'PUBLIC'
    genre TEXT,
    description TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT,
    stream_status VARCHAR(30) DEFAULT 'PLAYBACK_VERIFIED', -- 'PLAYBACK_VERIFIED', 'STREAM_AVAILABLE', 'STREAM_CHECKING', 'STREAM_NOT_FOUND', 'STREAM_UNAVAILABLE', 'PLAYBACK_ERROR', 'DISCOVERED'
    verification_status VARCHAR(30) DEFAULT 'VERIFIED', -- 'VERIFIED', 'COMMUNITY', 'PENDING_REVIEW'
    is_active BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    last_successful_playback TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to keep location geography column in sync with lat/lon
CREATE OR REPLACE FUNCTION public.update_station_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_station_location ON public.radio_stations;
CREATE TRIGGER trg_station_location
    BEFORE INSERT OR UPDATE OF latitude, longitude
    ON public.radio_stations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_station_location();

-- Spatial & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_radio_stations_location ON public.radio_stations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_radio_stations_city_state ON public.radio_stations (city, state);
CREATE INDEX IF NOT EXISTS idx_radio_stations_band ON public.radio_stations (band);
CREATE INDEX IF NOT EXISTS idx_radio_stations_stream_status ON public.radio_stations (stream_status);
CREATE INDEX IF NOT EXISTS idx_radio_stations_is_active ON public.radio_stations (is_active);

-- 5. MULTIPLE STREAMS PER STATION (SECTION 7)
CREATE TABLE IF NOT EXISTS public.radio_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.radio_stations(id) ON DELETE CASCADE,
    stream_url TEXT NOT NULL,
    protocol VARCHAR(20) DEFAULT 'HTTPS',
    codec VARCHAR(20) DEFAULT 'AAC',
    content_type VARCHAR(50) DEFAULT 'audio/aac',
    source_url TEXT,
    status VARCHAR(30) DEFAULT 'STREAM_AVAILABLE',
    is_primary BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    last_successful_playback TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_streams_station_id ON public.radio_streams(station_id);

-- 6. STREAM HEALTH CHECKS LOG (SECTION 7)
CREATE TABLE IF NOT EXISTS public.radio_stream_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES public.radio_streams(id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.radio_stations(id) ON DELETE CASCADE,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    dns_status VARCHAR(20) DEFAULT 'RESOLVED',
    http_status INTEGER,
    content_type TEXT,
    playback_status VARCHAR(30) NOT NULL, -- 'PLAYBACK_VERIFIED', 'PLAYBACK_ERROR', 'TIMEOUT'
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_radio_stream_checks_stream ON public.radio_stream_checks(stream_id, checked_at DESC);

-- 7. DISCOVERY LOGS
CREATE TABLE IF NOT EXISTS public.radio_discovery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_type VARCHAR(30) NOT NULL,
    search_term TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION,
    stations_found INTEGER DEFAULT 0,
    source_code TEXT,
    execution_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. POSTGIS RPC FUNCTION: get_stations_within_radius
CREATE OR REPLACE FUNCTION public.get_stations_within_radius(
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 20000
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    legal_name TEXT,
    city TEXT,
    state VARCHAR(2),
    country VARCHAR(2),
    frequency TEXT,
    band VARCHAR(10),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    official_website TEXT,
    website TEXT,
    logo_url TEXT,
    stream_url TEXT,
    stream_format VARCHAR(20),
    station_type VARCHAR(30),
    genre TEXT,
    description TEXT,
    source_name TEXT,
    stream_status VARCHAR(30),
    verification_status VARCHAR(30),
    is_active BOOLEAN,
    last_checked_at TIMESTAMPTZ,
    last_successful_playback TIMESTAMPTZ
) AS $$
DECLARE
    v_user_point GEOGRAPHY;
BEGIN
    v_user_point := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography;

    RETURN QUERY
    SELECT
        s.id,
        s.name,
        s.legal_name,
        s.city,
        s.state,
        s.country,
        s.frequency,
        s.band,
        s.latitude,
        s.longitude,
        ST_Distance(s.location, v_user_point) AS distance_meters,
        s.official_website,
        s.website,
        s.logo_url,
        s.stream_url,
        s.stream_format,
        s.station_type,
        s.genre,
        s.description,
        s.source_name,
        s.stream_status,
        s.verification_status,
        s.is_active,
        s.last_checked_at,
        s.last_successful_playback
    FROM public.radio_stations s
    WHERE s.is_active = TRUE
      AND ST_DWithin(s.location, v_user_point, p_radius_meters)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_stream_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_discovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active radio stations"
    ON public.radio_stations FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public read active sources"
    ON public.radio_sources FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public read streams"
    ON public.radio_streams FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public read cities"
    ON public.radio_cities FOR SELECT
    USING (TRUE);

CREATE POLICY "Admin write radio stations"
    ON public.radio_stations FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Admin write stream checks"
    ON public.radio_stream_checks FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Public can log discovery searches"
    ON public.radio_discovery_logs FOR INSERT
    WITH CHECK (TRUE);
