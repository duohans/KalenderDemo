# KalenderDemo Application Documentation

This is the long-form technical documentation for the maintained app in this repository. It is intended to explain how the app works end to end, how the repo is organized around it, and where the important implementation boundaries live.

Use this file as the detailed reference. Use `README.md` as the shorter repo entry point.
This document describes the current `KalenderDemo` application that lives at the repo root.

## 1. What The App Is

KalenderDemo is a browser-only day planner for substitute scheduling.

The operator works in a three-area layout:

- left: unscheduled need cards
- center: a fixed day-view planning board
- right: substitute cards with workload summaries

The app is optimized for rapid manual planning:

- drag lesson cards into the board
- drag substitutes onto row headers or individual cards
- open a detail sheet for keyboard-friendly edits
- undo and redo decisions
- persist the current planner locally across reloads

There is no backend. Everything is local state plus `localStorage`.

## 2. Product Model

The planner uses a normalized data model with four core entity types:

- `Teacher`
  The original teacher attached to a lesson card.
- `Substitute`
  A person who can be assigned to a row or directly to a card.
- `Row`
  A board lane. A row can optionally have a row-level responsible substitute.
- `NeedCard`
  A lesson that must be scheduled and optionally assigned a substitute.

Time is fixed to one day with six predefined time blocks:

- `08:30`
- `09:30`
- `10:30`
- `11:30`
- `12:30`
- `13:30`

The board is column-based by time and row-based by lane.

## 3. Core Invariants

These rules are central to the app and should be treated as domain invariants, not just UI behavior.

1. A need card keeps its `sourceTeacherId` forever, even if moved.
2. A row-level assignee is the default substitute for scheduled cards in that row.
3. An explicit card-level assignee overrides the row-level assignee.
4. Effective assignee logic is:

```ts
effectiveAssigneeId =
  card.explicitAssigneeId ??
  row.rowResponsibleId ??
  null
```

5. A board cell may contain at most one need card.
6. Rows never auto-merge or auto-split.
7. Unscheduled cards must have:

```ts
placement: 'unscheduled'
rowId: null
timeBlockId: null
```

8. Scheduled cards must have:

```ts
placement: 'scheduled'
rowId: string
timeBlockId: TimeBlockId
```

9. Need-card dragging only moves cards between the unscheduled panel and calendar cells.
10. Substitute dragging only assigns substitutes to row headers or individual need cards.

## 4. Runtime Architecture

The runtime is intentionally simple:

1. `src/main.tsx`
   Loads fonts, imports global CSS, and mounts React in `StrictMode`.
2. `src/app/App.tsx`
   Renders `PlannerPage` directly.
3. `src/store/plannerStore.ts`
   Creates the Zustand store, loads persisted state, and owns undo, redo, and selection state.
4. `src/features/schedule/useSchedule.ts`
   Exposes feature-facing hooks so runtime components do not need to import raw store internals.
5. `src/features/layout/PlannerPage.tsx`
   Composes the full UI, owns drag orchestration, and mounts the detail sheet.

There is no provider-based app shell such as `ScheduleProvider` in the current architecture.

## 5. Directory Overview

The repo is organized around a small set of docs, configs, and runtime entrypoints:

- `APPLICATION_DOCUMENTATION.md`
  The long-form technical reference for the root app.
- `README.md`
  The short project overview and run/verify instructions.
- `package.json`
  NPM scripts and dependency declarations.
- `vite.config.ts`
  Vite config plus Vitest setup and test exclusions.
- `playwright.config.ts`
  End-to-end test runner config for the root app.
- `eslint.config.js`
  Lint configuration and global ignores.
- `.gitignore`
  Generated-artifact and local-tooling ignores for the root app.

### `src/domain/schedule/`

This folder contains the planner's domain logic:

- `types.ts`
  Canonical types and action definitions.
- `constants.ts`
  Storage key, storage version, and fixed time blocks.
- `schema.ts`
  Zod validation for persisted planner documents.
- `seed.ts`
  The seeded planner state used for first load and fallback.
- `storage.ts`
  The concrete persistence layer.
- `reducer.ts`
  The only mutation layer for planner state.
- `selectors.ts`
  The main derivation layer for view models and planning summaries.
- `dnd.ts`
  Drag item typing, target typing, collision filtering, and drop resolution.

### `src/store/`

- `plannerStore.ts`
  Zustand store, history handling, selection handling, and persistence wiring.

### `src/features/`

- `layout/`
  Top-level shell and detail sheet.
- `calendar/`
  Board rendering, row headers, cells, and headers.
- `tasks/`
  Unscheduled panel.
- `people/`
  Substitute panel.
- `shared/`
  Reusable card and panel primitives.
- `motion/`
  Drag feedback context, timers, and animation helpers.
- `schedule/`
  Feature-facing hooks wrapping the store.

### `src/styles/`

The styling system is split by responsibility:

- `tokens.css`
- `layout.css`
- `calendar.css`
- `components.css`
- `responsive.css`

## 6. State Shape

The source of truth is `PlannerState` from `src/domain/schedule/types.ts`.

Conceptually it looks like this:

```ts
type PlannerState = {
  version: number
  teachers: Record<string, Teacher>
  teacherOrder: string[]
  substitutes: Record<string, Substitute>
  substituteOrder: string[]
  rows: Record<string, Row>
  rowOrder: string[]
  needCards: Record<string, NeedCard>
  needCardOrder: string[]
}
```

The app keeps entities normalized and stores ordering separately so UI rendering stays deterministic.

## 7. Seed Data And Persistence

### Seed Data

`src/domain/schedule/seed.ts` exports `createSeedPlannerState()`.

This seeded document is the default planner used when:

- the app is opened for the first time
- there is no saved state
- persisted state is malformed
- persisted state fails schema validation

The seed includes:

- multiple teachers
- multiple substitutes
- five rows
- a mix of scheduled and unscheduled need cards
- examples of row assignments and explicit card overrides

The seed is not just demo content. It is also part of the app's fallback behavior and test determinism.

### Storage

`src/domain/schedule/storage.ts` is the concrete persistence layer.

Important behavior:

- storage key: `substitute-planner:v2`
- documents must match `STORAGE_VERSION = 3`
- persisted JSON is parsed and validated through Zod
- invalid data falls back to seed state

The persistence layer exports:

- `loadPlannerState()`
- `savePlannerState(state)`
- `migrateStoredPlannerState(value)`

Despite the migration-oriented name, `migrateStoredPlannerState` currently acts as a validation gate and returns `null` for incompatible input.

## 8. Store And History Model

`src/store/plannerStore.ts` wraps the domain state in a Zustand store with additional UI concerns.

The store owns:

- current `state`
- current `selection`
- history `past` stack
- history `future` stack
- derived booleans `canUndo` and `canRedo`

### Dispatch flow

When `dispatch(action)` is called:

1. the current state is read from the store
2. `plannerReducer` computes `nextState`
3. if nothing changed, the function returns early
4. the previous state is pushed onto `past`
5. `future` is cleared
6. the next state is persisted
7. the store is updated

### Undo and redo

- `undo()` moves one snapshot from `past` back into `state` and pushes the old state into `future`
- `redo()` takes the first snapshot from `future` and restores it
- both operations save the restored state back to `localStorage`

### Selection

Selection is separate from planner data. It exists to drive the detail sheet.

Possible selection kinds:

- row selection
- need-card selection

Selection is opened and closed through store actions, and some features also use direct store helpers such as `openSelection()` and `closeSelection()`.

## 9. Feature-Facing Hook Layer

`src/features/schedule/useSchedule.ts` is the public facade used by runtime UI code.

It exposes:

- `useSchedule()`
- `useScheduleState(selector)`
- `useScheduleDispatch()`
- `useScheduleSelection()`
- `useScheduleSelectionActions()`
- `useScheduleHistoryActions()`

This layer exists so feature components depend on a schedule-oriented API rather than directly on low-level store implementation details.

## 10. Domain Mutation Layer

`src/domain/schedule/reducer.ts` is the only place where planner state changes.

Supported actions are:

- `moveNeedCardToCell`
- `moveNeedCardToUnscheduled`
- `assignSubstituteToRow`
- `clearRowResponsible`
- `assignSubstituteToNeedCard`
- `clearNeedCardExplicitAssignee`

Important behavior guaranteed by the reducer:

- collisions are prevented
- card identity stays stable
- moving a card does not rewrite teacher identity
- row assignments do not erase explicit card overrides
- clearing a row assignee only changes cards that were inheriting from that row

If a feature needs a new planner mutation, it should be expressed as a reducer action rather than encoded inside a UI component.

## 11. Selector Layer

`src/domain/schedule/selectors.ts` is the main derivation layer for the UI.

This file does much more than simple lookups. It contains:

- row title generation
- card title splitting
- scheduled-card indexing
- collision tracking
- effective assignee derivation
- summary metrics
- substitute workload derivation
- board-specific view models

### Caching strategy

The file uses `WeakMap` caches keyed by `PlannerState` instance.

This matters because:

- selectors remain pure from the caller's point of view
- expensive derivations are reused per immutable state snapshot
- undo and redo naturally invalidate caches by switching state references

### Key selector families

#### Structural selectors

- `selectScheduledNeedCards`
- `selectUnscheduledNeedCardIds`
- `selectCellNeedCardIdMap`
- `selectRowCards`

These derive the board structure.

#### Identity selectors

- `selectTeacherById`
- `selectSubstituteById`
- `selectRow`

These resolve normalized entities.

#### View-model selectors

- `selectRowTitle`
- `selectRowDisplayModel`
- `selectNeedCardDisplayModel`
- `selectPlannerSummary`
- `selectSubstituteWorkloads`

These are what most components actually care about.

### Row title rules

Row titles are fully derived.

- If a row has a responsible substitute:
  the title becomes `"{FirstName}s vikartimer"`
- If a row has no responsible substitute:
  the title is inferred from the teachers currently represented in that row

The selector also returns both `full` and `compact` forms.

### Need card display model

`selectNeedCardDisplayModel` resolves the data needed to render a single card, including:

- teacher
- effective assignee
- assignment mode
- conflict status
- split subject/class labels
- derived accents
- a human-readable status label

This keeps rendering components mostly presentation-focused.

### Planner summary

`selectPlannerSummary` drives the compact top-row chips and other overview data. It derives:

- total cards
- scheduled and unscheduled counts
- explicit overrides
- inherited assignments
- covered cards
- coverage rate
- unassigned items
- substitute count

## 12. Drag And Drop Model

Drag and drop is defined in `src/domain/schedule/dnd.ts` and orchestrated in `PlannerPage.tsx`.

### Drag item types

- `need-card`
- `substitute`

### Drop target types

- `unscheduled-panel`
- `calendar-cell`
- `row-header`
- `need-card`

### Collision filtering

`plannerCollisionDetection` filters the available droppable containers based on the active drag type before it falls back to pointer or rectangle intersection logic.

This prevents irrelevant targets from competing during drag interactions.

### Drop resolution

`resolveDrop(state, activeItem, target)` converts a valid drag/drop combination into a reducer action.

Examples:

- need card -> unscheduled panel
  `moveNeedCardToUnscheduled`
- need card -> calendar cell
  `moveNeedCardToCell`
- substitute -> row header
  `assignSubstituteToRow`
- substitute -> need card
  `assignSubstituteToNeedCard`

This keeps drag semantics in the domain layer instead of scattering them across components.

## 13. Main UI Composition

### `PlannerPage.tsx`

This is the top-level interaction shell.

It owns:

- `DndContext`
- pointer sensor setup
- drag lifecycle handlers
- drag overlay setup
- drag feedback provider wiring
- undo and redo controls
- keyboard shortcut handling
- summary chips
- board date label
- live-region announcements

It does not directly render individual cells or card visuals. It composes the main feature surfaces and routes drag events into reducer actions.

### Tasks panel

`src/features/tasks/TasksPanel.tsx` renders the unscheduled panel.

Responsibilities:

- compute unscheduled card IDs
- register the unscheduled dropzone
- render empty-state treatment when nothing is left
- render unscheduled cards using `TaskCard`

### Calendar board

The board lives in `src/features/calendar/`.

Key responsibilities:

- `CalendarGrid.tsx`
  renders the board shell, board chips, and row loop
- `RowLane.tsx`
  renders one full row
- `RowHeaderDropZone.tsx`
  renders the row header and row-level substitute target
- `CalendarCell.tsx`
  renders each time cell and card slot
- `TimeHeader.tsx`
  renders the fixed time labels
- `EmptyCellState.tsx`
  renders unoccupied cells

### People panel

`src/features/people/PeoplePanel.tsx` renders substitutes as drag sources.

Each substitute card shows:

- identity
- effective workload count
- row-assignment count
- explicit override count

## 14. Detail Sheet

`src/features/layout/PlannerDetailSheet.tsx` is the keyboard-friendly editing surface.

It uses the current store selection and branches into two modes:

- row detail mode
- need-card detail mode

### Need-card mode

The sheet shows:

- teacher
- class
- subject
- room
- current placement
- current assignee explanation

The operator can:

- move the card to another row/time
- send it back to the unscheduled panel
- assign or clear a direct substitute override

Placement controls use selector-derived validation so the sheet prevents saving to an occupied cell.

### Row mode

The row view shows:

- row title
- row assignee
- teachers represented in the row
- cards currently in the row

The operator can:

- assign a row-level substitute
- clear the current row assignee

### Focus handling

The sheet includes focus management and escape/close behavior so it works as an accessible modal workflow rather than a purely visual side panel.

## 15. Shared UI Primitives

The shared components folder contains reusable UI pieces that keep board, panel, and overlay rendering consistent.

Important pieces:

- `TaskCard`
  the main lesson card used in the board, unscheduled panel, detail sheet, and overlay variants
- `PersonCard`
  the substitute drag source card
- `DragOverlayCard`
  the floating drag preview
- `NeedCardVisual`
  shared lesson-card visual body
- `AssigneeBadge`
  reusable assignment status badge
- `PanelFrame`
  shell wrapper for side panels

These components mostly consume selector-derived data instead of implementing planner rules themselves.

## 16. Motion And Feedback

The app uses Framer Motion for interaction feedback rather than for route or page animation.

Motion-related files:

- `src/features/motion/PlannerDragFeedbackContext.tsx`
- `src/features/motion/useDragFeedbackTimers.ts`
- `src/features/motion/plannerMotion.ts`

This subsystem handles:

- drop handoff animation timing
- accepted-drop highlighting
- rejected-drop feedback
- overlay movement
- reduced-motion support
- screen-reader announcement content

`PlannerPage.tsx` converts reducer actions into motion events so the UI can acknowledge what happened without duplicating business logic.

## 17. Styling System

The app uses a CSS-first styling setup imported through `src/index.css`.

### Styling layers

- `tokens.css`
  colors, radii, typography, spacing primitives, board dimensions, and focus tokens
- `layout.css`
  shell layout, full-viewport structure, board growth rules, side-panel sizing
- `calendar.css`
  board-specific structure and lane geometry
- `components.css`
  cards, buttons, sheet styling, and component-level surfaces
- `responsive.css`
  breakpoint-specific layout adjustments

### Visual direction

The current design language is:

- warm cream and sand backgrounds
- sage, clay, and muted accent colors
- Fraunces for headings
- Manrope for body text
- softer panel surfaces and borders
- minimal decorative shell text
- board-first space allocation

## 18. Accessibility Model

The UI uses accessible names and regions as part of its structure, not just for testing.

Important patterns:

- the main work areas are exposed as named regions:
  `Uplanlagt`, `Dagstavle`, and `Vikarer`
- cards and row controls use explicit button labels
- planner actions announce results in a polite live region
- keyboard shortcuts avoid stealing input focus from form controls
- the detail sheet is exposed as a dialog with focus handling

The visible UI is intentionally compact, so some semantics are present primarily through accessible names rather than visible headings.

## 19. Testing Strategy

The project has three main verification layers.

### Domain unit tests

Located under `src/domain/schedule/*.test.ts`.

They cover:

- reducer rules
- drag/drop resolution rules
- schema validation
- selector behavior
- storage behavior

These tests protect the product model directly.

Vitest is configured in `vite.config.ts` with:

- `jsdom` as the test environment
- `src/test/setup.ts` as the shared setup file
- exclusions for `e2e/**`, `playwright.config.ts`, and `.claude/**`

### App integration tests

`src/app/App.test.tsx` renders the whole app in JSDOM and tests:

- compact shell structure
- detail sheet flows
- inline clear actions
- undo and redo behavior
- movement of unscheduled cards through the sheet

These tests rely on `resetPlannerStore()` to isolate the Zustand store between tests.

### End-to-end tests

`e2e/planner.spec.ts` covers:

- dragging an unscheduled card into the board
- moving a card through the detail sheet and persisting it
- moving a card through the detail sheet and undoing it

`playwright.config.ts` runs these tests against a fresh preview server on `127.0.0.1:4174` instead of a reused Vite dev server. Each E2E test clears `localStorage` before reloading so the seed state is deterministic.

This is important because earlier reuse of a long-lived Vite dev server could produce stale optimized dependency responses. The preview-server setup keeps E2E runs deterministic and closer to production output.

## 20. Tooling And Repo Hygiene

### Package scripts

The root app uses these main scripts from `package.json`:

- `npm run dev`
- `npm run build`
- `npm test`
- `npm run test:e2e`
- `npm run lint`
- `npm run preview`

### Linting

`eslint.config.js` applies TypeScript, React Hooks, and React Refresh rules to the root app and globally ignores:

- `dist`
- `test-results`
- `playwright-report`
- `.claude`

### Local generated files

`.gitignore` excludes the normal generated and local-only artifacts used by the root app, including:

- `dist`
- `test-results`
- `playwright-report`
- `.claude`

These are treated as disposable outputs rather than source content.

## 21. Common Interaction Flows

### Moving an unscheduled card into the board

1. The user drags a card from the unscheduled panel.
2. `TaskCard` provides the drag item.
3. `PlannerPage` receives drag events from `DndContext`.
4. `resolveDrop` converts the drop into `moveNeedCardToCell`.
5. The store dispatches the action through the reducer.
6. The new state is persisted and the board re-renders.

### Assigning a substitute to a row

1. The user drags a substitute from the right panel.
2. The row header is exposed as a valid substitute target.
3. `resolveDrop` returns `assignSubstituteToRow`.
4. The reducer stores `rowResponsibleId`.
5. Cards in that row inherit the substitute unless they already have explicit overrides.

### Assigning a substitute directly to a card

1. The user drags a substitute onto a need card.
2. The card becomes a `need-card` drop target.
3. `resolveDrop` returns `assignSubstituteToNeedCard`.
4. The reducer stores `explicitAssigneeId`.
5. The card now shows explicit assignment state.

### Editing through the detail sheet

1. The user opens a card or row selection.
2. The detail sheet reads the selection from the store.
3. Form controls are populated from selectors and current state.
4. Save actions dispatch normal reducer actions.
5. The sheet itself does not bypass domain logic.

## 22. Safe Ways To Extend The App

When adding features, keep responsibilities in the same layers:

- add new raw state shapes in `types.ts`
- add validation in `schema.ts`
- seed realistic examples in `seed.ts`
- add mutations in `reducer.ts`
- add derived UI behavior in `selectors.ts`
- update `dnd.ts` only if drag semantics actually change
- keep feature components thin and selector-driven

Good changes:

- new summary chips backed by selectors
- new detail-sheet controls backed by reducer actions
- new presentational fields in row or card view models

Risky changes:

- putting mutation logic inside UI components
- deriving important business rules only in JSX
- introducing hidden state outside the store
- changing persistence shape without schema updates

## 23. Key Takeaways

The app is small, but it is intentionally layered:

- domain files define truth
- the store wraps truth with history and selection
- schedule hooks expose that state to features
- components render selector-driven view models
- drag/drop maps interactions back into reducer actions
- persistence is local, validated, and deterministic

If you understand the relationship between `reducer.ts`, `selectors.ts`, `plannerStore.ts`, `PlannerPage.tsx`, and `PlannerDetailSheet.tsx`, you understand almost the entire app.
