# Photon Aerospace Website (React + TypeScript)

Photon Aerospace is now a Vite-powered React + TypeScript single-page app with full parity migration from the prior static HTML/CSS/JS implementation.

## Requirements

- Node.js 18+
- npm 9+

## Install

```bash
npm install
```

## Run (Development)

```bash
npm run dev
```

Default local URL:

- `http://127.0.0.1:5173/`

## Build (Production)

```bash
npm run build
```

Optional production preview:

```bash
npm run preview
```

## Route / Page Map

This project is intentionally a **single React route** for parity with the legacy site:

- `/`

In-page hash anchors preserved:

- `#technology`
- `#roadmap`
- `#team`
- `#contact`

## Migration Map (Legacy -> New)

### Entry + App shell

- Legacy: `/index.html`
- New:
  - `/index.html` (Vite entry template + root mount)
  - `/src/main.tsx`
  - `/src/App.tsx`

### Section markup

- Navbar -> `/src/components/Navbar.tsx`
- Technology -> `/src/components/TechnologySection.tsx`
- Mission Roadmap -> `/src/components/MissionRoadmapSection.tsx`
- Team + Advisory -> `/src/components/TeamSection.tsx`
- Contact -> `/src/components/ContactSection.tsx`
- Footer -> `/src/components/SiteFooter.tsx`

### Legacy inline script behaviors (from old `index.html`)

- Scroll video loading/scrubbing -> `/src/hooks/useScrollSequenceVideo.ts`
- Welcome banner fade on scroll -> `/src/hooks/useWelcomeBannerFade.ts`
- Feature-card background switching -> `/src/hooks/useFeatureCardBackgrounds.ts`
- Email and clipboard handling -> `/src/components/ContactSection.tsx`

### Legacy mission engine

- Legacy: `/mission-demo.js`
- New:
  - `/src/mission/missionDemo.ts` (`initMissionDemo(root): cleanup`)
  - `/src/hooks/useMissionDemo.ts`

### Styling

- Legacy global CSS: `/style.css`
- New global CSS import: `/src/styles/style.css`

Class names and DOM IDs are preserved for parity.

## Asset Strategy

Canonical static assets are served from Vite public root:

- `/public/assets/*` -> runtime `/assets/*`

Examples:

- `/assets/sequence.mp4`
- `/assets/desert-map-1.jpg`
- `/assets/drone-image-1.jpg`

CNAME is preserved via:

- `/public/CNAME`

## Behavior Parity Notes

Preserved behaviors include:

- Loading screen + timeout fallback.
- Scroll-scrubbed hero video using blob fetch.
- Welcome banner fade behavior.
- Feature background hover transitions.
- Team/advisor image error fallbacks.
- Contact mailto + clipboard + fallback messaging.
- Mission demo interactions:
  - defence/commercial mode toggle
  - draggable polygon
  - drone simulation and camera wedges
  - operator/drone selection
  - telemetry updates
  - resize/orientation responsive scaling

## TypeScript Notes

- TypeScript is enabled project-wide with `strict: true`.
- `noImplicitAny` is intentionally relaxed to `false` to preserve mission-demo parity during migration without altering simulation behavior.
- Mission module includes localized type-tightening TODO comments for incremental hardening.

## Known Gaps

- Commercial mode remains an intentional placeholder (matches legacy behavior).
- Mission telemetry remains simulated/dummy values (matches legacy behavior).
