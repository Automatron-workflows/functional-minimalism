# Functional Minimalism verification · 14 November 2026

## Verified source

- 28 unit and CLI integration tests pass. Static build and source checks pass: ten mapped components, three contracts, zero findings.
- Chromium with preinstalled Playwright: **25 browser assertions pass at actual 390px and 1440px viewports**, including all three flows and every contracted state. Browser exceptions: zero.
- A new regression proves native modal dialogs escape ancestor clipping, while genuinely clipped controls inside a modal still fail. The collector now follows the browser's top-layer behavior.
- Additional browser interaction checks pass at both sizes: Why and modal focus restoration, setup selectors and generated commands, clipboard-denied fallback, actual source ZIP download, embedded workshop open/close, portable brief download, and accepted screen-memory isolation.
- Reduced-motion preference prevents autoplay. Landing and workshop screenshots were inspected on mobile and desktop. The mobile transport no longer covers the example, and Try the harness appears in the hero.
- Starter export tests match the CLI-installed START_HERE.md for discovery, invoice and project, with scoped decisions and installed component paths.
- Source archive extraction, setup and doctor are checked independently of the presentation.

The hosted editing environment has preinstalled Chromium and Playwright, so these are real browser checks of the source served over HTTP. They are **not** successful public deployment checks or a human usability study.

## Deployment and access

- Public source: https://github.com/Automatron-workflows/functional-minimalism
- Hosted deployment: https://functional-minimalism.higgsfield.app
- Hosting platform reports **deployed**. Its build accepted the existing demo and a thin TanStack server adapter.
- Anonymous HTTP requests receive 401. An unauthenticated browser is redirected to Higgsfield sign-in before reaching the demo. Therefore live anonymous usability and downloads remain **blocked** despite deployment success.
- No public-access toggle is exposed by the connected website tools. Community-feed publication is a separate action and was not used as an undocumented authentication workaround.
- GitHub Pages is enabled, but its latest remote run is still the failed [run 43431360772](https://github.com/Automatron-workflows/functional-minimalism/actions/runs/43431360772). That earlier revision had 500px/1440px coverage and correctly failed the required 390px evidence gate.
- The local branch contains the viewport and modal-audit fixes. Git transport cannot resolve github.com, and the GitHub integration rejects content writes with HTTP 403. These changes still need an authenticated push.

## Reproduction and remaining checks

```sh
npm test
npm run build
npm run check
npm run test:browser
```

The dependency-free browser runner requires an installed, permitted Chrome. Its direct dump-DOM mode did not complete in the hosted sandbox, although the equivalent workshop assertions and collected evidence passed using the platform's supported Playwright browser. The updated GitHub CI runner still needs its own successful run.

Open dist/Functional_Minimalism_Preview.html for the complete offline demo. Open dist/Functional_Minimalism_Workshop.html for the standalone workshop.

Remaining release work: push main using an authenticated Git client, inspect the resulting Pages workflow, and run anonymous acceptance against the returned URL. GitHub Desktop's Push origin can perform the missing push. A comprehensive accessibility audit, assistive-technology review, human usability study and paired model comparison have not been run. Time and token savings remain unmeasured. Live Figma import and an Alps source pack remain unimplemented.
