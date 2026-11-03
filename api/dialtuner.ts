/** Vercel serverless proxy for the public DialTuner search API (avoids browser CORS). */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2 || query.length > 100) {
    return res.status(400).json({ error: 'Parâmetro q inválido.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const upstream = new URL('https://www.dialtuner.com.br/wp-json/longwave/v1/search');
    upstream.searchParams.set('q', query);
    const response = await fetch(upstream, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'RadioFinder/1.0' },
    });
    if (!response.ok) return res.status(502).json({ error: `Fonte DialTuner respondeu ${response.status}.` });
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(502).json({ error: error?.name === 'AbortError' ? 'Tempo limite da fonte DialTuner.' : 'Fonte DialTuner indisponível.' });
  } finally {
    clearTimeout(timeout);
  }
}
