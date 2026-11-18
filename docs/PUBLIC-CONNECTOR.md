# Keyless free connector

The prompt lab can generate a design without asking each visitor for an API key. It uses a small server-side connector that holds one free-model token and exposes only the free model allowlist.

## Local development

Run the local server with an OpenCode token in the environment:

```sh
OPENCODE_API_KEY=... npm run dev
```

Open the lab at `http://127.0.0.1:4178/demo/`. The page checks `/api/lab/health`; when the token is present it shows **Free local connector** and **Generate design** works without a browser key. The token stays in the Node process and is never sent to the page.

The local connector exposes:

```text
GET  /api/lab/health
POST /api/lab/generate
```

Only these models are accepted by the local connector:

- `longcat-2.5-free`
- `beam-free`
- `hy4-flash-free`
- `qwen3.8-flash` (open model; low cost, not free)

Requests are capped at 24,000 output tokens and 300 seconds.

## Public demo

GitHub Pages is static. To remove key friction for anonymous visitors, deploy the included Cloudflare Worker once:

```sh
cd worker
npx wrangler login
npx wrangler secret put OPENCODE_TOKEN
npx wrangler deploy
```

Copy the deployed Worker URL into `demo/lab-config.json`:

```json
{ "endpoint": "https://functional-minimalism-lab.<account>.workers.dev" }
```

Then rebuild and publish:

```sh
npm run build
```

Visitors now get the free public connector without a key. The page probes `${endpoint}/health` and falls back to BYOK or the recorded approved template if the Worker is unavailable.

The Worker:

- allows the three free models plus Qwen 3.8 Flash, an open model with a small provider cost;
- keeps `OPENCODE_TOKEN` as a Worker secret;
- adds CORS headers so the GitHub Pages lab can call it;
- limits each IP to 30 requests per hour in the current isolate;
- caps output at 24,000 tokens and times out at 240 seconds;
- never stores prompts or responses.

The in-memory IP limit is a basic abuse control, not a global quota. For a busier deployment, add Cloudflare KV or a rate-limit binding, and monitor the provider account. Free models are themselves rate-limited and can be slow.

## Token scope

Use an OpenCode Go API key or the local OpenCode access token with access to the free models. Do not put an OpenAI, Anthropic or OpenRouter key in the Worker unless you are prepared to pay for every visitor; the Worker is deliberately restricted to free models.

## Fallbacks

- No connector and no BYOK key: the approved recorded Atelier template and four-model benchmark remain available.
- Connector failure: the page reports the provider error and keeps the previous design.
- A visitor can still connect OpenAI, Anthropic or OpenRouter with their own key. That path overrides the free connector.

## Verification

```sh
curl https://your-worker.example/health
curl -X POST https://your-worker.example/generate \
  -H 'content-type: application/json' \
  -d '{"model":"longcat-2.5-free","messages":{"system":"Reply with ready.","user":"ready"},"maxTokens":32}'
```

The Worker source is in `worker/index.mjs` and is MIT licensed with the rest of the repository.
