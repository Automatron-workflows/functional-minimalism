// Provider-neutral prompt lab support. No credentials are stored here.
// The harness itself makes no model calls; the demonstration calls the
// provider a visitor connects, or renders recorded runs generated offline.

export const LAB_RUN_SCHEMA = 'functional-minimalism.lab-run/1';
export const LAB_INDEX_SCHEMA = 'functional-minimalism.lab-index/1';

export const PROVIDERS = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    keyLabel: 'OpenAI API key',
    keyURL: 'https://platform.openai.com/api-keys',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    docs: 'https://platform.openai.com/docs/api-reference/chat',
    browser: true,
    free: false
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    keyLabel: 'Anthropic API key',
    keyURL: 'https://console.anthropic.com/settings/keys',
    endpoint: 'https://api.anthropic.com/v1/messages',
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
    docs: 'https://docs.anthropic.com/en/api/messages',
    browser: true,
    free: false
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    keyLabel: 'OpenRouter API key',
    keyURL: 'https://openrouter.ai/keys',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    docs: 'https://openrouter.ai/docs',
    browser: true,
    free: true
  }
};

const htmlStart = /<!doctype\s+html|<html[\s>]|<body[\s>]|<main[\s>]|<div[\s>]/i;

export function extractHTML(text) {
  let value = String(text ?? '').trim();
  const fenced = value.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) value = fenced[1].trim();
  const start = value.search(htmlStart);
  if (start > 0) value = value.slice(start);
  const end = value.toLowerCase().lastIndexOf('</html>');
  if (end >= 0) value = value.slice(0, end + 7);
  if (!/^<!doctype/i.test(value) && !/^<html[\s>]/i.test(value)) {
    value = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${value}</body></html>`;
  }
  return value.trim();
}

// Conservative, layered with a CSP and a sandboxed iframe. It removes active
// content and external requests; it is not a general-purpose HTML sanitizer.
export function sanitizeHTML(input, { csp = true } = {}) {
  let html = extractHTML(input);
  html = html.replace(/<meta\b[^>]*http-equiv\s*=\s*(?:"content-security-policy"|'content-security-policy'|content-security-policy)[^>]*>/gi, '');
  html = html.replace(/<meta\b[^>]*charset\b[^>]*>/gi, '');
  html = html.replace(/<meta\b[^>]*name\s*=\s*(?:"viewport"|'viewport'|viewport)[^>]*>/gi, '');
  html = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  html = html.replace(/<script\b[^>]*\/?>/gi, '');
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, style =>
    style.replace(/@import[^;]+;/gi, '').replace(/url\(\s*(['"]?)https?:[\s\S]*?\1\s*\)/gi, 'none')
  );
  html = html.replace(/<(iframe|object|embed|link|base)\b[\s\S]*?<\/\1\s*>/gi, '');
  html = html.replace(/<(iframe|object|embed|link|base)\b[^>]*\/?>/gi, '');
  html = html.replace(/<meta\b[^>]*http-equiv\s*=\s*(?:"refresh"|'refresh'|refresh)[^>]*>/gi, '');
  html = html.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/\s(?:href|src|srcset|poster|action)\s*=\s*(?:"\s*(?:javascript|https?|data:text\/html)[^"]*"|'\s*(?:javascript|https?|data:text\/html)[^']*'|(?:javascript|https?|data:text\/html)[^\s>]*)/gi, '');
  html = html.replace(/@import[^;]+;/gi, '');
  html = html.replace(/url\(\s*(['"]?)https?:[\s\S]*?\1\s*\)/gi, 'none');
  const cspMeta = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; font-src data:; script-src \'none\'; connect-src \'none\'; frame-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">';
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${csp ? cspMeta : ''}`;
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1>${head}`);
  else html = html.replace(/<html([^>]*)>/i, `<html$1><head>${head}</head>`);
  return html.trim();
}

export function contentOnlyHTML(input) {
  let html = String(input ?? '');
  html = html.replace(/<head\b[\s\S]*?<\/head\s*>/gi, '');
  html = html.replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/\s(?:class|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/\s(?:on\w+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  html = html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return html;
}

export function buildBaselineMessages(prompt) {
  return {
    system: [
      'You are a coding agent. Build the screen the user asks for as one complete, self-contained HTML document.',
      'Use inline CSS in a style tag. Use system fonts and CSS shapes. Do not use external images, fonts, scripts or network requests.',
      'Target a 1280 by 800 desktop viewport and make the layout work at 390px. Use fictional data. Do not include a script tag.',
      'Return only the HTML document, with no markdown fences or explanation.'
    ].join(' '),
    user: String(prompt ?? '').trim()
  };
}

export function buildHarnessMessages({ prompt, beforeHTML, brief, rules, pack, guidance, outline }) {
  const parts = [
    'You are applying Functional Minimalism, a design harness for AI-built interfaces, to a model-generated screen.',
    'Rebuild the same screen so it follows the rules and brief below. Preserve every factual detail, label, value, permission, consequence and recovery path from the user request and the current HTML. Do not invent data. Keep the product\'s own character, palette and typography; do not replace them with a generic theme.',
    'Return one complete, self-contained HTML document with inline CSS, system fonts, CSS shapes only, no external requests and no scripts. Target 1280 by 800 and make the layout work at 390px.',
    'Keep the primary action and the decision facts visible in the first screen at 1280 by 800. Do not hide required information to make the page shorter.'
  ];
  if (outline) parts.push('The current HTML is a content and structure outline. Its presentational CSS is intentionally omitted; rebuild the visual design from the brief and the model\'s existing character.');
  if (guidance?.length) parts.push(`## Task guidance\n${guidance.map(item => `- ${item}`).join('\n')}`);
  if (rules) parts.push(`## Design rules\n${String(rules).trim()}`);
  if (brief) parts.push(`## Screen brief\n${String(brief).trim()}`);
  if (pack?.principles?.length) parts.push(`## Pack principles\n${pack.principles.map(item => `- ${item}`).join('\n')}`);
  if (beforeHTML) parts.push(`## Current HTML\n${String(beforeHTML).trim()}`);
  parts.push('## Output\nReturn only the complete HTML document. No markdown fences, commentary, script tags or external assets.');
  return {
    system: parts.join('\n\n'),
    user: `User request:\n${String(prompt ?? '').trim()}\n\nApply the harness to the current HTML.`
  };
}

export function providerHeaders(providerId, key) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  if (providerId === 'anthropic') return {
    'content-type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
  if (providerId === 'openrouter') return {
    'content-type': 'application/json',
    authorization: `Bearer ${key}`,
    'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://automatron-workflows.github.io/functional-minimalism/',
    'X-Title': 'Functional Minimalism Lab'
  };
  return { 'content-type': 'application/json', authorization: `Bearer ${key}` };
}

export function providerBody(providerId, { model, messages, maxTokens = 12000, temperature = 0.3, reasoningEffort = null }) {
  if (providerId === 'anthropic') return {
    model,
    max_tokens: maxTokens,
    temperature,
    system: messages.system,
    messages: [{ role: 'user', content: messages.user }]
  };
  if (providerId === 'openrouter') return {
    model,
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user }
    ],
    max_tokens: maxTokens,
    temperature,
    usage: { include: true },
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {})
  };
  const openAIReasoning = /^(gpt-5|gpt-6|o\d)/i.test(model);
  return {
    model,
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user }
    ],
    ...(openAIReasoning ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens, temperature }),
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {})
  };
}

export function parseProviderResponse(providerId, json) {
  if (providerId === 'anthropic') {
    const text = (json?.content ?? []).filter(part => part.type === 'text').map(part => part.text).join('');
    return {
      text,
      model: json?.model ?? null,
      finishReason: json?.stop_reason ?? null,
      usage: {
        input: json?.usage?.input_tokens ?? null,
        output: json?.usage?.output_tokens ?? null,
        total: (json?.usage?.input_tokens ?? 0) + (json?.usage?.output_tokens ?? 0) || null
      }
    };
  }
  const choice = json?.choices?.[0];
  return {
    text: choice?.message?.content ?? '',
    model: json?.model ?? null,
    finishReason: choice?.finish_reason ?? null,
    usage: {
      input: json?.usage?.prompt_tokens ?? null,
      output: json?.usage?.completion_tokens ?? null,
      total: json?.usage?.total_tokens ?? null,
      cost: json?.usage?.cost ?? null
    }
  };
}

export function parseModels(providerId, json) {
  const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  return rows.map(row => {
    const id = row.id ?? row.name ?? row.slug;
    if (!id) return null;
    const promptPrice = row.pricing?.prompt;
    const completionPrice = row.pricing?.completion;
    const free = providerId === 'openrouter'
      ? /:free$/i.test(id) || (Number(promptPrice) === 0 && Number(completionPrice) === 0 && promptPrice !== undefined)
      : /(?:^|[-/])free(?:$|[-/])/i.test(id);
    return {
      id,
      label: row.display_name ?? row.name ?? id,
      free,
      context: row.context_length ?? row.context_window ?? null,
      created: row.created ?? null
    };
  }).filter(Boolean).sort((a, b) => {
    if (a.free !== b.free) return a.free ? -1 : 1;
    return String(a.label).localeCompare(String(b.label));
  });
}

export async function requestProvider(providerId, { key, model, messages, maxTokens = 12000, temperature = 0.3, reasoningEffort = null, fetchImpl = fetch, signal } = {}) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  if (!key) throw new Error(`Add a ${provider.label} API key first.`);
  if (!model) throw new Error('Choose a model first.');
  const started = Date.now();
  const response = await fetchImpl(provider.endpoint, {
    method: 'POST',
    headers: providerHeaders(providerId, key),
    body: JSON.stringify(providerBody(providerId, { model, messages, maxTokens, temperature, reasoningEffort })),
    signal
  });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!response.ok) {
    const message = json?.error?.message ?? json?.error?.type ?? text.slice(0, 300) ?? `Request failed with ${response.status}`;
    throw new Error(`${provider.label}: ${message}`);
  }
  if (!json) throw new Error(`${provider.label} returned a response that was not JSON.`);
  const parsed = parseProviderResponse(providerId, json);
  if (!parsed.text.trim()) throw new Error(`${provider.label} returned an empty response.`);
  return { ...parsed, elapsedMs: Date.now() - started };
}

export async function listProviderModels(providerId, { key, fetchImpl = fetch, signal } = {}) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  if (!key) throw new Error(`Add a ${provider.label} API key first.`);
  const headers = providerHeaders(providerId, key);
  delete headers['content-type'];
  const response = await fetchImpl(provider.modelsEndpoint, { headers, signal });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!response.ok) {
    const message = json?.error?.message ?? json?.error?.type ?? text.slice(0, 300) ?? `Request failed with ${response.status}`;
    throw new Error(`${provider.label}: ${message}`);
  }
  const models = parseModels(providerId, json);
  if (!models.length) throw new Error(`${provider.label} returned no models for this key.`);
  return models;
}

export function summarizeMeasures(before, after) {
  const rows = [
    ['Visible words', 'words'],
    ['Paragraph words', 'paragraphWords'],
    ['Controls', 'controls'],
    ['Unnamed controls', 'unnamed'],
    ['Clipped controls', 'clipped'],
    ['Action-labelled controls', 'actionControls'],
    ['Headings', 'headings']
  ];
  return rows.map(([label, key]) => ({ label, before: before?.[key] ?? null, after: after?.[key] ?? null }));
}

export function runSlug({ preset, model }) {
  return `${preset}-${String(model).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
}
