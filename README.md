# A-Colorear — In-Browser Coloring Book (PWA)

A-Colorear is a tiny single-page Progressive Web App (PWA) for creating and painting coloring-book pages directly in the browser. The app is intentionally small and self-contained: all UI, styles and client-side logic live in `index.html`. This README summarizes the app features, developer notes and testing instructions.

## Key files

- `index.html` — The entire app UI and JavaScript. Contains canvas drawing/painting logic, palette generation, zoom handling, undo stack, image generation calls, and optional voice-to-text support.
- `manifest.json` — PWA metadata and icons used for installability.
- `sw.js` — Service worker used for caching and offline fallback.

## Features (brief)

- Canvas-based drawing: paint using mouse, touch, or pointer events. Drawing is raster-based (canvas).
- Color palette: simplified 12-color primary palette with labels + expandable modal with 24 vibrant colors. Click/tap to select, modal auto-closes after selection.
- **Blend mode & Opacity**: colors use `multiply` blend mode to preserve black outlines. Adjustable opacity slider (0–100%) to simulate different painting techniques (opaque paint, watercolor, pencil).
- Eraser and Undo: an eraser tool and an undo stack implemented by saving canvas snapshots as base64 data URLs (stack size limited, currently 50).
- Zoom: implemented with CSS `transform: scale(...)`. Coordinate remapping converts pointer events to correct canvas pixel coordinates via `getCanvasCoordsFromEvent` so drawing remains accurate while zoomed.
- Image generation: the app can request images from an external generative API (a demo endpoint). The code expects a certain response shape (a Base64 image at `data.candidates[0].content.parts[].inlineData.data`).
- Voice-to-text: optional quick text input via `webkitSpeechRecognition` when available (feature-detected before use).
- PWA + Service Worker: `manifest.json` and `sw.js` enable basic installability and offline caching.
- Material Design 3: modern UI with dynamic color system, Material Symbols icons, and responsive layout.

## Developer notes & important internals

- Single-file app: prefer edits inside `index.html` unless adding a significant feature; small, well-scoped edits are safest.
- Coordinate mapping: keep `getCanvasCoordsFromEvent` in sync with the zoom implementation. It converts DOM pointer coordinates to canvas pixel coordinates using the canvas bounding rect and canvas width/height.
- Undo snapshots: snapshots are stored as `canvas.toDataURL()` strings in an `undoStack`. Keep the stack size limit (50) in mind to avoid unbounded memory use.
- Image API shape: the existing code expects the generated image to be present in `data.candidates[0].content.parts[].inlineData.data` as Base64. If you swap providers, update this parsing accordingly.

### Mobile behavior: pull-to-refresh disabled

- The app now disables the browser "pull-to-refresh" behavior that on some tablets reloads the page when you drag down from the top. This was implemented as a low-risk, progressive change in `index.html`:
	- Primary: CSS `overscroll-behavior-y: none` on `html`/`body` and `#canvas-area` (modern browsers).
	- Fallback: a small `touchstart`/`touchmove` handler that calls `e.preventDefault()` when the page is at `scrollTop === 0` and the user pulls down (covers older tablets/browsers that don't fully respect the CSS property).

If you prefer to revert this (for compatibility with very old browsers) or to tune the behavior (for example add a small Y-threshold before preventing), open an issue and I can adjust the implementation.

## Manual testing / verification

To test the app locally, serve it from a static HTTP server (file:// may block some features like service workers):

```bash
# from the project root
python3 -m http.server 8000
# or, if you use Node.js
npx http-server -c-1 .
```

Then open `http://localhost:8000` in a modern browser (Chrome, Edge, or Safari).

Verify these behaviors:

- Draw with mouse or touch (pointerdown, pointermove, pointerup).
- Select colors from the palette and paint. The selected color should be applied.
- Use the eraser tool and confirm double-tap eraser clears canvas if implemented in UI.
- Undo (should revert recent snapshots up to the configured stack size).
- Zoom in/out (via UI buttons or Ctrl/Cmd + wheel) and confirm drawing coordinates remain correct.
- If your browser supports `webkitSpeechRecognition`, try voice-to-text input and confirm it populates the expected UI element.
- Check service worker registration under DevTools → Application → Service Workers.
- On tablets/phones: pulling down at the top of the page should no longer trigger a page reload (pull-to-refresh). If you still see reloads, try a hard refresh or test on another browser — older engines sometimes ignore the CSS fallback and may require the JS mitigation.

## Quick developer tips & common quick fixes

- If you change zoom behavior, update `getCanvasCoordsFromEvent` accordingly.
- If you swap generative-image APIs, adapt the response parsing to the new provider's JSON structure.
- When editing `sw.js`, update its cache list to include any new static files you add.
- Keep edits small and atomic — this is a single-file app and large refactors make diffs hard to review.

## How to contribute

- Open a PR with focused changes. Prefer small commits.
- When adding features that change saved state shapes (e.g., undo format), add migration notes.

## Contact / Questions

- José Luis Quintero: jlquintero(at)gmail.com
