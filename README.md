# Functional Minimalism

**Better UI. Fewer retries.**

Functional Minimalism is a design harness for AI-built interfaces.

## Why

Repeated redesigns cost time and tokens. Functional Minimalism puts a good design in place by default using useful design defaults, design systems, and accepted heuristics. The goal is a better first design concept with fewer corrective prompts.

[Functional minimalism](references/functional-minimalism.md) is our practical philosophy, inspired by Dieter Rams's principles. Reduce the effort needed to understand and act. Preserve labels, meaningful content, prices, permissions and recovery. Each product keeps its own character.

## What

A local design harness with versioned design packs, composition patterns, screen contracts, scoped design memory, and source/rendered-evidence checks. Your coding agent performs the design, browser work and repair; Functional Minimalism supplies context and checks. No model calls, credentials, npm dependencies or telemetry.

**v0.3.0** includes a branded illustrated demo, three working fixture flows, and one-command first-screen setup. Studio is an explicit reference system, not Alps. Nothing is published to npm.

[Source](https://github.com/Automatron-workflows/functional-minimalism) · [Contribute](CONTRIBUTING.md) · [Run a paired experiment](docs/EXPERIMENT.md)

The [public demo](https://automatron-workflows.github.io/functional-minimalism/) is hosted on GitHub Pages and opens without an account. Its route continues into `/demo/`. The source ZIP is also available from the workshop and offline preview. The separate Higgsfield draft is not part of this public release.

## Try the harness in a minute

Open the demo workshop, choose **Discover**, **Approve**, or **Organize**, then select **Get screen brief**. Inspect, copy, or download the brief. It includes actual component mappings, essential information, and required states.

To try memory, accept a correction in **Design memory**, switch screens, and get another brief. Project decisions carry over; screen-only decisions do not. Starter exports use the paths installed by `setup ../my-app`. They do not write memory into your local project.

## Set up your first screen

Clone [the repository](https://github.com/Automatron-workflows/functional-minimalism), or download and extract `functional-minimalism-source.zip`. From the `functional-minimalism` folder, with Node 18.16 or newer:

```sh
node bin/functional-minimalism.mjs setup ../my-app --template discovery --client both
node bin/functional-minimalism.mjs doctor --project ../my-app
```

Choose `discovery`, `invoice` or `project`; agent adapters are `codex`, `claude` or `both`. Replace `../my-app` with your new project's path.

Setup installs the Studio reference components, pinned pack, workflow, design rules, Rams reference, empty decision memory, a project-scoped screen contract, and `.design-harness/START_HERE.md`. It appends bounded blocks to agent instructions, preserving existing content. Existing harness installations and conflicting component files are refused.

Open the target project in your coding agent and ask:

> Build the screen described in `.design-harness/START_HERE.md`. Follow `.design-harness/WORKFLOW.md`. Render and exercise the result, repair findings, and report any verification limits.

The setup creates context and reusable components, not a running application. The host must load its instruction files; `doctor` cannot observe whether it did. Review the starter contract before building a real product.

## Use your existing design system

Map your actual tokens, components and source paths into a pack using [the format guide](docs/FORMAT.md). Component files must already exist in the target project.

```sh
node bin/functional-minimalism.mjs init ../existing-app --pack ./my-pack.json --client both
node bin/functional-minimalism.mjs brief ./my-screen.json --project ../existing-app
```

Do not install Studio over an established design system. Custom packs keep their own palette, density, typography and behavior. A normalized token-map importer exists; live Figma/Code Connect import and an Alps pack are pending actual integration and source material.

## Carry a decision forward

```sh
node bin/functional-minimalism.mjs remember --project ../my-app \
  --scope project --target my-app \
  --rule "Keep unfamiliar actions visibly labelled." \
  --reason "Explicit user feedback on navigation." --accept
node bin/functional-minimalism.mjs brief --compact --project ../my-app
```

Use the `projectId` returned by setup as the target. Without `--accept`, a decision stays proposed and is excluded from briefs. Accepted memory supports global (`*`), pack, project, and screen (`project-id/screen-id`) scopes. `--supersedes <id>` replaces a decision only within the same scope and target. Regenerate the brief after changing a contract or memory; `START_HERE.md` is an initial snapshot, not a live file.

## See it work

```sh
npm run build
npm run dev
```

Open **http://127.0.0.1:4178/demo/**. The landing comparison shows four model-default drafts and their adapted invoice-review results. Select a model, then drag the image or use the before/after switch to compare. Why explains the purpose; Set up gives the exact commands and downloadable source. Try the harness opens film discovery, a simulated invoice confirmation, and project tasks. Inspect runs real DOM checks against the fixture contracts. Design memory lets you accept a scoped correction and download another screen’s brief to see which decisions carry forward. That memory is local to the demo browser; it does not write to your project or agent.

After `npm run build`, open **dist/Functional_Minimalism_Preview.html** directly in a browser: a self-contained preview with the workshop and source ZIP embedded. **dist/Functional_Minimalism_Workshop.html** is the separate offline workshop. The landing comparison and Before/With harness examples are authored illustrations, not measured model outputs or user research. No real payment occurs.

## Time and token usage

Setup emits a compact brief that retains the task, source mappings, component rules and accepted decisions. Use `brief --compact` to regenerate it. `npm run measure:context` reports exact UTF-8 byte counts for full and compact example briefs. Bytes are not model tokens.

The harness adds context; the intended saving comes from avoiding repeated redesigns. No model benchmark or time-saving percentage is claimed. Follow [the paired experiment](docs/EXPERIMENT.md) to compare real usage and time under equal acceptance criteria.

## Check the result

```sh
npm test
npm run build
npm run check
npm run test:browser
```

The browser runner requires a local Chrome installation and permission to launch it. Set `CHROME_BIN` if needed. It tests the workshop at 390px and 1440px and writes evidence to `artifacts/`. It does not download a browser. See [the verification record](docs/VERIFICATION.md) for actual results and restrictions.

For your own screen, use `src/browser.mjs` to collect each contract state at each viewport and create the documented evidence envelope, then run:

```sh
node bin/functional-minimalism.mjs audit screen.json evidence.json --project ../my-app
```

Checks cover missing essential information, unnamed/clipped controls, overflow, annotated component/variant mismatches, missing primary actions, and state/viewport coverage. Small targets, competing actions and explanatory copy produce review findings. No word reduction can compensate for lost task information.

`check --css path.css` is lexical CSS analysis, not a full parser. Source checks validate paths and recognizable exports, not actual runtime component identity. DOM accessible names use a heuristic, not the full accessible-name algorithm. Caller-supplied evidence is not authenticated. These checks do not certify accessibility, aesthetics or usability.

Pack drift requires review and explicit `pin`. Memory is inspectable JSON, not model training. There is no autonomous repair engine or cross-model study.

Read [workflow](adapters/WORKFLOW.md), [rules](DESIGN_RULES.md), [brand](docs/BRAND.md), [audit](docs/AUDIT-v0.3.md), [commands](docs/CLI.txt), [status](docs/STATUS.md) and [Hardwire reference](references/hardwire.md). The legacy `design-harness.mjs` entry point remains compatible. MIT license.
