# Substitute Planner V2

Flat, grid-based day planner for substitute scheduling, built with React, TypeScript, Vite, Tailwind CSS, `dnd-kit`, Framer Motion, `lucide-react`, and `@fontsource/outfit`.

State is fully local: the planner runs without backend and persists to `localStorage`.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run build
npm test
npm run lint
```

## Product Model

- Time is the X axis and rows are the Y axis.
- Each row can contain several need cards, but each time cell can contain at most one card.
- Each row can have a `rowResponsibleId`.
- Each need card can optionally have an `explicitAssigneeId`.
- Effective assignee is:

```ts
card.explicitAssigneeId ??
  (card.placement === 'scheduled' ? row.rowResponsibleId : null) ??
  null
```

## Main Behaviors

- Drag need cards between rows and time cells.
- Drag need cards back to the left panel to unschedule them.
- Drag a substitute onto a row to assign row responsibility.
- Drag a substitute onto a card to create a direct override.
- Clear row responsibility or direct card overrides inline or from the detail sheet.
- Occupied cells reject drops.

## Visual Direction

- Strict flat design
- Outfit as the only UI typeface
- No box-shadows, no blur, no paper/sketch treatment
- Strong color blocks, rigid grid, bold headings, and sharp hover/focus states
- `lucide-react` icons used consistently for planner states and actions

## Important Files

- `src/domain/schedule/`
  - types, reducer, selectors, drag rules, storage, seed data
- `src/features/layout/PlannerPage.tsx`
  - top-level `DndContext` and app shell
- `src/features/calendar/`
  - schedule grid, row headers, cells, detail sheet integration
- `src/features/shared/`
  - draggable cards, badges, panel primitives, drag overlays
- `src/index.css`
  - centralized design tokens and component skins for the flat poster system

## Persistence

- Stored under `substitute-planner:v2`
- Invalid or incompatible persisted data is discarded and replaced by the seeded v2 state
