# Photon Aerospace Website

Photon Aerospace is a static marketing site with an interactive Defence mission demo embedded in the `Roadmap` section.

## Project Structure

- `index.html` - page structure and inline behavior for the main site.
- `style.css` - global styles plus mission demo styling.
- `mission-demo.js` - Defence mission simulation logic (polygon, drones, operators, telemetry, mode toggle).
- `assets/` - images/video used across sections and mission overlays.

## Defence Mission Demo (Current)

The roadmap section has been replaced by a mission-style operator UI with:

- Sticky full-screen section while scrolling through the roadmap area.
- `Defence` and `Commercial` mode buttons.
- Commercial mode currently shows a placeholder state.
- Static desert map with interactive overlays.
- Draggable polygon mission area.
- 5 simulated drones that rebalance coverage when polygon points move.
- Camera direction wedges ("pizza slices") per drone.
- 3 clickable operator pins on the map.
- Click drone: camera overlay and telemetry focus that drone.
- Click operator: highlights operator and shows nearest drone feed context.
- Battery/RTB/range/endurance telemetry panel for selected context.
- Logical mission scene rendered at `1600x900` and scaled responsively for viewport fit.
- Adaptive compact HUD mode on smaller screens.

## Browser and Device Support

Current target baseline:

- Chrome (desktop/mobile): latest 2 versions
- Safari (macOS + iOS): latest 2 versions
- Edge: latest 2 versions
- Firefox: latest 2 versions

Compatibility behaviors included:

- Dynamic viewport height handling (`dvh/svh` + JS fallback) for mobile browser chrome.
- `backdrop-filter` fallback styling when blur support is unavailable.
- Mobile fallback for `background-attachment: fixed`.

## Required Mission Assets

Expected mission asset filenames:

- `assets/desert-map-1.jpg` (map background)
- `assets/drone-image-1.jpg` (camera overlay image)

If an asset is missing, the UI shows an in-panel fallback message instead of failing.

## Run Locally

This repo is static (no build step required). Serve from the repository root with any local HTTP server.

Example options:

```bash
python -m http.server 5173
```

```bash
npx serve . -l 5173
```

Then open:

- `http://localhost:5173/`

## Known Limitations

- Commercial mode is intentionally a placeholder.
- Drone movement and telemetry are currently dummy/simulated values.
- Mission simulation coordinates are fixed to a logical `1600x900` scene.
- Extremely narrow portrait screens may require visual zooming by the user for very fine polygon handle edits.

## Next Recommended Improvements

- Implement full Commercial mission view.
- Replace dummy telemetry with live or replay mission data.
- Add configurable mission presets and operator layouts.
