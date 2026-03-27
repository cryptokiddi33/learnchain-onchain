// Netlify Function: proxy para Tokenomist API
// Llamada desde el browser: GET /.netlify/functions/unlocks
// Sin restricciones CORS porque corre en el servidor de Netlify

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300', // cache 5 min
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  try {
    // Tokenomist API — fuente oficial de CoinGecko y Binance para unlocks
    const res = await fetch(
      'https://api.tokenomist.ai/v1/unlocks?days=30&limit=50&sort=date',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LearnChain/1.0',
          'Referer': 'https://tokenomist.ai/',
          'Origin': 'https://tokenomist.ai',
        }
      }
    );

    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify({ source: 'tokenomist', data }), { headers });
    }

    // Fallback 2: Token.unlocks.app
    const res2 = await fetch(
      'https://token.unlocks.app/api/upcoming?days=30&limit=50',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LearnChain/1.0',
        }
      }
    );

    if (res2.ok) {
      const data2 = await res2.json();
      return new Response(JSON.stringify({ source: 'token-unlocks', data: data2 }), { headers });
    }

    // Fallback 3: Binance internal API
    const res3 = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/marketing/tokenUnlock/list?pageIndex=1&pageSize=30',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible)',
          'Referer': 'https://www.binance.com/en/markets/token_unlock',
        }
      }
    );

    if (res3.ok) {
      const data3 = await res3.json();
      return new Response(JSON.stringify({ source: 'binance', data: data3 }), { headers });
    }

    throw new Error(`All sources failed: ${res.status}, ${res2.status}, ${res3.status}`);

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers }
    );
  }
};

export const config = { path: '/api/unlocks' };
