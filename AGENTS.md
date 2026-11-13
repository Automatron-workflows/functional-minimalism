# Design harness working context

This folder contains the design plan, reusable authoring context, and Functional Minimalism v0.3 implementation. Read `docs/STATUS.md` and `docs/VERIFICATION.md` for implemented capabilities and verification limits. Live Figma importing and an Alps pack remain pending.

Before designing or reviewing a screen, read `DESIGN_RULES.md` and the relevant approved reference. Read `references/hardwire.md` for explanatory demos. Read `Automatron_Design_Harness_Plan.md` when changing the architecture or implementation scope.

## Default approach

1. Start with the person's task and the visible result. Put the object, preview or interaction on screen before writing explanatory copy.
2. Use a short internal screen contract: task, primary object, main action, essential visible information, chosen composition, required states and verification evidence. Keep this contract out of the product UI.
3. Preserve the selected brand and its approved visual language. Use Hardwire's cinematic demo profile for relevant demos. Do not treat its colors as Alps tokens or a universal theme.
4. Remove repeated headings, numbered wrappers, helper paragraphs and implementation labels that the visual already explains. In product copy, avoid em dashes and en dashes.
5. Use motion to make a state change or causal relationship legible. Provide pause and replay for a looping demonstration, honor reduced motion, and stop unnecessary work when hidden.
6. Keep essential content, recognizable controls, values, permissions and recovery visible when the task needs them. An accessible name alone does not make an unfamiliar icon understandable.
7. Keep demonstrations honest. Illustrative playback must not trigger sign in, payment or other real actions. Do not invent measured speed or execution claims from an animation.
8. Build and inspect the actual states. Check narrow and wide views, keyboard focus, touch controls, loading, errors and the successful result as applicable.
9. Record accepted corrections with their scope and source. Unaccepted suggestions remain provisional. Do not claim a preference was learned across clients unless the relevant client actually loaded this context.

## Delivery check

The central question is: can a person identify the object, action and outcome without reading an introduction?

If the answer is unclear, fix the composition, affordance or example first. Add the shortest useful label when it improves understanding. Do not conceal essential information to meet a word count.

Report working behavior, inspected evidence and remaining uncertainty separately. User approval establishes an accepted design direction; it does not establish measured usability or accessibility certification.

Use **functional minimalism** as the design philosophy. Read `references/functional-minimalism.md` for the Dieter Rams reference and practical review guidance. Reduce effort to understand and act; preserve useful information and product character.
