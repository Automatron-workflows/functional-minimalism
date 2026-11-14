# Functional Minimalism verification · 14 November 2026

## Passed locally

- **28 unit and CLI integration tests** on Node 18.16.0. This includes component/token validation, essential information, scope isolation, supersession, evidence completeness, non-destructive setup, symlink refusal, instruction checks, and playback gates.
- The new starter export matches the CLI-installed `START_HERE.md` for discovery, invoice, and project. Applicable decisions are remapped to the starter without leaking another screen's decisions or mutating workshop memory.
- Static build and registry/source checks: ten mapped components, three contracts, zero findings. These checks do not certify visual quality.
- Both assembled offline JavaScript modules pass `node --check`.
- Source ZIP integrity passes. Setup and doctor pass from the extracted archive for discovery/Codex, invoice/Claude, and project/both.

## Remote browser evidence from the previous commit

The initial GitHub workflow ran 23 workshop assertions successfully at an actual 500px width and 23 at 1440px. The evidence audit correctly refused to pass because the required 390px coverage was missing. See [run 43431360772](https://github.com/Automatron-workflows/functional-minimalism/actions/runs/43431360772).

The runner is now changed to fixed-width iframe viewports and explicitly rejects a captured width different from the requested width. A new browser assertion covers visible starter-brief output. The updated browser runner has **not** executed successfully in this local environment: the Chrome process fails to launch. The new UI is not browser-verified.

## Publication status

- Public source repository: https://github.com/Automatron-workflows/functional-minimalism
- GitHub Pages is enabled using GitHub Actions.
- There is **no successful Pages deployment**. The latest remote run remains the failed run above; the local release changes have not been pushed.
- The local Git transport cannot resolve `github.com`. The GitHub integration rejects writes with HTTP 403, despite repository metadata reporting that the user has push/admin rights.
- The alternate Sites source host is also unreachable from this runtime. Its existing private, undeployed project was renamed Functional Minimalism; no Site version was deployed.
- Vercel rejected creation of an isolated fallback project with HTTP 403. No project was created. Its CLI is not installed.

These are access and runtime limits. No checks were disabled to claim a deployment.

## Remaining browser acceptance

- Actual 390px and 1440px workshop evidence after the viewport fix.
- Landing composition, contrast, 200% text enlargement, focus, and keyboard traversal.
- Playback, pause/resume/replay, reduced motion, hidden/offscreen suspension, and modal focus.
- Why and Set up, selectors, clipboard fallback, source download, workshop open/close.
- Get screen brief, copy/download, example switching, and project versus screen memory.
- Discovery preview/save/filter, simulated invoice confirmation/recovery, and task creation/filtering.

No participant usability study or model comparison has been run. Token and elapsed-time savings remain unmeasured. Live Figma importing and an Alps source pack are not implemented.

## Complete the release

From an authenticated, network-enabled Git client, push the local `main` branch to `Automatron-workflows/functional-minimalism`. GitHub Desktop's **Push origin** performs this step without changing the credentials available to this runtime.

The Pages workflow runs unit tests, build, source checks, and browser checks before deployment. Review its result and repair any real findings. Only then open the returned Pages URL and complete the acceptance list above.

Reproduce locally:

```sh
npm test
npm run build
npm run check
npm run test:browser
```

The browser runner requires permission to launch an installed Chrome. It does not download a browser or disable its sandbox. Open `dist/Functional_Minimalism_Preview.html` for the offline demo, or `dist/Functional_Minimalism_Workshop.html` for the standalone workshop.
