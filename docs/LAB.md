# Prompt lab, approved gallery and benchmark

The landing page compares a model's own first draft with the approved Atelier result. It is a demonstration layer, not the harness runtime. The harness CLI still makes no model calls.

## The default view

The page opens on the **approved Atelier template** for the North Studio invoice prompt. The before is the model's own first draft. The after is the harness result, built from:

- the real compact brief from `composeBrief` and `packs/atelier/pack.json`;
- the invoice task guidance and the Atelier visual system in `demo/presets.json`;
- the realistic invoice fixture in `demo/fixtures/invoice.json`, supplied to both conditions;
- a content-only outline of the first draft, so the harness rebuilds composition instead of copying CSS;
- the manually reviewed component gallery in `gallery/templates.json` for live generation.

The page shows one design, not four competing designs. The four recorded models are kept for the benchmark and are linked from the model rail and the benchmark note.

## Approved component gallery

`gallery/templates.json` is the open, MIT-licensed vocabulary. Each component records its HTML, CSS, rules, approval, date and license. The hosted gallery at `/gallery/` renders the components and reads local approval proposals from the same browser.

The live harness pass includes the gallery in its prompt. The instruction is explicit: reuse the approved components, structures and tokens; do not invent a new visual language. The gallery is a reviewed starting point, not an automatic training set.

The **Approve this design** button in **Run details** stores a local proposal and downloads `gallery-proposal-<model>.json`. A person reviews the proposal, extracts reusable components and merges reviewed components into `gallery/templates.json`. Nothing is learned automatically from an unapproved output. Every gallery revision should be benchmarked before it becomes the default.

## Recorded models and benchmark

`demo/runs/` contains four actual v1 runs: Beam (free), LongCat 2.5 (free), Qwen 3.8 Flash (open model) and Claude Haiku 5.5 (frontier reference). LongCat 2.5 is the approved default. The v0 runs are archived in `docs/benchmark/v0/`.

```sh
npm run benchmark:lab
```

The benchmark measures each run at 1280 and 390px with `demo/measure.mjs` and scores it with `src/craft.mjs`. The heuristic covers text restraint, paragraph restraint, action clarity, hierarchy, cohesion, whitespace, responsive integrity, required facts and contrast, with penalties for missing facts, overflow, a disabled primary action and extreme word counts.

The v1 after pass averaged **96.2/100** against **77.7** for v0, and all four models improved. See [the benchmark](BENCHMARK.md) for the per-model table, component points, rendered evidence and limits. The score is not a beauty model, a usability study or the CLI audit.

The approved gallery is the live layer. A first LongCat 2.5 gallery pass duplicated the hero amount and was rejected (`docs/benchmark/v2-longcat-gallery/`). The tightened rules fixed it in a second pass: 136 words, the amount repeated twice, the page shell applied. That pass scored 92.7 against 96.3 for the recorded v1, so the default remains v1; the evidence is in `docs/benchmark/v3-longcat-gallery/`. The live connector uses the tightened gallery so a visitor can generate on demand. A full v3 benchmark remains pending.

## Reproduce the recorded runs

The generator uses the OpenCode chat-completions endpoint. Set an API key in the environment; the key is never written to the repository.

```sh
OPENCODE_API_KEY=... npm run generate:runs -- --presets invoice --force
```

Useful flags:

```sh
--models beam-free,longcat-2.5-free
--presets invoice
--force             # regenerate even when run files exist
--remeasure         # recompute measurements without calling a model
--before <file>     # ingest a recorded first draft instead of calling the API
--after <file>      # ingest a recorded harness pass instead of calling the API
```

The script writes `demo/runs/<preset>-<model>.json`, two PNGs and `demo/runs/index.json`. `npm run build` copies them into `dist/`; the standalone preview embeds them as data URLs.

## Free connector (no visitor key)

The lab prefers a host-configured free connector over BYOK.

- **Local:** `OPENCODE_API_KEY=... npm run dev` starts `/api/lab`. The browser shows **Free local connector** and generates without a key. The token stays in Node.
- **Public:** deploy `worker/index.mjs` to Cloudflare Workers with `OPENCODE_TOKEN` as a secret, then set `demo/lab-config.json` to the Worker URL and rebuild. Visitors no longer need keys.
- **Models:** `longcat-2.5-free`, `beam-free`, `hy4-flash-free` only. Output is capped at 24,000 tokens; the local server waits 300 seconds, the Worker 240.
- **Fallbacks:** no connector -> approved recorded template plus optional BYOK; connector failure -> error and the previous design stays.

See [the public connector guide](PUBLIC-CONNECTOR.md) for deployment, rate limits and the security boundary.

## Live mode

The live panel prefers the host free connector. If none is configured, it supports OpenAI, Anthropic and OpenRouter; OpenRouter is the BYOK default because it exposes free models with browser CORS. OpenAI and Anthropic also allow browser requests; the Anthropic request sends `anthropic-dangerous-direct-browser-access`. The page has no server and no telemetry.

- The key is held in memory. It is written to `sessionStorage` so a reload keeps the tab connected. **Remember on this device** moves it to `localStorage`; Disconnect removes both.
- Each model call is limited to 180 seconds. Cancel aborts the in-flight calls.
- The generated HTML is sanitized (scripts, frames, event handlers and external requests removed), receives a restrictive CSP and is rendered in a sandboxed iframe. It is not executed as application code.
- The harness pass receives the approved gallery. One design is generated, not four. The result is not stored on a server.

## What it does not do

The lab does not run a coding agent, a browser repair loop, the full CLI audit or a controlled paired experiment. It does not authenticate the model response, guarantee completion, or certify accessibility. The measurements are a transparent heuristic. Use [the experiment](EXPERIMENT.md) and the CLI evidence checks for actual acceptance work.
