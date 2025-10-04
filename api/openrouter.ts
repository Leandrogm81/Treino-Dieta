// api/openrouter.ts
// Função Serverless na Vercel para chamar o OpenRouter sem expor a chave no front.

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      // Teste rápido no navegador: /api/openrouter
      return res.status(200).json({ ok: true, route: '/api/openrouter' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' });
    }

    // Body vindo do front: { model, messages, stream, ... }
    const body = req.body || {};

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Identificação opcional do app
        'HTTP-Referer': process.env.SITE_URL || 'https://treino-dieta.vercel.app',
        'X-Title': 'Treino-Dieta',
      },
      body: JSON.stringify({
        model: body.model || 'openrouter/auto',
        messages: body.messages || [],
        stream: body.stream ?? false,
        max_tokens: body.max_tokens,
        temperature: body.temperature,
        top_p: body.top_p,
        presence_penalty: body.presence_penalty,
        frequency_penalty: body.frequency_penalty,
      }),
    });

    // Caso queira streaming no futuro, é só adaptar para repassar o stream.
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: err?.message });
  }
}
