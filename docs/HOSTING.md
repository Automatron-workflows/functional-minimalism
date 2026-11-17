# Hosting record

The toolkit's canonical source is Automatron-workflows/functional-minimalism. The public demo is deployed from its main branch through GitHub Pages.

- URL: https://automatron-workflows.github.io/functional-minimalism/
- Public route: `/demo/`
- Build and deployment: `.github/workflows/pages.yml`; deploys `dist/` after tests, source checks and browser checks.
- The downloadable source archive is built by `npm run build`; the standalone preview embeds the demo and archive.
- A separate Higgsfield draft exists at functional-minimalism.higgsfield.app. It requires sign-in for anonymous visitors and is not the canonical or advertised demo.

For a source change, use a clean clone or the reviewed checkout, run the documented checks, and verify the live Pages route after CI deploys.
