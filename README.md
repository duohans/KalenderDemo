# KalenderDemo

Browser-only day-view substitute planner built with React, TypeScript, Vite, Zustand, Zod, `dnd-kit`, `lucide-react`, and `@fontsource` typography.

The maintained product lives at the repo root. It runs entirely in the browser, persists to `localStorage`, and is optimized for a full-viewport planning workflow with a dominant central board and fixed side rails.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

## Current Product Model

- Time is a fixed six-column day view:
  - `08:30`
  - `09:30`
  - `10:30`
  - `11:30`
  - `12:30`
  - `13:30`
- Rows are user-managed planning lanes, not a fixed five-row board.
- Seeded planner state starts with:
  - `1` real row
  - a dedicated `new row` placeholder below the rows
- Each need card owns a stable `allocatedTimeBlockId`.
- Normal scheduling must respect `allocatedTimeBlockId`.
- A board cell may contain at most one need card.
- Rows can have a `rowResponsibleId`.
- Need cards can have an `explicitAssigneeId`.
- Effective assignee is:

```ts
card.explicitAssigneeId ??
  (card.placement === 'scheduled' ? row.rowResponsibleId : null) ??
  null
```

- Unscheduled cards always keep:

```ts
placement: 'unscheduled'
rowId: null
timeBlockId: null
```

## Main Behaviors

- Drag a need card from `Uplanlagt` onto an existing row header to auto-place it in that row at its allocated time.
- Drag a need card onto the `new row` placeholder to create a row and auto-place the card at its allocated time.
- Drag a scheduled need card back to `Uplanlagt`.
- Dragging a need card into the wrong time column is rejected.
- Drag substitutes onto row headers to assign row responsibility.
- Drag substitutes onto need cards to create direct overrides.
- Change a lesson's time only through the detail sheet, with explicit confirmation.
- Create rows from the placeholder and remove rows from row controls or the detail sheet.
- Use `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` for undo and redo.
- Persist planner state across reloads with schema validation and seed fallback.

## Workspace Layout

- Left rail: `Uplanlagt`
  - fixed-height side rail
  - paged in groups of `5`
  - unscheduled cards show their allocated time
- Center: `Dagstavle`
  - full day board
  - row headers + time cells
  - trailing `new row` placeholder
- Right rail: `Vikarer`
  - fixed-height side rail
  - paged in groups of `5`
  - person-first substitute cards

## Visual System

- Full-viewport shell with board-first space allocation.
- Warm cream, sand, clay, and sage palette.
- Fraunces only for high-level headings.
- Manrope for operational UI text.
- Calm cards and stable layout geometry.
- No UI animation layer; visual state changes are immediate.

## Important Files

- `src/domain/schedule/`
  Core planner types, reducer, selectors, drag rules, storage, and seeded state.
- `src/store/plannerStore.ts`
  Zustand store, undo/redo history, selection state, and persistence wiring.
- `src/features/schedule/useSchedule.ts`
  Feature-facing facade over the planner store hooks.
- `src/features/layout/PlannerPage.tsx`
  App shell, drag context, keyboard shortcuts, live announcements, and overlay orchestration.
- `src/features/layout/PlannerDetailSheet.tsx`
  Explicit editing flow for placement, time changes, and row configuration.
- `src/features/calendar/`
  Board shell, row headers, row placeholder, and cells.
- `src/styles/`
  Tokens, layout, board, component, and responsive styling.

## Persistence

- Stored under `substitute-planner:v2`
- Current schema version is `4`
- Version `3` documents are migrated to add `allocatedTimeBlockId`
- Invalid or incompatible documents are discarded and replaced by seeded planner state
