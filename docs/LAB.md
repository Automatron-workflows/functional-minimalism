# Prompt lab

The lab shows one prompt through four models, with and without the design harness. Nothing else is on the page.

## The page

1. A prefilled prompt sits at the top. Write anything in it.
2. **Generate 4 designs** runs four models. Each model makes its own first draft, then a second pass with the Functional Minimalism brief.
3. Four cards show the results. Every card has a **Before / After** control:
   - **Before** is that model's first draft, with no harness context.
   - **After** is the same model applying the Atelier visual system, the invoice fixture, the approved component gallery and the compact brief.
4. The four recorded cards (Beam, Claude Haiku 5.5, LongCat 2.5, Qwen 3.8 Flash) are available without a key. Live generation replaces them with the four current results.

The harness pass receives a content-only outline of the draft, not its CSS, so it rebuilds composition instead of copying it.

## Approved gallery

`gallery/templates.json` is the manually reviewed MIT dataset of components: page shell, brand line, document, hero amount, summary rail, primary action, line items, labels and status. It is rendered at `/gallery/`. The live harness prompt includes it and requires reuse of its structures and tokens. The gallery is versioned by hand; nothing is trained automatically from an unapproved result.

## Free connector

The page prefers a host-configured free connector over asking every visitor for a key.

- **Local:** `OPENCODE_API_KEY=... npm run dev` starts `/api/lab`; the page detects it and generates without a browser key.
- **Public:** deploy `worker/index.mjs` once with `OPENCODE_TOKEN` as a Cloudflare secret, set `demo/lab-config.json` to the Worker URL, and rebuild. Visitors then need no key.
- **Models:** `longcat-2.5-free`, `beam-free`, `hy4-flash-free` and the open `qwen3.8-flash`. The first three are free; Qwen has a small provider cost.
- **Fallbacks:** no connector -> the four recorded cards remain and BYOK is available; a failed live card reports its own error.

See [the connector guide](PUBLIC-CONNECTOR.md).

## Recorded models

| Model | Access |
| --- | --- |
| Beam | OpenCode Go, free |
| Claude Haiku 5.5 | OpenCode Go, frontier reference |
| LongCat 2.5 | OpenCode Go, free |
| Qwen 3.8 Flash | OpenCode Go, open model |

The runs are actual model output. A single run is not a usability study.

## Benchmark

The four recorded runs are archived for a reproducible craft comparison:

```sh
npm run benchmark:lab
```

It writes `docs/BENCHMARK.md` and `docs/benchmark.json`. The v1 after pass averaged 96.2/100 against 77.7 for v0, with 4 of 4 models improving. The score is a transparent heuristic, not a beauty model, and the benchmark is not part of the demo page.

The gallery was tried in two later passes. The first duplicated the hero amount and was rejected. The tightened second pass fixed the duplication but scored lower than v1, so it was not promoted. Evidence is in `docs/benchmark/v2-longcat-gallery/` and `docs/benchmark/v3-longcat-gallery/`.

## Reproduce the recorded runs

```sh
OPENCODE_API_KEY=... npm run generate:runs -- --presets invoice --force
```

Useful flags: `--models`, `--presets`, `--force`, `--remeasure`, `--before <file>`, `--after <file>`. The script writes `demo/runs/`, and `npm run build` copies it into `dist/`.

## Limits

The lab does not run a coding agent, a repair loop, the full CLI audit or a controlled experiment. It does not authenticate model responses or certify accessibility. Use [the experiment](EXPERIMENT.md) and the CLI evidence checks for acceptance work.
