# Prompt-lab benchmark

Generated 2026-11-18 from 4 recorded models. Each model has one run per harness version. The v1 first draft received the invoice fixture; v0 used the natural-language prompt without it. The v1 after pass received the Atelier brief, guidance and explicit visual system; v0 used the earlier Studio rules. Compare the before/after delta within each version, not the raw before scores across versions.

## Craft heuristic

The score is a transparent heuristic out of 100: text restraint (15), paragraph restraint (5), action clarity (20), hierarchy (15), visual cohesion (15), whitespace (10), responsive integrity (10), required facts (5) and contrast (5), with penalties for missing facts, overflow, a disabled primary action and extreme word counts. It measures rendered output at 1280 and 390px. It is not a beauty model, a usability study or the CLI audit.

## Before and after, v0 and v1

| Model | v0 before | v0 after | v0 delta | v1 before | v1 after | v1 delta |
| --- | --- | --- | --- | --- | --- | --- |
| Beam | 43.7 | 66.1 | +22.4 | 71.2 | 97.3 | +26.1 |
| Claude Haiku 5.5 | 69.3 | 75 | +5.7 | 60.8 | 97.9 | +37.1 |
| LongCat 2.5 | 47 | 84.5 | +37.5 | 49.5 | 96.3 | +46.8 |
| Qwen 3.8 Flash | 51.5 | 90.1 | +38.6 | 65.4 | 98.2 | +32.8 |

v0 average: before 52.9, after 78.9, delta 26.  
v1 average: before 61.7, after 97.4, delta 35.7.  
v1 improved 4 of 4 models.

## What changed in v1

- An **Atelier** pack with a warm paper canvas, white document, display serif hero amount, one deep-green accent, an 8px spacing scale, six type sizes and one soft shadow.
- A **real invoice fixture** supplied to both conditions, so line items, totals, supplier, customer, destination and consequence are consistent.
- An explicit **visual system** in the harness prompt: page container, two-column document review, 48px gutters, 360px summary rail, one primary action and a 120-word budget.
- The harness pass still receives a content-only outline of the first draft, not its CSS. It rebuilds the composition instead of copying it.

## Next layer: the approved component gallery

The hosted [approved gallery](../gallery/) contains nine manually reviewed components extracted from the Atelier output: page shell, brand line, document, hero amount, summary rail, primary action, line items, labels and status. The live prompt lab now passes that gallery to the harness pass. This table measures v1, which used the Atelier principles without the gallery; the gallery is the next iteration and will be benchmarked as v2.

## Gallery v2 trial (rejected)

A first LongCat 2.5 pass with the approved gallery duplicated the hero amount in the document and the summary rail: 144 words and 88 paragraph words against 130 and 32 in the approved v1 design. It was not approved. The [v2 evidence](./benchmark/v2-longcat-gallery/) is kept for review. The gallery rules now state that each fact appears once and that the summary rail owns the hero amount; the next live pass uses the tightened rules. The approved default remains the v1 LongCat design.

## v1 component points

| Model | text (15) | paragraph (5) | action (20) | hierarchy (15) | cohesion (15) | whitespace (10) | responsive (10) | facts (5) | contrast (5) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Beam | 15 | 3.2 | 20 | 15 | 14.1 | 10 | 10 | 5 | 5 |
| Claude Haiku 5.5 | 14.3 | 3.6 | 20 | 15 | 15 | 10 | 10 | 5 | 5 |
| LongCat 2.5 | 13.8 | 4.3 | 20 | 13.2 | 15 | 10 | 10 | 5 | 5 |
| Qwen 3.8 Flash | 15 | 5 | 20 | 13.2 | 15 | 10 | 10 | 5 | 5 |

## Rendered evidence

| Model | v1 | v0 |
| --- | --- | --- |
| Beam | [v1 before](../demo/runs/invoice-beam-free-before.png) · [v1 after](../demo/runs/invoice-beam-free-after.png) | [v0 before](./benchmark/v0/invoice-beam-free-before.png) · [v0 after](./benchmark/v0/invoice-beam-free-after.png) |
| Claude Haiku 5.5 | [v1 before](../demo/runs/invoice-claude-haiku-5-5-before.png) · [v1 after](../demo/runs/invoice-claude-haiku-5-5-after.png) | [v0 before](./benchmark/v0/invoice-claude-haiku-5-5-before.png) · [v0 after](./benchmark/v0/invoice-claude-haiku-5-5-after.png) |
| LongCat 2.5 | [v1 before](../demo/runs/invoice-longcat-2-5-free-before.png) · [v1 after](../demo/runs/invoice-longcat-2-5-free-after.png) | [v0 before](./benchmark/v0/invoice-longcat-2-5-free-before.png) · [v0 after](./benchmark/v0/invoice-longcat-2-5-free-after.png) |
| Qwen 3.8 Flash | [v1 before](../demo/runs/invoice-qwen3-8-flash-before.png) · [v1 after](../demo/runs/invoice-qwen3-8-flash-after.png) | [v0 before](./benchmark/v0/invoice-qwen3-8-flash-before.png) · [v0 after](./benchmark/v0/invoice-qwen3-8-flash-after.png) |

## Limits

This is four models, one run each, one prompt. It does not establish universal beauty or a time saving. It does not run a coding-agent repair loop, the CLI audit, a participant study or a blind human preference test. The v0 and v1 first drafts were generated with different prompt envelopes because the fixture was added in v1; compare the before/after delta within each version, not the raw before scores across versions.
