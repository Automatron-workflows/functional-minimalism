# Hosting handoff

The toolkit's canonical source is Automatron-workflows/functional-minimalism. The live hosting copy contains a snapshot of that source, including local fixes not yet pushed to GitHub.

- Website ID: a8a3aae3-7d67-4aa4-93db-b9f95cb9acdb
- Slug: functional-minimalism
- URL: https://functional-minimalism.higgsfield.app
- Kind: standalone website, no generation integration, database or secrets.
- Access: platform deployment succeeds, but anonymous gateway requests require sign-in. Do not advertise this as an anonymous public demo until that is resolved.

For a future authorized edit, use website_repo_access checkout with the website ID, then its returned checkout path. The root harness/ directory is the source snapshot. app/public/ contains the static demo, library, packs, contracts, references and downloadable source ZIP. app/src/landing.html is the same authored landing document with its hosting base and canonical/share metadata. app/src/routes/index.tsx serves it through the platform's existing server routing. The platform package manifest and lockfile are unchanged.

Update the matching public source files and landing document when the harness changes. Rebuild the downloadable ZIP from harness/scripts/build.mjs, then copy that intentional distribution artifact to app/public/functional-minimalism-source.zip. Commit source/assets, push with website_repo_access, deploy, and inspect website_status. The platform build is required because Bun and the app's dependencies were not provisioned in the editing sandbox.

The public distribution target remains GitHub Pages once the authenticated source push and its mandatory checks succeed. See VERIFICATION.md for observed evidence and access limits.
