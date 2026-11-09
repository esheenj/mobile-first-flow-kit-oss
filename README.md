# Mobile-first Flow Kit

**[Open the GitHub-deployed responsive fictional journey](https://esheenj.github.io/mobile-first-flow-kit-oss/)** — [GitHub Pages deployment](https://github.com/esheenj/mobile-first-flow-kit-oss/actions/runs/42483166769) succeeded on **9 November 2026**. Independent external HTTPS/browser verification is still pending; please report any rendering problems in GitHub Issues.

[![Offline checks](https://github.com/esheenj/mobile-first-flow-kit-oss/actions/workflows/test.yml/badge.svg)](https://github.com/esheenj/mobile-first-flow-kit-oss/actions/workflows/test.yml)

**Experimental source preview · MIT · zero runtime dependencies**

Dependency-free responsive journey demo with bounded state transitions, validation and focus management.

A small, reusable reference for developers building human-centered interfaces. MIT licensed. No runtime packages, telemetry, account, keys or remote backend.

## Run

Node.js 20+ and Python 3 for the browser demo:

```sh
git clone https://github.com/esheenj/mobile-first-flow-kit-oss.git
cd mobile-first-flow-kit-oss
npm test
npm run demo
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000 on the same computer. No npm install is required. The package is source-only; private:true prevents accidental registry publishing.

## Run the actual browser MVP and contribute

The fictional journey in `index.html` now has an **exact-source GitHub Pages artifact**: `node scripts/stage_pages.mjs dist/pages` stages only the HTML and two ESM modules, and the CI checks the staged site through real Chrome at 320–1440px. No private source, account or backend is deployed. [Pages setup and actual HTTPS acceptance](docs/PAGES_RELEASE.md) are required before a live URL is advertised.

For a first contribution, try a bounded [regression or keyboard task](docs/GOOD_FIRST_ISSUES.md), and follow [CONTRIBUTING.md](CONTRIBUTING.md). GitHub Pages deployment is confirmed by Actions; independent external browser acceptance is still pending.

## Features

- Three-step journey: choose a template, name it, review and finish.
- Back preserves input; reset clears it; invalid actions fail explicitly.
- Responsive layout, native controls, live status and heading focus on transitions.
- Frozen synthetic choices and pure model tests.

## API v1

| Export | Contract |
| --- | --- |
| initialState() | Returns a fresh step 0 state |
| transition(state, action) | Returns a new state or throws FlowError |
| TEMPLATES | Frozen synthetic choices |

Actions: SELECT_TEMPLATE on step 0, EDIT_LABEL on step 1 (up to 50 characters), NEXT with required selection/3–50 character label, BACK before completion, RESET at any valid state. Completed state is terminal except RESET. State fields are step, template and label. No persistence or network.

## Minimal model example

```js
import { initialState, transition } from './src/flow.mjs';
let state = initialState();
state = transition(state, { type: 'SELECT_TEMPLATE', value: 'booking' });
state = transition(state, { type: 'NEXT' });
state = transition(state, { type: 'EDIT_LABEL', value: 'Synthetic booking' });
state = transition(state, { type: 'NEXT' });
state = transition(state, { type: 'NEXT' });
console.log(state.step); // 3: complete
```

The model has no DOM dependency. The small browser adapter in `src/app.mjs` owns rendering, validation associations and focus recovery. Reuse the model or study the adapter independently.

## Limitations and checks

This is a reference starter, not a production framework or WCAG certification. Unit tests cover model behavior, not every browser or assistive technology. Released as an experimental source preview after maintainer review and owner visual acceptance. Real-phone recordings show narrow and expanded layouts and selected interactions. Automated model/focus checks and prior Chromium checks are distinct evidence; screen-reader announcements, full physical-device journey, high zoom and the corrected button rendering are not fully verified. See [QA.md](QA.md) for the open checks. No production backend, private API gateway or credentials are required or included.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), bug reports or feature requests. Useful feedback includes a synthetic reproduction, exact revision and observable expected result. Follow [community conduct](CODE_OF_CONDUCT.md) and [private vulnerability reporting](SECURITY.md).

## Roadmap

Complete the open device/accessibility matrix, improve examples and add focused integration tests based on real use cases. Propose a small synthetic reproduction in Issues. No adoption metrics are claimed.

[License](LICENSE) · [Design System Foundations](https://github.com/esheenj/design-system-foundations-oss)



## For AI-assisted contributions

Read [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md) and the machine-readable [project-manifest.json](project-manifest.json). Inspect current source and tests before editing. Keep changes small, fixtures synthetic and verification explicit. The manifest describes this public source; it grants no access or execution authority.

## Related public tools

- [Mobile-first Flow Kit](https://github.com/esheenj/mobile-first-flow-kit-oss)
- [Data Table Interactions](https://github.com/esheenj/data-table-interactions-oss)
- [Design System Foundations](https://github.com/esheenj/design-system-foundations-oss)
