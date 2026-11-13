# Functional Minimalism workflow · functional minimalism

Apply this workflow to UI work. Keep planning and implementation commentary out of the product interface.

Use functional minimalism: reduce interpretation and repeated explanation while preserving the information needed to act. Read `references/functional-minimalism.md` for the Dieter Rams reference and practical review criteria.

Read the adjacent `DESIGN_RULES.md` when installed in `.design-harness/`; in the harness source, read the root `DESIGN_RULES.md`. It contains Matthias's accepted visual-first guidance. For explanatory demos, also read `references/hardwire.md`. Keep Hardwire's exact colors, layout, and pacing scoped to that reference.

1. Read the pinned pack and the screen's contract. Reuse actual components and semantic tokens. If a project already has a design system, capture that system rather than importing the reference aesthetic.
2. Read accepted memory decisions matching this project, pack, and screen. Proposed or rejected decisions must not become instructions. Current user direction and task requirements take priority over older taste preferences.
3. Define the person's task, primary object, primary action, essential visible information, composition, states, and mobile/desktop widths. Use the screen schema in the harness examples. Do not choose cards before understanding the task.
4. Build a complete usable path. Challenge repetitive explanation first. Preserve useful labels, content, consequences, and recovery. Give unfamiliar actions visible names. Add semantic HTML, keyboard access, focus treatment, and reduced-motion handling.
5. Render the actual implementation. Exercise each required state at each specified width. Capture DOM evidence using src/browser.mjs. Check keyboard navigation, contrast, enlarged text, long content, and errors separately. DOM annotations are declarations, not proof of source identity.
6. Run source checks and audit actual captured evidence. Repair concrete failures, then rerun affected checks. Cap repair at three passes and report unresolved findings. Never claim aesthetic quality or usability has been measured solely because checks pass.
7. Record only explicit accepted corrections as accepted memory. Retain scope, target, reason, and provenance. Keep different brands separate. Never silently replace a user's design files or preferences.

The harness is a workflow and a set of deterministic checks. The host agent performs the design, browser interaction, and repairs. It does not invoke paid models, infer acceptance, or run a hidden autonomous loop.
