# Functional minimalism · design rules

Functional minimalism means less effort to understand and act. See [the Dieter Rams reference and our software review practices](references/functional-minimalism.md). These principles guide decisions; they do not require blank screens, unlabeled icons, or one visual style for every product.

Accepted by Matthias on 13 November 2026 following the Hardwire silent demo. These rules are authoring and review context. They are not implemented automated checks.

## General defaults

Refinement accepted from Matthias on 15 November 2026: treat an interface as a usable object. Start with its function and controls; keep only features that serve the current task. Avoid introductory prose, feature tours and repeated descriptions around ordinary actions. Use form, proportion, position and feedback to communicate. Preserve visible labels where they make the action understandable. This direction refines the existing rules and does not authorize hiding costs, errors, names or units.

| Rule | Apply it by doing this | Review evidence |
| --- | --- | --- |
| Show the task | Lead with the real object, preview, workspace or interaction. | The first view communicates what can happen. |
| Minimize interpretation | Use familiar content, grouping, proportion and clear state changes. | Someone can identify the intended action and result. |
| Make each element earn its place | Remove wrappers, duplicate headings and explanations already conveyed visually. | Each remaining element supports the task or necessary context. |
| Keep hierarchy deliberate | Give the current task a dominant object and a clear action. | The eye reaches the useful part before secondary information. |
| Reveal secondary detail in context | Put specifications, implementation notes and optional help behind an appropriate control. | The primary path remains complete without opening them. |
| Preserve consequential information | Keep relevant prices, recipients, scope, permissions, errors and confirmation visible at the decision point. | A person can understand what they are authorizing and recover from failure. |
| Use motion as explanation | Connect a trigger, transition and outcome. Make duration serve comprehension. | The animation clarifies causality; a still or reduced motion alternative preserves meaning. |
| Keep product character | Follow the approved brand, source components and density appropriate to the task. | A second product does not become a reskinned Hardwire page. |

## Cinematic demo profile

Use this profile for a short product explanation or capability demonstration where the visual sequence is the main content.

1. Start with a simple wordmark and the demonstration. Add one concise headline only when the comparison cannot be identified without it. Hardwire's dark presentation is the approved reference for this profile.
2. Show one coherent comparison. Use a few recognizable examples only when they clarify that the capability spans several situations. Three is a reference choice, not a required grid.
3. Let the source object and final state identify the example. Google sign in, a payment card and a settings switch worked in Hardwire. Use equally specific objects for another product.
4. Replace text driven tutorial panels with observable changes. Avoid numbered cards, navigation lists, code call labels and repeated success captions on the landing view.
5. Establish the starting state, show the action, reveal the result and leave a short moment to inspect it. Subtle camera movement, cursor travel and a direct path should serve this sequence.
6. When comparing routes, keep the intent and outcome equivalent. Distinguish routes through spatial position, motion and state. Add concise visible labels if people cannot identify the comparison.
7. A silent illustrative loop may start automatically. Keep pause and replay available, prevent flashing, support reduced motion and suspend work while hidden. Never autoplay consequential application actions.
8. Put optional technical context behind a discoverable information control. Retain brief visible disclosure if the scene could otherwise be mistaken for a live action or measured performance.
9. Keep icon controls recognizable and named for assistive technology. Verify focus, keyboard activation, touch access and the information control on mobile.

### Manual comparison

- Let the selected source and its adapted result carry the explanation. Do not add a headline, captions or tutorial copy above the stage when the pair is self-explanatory.
- Keep model result thumbnails under each other in a stable rail. Selecting one updates the before/after pair.
- Provide a visible before/after control labelled Before and After. Support pointer drag and keyboard; do not autoplay the comparison.
- Keep the task, structure and essential facts identical across sources. Preserve each source's composition, palette and typography; do not collapse every source into one default theme.
- Reserve each result's own accent for its single action. Keep the header, rail and action free of logo badges, rail icons, fake window chrome and button arrows.
- Show whether results are recorded or live, and name the model, provider and date. State the one-run limits. A source name on stage is not enough disclosure, and one run is not a benchmark.

## Functional interface profile

Apply the same restraint to forms, editors, financial tasks and operational tools through composition and direct interaction. Preserve the information needed to use them.

| Element | Keep visible when needed | Usually reveal later |
| --- | --- | --- |
| Form | Field labels, entered values, units, validation errors and submit action. | Detailed field guidance and implementation notes. |
| Payment | Amount, currency, recipient, relevant terms and explicit confirmation. | Nonessential history and technical diagnostics. |
| Settings | Understandable preference names, current values and save or undo behavior. | Advanced explanations and audit history. |
| Workspace | The objects being managed, meaningful status and relevant editing controls. | Background rationale and secondary configuration. |

### Document review

- Make the document the dominant object. Keep the decision facts beside it rather than repeating them in a summary card.
- Use scale, spacing and alignment instead of dividers, repeated totals or decorative wrappers.
- Reserve the accent for the single primary action.
- At confirmation, keep supplier, amount, due date, destination and consequence visible. A confirmation that drops one of these is incomplete.
- Use spacing and type hierarchy to separate regions. A divider is a last resort, not a default.

Do not trade reading for guessing, extra navigation or lost context. An unfamiliar icon needs a visible label. An editorial product still needs its content. Dense data can belong in a clear table rather than a sparse decorative layout.

## Review gates

1. **Comprehension:** identify the object, main action and result without an introductory paragraph. An unresolved interpretation is a finding, not a reason to invent a score.
2. **Information:** check every removed item for task relevance. Price, permission, units, error recovery and essential status cannot be discarded to reach a text quota.
3. **Behavior:** verify the useful path and relevant alternate states. A film must be identified as illustration; it is not execution evidence.
4. **Motion:** verify pause, resume, replay, reduced motion and hidden page behavior where relevant. The outcome must remain understandable without the animation.
5. **Access:** inspect keyboard focus, screen reader names, contrast, touch controls and narrow layouts. Do not claim complete accessibility from a screenshot.
6. **Identity:** compare against the chosen brand and approved references. Keep project specific choices scoped.

Hardwire is an approved visual direction. Whether the comparison is immediately understood by new visitors still needs observation with those visitors. Preserve that distinction in evaluation reports.
