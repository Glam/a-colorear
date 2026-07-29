# A-Colorear — In-Browser Coloring Book (PWA)

A-Colorear is a tiny single-page Progressive Web App (PWA) for creating and painting coloring-book pages directly in the browser. The app is intentionally small and self-contained: all UI, styles and client-side logic live in `index.html`. This README summarizes the app features, developer notes, testing instructions and a brief security note about the embedded API key.

## Key files

- `index.html` — The entire app UI and JavaScript. Contains canvas drawing/painting logic, palette generation, zoom handling, undo stack, image generation calls, and optional voice-to-text support.
- `manifest.json` — PWA metadata and icons used for installability.
- `sw.js` — Minimal service worker used for caching and offline fallback.

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

## Suggested low-risk improvements


## How to contribute

- Open a PR with focused changes. Prefer small commits.
- When adding features that change saved state shapes (e.g., undo format), add migration notes.

## Contact / Questions


## Recent changes (2026-03-26)

Today I completed a major UI and UX overhaul to modernize the app with Material Design 3 principles and improve painting experience. Key edits:

### Design & UI
- **Material Design 3 implementation**: replaced basic CSS with Tailwind CSS + MD3 color system (primary, secondary, tertiary, surface tokens). Modern semantic colors and responsive layout.
- **Header redesign**: integrated prompt input, generate button, undo, and new opacity slider in a cohesive top bar.
- **Sidebar navigation**: left-side fixed toolbar with 6 brush sizes + eraser + color indicator.
- **Color palette overhaul**:
  - Simplified to 12 primary colors with Spanish labels (Azul, Rojo, Verde, Naranja, etc.).
  - Added expandable modal with 24 vibrant colors (grid 8×3).
  - Modal auto-closes after color selection.
  - Increased vertical padding to prevent selection ring clipping.

### Painting & Blend Modes
- **Blend mode `multiply`**: colors now use `globalCompositeOperation = 'multiply'`, preserving black outlines while allowing vibrant colors (like real watercolors or markers).
- **Opacity slider**: added interactive slider (0–100%) in header to simulate different painting techniques:
  - 100% = Opaque paint (default)
  - 70% = Watercolor
  - 40% = Pencil
  - Users can adjust in real-time.

### Technical improvements
- Canvas dimensions fixed at 800×600 (consistent with new design).
- Canvas area behavior identical to original (no centering, clean overflow).
- All original functionality preserved: zoom, pan, undo, image generation, voice input.
- Responsive design with overflow handling for palette grid.

### Files changed
- `index.html` — complete redesign with MD3, Material Symbols icons, Tailwind CSS, new palette system, blend modes, and opacity control.
- `Add an export/download button that saves the canvas as PNG — small priority.
3. Add a minimal Playwright smoke test that checks the page loads, the canvas exists, drawing works, and the service worker registers — low/medium priority.
4. Improve accessibility: add ARIA labels, tooltips, and keyboard shortcuts (e.g., Ctrl+Z for undo) — small priority.

If you want, I can implement any of these nexnd add a tiny server-side proxy example (Node/Express) — medium priority.
2. Polish toolbar visuals: add hover states, improved focus outlines, and accessible tooltips — small priority.
3. Add an export/share button that downloads the canvas as PNG or uses the Web Share API on mobile — small priority.
4. Add a minimal Playwright smoke test that checks the page loads, the canvas exists, and the service worker registers — low/medium priority.

If you want, I can implement items 1 or 2 next.
If anything in `index.html` or the other files is unclear (zoom math, undo behavior, or service worker caching), open an issue or ask for a targeted change.

---

This README was generated from the repository's developer notes. If you'd like, I can also:

- Replace the inline API key with a placeholder and add a short proxy example.
- Add a minimal smoke test script (Playwright) and an `npm` script to run it.

