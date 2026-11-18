# Prompt lab and recorded model runs

The landing page compares a model's own first draft with the same model applying the Functional Minimalism brief. It is a demonstration layer, not the harness runtime. The harness CLI still makes no model calls.

## What the page does

1. The prompt is prefilled with an invoice-review request.
2. **Recorded mode** reads four stored runs from `demo/runs/`. Each run contains the prompt, model metadata, the first-draft HTML, the harness-pass HTML, rendered measurements at 1280 and 390px, and two screenshots.
3. **Live mode** uses a provider key pasted into the Connect panel. With OpenRouter, the page selects up to four free models and runs both passes for each model, two at a time. Other providers run the selected model once. Keys stay in the browser and are sent only to the provider.
4. The before/after view renders the stored HTML in a sandboxed iframe. **What changed** is computed from the rendered DOM: words, paragraph words, controls, unnamed controls, clipped controls, action-labelled controls, headings, horizontal overflow and, for the recorded invoice prompt, the required facts.

The harness pass receives the compact brief produced by the real `composeBrief` compiler, the invoice task guidance, the Functional Minimalism principles and a content-only outline of the draft. It does not receive the draft's CSS. It rebuilds the composition rather than copying the first draft.

## Recorded set

| Model | Access | Notes |
| --- | --- | --- |
| Beam | OpenCode Go, free | Generated 18 November 2026 |
| LongCat 2.5 | OpenCode Go, free | Generated 17 November 2026 |
| Qwen 3.8 Flash | OpenCode Go, open model | Generated 17 November 2026 |
| Claude Haiku 5.5 | OpenCode Go, frontier reference | Recovered from an earlier recorded run; timings and tokens were not captured |

Recorded runs are one sample per model. Free models are rate-limited and can be slower or return partial results. The page keeps partial successes and reports failures per model. A single run is not a benchmark, a usability study or evidence of a general time saving.

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

The model list and the invoice prompt live in `scripts/generate-lab-runs.mjs` and `demo/presets.json`. The brief comes from `packs/studio/pack.json` and `examples/invoice.screen.json`; change those, then regenerate.

## Live mode

The live panel supports OpenAI, Anthropic and OpenRouter. OpenRouter is the default because it exposes free models with browser CORS. OpenAI and Anthropic also allow browser requests; the Anthropic request sends `anthropic-dangerous-direct-browser-access`. The page has no server and no telemetry.

- The key is held in memory. It is written to `sessionStorage` so a reload keeps the tab connected. **Remember on this device** moves it to `localStorage`; Disconnect removes both.
- Each model call is limited to 180 seconds. Cancel aborts every in-flight model.
- The generated HTML is sanitized (scripts, frames, event handlers and external requests removed), receives a restrictive CSP and is rendered in a sandboxed iframe. It is not executed as application code.
- The four-model fan-out runs with a concurrency of two. The rail reports Queued, Drafting, Harness, Measuring, Ready or Failed for each model. Results are not stored on a server and are not added to the recorded set.

## What it does not do

The lab does not run a coding agent, a browser repair loop, the full CLI audit or a controlled paired experiment. It does not authenticate the model response, guarantee completion, or certify accessibility. The measurements are a transparent heuristic. Use [the experiment](EXPERIMENT.md) and the CLI evidence checks for actual acceptance work.
