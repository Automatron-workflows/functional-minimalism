# Functional Minimalism verification · 18 November 2026

## Prompt-lab update · 18 November 2026

- 54 unit/CLI tests pass, including prompt construction, provider wire formats, HTML extraction/sanitization, content-only outlines and the recorded-run schema.
- Static build and source checks pass. `npm run test:browser` passes 26 workshop assertions and 8 prompt-lab assertions at actual 390px and 1440px widths, with zero browser exceptions. Lab evidence is stored in `artifacts/browser-results.json`.
- The recorded set contains four actual model runs: Beam (free), LongCat 2.5 (free), Qwen 3.8 Flash (open model) and Claude Haiku 5.5 (frontier reference). Each run stores the first-draft HTML, the harness-pass HTML, rendered measurements at 1280px and 390px, and two screenshots. The Claude run was recovered from an earlier recording; its timings and token counts are missing.
- The harness pass uses the real compact brief from `composeBrief`, invoice task guidance, the design principles and a content-only outline of the first draft. The first draft has no harness context.
- The four-model live fan-out was exercised in Chromium with a deterministic mocked provider response. No real OpenRouter, OpenAI or Anthropic key was used in automated verification. Live provider calls, rate limits and model-specific behavior remain unverified in CI.
- The recorded page and live flow are a demonstration, not a benchmark, usability study, full audit or coding-agent repair loop.

## Foundation update · 15 November 2026

- 37 unit/CLI tests pass, including all 13 adapter declaration matchers, UI selection, selective context, manifest preservation, config drift, symlink refusal and surface-policy failures.
- Static build and source checks pass. New source adds no npm/runtime dependency.
- Preinstalled Chromium/Playwright ran 25 workshop assertions at actual 390px and 1440px, with zero browser exceptions. Invoice confirmation preserves supplier, amount, destination and consequence. A DOM fixture verifies feature/control collection and excludes a hidden feature. See [captured summary](verification-source-2026-11-15.json).
- The React adapters provide declared-stack context. Real consuming applications for every library/version have not been compiled or browser-certified. The appliance is a planning contract, not a running fourth demo.
- No model/token benchmark or participant usability study has been run. Publication/access restrictions from the 14 November record below remain unresolved.

## Prior release evidence · 14 November 2026

## Verified source

- 28 unit and CLI integration tests pass. Static build and source checks pass: ten mapped components, three contracts, zero findings.
- Chromium in GitHub Actions: **26 browser assertions pass at actual 390px and 1440px viewports**, including all three flows and every contracted state. Browser exceptions: zero. The dialog focus regression has a source-level test and was also checked through the live invoice flow.
- A new regression proves native modal dialogs escape ancestor clipping, while genuinely clipped controls inside a modal still fail. The collector now follows the browser's top-layer behavior.
- Additional browser interaction checks pass at both sizes: Why and modal focus restoration, setup selectors and generated commands, clipboard-denied fallback, actual source ZIP download, embedded workshop open/close, portable brief download, and accepted screen-memory isolation.
- Reduced-motion preference prevents autoplay. Landing and workshop screenshots were inspected on mobile and desktop. The mobile transport no longer covers the example, and Try the harness appears in the hero.
- Starter export tests match the CLI-installed START_HERE.md for discovery, invoice and project, with scoped decisions and installed component paths.
- Source archive extraction, setup and doctor are checked independently of the presentation.

These are automated browser checks of the source served over HTTP. They are not a human usability study.

## Deployment and access

- Public source: https://github.com/Automatron-workflows/functional-minimalism
- Public demo: https://automatron-workflows.github.io/functional-minimalism/
- Pages returns HTTP 200 anonymously and redirects to the runnable `/demo/` landing page.
- The [latest main workflow](https://github.com/Automatron-workflows/functional-minimalism/actions/runs/43698444174) passes both build and deploy jobs. The required PR workflow passes 26 browser assertions at each actual viewport, 390px and 1440px.
- The prior [failed workflow](https://github.com/Automatron-workflows/functional-minimalism/actions/runs/43431360772) correctly rejected a 500px browser window mislabeled as 390px; that runner was fixed rather than weakened.

## Reproduction and remaining checks

```sh
npm test
npm run build
npm run check
npm run test:browser
```

The dependency-free browser runner requires an installed, permitted Chrome.

Open dist/Functional_Minimalism_Preview.html for the complete offline demo. Open dist/Functional_Minimalism_Workshop.html for the standalone workshop.

Remaining evidence limits: no human usability study, assistive-technology review, or paired model comparison has been run. Time and token savings remain unmeasured. Live Figma import and an Alps source pack remain unimplemented.
