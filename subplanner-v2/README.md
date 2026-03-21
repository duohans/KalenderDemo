# subplanner-v2

Fresh production-grade foundation for a substitute scheduling planner for schools. This build is intentionally isolated from the previous MVP and uses a new architecture centered on a custom DOM planner board instead of patching the old implementation.

## Purpose

The app models a school substitute planning board where:

- time runs on the X axis
- planning lanes run on the Y axis
- need cards represent concrete lesson coverage needs
- row assignees provide default coverage for an entire lane
- card-level assignees override the row assignee
- row titles are always derived from the current planner state

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- TanStack Router
- TanStack Query
- Zustand
- Zod
- dnd-kit packages
- motion
- react-aria-components
- date-fns
- lucide-react
- clsx
- tailwind-merge
- Vitest
- Playwright

## Scripts

- `npm run dev` starts the Vite dev server.
- `npm run typecheck` runs TypeScript project checks.
- `npm run build` runs type checks and creates a production build.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest once.
- `npm run test:watch` runs Vitest in watch mode.
- `npm run test:e2e` runs Playwright tests.

## Project Structure

```text
subplanner-v2/
  src/
    app/
    routes/
    features/
      planner/
        domain/
        selectors/
        state/
        dnd/
        motion/
        components/
        utils/
    components/
      ui/
    lib/
    styles/
    test/
  e2e/
```

## Current Status

Implemented in this pass:

- architecture, domain, and implementation planning docs
- React app scaffold with routing, query provider, and Tailwind theme
- normalized planner domain schemas and selectors
- Zustand planner store with seeded mock data and persistence-ready structure
- rigid three-area planner shell with equal-height lanes and fixed day-view time blocks
- initial unit and end-to-end test setup

Deferred to later phases:

- full drag-and-drop interactions
- richer motion polish
- server-backed data layer
- week view

## Key Docs

- `ARCHITECTURE_DECISION.md`
- `APP_DOMAIN_SPEC.md`
- `IMPLEMENTATION_PLAN.md`

## Setup

```bash
npm install
npm run dev
```
