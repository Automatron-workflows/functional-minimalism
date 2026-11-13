# Automatron Design Harness

**Minimum reading. Maximum clarity.**

A portable workflow for AI-built interfaces: reusable design packs, task-specific screen contracts, scoped design memory, and checks against the rendered result.

The first implementation is **v0.1.0**. It runs locally, has no npm dependencies, and makes no model or service calls. Studio is an authored reference system, **not Alps**. No npm package has been published.

## Try the working examples

Use Node 18.16 or newer. From this folder:

```sh
npm run build
npm run dev
```

Open **http://127.0.0.1:4178/demo/**. Try film discovery, invoice confirmation, and project tasks. Switch Before / With harness to see an illustrated comparison. Both versions preserve the same task information. These are authored fixtures, not outputs from a measured model benchmark. All payments are simulated.

Alternatively, open **dist/Design_Harness_Preview.html** directly in a browser. This standalone build includes its scripts, styles, data, and artwork, and does not need a server or network connection.

Choose **Inspect** to see real DOM counts and findings from the same checker used by the CLI. The state selector exposes loading, empty, error, confirmation, and success states where applicable.

## Use it on a project

```sh
node bin/design-harness.mjs init ../my-app --client both
node bin/design-harness.mjs brief examples/discovery.screen.json --project ../my-app
node bin/design-harness.mjs check --project ../my-app
```

Initialization adds a versioned `.design-harness/` directory and appends a bounded instruction block to `AGENTS.md` and `CLAUDE.md`. Existing instructions are preserved. Existing harness installations and conflicting reference-component files are not overwritten. With the bundled pack, actual reference components, tokens, styles, and artwork are copied into `src/design-system/`. Import the component functions and both CSS files when using that reference system; user-supplied text must be escaped. The styles include the demonstration shell, so use your own mapped pack for an established product.

For your own system, supply `--pack path/to/pack.json`. Component paths then refer to files already in the target project. The harness does not copy another project's brand into yours or assume a screenshot provides a complete design system.

Adapt an example screen contract: set `project` to your project identifier, define the task, essential information IDs, applicable states, widths, and actual components. The generated brief is portable text; the host agent performs the design and repair work. Instruction-file support depends on the agent host actually loading the files.

## Remember a correction

```sh
node bin/design-harness.mjs remember --project ../my-app \
  --scope project --target my-app \
  --rule "Keep unfamiliar actions visibly labelled." \
  --reason "Explicit user feedback on navigation." --accept
```

Without `--accept`, a decision remains proposed and is excluded from generated briefs. Accepted decisions can target `global` (`*`), `pack`, `project`, or `screen` (`project-id/screen-id`). `--supersedes <id>` replaces a prior decision only in the same scope and target. Memory is editable JSON, not model training.

## Check the result

```sh
npm test
npm run check
npm run test:browser
```

Build first. The browser command uses a **locally installed Chrome**, the standalone preview, a temporary fresh profile, and two viewport widths. Set `CHROME_BIN` if Chrome is in a different location. No browser download is attempted. Reports are written to `artifacts/` when the run completes and include actual captured snapshots. No screenshot or report is sent to a service. See the verification record for restrictions encountered in the build environment.

For another app, import `collectSnapshot` from `src/browser.mjs`, collect the contract's states at each requested width, and create the documented evidence envelope. The CLI requires the evidence to match the pinned design-pack digest:

```sh
node bin/design-harness.mjs audit screen.json evidence.json --project ../my-app
```

The checker catches missing essential information, unnamed or clipped controls, horizontal overflow, unknown annotated components/variants, missing primary actions, and incomplete state/viewport coverage. Explanatory word counts, competing actions, and small targets are review findings. Fewer words never offset a missing amount or label.

`check --css file.css` also scans CSS for unrecognized semantic variables, token overrides, and literal color values. This is a **lexical CSS checker**, not a complete CSS parser, JSX/TypeScript AST analyzer, or proof that the actual component implementation was used. Component-source checks establish local paths and recognizable export declarations only. The DOM name heuristic is not the full accessible-name algorithm.

## Connect Figma or your library

See [the format guide](docs/FORMAT.md). v0.1 imports a documented normalized token map and records its source. Structured Figma data and Code Connect mappings can be converted into this format, but **a live Figma connector and automatic component mapping are not implemented**. Verify the mapping against real source code. The Alps source is still required for an Alps-specific pack.

Pack changes trigger a drift error until reviewed and explicitly pinned with `pin --project …`. Importing a token map creates a separate pack file and increments its patch version; it never silently updates consuming projects.

## What this release establishes

- A usable CLI, library, and two agent instruction adapters.
- Ten real reference components with variants and usage rules.
- Three interactive example flows, with browser instrumentation and reproducible behavior checks.
- Scoped memory and explicit version pinning.
- Static demo output that can be hosted without a backend.

The host agent still has to inspect visual quality, exercise keyboard and assistive-technology behavior, and repair findings. These checks do not certify accessibility, aesthetics, usability, genuine user approval, or evidence authenticity. Evidence is caller supplied. No cross-model benchmark or participant usability study has been run.

Read [the workflow](adapters/WORKFLOW.md), [accepted design rules](DESIGN_RULES.md), [the Hardwire reference](references/hardwire.md), [CLI commands](docs/CLI.txt), [the implementation status](docs/STATUS.md), [the verification record](docs/VERIFICATION.md), and [the original product plan](Automatron_Design_Harness_Plan.md).

MIT license. An Automatron project.
