# KalenderDemo

Compact day-view substitute planner built with React, TypeScript, Vite, Zustand, Zod, `dnd-kit`, Framer Motion, and `lucide-react`.

The root app is the maintained product in this repository. It runs entirely in the browser, persists to `localStorage`, and is optimized for a full-viewport planning workflow with a dominant central board and compact side panels.

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

## Product Model

- Time is the X axis and rows are the Y axis.
- Each time cell may contain at most one need card.
- Rows can have a `rowResponsibleId`.
- Need cards can have an `explicitAssigneeId`.
- Effective assignee is:

```ts
card.explicitAssigneeId ??
  (card.placement === 'scheduled' ? row.rowResponsibleId : null) ??
  null
```

- Moving a need card never changes its `sourceTeacherId`.
- Unscheduled cards live in the left panel and keep `rowId: null` plus `timeBlockId: null`.

## Main Behaviors

- Drag need cards between the unscheduled panel and schedule cells.
- Drag substitutes onto row headers to assign row responsibility.
- Drag substitutes onto need cards to create direct overrides.
- Clear row responsibility and direct overrides inline or from the detail sheet.
- Use `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` for undo and redo.
- Persist planner state across reloads with schema validation and seed fallback.

## Visual System

- Full-viewport shell with minimal outer padding.
- Warm cream, sand, clay, and sage palette.
- Fraunces headings with Manrope body text.
- Soft panel surfaces, lighter borders, and subdued drag affordances.
- Layout priority goes to the planning board over shell copy.

## Important Files

- `src/domain/schedule/`
  Core planner types, reducer, selectors, drag rules, storage, and seeded state.
- `src/store/plannerStore.ts`
  Zustand store, undo/redo history, selection state, and persistence wiring.
- `src/features/schedule/useSchedule.ts`
  Feature-facing facade over the planner store hooks.
- `src/features/layout/PlannerPage.tsx`
  App shell, drag context, keyboard shortcuts, live announcements, and overlay orchestration.
- `src/styles/`
  Tokens, layout, board, component, and responsive styling for the planner UI.

## Persistence

- Stored under `substitute-planner:v2`
- Invalid or incompatible documents are discarded and replaced by seeded planner state
