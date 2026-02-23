# Ground Control Simulation Toggle

The Ground Control Simulation is currently hidden behind a feature flag.

## Current state

`showGroundControlSimulation` is set to `false` in:

- `index.html` (inside `window.PHOTON_FEATURE_FLAGS` in the `<head>`)

When this flag is `false`:

- The simulation UI in the roadmap section stays hidden.
- A temporary roadmap placeholder message is shown.
- `mission-demo.js` is not loaded.

## How to show it again

1. Open `index.html`.
2. Find `window.PHOTON_FEATURE_FLAGS` in the `<head>`.
3. Change:

```js
showGroundControlSimulation: false
```

to:

```js
showGroundControlSimulation: true
```

4. Save and reload the site.

## Why this approach

- Re-enable is a one-line change.
- The mission simulation markup and script are preserved.
- Keeping script loading conditional avoids unnecessary work when the feature is off.
