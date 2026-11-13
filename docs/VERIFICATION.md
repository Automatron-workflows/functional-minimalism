# Verification record · 13 November 2026

## Passed

- **17 unit and CLI integration tests** on Node 18.16.0. These cover token validation/cycles/type mismatches, registry validation, preservation of consequential information, malformed evidence, state/viewport coverage, project and screen scope isolation, supersession safety, CSS findings, non-destructive project initialization, symlink refusal, source-path containment, and CLI exit behavior.
- Static build, including a standalone HTML preview with embedded data, artwork, styles, and scripts.
- Registry/source checks for ten mapped components, three screen contracts, generated-token consistency, and semantic CSS checks. Zero findings.
- JavaScript syntax checks for all 12 implementation/build modules and the assembled standalone script.

## Blocked in the build environment

- Local HTTP preview: the environment rejected binding a localhost port (`EPERM`).
- Headless browser run: the installed Chrome process could not launch in this sandbox. No browser-result file was produced and no browser assertions are counted as passed.
- Desktop browser preview: browser security policy rejected opening a `file:` URL. No workaround was attempted after that rejection.
- GitHub publication: the local GitHub CLI reported invalid authentication. No remote repository was created and no code was published.

## Not established

Rendered appearance, mobile layout, actual interaction correctness in a browser, keyboard traversal, screen-reader behavior, contrast, and motion behavior still need browser review. The implementation includes checks and native semantics for these, but source inspection does not prove them. The 23 browser assertions per viewport are supplied for a later run, not reported as passed.

No model-comparison experiment, participant usability study, live Figma import, or Alps-specific validation has been performed.

## Reproduce

From the source directory:

```sh
npm test
npm run build
npm run check
npm run test:browser
```

The browser runner needs a local Chrome installation and permission to launch it; it uses the standalone HTML and a temporary profile, without a web server. If needed, set `CHROME_BIN` to the browser executable. Successful execution writes per-screen evidence and detailed results under `artifacts/`.

You can also open `dist/Design_Harness_Preview.html` yourself. It runs offline. Use each main action and the Inspect panel's state picker at desktop and narrow window widths. Review every required state and independently test keyboard and assistive technology behavior before treating this release as fully verified.
