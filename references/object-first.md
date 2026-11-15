# Design the usable object first

The starting question is: what is the person operating? A timer, document, collection, invoice or set of tasks. Put that object and its state in the foreground. Give the person a direct way to act on it.

## Before writing JSX

1. Write the task as a verb and object. Define a visible successful result.
2. List candidate features. Mark each primary, secondary or omit, with a reason tied to the task. Add no feature solely because the selected library has that component.
3. Compose the object, current state and primary action. Choose a list, document, canvas, gallery or control surface according to the work. Do not default to a dashboard or a grid of cards.
4. Keep the smallest useful set of visible words: object identity, values and units, control names, meaningful status, consequences and recovery. Challenge welcome copy and repeated introductions first.
5. Use icon-only controls only where their meaning is sufficiently familiar for the intended people and context. Record the rationale and verify recognition. Provide an accessible name. Unfamiliar actions and consequential confirmations keep concise visible labels. Tooltips are supplementary.
6. Preserve the approved brand through typography, scale, spacing, alignment, color, imagery and motion. Match contrast and density to the task. A dense ledger and a quiet timer can both follow this philosophy.
7. Exercise loading, empty, success, error, confirmation and editing states as applicable. Keyboard and touch must offer alternatives to gestures. Keep recovery visible at the point of failure.

## A concrete appliance translation

A kitchen timer can show a large remaining time, explicit units, an adjustable duration, Start, and a quiet preset row. It does not need “Welcome to your time management dashboard,” explanatory feature cards, an account requirement or achievements for this task. A keyboard-editable value can complement a dial. A state change and concise status can communicate that the countdown is running.

The timer contract in the source repository is a planning example, not a shipped timer application. Removing its text is not a validated usability result. Observe whether people can start, pause and recover without instructions.

## Text review

| Text type | Default treatment |
| --- | --- |
| Object/content: film title, supplier, document name | Preserve what identifies the object and supports the decision. |
| Control: Start, Pay, Duration, Search | Keep short and specific; remove only when recognition has evidence. |
| Value/unit: €1,210, 10 min | Preserve at the point of use. |
| Explanation: welcome copy, duplicate instruction | Remove when hierarchy or behavior already communicates it. |
| Consequence/error: recipient, permission, retry | Preserve when needed to authorize, understand or recover. |

Digital inclusion is evaluated through successful use, keyboard and assistive-technology access, contrast, text enlargement and error recovery. Fewer features and less reading can help, but icon recognition, hidden navigation and memory demands can increase effort. No total-word-count target can certify inclusion.

## Evidence and memory

Use annotated browser snapshots to catch objective regressions. Use visual review for proportion, hierarchy and brand coherence. Use observed task attempts with intended users for comprehension. Keep these conclusions separate.

An agent can propose a correction, but only explicitly accepted corrections enter memory. Scope them to the relevant screen, project or pack. Do not convert a timer's quiet composition into a universal rule against data tables or editorial content.
