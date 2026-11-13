# Automatron Design Harness

**Product plan and accepted design context · 13 November 2026 · proposed v0.1**

**Build interfaces people can understand by looking and using.**

The harness carries a team's design judgment into every AI-assisted build: what belongs on the screen, how it behaves, which components to use, and what must be checked before delivery. It starts each project from an approved visual language and improves through specific, remembered corrections.

This document now includes the accepted design direction from the Hardwire silent demo. The companion `AGENTS.md`, `DESIGN_RULES.md` and `references/hardwire.md` are usable authoring context. The harness runtime, adapters, automated checks and evaluation flows described below remain proposed work. Working project name: **Automatron Design Harness**. Keep naming and launch branding secondary until the workflow proves useful.

## 1. The product decision

Make a portable, repository-based design workflow for coding agents. Start with product designers, founders, and product engineers who repeatedly ask AI to remove clutter and recover an existing visual identity.

The immediate job: **“Use our design system and judgment from the first screen, without making me art-direct the same corrections again.”**

The central principle is **minimum reading, maximum clarity**. The objective is lower human effort: less interpretation, fewer uncertain choices, and less corrective work. A lower word count is useful evidence only when task success survives.

A component library supplies ingredients. The harness decides how to compose them for a person doing a specific task, then checks the result. Its core assets are composition rules, verified component mappings, approved examples, and evaluated behavior.

As a sibling to [Hardwire](https://github.com/Automatron-workflows/hardwire), this is a separate Automatron project. Hardwire describes and checks application actions for agents. The design harness guides and evaluates human interfaces. A future shared action contract could keep the two consistent; it is not required for the first release.

## 2. What “human-first” means on a screen

| Decision | Default | Important exception |
| --- | --- | --- |
| Starting point | Identify the person's task and show the thing they came to use. | Editorial and reading products need substantial content. |
| Hierarchy | Give the current task one clearly dominant action. | Workbenches can support several peer actions when their hierarchy is intentional. |
| Copy | Keep names, values, labels, and useful feedback. Remove repeated explanations and promotional filler. | Unfamiliar actions and consequential choices need enough explanation to make an informed decision. |
| Composition | Use the structure native to the task: gallery, timeline, table, canvas, player, or form. | Cards are appropriate when objects really are independent and comparable. |
| Disclosure | Keep the frequent path visible; reveal secondary controls in context. | Do not bury price, scope, destination, permissions, or essential status. |
| Visual communication | Use real content, previews, grouping, position, and state changes to explain. | A meaningless illustration does not replace an instruction. |
| Icons | Use familiar icons where their purpose is clear, with accessible names. | Unknown actions retain visible labels; tooltips cannot carry essential meaning. |
| Motion | Explain continuity, manipulation, progress, and feedback. | Essential meaning must survive reduced motion and a static frame. |

Classify text before removing it:

- **Content:** a film title, account name, article, or data value. Preserve what the task needs.
- **Control:** navigation, button labels, field labels, and units. Make these concise and unambiguous.
- **Explanation:** introductory paragraphs, helper copy, repeated descriptions. Challenge these first.
- **Consequences and recovery:** costs, commitments, errors, and next steps. Keep these understandable at the decision point.

“90% less text” becomes a useful editing challenge for redundant explanation, not a universal quota for the interface. Moving all copy into tooltips, shrinking type, or adding extra steps does not count as improvement.

## 2.1 Accepted reference: the Hardwire silent demo

Matthias approved the silent Hardwire demo on 13 November 2026 and explicitly asked to apply the same design rules to this harness. The accepted reference is the [published film](https://automatron-workflows.github.io/hardwire/), pinned to [source revision dbfcc074](https://github.com/Automatron-workflows/hardwire/tree/dbfcc074b7386fbceee3e3a0bd1a00de9d667ec0/playground). `references/hardwire.md` records its scope, rejected alternatives and evidence limits.

The accepted composition has a plain wordmark, one headline and three recognizable animated examples. Google sign in, invoice payment and settings communicate that the capability is general. Cursors navigate interfaces above direct paths to the pictured outcomes. The screen carries no numbered tutorial cards, code call labels, menu prose or repeated result captions. Shared pause and replay controls keep the film manageable. Optional context sits behind an information icon.

The important correction is **show the operation and its result before adding explanation**. Earlier versions became more structured while still requiring too much reading. The successful change replaced explanatory interface elements with a visual sequence.

| Context | Default approach | Boundary |
| --- | --- | --- |
| Explanatory demo | Use a coherent visual story, recognizable objects, meaningful motion and little visible copy. Hardwire is the accepted cinematic reference. | Keep the illustration honest, offer motion controls and retain disclosure where misunderstanding would matter. |
| Working product interface | Use direct interaction, useful previews, clear hierarchy and concise feedback. | Keep the labels, values, units, permissions, confirmations and recovery needed to act. |
| Brand adaptation | Preserve the selected product's actual visual language. | Hardwire's dark palette and exact composition are scoped to its demo. They do not define Alps or every future interface. |

Motion should establish a starting state, show an action and reveal a result. A looping illustration can autoplay, pause and replay. Honor reduced motion and suspend unnecessary work when hidden. Never let explanatory autoplay perform consequential application actions. A still alternative must preserve the meaning.

**Context delivered:** `AGENTS.md` tells the next agent what to load; `DESIGN_RULES.md` provides the profiles and review gates; `references/hardwire.md` keeps the accepted and rejected decisions together. Hosts that do not load these files need them explicitly included. This is reusable design context, not an implemented enforcement engine or a guarantee of memory across unrelated conversations.

**Audit limit:** this reference has user approval and inspected playback, keyboard and mobile behavior. Its 133 repository tests passed at publication, covering toolkit and fixture behavior. No first time visitor study establishes comprehension of the artwork. Test whether the cursor/direct path distinction and outcomes are understood. Add a concise label when observation shows it is needed rather than treating zero text as the goal.

## 3. The design judgment the harness must retain

The design pack needs more than fonts and colors. It must contain decisions at several levels:

| Level | What the pack records |
| --- | --- |
| Art direction | Brand character, typography roles, image treatment, contrast, density, surfaces, icon style, and motion character. |
| Foundations | Semantic color tokens, type scale, spacing, dimensions, radii, elevation, responsive rules, and light/dark modes where supported. |
| Components | Real implementation imports, supported properties, variants, states, accessibility contracts, and examples. |
| Composition | How components form a coherent task: content hierarchy, grouping, alignment, scale contrast, and primary action placement. |
| Interaction | Navigation, editing, selection, direct manipulation, progress, feedback, undo, and recovery. |
| References | Approved screens and rejected alternatives, annotated with the specific reason for each decision. |

Granular example: a button record needs its import path, semantic role, variants, label behavior, loading behavior, disabled behavior, focus treatment, and where it belongs in a composition. A rounded rectangle and a hex code are insufficient.

Make hierarchy and typography do real work. Start from authentic content and realistic content lengths. Use a coherent asset family. Allow fewer, stronger elements to carry the screen. Preserve the product's character through layout, imagery, proportions, and interaction, rather than a universally imposed dark theme, neutral palette, or fashionable gradient.

Treat Airbnb and Spotify as references for product clarity and coherent interaction, not visual templates to copy. This harness must support both an expressive consumer experience and a dense professional tool without flattening either into the same interface.

## 4. Five parts of the harness

| Part | Responsibility | Reviewable output |
| --- | --- | --- |
| Design-system adapter | Resolve source assets, tokens, components, and their versions. | A versioned design pack with verified mappings and explicit gaps. |
| Task and composition planner | Choose the right structure for a person's goal and context. | A short screen contract and state map. |
| Agent workflow | Give the model the relevant rules, examples, and real components at the right moment. | Working screens that reuse the selected system. |
| Evaluation loop | Inspect source, rendered screens, and actual interactions; request targeted repairs. | Evidence and findings, separated into failures and design judgments. |
| Decision memory | Retain accepted corrections with their scope and reasons. | A small, versioned history that informs the next build. |

Keep the core format independent of a model or editor. The first implementation can target React/TypeScript, with separate instruction adapters for supported agent clients. “Model-independent” is an architectural goal; quality and tool compatibility must be measured per client and model version.

Persistent instructions only work when the host actually loads them. The setup must verify this with a small project check; it cannot promise that an unrelated chat will automatically inherit the rules. File-only clients can consume the pack, but cannot claim rendered verification without a renderer or browser.

## 5. From Figma or an existing system to a usable pack

Prefer the existing code library for implementation APIs and the approved design source for visual intent. Preserve the origin of both. If they conflict, record the mismatch and choose an explicit resolution rather than silently approximating.

| Available source | Import approach | Confidence limit |
| --- | --- | --- |
| Figma with linked code components | Read selected frames, variables, components, variants, and Code Connect mappings. | Verify referenced imports and properties against the actual repository. |
| Existing component repository | Inspect tokens, public component APIs, stories/examples, and usage guidance. | Implementation code alone does not establish intended composition or brand judgment. |
| Figma without code mappings | Extract structured design context and map components manually for the pilot. | Missing implementations are recorded as gaps. |
| Token export and reference screenshots | Load tokens; annotate visual rules and representative screens. | Screenshots cannot establish hidden states, responsive behavior, or accessibility. Mark deductions as provisional. |

Each imported item records a source reference, source revision or hash where available, capture date, supported platform, and whether it is verified or inferred. Preserve aliases and semantic token names instead of flattening everything into raw values.

Updates produce a diff: changed tokens, component APIs, references, and affected screens. Pin consuming projects to a pack version; make updates explicit and reversible. Do not silently overwrite project decisions or local component modifications.

**Alps is the intended first real pack, pending its source.** The current search did not establish a relevant Alps file, repository, or Figma reference. Do not substitute another project's design system or invent Alps tokens. A clearly named synthetic fixture can exercise the importer while the real source is unresolved.

## 6. The repeatable design workflow

1. **Understand the task.** Identify the person, goal, object, context, primary action, necessary information, and successful end state. Ask only for missing information that changes the design.
2. **Load the relevant system.** Retrieve the appropriate pack, scoped decisions, real component APIs, and a few relevant examples. Do not flood the context with the entire library.
3. **Choose the composition.** Compare two materially different structures when direction is open. Select the one that best fits the task; record the reasoning briefly outside the product UI.
4. **Build one complete flow.** Implement the useful path and its applicable loading, empty, error, success, disabled, permission, and long-content states.
5. **Render and interact.** Inspect desktop and mobile, exercise the primary action, check focus and keyboard use, and inspect overflow and touch behavior.
6. **Repair precisely.** Turn findings into local edits. Recheck the affected states. Cap autonomous repair at three passes for the pilot; preserve unresolved findings instead of looping indefinitely or declaring success.
7. **Remember accepted changes.** Save the rule, example, reason, scope, and superseded decision. Reuse it in subsequent tasks.

A screen contract should remain short: goal, primary object, primary action, essential visible information, secondary details, chosen structure, required states, and evidence required. It is an internal design artifact, not explanatory text added to the product.

## 7. Remember taste without making every project identical

Store global preferences separately from brand, project, screen, and experiment decisions. Carry Hardwire's accepted visual storytelling, restraint and progressive disclosure into the general defaults. Keep its dark cinematic art direction in the demo profile. Its exact colors, typography and timing are reference choices rather than universal tokens.

An accepted correction becomes a specific record:

> Context: media discovery results. Decision: remove repeated descriptions and let artwork, titles, and availability carry scanning. Keep a visible action label where its meaning is ambiguous. Reason: faster comparison. Scope: this discovery pattern. Evidence: approved screen and review. Supersedes: prior card description rule.

Apply explicit current instructions and the active project contract before older preferences. Keep hard accessibility and functional requirements separate from aesthetic defaults. Flag real conflicts rather than blending incompatible instructions.

Users can inspect, edit, and remove decisions. Unaccepted model suggestions remain provisional. No model training is needed for this form of memory: it is a versioned design record with relevant retrieval.

## 8. Checks and their limits

| Check | Method | Treatment |
| --- | --- | --- |
| Components and tokens match the selected system | Source/AST checks and registry comparison. | Block invalid imports, unsupported variants, and forbidden overrides when policy is explicit. |
| The main flow works | Browser interaction assertions against the task contract. | Block broken navigation, nonfunctional controls, or missing outcomes. |
| Accessibility basics | Automated checks plus manual keyboard/focus and representative assistive-technology review. | Block known critical failures; automated results are not complete accessibility certification. |
| Layout survives real conditions | Render at small and large widths, zoom, long strings, and relevant states. | Block clipped essential content and inaccessible controls. |
| Reading burden | Count visible text by role and state; compare with baseline and extra navigation. | Advisory. Never reward removing meaningful labels or hiding content. |
| Hierarchy, craft, and brand fidelity | Side-by-side reference review and human review; model critique may assist. | Advisory judgment with reasons and evidence. |
| Comprehension and findability | Observe people attempting a representative task. | Required product evidence before broad quality claims. |

Report concrete findings such as “primary action is clipped at 390px” or “unmapped component introduced.” Avoid a fabricated “beautiful: 94/100” score. Screenshots show appearance; interaction traces show behavior; neither alone establishes usability.

Keep important labels, clear error recovery, visible focus, sufficient contrast, sensible touch targets, reduced-motion behavior, and alternatives to gesture-only controls. Validate a sample with enlarged text and localization expansion. These are part of the quality of the design, not optional finishing touches.

## 9. First proof: three different jobs

Build complete, small flows with realistic fixture data. The comparison must use identical capabilities and information in each condition.

| Flow | Proposed composition | Detail that appears when needed | What it proves |
| --- | --- | --- | --- |
| Find something to watch | Content-led gallery with artwork, titles, availability, and clear selection/play actions. | Synopsis, cast, and expanded filters. | Visual discovery can reduce repetitive explanation while preserving choice. |
| Review an invoice | Document preview, supplier, amount, due date, payment destination, and a clear approve/pay step. | Line-item detail and history. | Restraint can preserve consequential information and explicit confirmation. Use fixtures only. |
| Manage a project | Useful list or timeline with owners, dates, and status; direct editing. | History and secondary settings. | The harness supports information-dense work without imposing decorative card grids. |

The public introduction should follow the cinematic demo profile: let the visual transformation show what the harness changes and keep explanation optional. Offer a separate working comparison where a visitor can switch between baseline and harness output and complete the same task. The film supports the introduction; only the working comparison can provide task execution evidence. Do not equate illustration with measured performance.

Evaluate three conditions: **ordinary generation**, **design-system context only**, and **the full harness**. This separates the contribution of the design system from the contribution of the workflow and checks.

For an initial feasibility run: three tasks × three conditions × two available agent/model setups = 18 builds. Record model/client versions, prompts, budgets, runtime, tool access, repair passes, and failures. This is an exploratory sample; repeat before making general reliability claims.

Run formative usability sessions with at least six representative participants, counterbalance presentation order, and use equivalent task data to reduce learning effects. Observe task completion, wrong actions, time to first useful action, unnecessary navigation, and requests for explanation. Also record designer interventions and brand preference. Report raw observations rather than implying statistical significance from a small sample.

Pilot acceptance: every core path works; no unresolved known critical accessibility or information-loss failures; fewer repeated design corrections; and observed usability at least holds while clarity or effort improves. A word-count reduction alone cannot pass. Add a held-out task and a second contrasting design pack before claiming the harness generalizes.

## 10. Build sequence and release boundaries

| Stage | Deliverable | Exit condition |
| --- | --- | --- |
| 1. Capture judgment | Identify Alps; inventory its real assets; annotate approved/rejected examples; define the screen contract and pack format. | One real pack with known gaps and ten well-described core components. |
| 2. Prove the workflow | Run the design loop on the three fixture flows using the pack. | Demonstrable working flows and a baseline comparison; rules explain their design choices. |
| 3. Enforce and remember | Add component/token checks, render evidence, state checks, scoped decision memory, and two client adapters. | A fresh session can reproduce the rules and catch deliberate regressions without repeating the art direction. |
| 4. Package under Automatron | Separate repository, concise setup, accessible visual demo, reproducible evaluation fixtures, license, and limitations. | Another person can install and complete a task; evaluate a held-out task and second visual system. |

Recommended first technical surface: a versioned pack format, a lightweight CLI, and agent instruction adapters. Add an MCP facade only when real client integration needs it. These are delivery formats, not proof of design quality.

Proposed repository areas: `spec/`, `packs/`, `adapters/`, `checks/`, `examples/`, `evals/`, and `docs/`. Keep the first implementation local and inspectable. Avoid account management, hosting infrastructure, a marketplace, a custom design editor, and a large component library until the core loop proves useful.

The first release does not promise arbitrary Figma-to-production conversion, universal framework support, identical output across models, automatic learning of unaccepted preferences, or a one-click guarantee of excellent design.

## 11. Current landscape and differentiation

Lovable already documents reusable design-system projects, component/token schemas, setup verification, and adherence enforcement. Those are existing capabilities, not a unique claim for this proposal. Its public documentation does not establish the details of its internal model orchestration. [1]

Figma provides structured design context through its MCP server; Code Connect can supply implementation details and component mappings. This gives the proposed importer a practical foundation, while the agent still needs explicit conventions and must implement and validate the result. [2][3]

The proposed Automatron contribution is the combination of **portable task composition, project-scoped design memory, and evidence-based review across agent environments**. Whether that combination produces enough value is what the pilot must establish.

W3C guidance supports providing sufficient labels and instructions without overwhelming users; removing visible labels and leaving only an accessible name does not automatically satisfy the need for understandable input guidance. [4] Target-size checks should use the actual WCAG criterion and its exceptions, rather than mislabeling a preferred larger design target as the universal minimum. [5]

## 12. Immediate next build

Use the delivered authoring context and approved Hardwire reference immediately. For the first actual design system pack, resolve the Alps Figma or repository reference and create the pack from that real source. Use it to build and evaluate the discovery flow first, then pressure-test the same rules with the invoice and project flows. Let the observed failures determine which checks to implement before expanding the framework.

The desired outcome is concrete: **a new session produces a recognizably appropriate, usable interface before Matthias has to say “90% less text.”**

## Sources

Primary documentation consulted on 13 November 2026. These support integration and accessibility details; the proposed design rules, architecture, and evaluation plan above are recommendations.

1. [Lovable: Design systems](https://docs.lovable.dev/features/design-systems)
2. [Figma: MCP server introduction](https://developers.figma.com/docs/figma-mcp-server/)
3. [Figma: Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)
4. [W3C: Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)
5. [W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
