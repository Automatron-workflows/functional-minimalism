# One useful experiment

Build the same small task with and without the harness. Use the same model/version, task requirements, design-system source, viewport sizes and acceptance checks. Use fresh sessions and alternate run order. Keep the harness brief and workflow context in its usage totals.

Start with the invoice example: show recipient, amount, destination and due date; require explicit confirmation; make errors recoverable. Use simulated money in both conditions.

Stop only when the same functional checks pass and a reviewer accepts the result. Record:

| Measure | Record |
| --- | --- |
| Time | Elapsed minutes from first prompt to accepted result |
| Usage | Provider-reported input, output and cached token counts |
| Rework | Number of corrective prompts and their reasons |
| Task completion | Confirmation, error recovery, narrow layout and keyboard results |
| Review | Blind comparison of clarity, hierarchy and fit to the supplied system |

Repeat across the discovery and project examples. Preserve raw outputs and failed runs. Report the sample size and model settings. A single attractive screenshot is not evidence of a general saving.

`npm run measure:context` compares the UTF-8 size of full and compact generated briefs. It is a deterministic context-size check only; it does not estimate model tokens or measure model quality, time, cost, or first-pass success.
