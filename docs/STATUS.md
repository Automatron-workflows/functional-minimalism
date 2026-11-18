# Functional Minimalism v0.3 implementation status

The original product plan remains a proposal. This file tracks the implemented slice.

| Capability | Status |
| --- | --- |
| Functional minimalism guidance with Dieter Rams reference | Implemented; human review guidance |
| One-command first-screen setup and doctor | Implemented; compact brief by default |
| Functional Minimalism brand, four model cards with per-card before/after, live prompt lab, approved component gallery and setup panel | Implemented; source served in Chromium at 390px and 1440px |
| Versioned packs, semantic tokens, alias validation | Implemented |
| Eleven mapped HTML reference components | Implemented |
| Pack composition patterns and contract binding | Implemented; document review and manual comparison |
| Three screen contracts and portable briefs | Implemented |
| Codex / Claude project instruction files | Implemented; host must load them |
| Scoped accepted/proposed/rejected decision memory | Implemented; workshop adds local acceptance and brief download |
| Pack pinning and drift detection | Implemented |
| Normalized token-map import with provenance | Implemented |
| Local source/export checks and lexical CSS checks | Implemented; limitations documented |
| DOM collection and state/viewport evidence audit | Implemented; essential facts checked in ready and confirmation |
| Feature scope and control presentation plans | Implemented optional surface schema; annotation-based checks; recognition requires people |
| State-specific essential information | Implemented; invoice confirmation now declares required information |
| React stack adapters | 13 context adapters; manifest/config detection, explicit UI selection, brief composition and drift checks |
| React version/build compatibility matrix | Not run; adapters do not certify installed API compatibility |
| Four recorded model runs, three interactive fixture flows and static build | Implemented; direct starter brief copy/download added; four equal cards |
| Local Chrome behavioral verification runner | Actual-width iframe runner implemented; GitHub CI passes 26 workshop and 5 prompt-lab assertions each at 390px and 1440px |
| Live Figma / Code Connect importer | Pending |
| Alps design pack | Pending actual source |
| Harness runtime model calls | None; the optional prompt lab uses a host free connector or the provider a visitor connects |
| Keyless free connector | Local `/api/lab` and Cloudflare Worker adapter; three free models plus Qwen open; public keyless generation requires the host to deploy the Worker |
| AST-based React/TypeScript prop validation | Pending |
| Craft benchmark of the harness | Implemented; transparent heuristic, v1 after 96.2 vs v0 77.7, 4/4 improved; see docs/BENCHMARK.md |
| Participant usability study or blind human preference test | Not run |
| GitHub repository / Pages publication | Public source and anonymous demo are live; main CI and Pages deployment pass |
| Hosted deployment | GitHub Pages demo is canonical. A separate Higgsfield draft requires sign-in and is not advertised |
| npm publication | Not published; install from source |

The harness runtime requires no credentials or external dependencies. The optional prompt lab uses a visitor-supplied provider key in the browser; no server proxies or stores it. Tests and observed results are recorded separately from product claims. The recorded model-run lab shows actual model output; it is not a measured performance comparison, benchmark or usability study.
