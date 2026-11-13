# Functional Minimalism v0.3 verification · 13 November 2026

## Passed

- **26 unit and CLI integration tests** on Node 18.16.0. Coverage includes token/type/alias validation, task information, evidence completeness, scope isolation, supersession, lexical CSS findings, non-destructive initialization, symlink refusal, CLI errors, first-screen setup, instruction preflight, doctor findings, and illustration playback gates.
- Static build with a self-contained branded preview, embedded workshop and downloadable source archive.
- Registry/source checks for ten mapped components, three screen contracts, generated-token consistency and reference-system CSS. Zero findings. The branded presentation's CSS is separate from the Studio pack; the reference CSS check does not certify it.
- JavaScript syntax checks for source, CLI, demo and build modules, plus both assembled standalone scripts.
- ZIP integrity and successful setup/doctor from an extracted source archive for discovery/Codex, invoice/Claude, and project/both. These checks exercise real packaged files, not only source imports.

## Earlier environment limitations

The local environment rejects HTTP port binding and cannot launch the installed headless Chrome. The browser security policy also rejected a local file URL; no alternate browser route was used for that blocked action. These limitations were established in the preceding audit and are not claimed to have changed.

A new private Site was registered for the hosted demo. Source publication failed because the environment could not resolve the Git host. No Site version was deployed through that route. The static output and hosting manifest remain prepared for a later publication attempt. GitHub CLI authentication was also invalid in the preceding audit; no public repository or npm package was published.

## Still to verify in a browser

- Desktop and 390px composition, overflow, text enlargement and contrast.
- Landing before/after selection, sequential composition, pause, replay, reduced motion, offscreen/hidden suspension and modal focus.
- Setup selectors, copy fallback, source download, workshop opening and Escape dismissal.
- Discovery/save/filter, invoice confirmation/recovery and task creation/filtering.
- Workshop decision acceptance, project versus screen scope, browser persistence or session-only fallback, clearing, and downloaded brief content.
- Keyboard traversal and assistive technology behavior.

The supplied workshop browser runner has not executed successfully here. No browser assertions, visual review, model-comparison experiment or participant usability study are counted as passed. Live Figma import and an Alps pack are not implemented. Source checks and authored animation are not usability evidence.

## Reproduce

```sh
npm test
npm run build
npm run check
npm run test:browser
```

The browser runner requires a local Chrome installation and permission to launch it; set `CHROME_BIN` if needed. It runs `dist/Functional_Minimalism_Workshop.html` at 390px and 1440px, using a temporary profile and no HTTP server. A successful run writes evidence under `artifacts/`.

Open `dist/Functional_Minimalism_Preview.html` for the complete offline demonstration. Use the browser checklist above for the landing and memory controls in addition to the runner. GitHub Pages publication and browser acceptance are being verified for v0.3; results are recorded below.
