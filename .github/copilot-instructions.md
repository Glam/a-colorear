## Quick orientation for AI coding agents

This repository is a tiny Progressive Web App (PWA) for creating coloring-book pages and painting them in-browser. The app is a single-page static site with a service worker and client-side logic in `index.html`. Use these notes to make focused, low-risk edits.

Key files
- `index.html` — entire application UI and JavaScript. Contains:
  - Canvas-based coloring logic (pointer events, undo stack using data URLs).
  - Color palette generation (64 colors grid produced at runtime).
  - Zoom handling implemented by CSS `transform: scale(...)` with coordinate remapping in `getCanvasCoordsFromEvent`.
  - Image generation via an external image API (Gemini demo endpoint) — API URL and an inline API key string are present in the file.
  - Voice-to-text using `webkitSpeechRecognition` (feature-detect before use).
- `manifest.json` — PWA metadata and icons.
- `sw.js` — minimal service worker (caching install + fetch fallback). 

What matters when editing
- Single-file app: `index.html` holds HTML, CSS and JavaScript — prefer small, well-scoped edits inside this file rather than extracting into new modules unless adding many features.
- Coordinate transforms: zoom is implemented with CSS scale; pointer coordinates are converted to canvas pixels using bounding rect and canvas dims. Any change to zoom implementation must preserve `getCanvasCoordsFromEvent` math or update all drawing event handlers.
- Undo stack: stored as base64 data URLs in `undoStack`. Keep stack size limits (currently 50) in mind for memory/serialization changes.
- Image generation: the code currently calls Google generative endpoint and expects a Base64 image in `data.candidates[0].content.parts[].inlineData.data`. Do not remove or rename keys without verifying the remote API shape.
- Security: there is an inline API key variable in `index.html`. Treat it as sensitive — do not commit real production keys. If replacing with environment-injected secrets, update README and document required dev setup.

Testing & verification
- Manual: open `index.html` in a browser (or serve with a static server) and verify:
  - Canvas drawing with mouse/touch (pointerdown/move/up).
  - Zoom in/out with buttons and Ctrl/Cmd + wheel — drawing coordinates must remain correct.
  - Palette selection and eraser/undo behavior (double-tap eraser clears canvas).
  - Service worker registration (check DevTools → Application → Service Workers).
- Automated: there are no tests in the repo. When adding code, include at least one small smoke script (e.g., a node-based static-check or an HTML load test) and document how to run it in README.

Common quick fixes and patterns
- Add feature flags conservatively — put toggles near top of `index.html` and default to off.
- Avoid adding heavy dependencies — this is a small static PWA; prefer vanilla JS and small utilities.
- If introducing new files referenced by `sw.js` cache, update `sw.js` cache list accordingly.

Examples from repo
- Coordinate mapping (important): getCanvasCoordsFromEvent in `index.html`
- Undo snapshot: `saveState()` pushes `canvas.toDataURL()` into `undoStack`
- Palette generation: nested loops create 64 `rgb(...)` swatches and attach click handlers

When you see an inline API key
- Flag it: leave a TODO comment and open an issue to rotate/remove keys.
- Prefer replacing with a placeholder (e.g. `REPLACE_WITH_API_KEY`) and brief docs telling maintainers to provide a runtime secret or use a proxy server.

If you need to add tests or CI
- Keep tooling light: a small `npm` script that serves `index.html` or runs `playwright`/`puppeteer` smoke tests is sufficient. Document commands in the README and in this file.

Contribute style
- Keep changes small and reversible. The project is single-file; prefer atomic commits that change at most one conceptual area (UI, drawing logic, API integration, service worker).

Questions for the maintainer
- Do you want the inline API key removed or rotated to a placeholder?
- Should I add any automated tests or CI scripts for future changes?
If anything above is unclear, tell me which area to expand (API flow, zoom math, or service worker caching) and I'll update this file.
