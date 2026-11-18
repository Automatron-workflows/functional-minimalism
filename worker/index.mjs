// Public, keyless connector for the Functional Minimalism prompt lab.
// Deploy once with an OpenCode token. Visitors never enter a key.
// Only the free model allowlist is accepted.

const MODELS = [
  { id: 'longcat-2.5-free', label: 'LongCat 2.5', free: true },
  { id: 'beam-free', label: 'Beam', free: true },
  { id: 'hy4-flash-free', label: 'HY4 Flash', free: true },
  { id: 'qwen3.8-flash', label: 'Qwen 3.8 Flash', free: false }
];
const OPENCODE_BASE = 'https://opencode.ai/zen/go/v1';
const ALLOWED_ORIGIN = '*';
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 30;
const hits = new Map();

function cors(extra = {}) {
  return {
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extra
  };
}
function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: cors(extra) });
}
function clientIP(request) {
  return request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown';
}
function withinLimit(ip) {
  const now = Date.now();
  const current = (hits.get(ip) ?? []).filter(time => now - time < WINDOW_MS);
  if (current.length >= LIMIT) return false;
  current.push(now);
  hits.set(ip, current);
  return true;
}
async function readJSON(request) {
  const text = await request.text();
  if (text.length > 2_000_000) throw new Error('Request body too large');
  try { return JSON.parse(text); } catch { throw new Error('Request body must be JSON'); }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      if (!env.OPENCODE_TOKEN) return json({ ok: false, error: 'Connector token is missing' }, 503);
      return json({ ok: true, models: MODELS });
    }
    if (url.pathname !== '/generate') return json({ ok: false, error: 'Not found' }, 404);
    if (request.method !== 'POST') return json({ ok: false, error: 'POST required' }, 405);
    if (!env.OPENCODE_TOKEN) return json({ ok: false, error: 'Connector token is missing' }, 503);
    const ip = clientIP(request);
    if (!withinLimit(ip)) return json({ ok: false, error: 'Free connector limit reached. Try again later or use your own key.' }, 429);

    let body;
    try { body = await readJSON(request); } catch (error) { return json({ ok: false, error: error.message }, 400); }
    if (!body?.messages) return json({ ok: false, error: 'messages required' }, 400);
    const model = MODELS.find(item => item.id === body.model) ?? MODELS[0];
    const raw = body.messages;
    const messages = Array.isArray(raw) ? raw : [
      { role: 'system', content: String(raw.system ?? '') },
      { role: 'user', content: String(raw.user ?? '') }
    ];
    if (!messages.some(message => String(message.content ?? '').trim())) return json({ ok: false, error: 'empty messages' }, 400);
    const maxTokens = Math.min(Number(body.maxTokens) || 16000, 24000);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 240000);
    try {
      const response = await fetch(`${OPENCODE_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${env.OPENCODE_TOKEN}`,
          'x-opencode-session': `public-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
        },
        body: JSON.stringify({
          model: model.id,
          messages,
          max_tokens: maxTokens,
          temperature: 0.3,
          stream: false,
          ...(model.id.includes('hy4') ? { reasoning_effort: 'low' } : {})
        }),
        signal: controller.signal
      });
      const text = await response.text();
      let payload;
      try { payload = JSON.parse(text); } catch { payload = null; }
      if (!response.ok) return json({ ok: false, error: payload?.error?.message ?? text.slice(0, 300) ?? `Provider returned ${response.status}` }, 502);
      const choice = payload?.choices?.[0];
      const content = choice?.message?.content ?? '';
      if (!content.trim()) return json({ ok: false, error: 'Provider returned an empty response' }, 502);
      return json({
        ok: true,
        model: payload.model ?? model.id,
        finishReason: choice?.finish_reason ?? null,
        text: content,
        usage: {
          input: payload.usage?.prompt_tokens ?? null,
          output: payload.usage?.completion_tokens ?? null,
          total: payload.usage?.total_tokens ?? null,
          cost: payload.usage?.cost ?? null
        }
      });
    } catch (error) {
      return json({ ok: false, error: controller.signal.aborted ? 'The free connector timed out' : error.message }, 502);
    } finally {
      clearTimeout(timer);
    }
  }
};
