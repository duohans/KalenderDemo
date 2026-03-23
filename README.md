# KalenderDemo

KalenderDemo is a browser-only substitute scheduling planner built with React, TypeScript, Vite, Zustand, Zod, `dnd-kit`, `lucide-react`, and `@fontsource` typography.

The app runs entirely in the browser, persists locally with `localStorage`, and is designed around a board-first planning workflow.

There is no backend.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Note: `npm run lint` currently reports known existing repo issues. `npm run test`, `npm run build`, and `npm run test:e2e` are the clean verification commands in the current snapshot.

## Current Product Snapshot

- `Dag` is the main editing and planning surface.
- `Uke` is an overview and navigation surface built in the same structured timetable system as the day board.
- Day view uses a three-area planner shell:
  - left: `Uplanlagt` as a vertically scrolling single-column list
  - center: `Dagstavle`
  - right: `Vikarer` as a paged side rail
- Week view uses a timetable grid without the side rails and ends cleanly at the final visible timeslot.

## Day View

The current day board is transposed:

- Y axis = fixed lesson time blocks
- X axis = planning rows/lanes
- left edge = sticky time axis
- top row = lane headers + trailing new-row placeholder

Each board cell still represents exactly one `row + time block` combination, and each cell may contain at most one lesson card.

Rows are user-managed:

- seeded planner state starts with `1` real row
- rows can be created explicitly
- rows can be created by dropping a lesson card onto the new-row placeholder
- rows can be removed

In the current transposed layout, the new-row affordance appears as the trailing header column on the right side of the board.

## Week View

Week view is a timetable-style overview:

- X axis = Monday to Friday
- Y axis = the same fixed lesson time blocks used in day view
- cells use the same quiet timetable presentation language as day view
- empty cells use a subtle structural marker rather than visible sentence copy
- `1` mini card uses the full slot width
- `2` mini cards render as equal side-by-side columns
- up to `3` mini cards are shown side by side per cell
- extra lessons collapse into a narrower `+N` overflow indicator

Interaction in week view:

- clicking a weekday header opens that day in day view
- clicking a week cell opens that day in day view
- clicking a mini card opens the detail sheet without leaving week view
- the detail sheet offers `Åpne i dagvisning` for deeper editing

Week view is not a drag-and-drop planning surface in the current MVP.

## Core Planner Rules

- Every `NeedCard` has:
  - `sourceTeacherId`
  - `dayId`
  - `allocatedTimeBlockId`
- `allocatedTimeBlockId` is the lesson's owned/original time.
- Normal scheduling must respect both `dayId` and `allocatedTimeBlockId`.
- A card can only be placed in a board cell whose time block matches its allocated time.
- Dragging a need card onto a row header auto-places it into that row at its allocated time.
- Dragging a need card onto the new-row placeholder creates a row and auto-places the card at its allocated time.
- Dragging a scheduled card back to `Uplanlagt` is allowed.
- Dragging a need card into the wrong time cell is rejected.
- A row-level responsible substitute is the default assignee for scheduled cards in that row.
- An explicit card-level assignee overrides the row-level responsible substitute.
- Effective assignee precedence is:

```ts
card.explicitAssigneeId ??
  (card.placement === 'scheduled' ? row.rowResponsibleId : null) ??
  null
```

- Changing a lesson's time is not a drag action.
- Time changes happen only through the detail sheet and require explicit confirmation.

## Current UI Behavior

- `Uplanlagt` and `Vikarer` are fixed-height side rails in day view.
- `Uplanlagt` scrolls vertically as a single top-down list in DOM/render order.
- `Vikarer` pages in groups of `5`.
- Unscheduled cards show their allocated/original time.
- The day-view time axis is sticky and occupies a real first grid column.
- Lane columns use fixed widths and the board scrolls horizontally when needed.
- The app has no UI animation layer; visual state changes are immediate.

## Important Files

- `src/domain/schedule/`
  Planner types, reducer, selectors, drag rules, storage, schema, and seed data.
- `src/store/plannerStore.ts`
  Zustand store, history, selection, and persistence wiring.
- `src/features/layout/PlannerPage.tsx`
  Top-level shell, DnD context, view-mode switching, chips, and detail sheet orchestration.
- `src/features/layout/PlannerDetailSheet.tsx`
  Explicit editing flow for row configuration, placement, assignees, and time changes.
- `src/features/calendar/CalendarGrid.tsx`
  Transposed day-view board.
- `src/features/week/WeekView.tsx`
  Week-view timetable.
- `src/features/tasks/TasksPanel.tsx`
  `Uplanlagt` side rail.
- `src/features/people/PeoplePanel.tsx`
  `Vikarer` side rail.
- `src/styles/`
  Tokens, layout, board, component, and responsive styling.

## Persistence

- Storage key: `substitute-planner:v2`
- Current schema version: `5`
- Stored version `3` and `4` documents are migrated forward
- Migration backfills newer lesson fields such as `allocatedTimeBlockId` and `dayId`
- Invalid or incompatible data falls back to seeded planner state

## Long-Form Reference

See [APPLICATION_DOCUMENTATION.md](./APPLICATION_DOCUMENTATION.md) for the detailed architecture and runtime model.
