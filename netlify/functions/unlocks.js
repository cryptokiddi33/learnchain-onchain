// Netlify Function: proxy para Token Unlocks
// Prueba múltiples fuentes hasta encontrar una que funcione

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  // Source 1: Binance public API (endpoint real de la página de unlocks)
  try {
    const res = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/marketing/tokenUnlock/list?pageIndex=1&pageSize=30&orderBy=unlockTime&orderType=ASC',
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.binance.com/en/markets/token_unlock',
          'Origin': 'https://www.binance.com',
          'clienttype': 'web',
          'lang': 'en',
        }
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.code === '000000' && data?.data) {
        return new Response(JSON.stringify({ source: 'binance', data: data.data }), { headers });
      }
    }
    console.log('Binance primary failed:', res.status);
  } catch (e) {
    console.log('Binance primary error:', e.message);
  }

  // Source 2: Binance alternative endpoint
  try {
    const res2 = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/marketing/tokenUnlock/list?pageIndex=1&pageSize=20',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
          'Referer': 'https://www.binance.com/',
        }
      }
    );

    if (res2.ok) {
      const data2 = await res2.json();
      if (data2?.data) {
        return new Response(JSON.stringify({ source: 'binance', data: data2.data }), { headers });
      }
    }
    console.log('Binance alt failed:', res2.status);
  } catch (e) {
    console.log('Binance alt error:', e.message);
  }

  // Source 3: CoinGecko token unlocks (uses Tokenomist under the hood)
  try {
    const res3 = await fetch(
      'https://pro-api.coingecko.com/api/v3/token_unlocks?days=30&per_page=30',
      {
        headers: {
          'Accept': 'application/json',
          'x-cg-pro-api-key': 'CG-HjxubDDpJ88jwNh4ZsTdXfwy',
        }
      }
    );

    if (res3.ok) {
      const data3 = await res3.json();
      return new Response(JSON.stringify({ source: 'coingecko', data: data3 }), { headers });
    }
    console.log('CoinGecko failed:', res3.status);
  } catch (e) {
    console.log('CoinGecko error:', e.message);
  }

  // Source 4: Tokenomist with different endpoint format
  try {
    const res4 = await fetch(
      'https://tokenomist.ai/api/upcoming-unlocks?days=30',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible)',
          'Referer': 'https://tokenomist.ai/',
        }
      }
    );

    if (res4.ok) {
      const data4 = await res4.json();
      return new Response(JSON.stringify({ source: 'tokenomist', data: data4 }), { headers });
    }
    console.log('Tokenomist failed:', res4.status);
  } catch (e) {
    console.log('Tokenomist error:', e.message);
  }

  // All failed — return error so frontend uses curated fallback
  return new Response(
    JSON.stringify({ error: 'All sources failed — using curated fallback' }),
    { status: 503, headers }
  );
};

export const config = { path: '/api/unlocks' };
