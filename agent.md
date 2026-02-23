# Photon Aerospace Project State

Snapshot date: 2026-02-23  
Repository path: `/Users/maxhitchings/Projects/Photon-Aerospace`

## Git State
- Current branch: `migration/react-ts`
- Branch relation: `migration/react-ts` and `main` currently point to the same commit (`9772185`, message: `update ui`)
- Remote: `origin` -> `git@github.com:oliver-hitchings/Photon-Aerospace.git`
- Working tree: clean (no uncommitted changes)

## Current Architecture
- Project is a static site (no build step, no framework runtime in repo).
- Main files:
  - `index.html` (single-page structure + inline UI scripts)
  - `style.css` (global styling + mission UI styles)
  - `mission-demo.js` (Defence mission simulation logic)
  - `assets/` (images + scroll video)
  - `CNAME` (`www.photonaerospace.co.uk`)

## What Is Implemented
- Landing/loading flow:
  - Full-screen loading screen and welcome banner.
  - Scroll-driven hero video (`assets/sequence.mp4`).
- Site sections:
  - Technology
  - Roadmap (replaced with mission-control experience)
  - Team + advisory cards
  - Contact section with mailto and copy-to-clipboard fallback
- Mission demo (Defence mode):
  - Logical scene fixed at `1600x900`, responsively scaled to viewport.
  - Draggable polygon mission boundary.
  - 5 simulated drones with heading, speed, altitude, battery/endurance/range telemetry.
  - 3 clickable operator pins.
  - Camera FOV wedges and drone/operator selection behavior.
  - Compact HUD behavior on smaller screens.
- Mission demo (Commercial mode):
  - Placeholder view only (not implemented yet).

## Assets and Content State
- Tracked files: 20 total.
- Assets folder contains core media including:
  - `assets/sequence.mp4`
  - `assets/desert-map-1.jpg`
  - `assets/drone-image-1.jpg`
  - team/advisory imagery
- There is also a duplicate root-level map file: `desert-map-1.jpg` (used by current mission config).

## Tooling and Operations State
- No `package.json`, `tsconfig.json`, bundler config, test config, CI config, or container config found.
- No `.gitignore` file present.
- Local development is expected via a simple static HTTP server.

## Known Gaps / Drift
- Branch name suggests React/TypeScript migration intent, but codebase is currently plain HTML/CSS/JS.
- README says required map asset is `assets/desert-map-1.jpg`, but runtime code currently uses `desert-map-1.jpg` at repo root.
- README mentions in-panel mission asset fallback messaging; current JS only changes image opacity on load error (fallback CSS classes exist but are not used by JS).
- Commercial mode remains a placeholder.
- Telemetry and mission behavior are simulated, not connected to live data.

## Practical Next Steps
1. Choose a single canonical path for the mission map asset and align code/docs.
2. Either implement visible asset fallback panels in mission JS or update README behavior notes.
3. Decide whether `migration/react-ts` will remain static or begin actual React/TypeScript scaffolding.
4. Add minimal repository hygiene (`.gitignore`, basic lint/test checks) if active development will continue.
