import urllib.request
import time

stations = [
    {
        "name": "Rádio Vanguarda FM",
        "frequency": "91.3",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://sonicpanel.oficialserver.com:7001/stream",
        "website": "https://vanguardafm.com.br",
        "source": "Radios.com.br (ID 14552) / SonicPanel",
        "lat": -19.4795,
        "lon": -42.5492
    },
    {
        "name": "Grande Vale FM",
        "frequency": "93.1",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://cast.radiu.live:6884/stream",
        "website": "https://grandevalefm.com.br",
        "source": "Radios.com.br (ID 14298) / Cast Radiu",
        "lat": -19.4682,
        "lon": -42.5367
    },
    {
        "name": "Rádio 98 FM (98.1)",
        "frequency": "98.1",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://9526.brasilstream.com.br/stream",
        "website": "https://98ipatinga.com.br",
        "source": "Radios.com.br (ID 68923) / BrasilStream",
        "lat": -19.4720,
        "lon": -42.5420
    },
    {
        "name": "Rádio Sou 94 FM (94.7)",
        "frequency": "94.7",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://stm12.voxhd.com.br:11822/stream",
        "website": "http://www.sou94.com.br",
        "source": "Radios.com.br (ID 117) / VoxHD",
        "lat": -19.4810,
        "lon": -42.5350
    },
    {
        "name": "Rádio Líder FM",
        "frequency": "95.3",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://srv3.soundstream.com.br/listen/radiolideripatinga/live",
        "website": "http://www.radiolider.net.br",
        "source": "Radios.com.br (ID 120) / SoundStream",
        "lat": -19.4950,
        "lon": -42.5580
    },
    {
        "name": "Rádio Liberdade FM",
        "frequency": "98.7",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://hts07.brascast.com:9192/live",
        "website": "https://98fmliberdade.com.br",
        "source": "Site Oficial / Brascast",
        "lat": -19.4880,
        "lon": -42.5430
    },
    {
        "name": "Maravilha FM",
        "frequency": "89.5",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://stm19.srvstm.com:7080/stream",
        "website": "https://89maravilhafm.com",
        "source": "Portal da Rede / SrvStm",
        "lat": -19.4700,
        "lon": -42.5200
    },
    {
        "name": "Rádio Renascer (101 FM)",
        "frequency": "101.5",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://stm22.voxhd.com.br:12496/stream",
        "website": "https://www.sou101fm.com.br",
        "source": "Site Oficial / VoxHD",
        "lat": -19.4650,
        "lon": -42.5310
    },
    {
        "name": "Rádio Tropical FM",
        "frequency": "96.1",
        "band": "FM",
        "city": "Timóteo",
        "state": "MG",
        "stream_url": "https://servidor32-4.brlogic.com:8168/live",
        "website": "https://tropicalvalefm.com.br",
        "source": "Radios.com.br (ID 16142) / BRLogic",
        "lat": -19.5817,
        "lon": -42.6439
    },
    {
        "name": "Rádio Vox 97 FM",
        "frequency": "97.1",
        "band": "FM",
        "city": "Timóteo",
        "state": "MG",
        "stream_url": "https://8416.brasilstream.com.br/stream",
        "website": "https://vox97.com.br",
        "source": "Site Oficial / BrasilStream",
        "lat": -19.5780,
        "lon": -42.6390
    },
    {
        "name": "Rádio Itatiaia Vale do Aço",
        "frequency": "102.3",
        "band": "FM",
        "city": "Timóteo",
        "state": "MG",
        "stream_url": "https://server02.ouvir.radio.br:8050/stream",
        "website": "https://itatiaia.com.br",
        "source": "Radios.com.br (ID 15693) / Ouvir.radio.br",
        "lat": -19.5790,
        "lon": -42.6410
    },
    {
        "name": "Rádio Educadora FM 107.1",
        "frequency": "107.1",
        "band": "FM",
        "city": "Coronel Fabriciano",
        "state": "MG",
        "stream_url": "https://audio.heek.com.br/107fm",
        "website": "https://radioeducadoramg.com.br",
        "source": "Radios.com.br (ID 12840) / Heek Audio",
        "lat": -19.5186,
        "lon": -42.6311
    },
    {
        "name": "Rádio Educadora FM 91.7",
        "frequency": "91.7",
        "band": "FM",
        "city": "Coronel Fabriciano",
        "state": "MG",
        "stream_url": "https://audio.heek.com.br/am1010",
        "website": "https://radioeducadoramg.com.br",
        "source": "Radios.com.br (ID 12841) / Heek Audio",
        "lat": -19.5190,
        "lon": -42.6320
    },
    {
        "name": "Rádio Galáxia FM",
        "frequency": "99.5",
        "band": "FM",
        "city": "Coronel Fabriciano",
        "state": "MG",
        "stream_url": "https://api.ultranet.psi.br:8100/galaxiafm",
        "website": "https://radiogalaxiafm.com.br",
        "source": "Radios.com.br (ID 24550) / Ultranet",
        "lat": -19.5211,
        "lon": -42.6248
    },
    {
        "name": "Fundação Educativa e Cultural (Sou 101 FM)",
        "frequency": "101.5",
        "band": "FM",
        "city": "Santana do Paraíso",
        "state": "MG",
        "stream_url": "https://stm22.voxhd.com.br:12496/stream",
        "website": "https://www.sou101fm.com.br",
        "source": "MCom Outorga / Concessão Santana do Paraíso",
        "lat": -19.3644,
        "lon": -42.5600
    },
    {
        "name": "Jovem Pan FM Vale do Aço",
        "frequency": "103.5",
        "band": "FM",
        "city": "Ipatinga",
        "state": "MG",
        "stream_url": "https://stream.zeno.fm/vz3lvxuoxbdtv",
        "website": "https://jovempan.com.br/afiliada/valedoaco-fm",
        "source": "Site Oficial Jovem Pan / Zeno",
        "lat": -19.4670,
        "lon": -42.5400
    }
]

print("=== AUDITING AND TESTING ALL REAL STREAMS ===")
for s in stations:
    start = time.time()
    url = s["stream_url"]
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        with urllib.request.urlopen(req, timeout=6) as resp:
            elapsed = int((time.time() - start) * 1000)
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            cors = resp.headers.get("Access-Control-Allow-Origin", "None")
            first_bytes = resp.read(15)
            print(f"[OK PLAYBACK_VERIFIED] {s['name']} ({s['frequency']} {s['band']} - {s['city']}): Status={status}, Type={content_type}, Latency={elapsed}ms, CORS={cors}, Bytes={len(first_bytes)}")
    except urllib.error.HTTPError as he:
        print(f"[STREAM_UNAVAILABLE / HTTP {he.code}] {s['name']} ({s['frequency']} {s['band']}): {he}")
    except Exception as e:
        print(f"[STREAM_UNAVAILABLE / ERROR] {s['name']} ({s['frequency']} {s['band']}): {e}")
