# Contribute to Functional Minimalism

Start with a real task and a reproducible problem. Small improvements to a design pack, a task contract, or a failing interaction are welcome.

## Run locally

Use Node 22 (the CI version). The runtime supports Node 18.16 or newer. No dependency installation is needed.

```sh
npm test
npm run build
npm run check
npm run dev
```

Open http://127.0.0.1:4178/demo/. For browser checks, install Chrome from its official source, then run `npm run test:browser`. The runner captures actual 390px and 1440px iframe viewports; requested window size alone is not evidence of viewport coverage.

## Useful contributions

- A reusable pack mapped to real source components, with provenance and a runnable example.
- A task that exposes a gap: lost essential information, an ambiguous action, an error that cannot be recovered from, or a keyboard failure.
- A reproducible paired build from [the experiment](docs/EXPERIMENT.md), including unsuccessful runs and provider-reported usage.
- A simpler implementation that preserves behavior and makes the next contribution easier.

For a visual change, include before/after screenshots at a narrow and wide width, the interaction exercised, and any remaining limits. Tests can catch missing information and broken behavior; they cannot certify taste or usability.

For a core change, add a regression test only when it protects meaningful behavior. Run the relevant checks. Keep code dependency-free unless a concrete need justifies changing that policy.

Use the existing design system. Functional minimalism reduces effort; it does not turn every product into the demo. Rams is an attributed influence, not an endorsement. Do not claim token or time savings from character counts or authored animation.

Open a small pull request that explains the problem, resulting behavior, and verification. Never include credentials, customer data, or unlicensed assets in an example. Contributions are licensed under the repository's MIT license.
