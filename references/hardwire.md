# Approved reference: Hardwire silent demo

**Approval:** Matthias called this version great and asked to carry its design rules into the design harness on 13 November 2026.

**Live reference:** https://automatron-workflows.github.io/hardwire/

**Pinned source:** https://github.com/Automatron-workflows/hardwire/tree/dbfcc074b7386fbceee3e3a0bd1a00de9d667ec0/playground

**Published change:** https://github.com/Automatron-workflows/hardwire/pull/10

## What was accepted

The dark page retains a plain hardwire wordmark and the headline “Agentic actions. Without the clicks.” Three silent scenes show Google sign in, invoice payment and settings. Cursor navigation sits above direct paths to the pictured results. Familiar objects, interface transitions, subtle camera movement and a visible result carry the explanation. A shared pair of icon controls handles pause and replay. Context is available from an information icon.

This is an illustrative film. It does not execute the local comparison handlers, authenticate an account or make a payment. The source retains those executable examples separately.

## Corrections that led here

| Earlier direction | User feedback | Rule to retain |
| --- | --- | --- |
| Theme switching | Did not demonstrate the strongest use cases. | Choose an example that communicates the actual product value. |
| Shop and calendar as the main demo | Suggested Hardwire was a shop or calendar product. | Use a small set of familiar domains when the capability is general. |
| Three numbered comparison cards with menus, code and captions | Too much to read despite being more structured. | Fewer paragraphs alone is insufficient; replace explanatory UI with observable behavior. |
| Light presentation | The earlier dark treatment was preferred. | Preserve the accepted theme for this demo. |
| Silent animated scenes | Explicitly approved. | Carry forward the visual storytelling and restraint. |

## Transferable decisions

1. Start with an outcome people can recognize.
2. Make the visual sequence explain what changes and how the paths differ.
3. Remove code labels and repeated explanatory scaffolding from the first view.
4. Keep optional details available without making them a prerequisite.
5. Treat motion, interaction and static fallback as one design.

## Scoped decisions

The dark canvas, subdued green, typography, exact spacing, three columns and eight second loop belong to this particular demo. They are reference choices, not mandatory tokens for every product. They do not define Alps.

## Audit and evidence limits

The approved source separates the film from executable fixtures. It provides accessible scene descriptions, keyboard operated controls, pause and replay, a reduced motion starting state, and suspension when the page or film is hidden.

The publication review exercised playback, frozen pause state, resume, replay, optional context, keyboard controls and a 390px layout. The repository's 133 tests and package checks passed at publication. Those checks cover the toolkit and fixtures; they do not establish first time visitor comprehension or complete accessibility of the artwork.

Open validation questions: can new visitors distinguish the upper and lower routes from the cursor and direct path symbols; can they identify each outcome without labels; can touch users find the optional context; does the static comparison remain clear? Resolve these through observation. If a short label improves the task, keep it. User approval should preserve the direction without freezing every detail.
