# AGENTS.md

## Verified Workflows

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Start dev server (fixed host/port): `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
- Build production bundle: `npm run build`
- Preview production build: `npm run preview`

## Current Repo Conventions

- Application code is under `src/`.
- Static assets are served from `public/assets/`.
- Production output is generated in `dist/`.

## TODO

- Add a documented smoke-test command when an automated test runner is introduced.
