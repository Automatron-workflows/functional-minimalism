# Versioned design inputs

All formats are UTF-8 JSON. Runtime validators in `src/core.mjs` are authoritative for v0.1.

## Pack — `design-harness.pack/1`

Required: `id` (lowercase slug), `name`, semantic `version`, `source`, nonempty `principles`, `tokens`, and `components`. Optional `patterns` records reusable composition judgment.

`source` records `kind` (`synthetic`, `repository`, `figma`, or `export`) and `reference`. Include capture time and source revision when available. Never label inferred properties as verified.

Tokens use a flat semantic name map:

```json
{
  "color.background": { "type": "color", "value": "#101214" },
  "color.focus": { "type": "color", "value": "{color.accent}" },
  "color.accent": { "type": "color", "value": "#d9ff85" },
  "space.unit": { "type": "dimension", "value": "8px" },
  "motion.quick": { "type": "duration", "value": "180ms" },
  "font.body": { "type": "font", "value": "Inter, sans-serif" }
}
```

Types: color (hex, transparent, currentColor), dimension (0 or nonnegative px/rem/em/%/vh/vw), duration (ms/s), finite number, and font-family string. Aliases must exist, remain acyclic, and match types. CSS identifiers are semantic names with dots replaced by hyphens; collisions are rejected. CSS output is deterministic. This is a narrow normalized format, **not a claim of full DTCG or Figma export support**.

Each component records a unique `name`, relative `source` file, named `export`, unique `variants`, supported `states`, and `rules`. The current reference implementation emits semantic HTML. The format can point at React or other component files, but v0.1 does not parse or enforce their prop types.

Optional `patterns` records composition judgment that is too specific for a single component: a unique `id`, the `object` being composed, a nonempty `structure` list, and nonempty `rules`. A screen contract can name one pattern with the `pattern` field. `composeBrief` includes the pattern's structure and rules; an unknown pattern id fails brief generation. Patterns are guidance for the agent and human review, not automatic aesthetic checks.

Figma integration path: use approved Figma structured context/variable exports; map tokens to the normalized map; map component/variant IDs to actual repository imports; preserve Figma URLs and revision references; review inferred states and responsive behavior. `import-tokens` records the source and creates a new pack. It does not contact Figma, discover credentials, or write to Figma.

## Screen — `design-harness.screen/1`

Required fields: `id`, `project`, `goal`, `object`, `primaryAction`, `composition`, unique `essential` information IDs, unique `states` containing ready, viewport widths, component names, and `maxPrimaryActions`. `explanationBudget` is advisory. Optional `pattern` names a composition pattern from the pack. `consequential: true` requires a confirmation state and consequence information.

Annotate a rendered flow:

```html
<p data-essential="amount" data-copy="content">€1,210.00</p>
<button data-component="Button" data-variant="primary"
        data-primary data-copy="control">Review payment</button>
```

`data-copy` categories: content, control, explanation, consequence. Untagged visible text remains `unclassified`; it is not silently excluded. Essential information must be visible in the ready state. For a consequential flow, the confirmation state must also show every essential fact, including consequence. The state map must be adapted to the task; not every flow needs every possible state.

## Evidence — `design-harness.evidence/1`

```json
{
  "schema": "design-harness.evidence/1",
  "packDigest": "the SHA-256 digest in .design-harness/config.json",
  "capturedAt": "ISO timestamp",
  "snapshots": []
}
```

Populate snapshots using the actual browser collector at every state/width pair. Include separate interaction assertions or browser test results for actions: DOM snapshots do not prove those actions work. Save screenshots separately when a visual review needs them. A digest binds evidence to a pack revision, not to a verified renderer or source-code revision. Both DOM annotations and the envelope can be fabricated by a caller; there is no authenticity claim.

`auditEvidence` returns pass/fail/incomplete and per-snapshot findings. CLI audit exits nonzero for either failure or missing coverage. A pass covers only these declared checks and supplied snapshots.

## Memory — `design-harness.memory/1`

Each decision has `id`, `scope`, `target`, `status`, `rule`, `reason`, `createdAt`, and optional `supersedes`. Screen targets are qualified as `project-id/screen-id`, so two projects with a screen called invoice do not share its decisions. Only accepted, matching, active decisions enter a brief. Specificity order is global → pack → project → screen; explicit current user instructions and the screen contract remain authoritative. The tool does not resolve semantic contradictions between sentences. Review conflicting rules explicitly.

## Current source limits

The CSS scanner recognizes `var(--token)` references and color literals in declarations. It is not a full CSS parser, cannot detect every named color, and does not check computed styles against tokens. Source checks use a conservative export-declaration pattern without executing imports. A warning requests manual verification; it does not prove a missing export. Files must resolve inside the project. The browser collector provides a practical accessible-name heuristic, visibility, bounding boxes, component annotations, and visible word counts; use dedicated accessibility review for full coverage.
# Surface and state extensions · 15 November 2026

These are optional additions to design-harness.screen/1; existing contracts remain valid.

- `essentialByState`: an object mapping declared state names to arrays of essential information IDs. The ready-state `essential` list still applies independently. The invoice example requires supplier, amount, destination and consequence in confirmation.
- `surface.features`: unique `{id, placement, reason}` records. Placement is primary, secondary or omit. At least one primary feature is required.
- `surface.controls`: unique `{id, label, presentation, states}` records. Presentation is text or icon; icon choices require a nonempty `familiarity` rationale. Optional risk is ordinary or consequential. Consequential controls must use text.
- `surface.maxVisibleFeatures`: optional positive review threshold, scoped to the task. It does not override essential information.

Snapshots from the collector now include `features` from visible `data-feature` annotations and control `id` from `data-control` (or the demo's `data-action`). An opted-in surface contract requires feature evidence. Its audit catches unknown/omitted annotated features, missing primary features in ready state and missing controls in declared states. An annotation is an assertion by the implementation: unannotated features and visible-label comprehension need separate review.

Pass the active overlay DOM root to collectSnapshot when a React library renders dialogs through a portal. The harness does not infer library component identity from a DOM attribute.

The React inventory and connection formats are `design-harness.react-inventory/1` and `design-harness.react-connection/1`. See [architecture](ARCHITECTURE.md). They record manifest declarations and config fingerprints, not resolved lockfile versions or runtime verification. Read their evidence level before making compatibility claims.
