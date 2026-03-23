# KalenderDemo Application Documentation

This is the long-form technical reference for the maintained app in this repository.

Use [README.md](/Users/hans/Documents/GitHub/KalenderDemo/README.md) as the short entry point.
Use this file when you need the current runtime model, domain invariants, architecture boundaries, or implementation map.

## 1. What The App Is

KalenderDemo is a browser-only substitute scheduling planner for a single school day.

The operator works in a three-area layout:

- left: `Uplanlagt`
- center: `Dagstavle`
- right: `Vikarer`

The app is optimized for fast manual planning:

- drag lesson cards into rows
- drag substitutes onto rows or individual cards
- create and remove rows as needed
- change a lesson's owned time only from the detail sheet
- undo and redo decisions
- persist the current planner locally across reloads

There is no backend. All state is local plus `localStorage`.

## 2. Current Workflow Model

The center board is still the primary workspace, but the board no longer behaves like a fixed five-lane planner.

Current board behavior:

- the seed starts with `1` real row
- below the real rows there is a dedicated `new row` placeholder
- the placeholder is a row-creation affordance, not a normal schedulable row
- rows are created explicitly by action or by dropping a need card onto the placeholder
- rows can also be removed

The side rails are fixed-height rails beside the board:

- `Uplanlagt` shows unscheduled lesson cards
- `Vikarer` shows substitute cards
- both rails page in groups of `5`
- overflow is handled by paging rather than normal in-rail scrolling

## 3. Core Domain Types

The planner uses a normalized data model with four core entity types:

- `Teacher`
  The original teacher attached to a lesson card.
- `Substitute`
  A person who can be assigned to a row or directly to a card.
- `Row`
  A user-managed board lane. A row can optionally have a row-level responsible substitute.
- `NeedCard`
  A lesson that must be scheduled and optionally assigned a substitute.

Time is fixed to one day with six predefined time blocks:

- `08:30`
- `09:30`
- `10:30`
- `11:30`
- `12:30`
- `13:30`

Every `NeedCard` now has a stable `allocatedTimeBlockId`. That is the lesson's owned/original time.

## 4. Core Invariants

These rules are domain invariants and should be enforced in the domain layer, not recreated in presentation code.

1. A need card keeps its `sourceTeacherId` forever.
2. A need card keeps its `allocatedTimeBlockId` as its source-of-truth time.
3. A row-level assignee is the default substitute for scheduled cards in that row.
4. An explicit card-level assignee overrides the row-level assignee.
5. Effective assignee logic is:

```ts
effectiveAssigneeId =
  card.explicitAssigneeId ??
  (card.placement === 'scheduled' ? row.rowResponsibleId : null) ??
  null
```

6. A board cell may contain at most one need card.
7. Rows are user-managed and never auto-created except through the intended row-creation interaction.
8. Unscheduled cards must have:

```ts
placement: 'unscheduled'
rowId: null
timeBlockId: null
```

9. Scheduled cards must have:

```ts
placement: 'scheduled'
rowId: string
timeBlockId: TimeBlockId
```

10. For normal scheduling, `timeBlockId` must match `allocatedTimeBlockId`.
11. Need-card dragging no longer supports free movement across arbitrary time columns.
12. Substitute dragging only assigns substitutes to row headers or individual need cards.

## 5. Scheduling Model

The app now distinguishes between a lesson's owned time and its visible placement.

- `allocatedTimeBlockId`
  The lesson's owned/original time.
- `rowId + timeBlockId`
  The current scheduled placement when the card is on the board.

Normal drag-and-drop planning respects the owned time:

- unscheduled card -> existing row header
  auto-place into that row at `allocatedTimeBlockId`
- unscheduled card -> new row placeholder
  create a row and auto-place at `allocatedTimeBlockId`
- scheduled card -> unscheduled panel
  allowed
- arbitrary wrong time cell drop
  rejected

If the operator wants to change the lesson's actual time, that is not a drag action anymore. It must happen in the detail sheet with explicit confirmation.

## 6. Row Model

Rows are no longer treated as a hard-coded five-row board.

Important behavior:

- the seed starts with `1` actual row
- row count is controlled by planner actions
- a dedicated `new row` placeholder always appears after the last real row
- the placeholder does not render empty time slots
- rows can be removed
- removing a row sends its scheduled cards back to `Uplanlagt`
- remaining rows are reindexed for deterministic ordering

This logic lives in the reducer and DnD resolution, not only in rendering.

## 7. Runtime Architecture

The runtime stays intentionally simple:

1. `src/main.tsx`
   Loads fonts, imports global CSS, and mounts React.
2. `src/app/App.tsx`
   Renders `PlannerPage`.
3. `src/store/plannerStore.ts`
   Creates the Zustand store, loads persisted state, and owns undo, redo, and selection state.
4. `src/features/schedule/useSchedule.ts`
   Exposes feature-facing hooks so components do not depend on raw store internals.
5. `src/features/layout/PlannerPage.tsx`
   Composes the shell, DnD context, rails, board, and detail sheet.

There is no backend service, routing layer, or remote sync model in the current architecture.

## 8. Directory Overview

### Top-level docs and config

- `APPLICATION_DOCUMENTATION.md`
  This detailed reference.
- `README.md`
  Short repo and product overview.
- `package.json`
  Scripts and dependency declarations.
- `vite.config.ts`
  Vite config and Vitest setup.
- `playwright.config.ts`
  End-to-end test config.
- `eslint.config.js`
  Lint configuration.

### `src/domain/schedule/`

The planner domain lives here:

- `types.ts`
  Canonical types and reducer action definitions.
- `constants.ts`
  Storage key, storage version, and fixed time blocks.
- `schema.ts`
  Zod validation for persisted planner documents.
- `seed.ts`
  Seeded planner state used for first load and fallback.
- `storage.ts`
  Persistence and migration logic.
- `reducer.ts`
  The only mutation layer for planner data.
- `selectors.ts`
  Derived view models, summaries, and validation helpers.
- `dnd.ts`
  Drag item typing, target typing, collision filtering, and drop resolution.

### `src/store/`

- `plannerStore.ts`
  Zustand store, history handling, selection handling, and persistence wiring.

### `src/features/`

- `layout/`
  App shell and detail sheet.
- `calendar/`
  Board rendering, row headers, cells, and the new-row placeholder.
- `tasks/`
  `Uplanlagt` rail.
- `people/`
  `Vikarer` rail.
- `shared/`
  Cards, badges, panel wrappers, overlay, and pager primitives.
- `motion/`
  Timed feedback and live-announcement helpers.
- `schedule/`
  Feature-facing hooks wrapping the store.

### `src/styles/`

- `tokens.css`
- `layout.css`
- `calendar.css`
- `components.css`
- `responsive.css`

## 9. State Shape

The source of truth is `PlannerState` from [src/domain/schedule/types.ts](/Users/hans/Documents/GitHub/KalenderDemo/src/domain/schedule/types.ts).

Conceptually:

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

Entities are normalized and order is stored separately so rendering remains deterministic.

## 10. Seed Data And Persistence

### Seed Data

[src/domain/schedule/seed.ts](/Users/hans/Documents/GitHub/KalenderDemo/src/domain/schedule/seed.ts) exports `createSeedPlannerState()`.

Current seed behavior:

- multiple teachers
- multiple substitutes
- `1` initial row
- a mix of scheduled and unscheduled need cards
- examples of row assignments and direct card overrides
- every need card already includes `allocatedTimeBlockId`

The seed is both demo content and fallback behavior.

### Storage

[src/domain/schedule/storage.ts](/Users/hans/Documents/GitHub/KalenderDemo/src/domain/schedule/storage.ts) is the persistence layer.

Important behavior:

- storage key: `substitute-planner:v2`
- current schema version: `4`
- version `3` documents are migrated by backfilling `allocatedTimeBlockId`
- persisted JSON is validated through Zod
- invalid data falls back to seed state

Exports:

- `loadPlannerState()`
- `savePlannerState(state)`
- `migrateStoredPlannerState(value)`

## 11. Store And History Model

[src/store/plannerStore.ts](/Users/hans/Documents/GitHub/KalenderDemo/src/store/plannerStore.ts) wraps planner data in a Zustand store with additional UI concerns.

The store owns:

- current planner `state`
- current `selection`
- history `past`
- history `future`
- derived `canUndo` and `canRedo`

### Dispatch flow

When `dispatch(action)` is called:

1. the current state is read
2. `plannerReducer` computes `nextState`
3. unchanged state returns early
4. the previous state is pushed onto `past`
5. `future` is cleared
6. the next state is persisted
7. the store is updated

### Undo and redo

- `undo()` restores one snapshot from `past`
- `redo()` restores one snapshot from `future`
- both persist the restored state back to `localStorage`

### Selection

Selection is stored separately from planner data and drives the detail sheet.

Supported selections:

- row selection
- need-card selection

## 12. Domain Mutation Layer

[src/domain/schedule/reducer.ts](/Users/hans/Documents/GitHub/KalenderDemo/src/domain/schedule/reducer.ts) is the only place where planner data changes.

Supported actions are:

- `createRow`
- `removeRow`
- `updateNeedCardAllocatedTimeBlock`
- `moveNeedCardToCell`
- `moveNeedCardToUnscheduled`
- `assignSubstituteToRow`
- `clearRowResponsible`
- `assignSubstituteToNeedCard`
- `clearNeedCardExplicitAssignee`

Important reducer guarantees:

- collisions are prevented
- wrong-time placement is rejected
- row removal unschedules cards from that row
- moving a card never rewrites teacher identity
- row assignments do not erase explicit overrides
- clearing a row assignee only affects cards that were inheriting from that row
- allocated-time changes revalidate placement immediately

If a feature needs a new planner mutation, it should be expressed here rather than embedded inside a React component.

## 13. Selector Layer

[src/domain/schedule/selectors.ts](/Users/hans/Documents/GitHub/KalenderDemo/src/domain/schedule/selectors.ts) is the main derivation layer for UI and validation.

It contains more than lookups:

- row title generation
- scheduled-card indexing
- collision tracking
- effective assignee derivation
- planner summary metrics
- substitute workload derivation
- board view models
- need-card display models
- row-level placement validation

### Caching strategy

The file uses `WeakMap` caches keyed by `PlannerState` instance.

That means:

- selectors stay pure from the caller's point of view
- expensive derivations are reused per immutable snapshot
- undo/redo naturally invalidate caches by switching state references

### Important selector families

Structural selectors:

- `selectScheduledNeedCards`
- `selectUnscheduledNeedCardIds`
- `selectCellNeedCardIdMap`
- `selectRowCards`

Identity selectors:

- `selectTeacherById`
- `selectSubstituteById`
- `selectRowTitle`

Validation selectors:

- `selectCanDropNeedCardInCell`
- `selectCanDropNeedCardInRow`
- `selectCanPlaceNeedCardInCell`

View-model selectors:

- `selectRowDisplayModel`
- `selectNeedCardDisplayModel`
- `selectPlannerSummary`
- `selectSubstituteWorkloads`

### Need-card display model

`selectNeedCardDisplayModel` resolves the data needed to render a lesson card, including:

- teacher
- effective assignee
- status assignee
- assignment mode
- conflict status
- split subject/class labels
- derived accents
- allocated time label
- status label and detail text

This keeps `TaskCard`, `NeedCardVisual`, and `AssigneeBadge` presentation-focused.

## 14. Drag And Drop Model

Drag and drop is defined in [src/domain/schedule/dnd.ts](/Users/hans/Documents/GitHub/KalenderDemo/src/domain/schedule/dnd.ts) and orchestrated in [src/features/layout/PlannerPage.tsx](/Users/hans/Documents/GitHub/KalenderDemo/src/features/layout/PlannerPage.tsx).

### Drag item types

- `need-card`
- `substitute`

### Drop target types

- `unscheduled-panel`
- `calendar-cell`
- `row-header`
- `new-row-placeholder`
- `need-card`

### Current need-card semantics

- need card -> `unscheduled-panel`
  `moveNeedCardToUnscheduled`
- need card -> `calendar-cell`
  only valid if row/time is allowed for that card
- need card -> `row-header`
  auto-place into that row at `allocatedTimeBlockId`
- need card -> `new-row-placeholder`
  `createRow` with auto-placement

### Current substitute semantics

- substitute -> `row-header`
  `assignSubstituteToRow`
- substitute -> `need-card`
  `assignSubstituteToNeedCard`

### Collision filtering

`plannerCollisionDetection` filters droppable containers by active drag type before falling back to pointer or rectangle intersection logic. This prevents irrelevant targets from competing during drag.

## 15. Main UI Composition

### `PlannerPage.tsx`

This is the top-level interaction shell.

It owns:

- `DndContext`
- pointer sensor setup
- drag lifecycle handlers
- drag overlay setup
- feedback provider wiring
- undo/redo controls
- keyboard shortcut handling
- summary chips
- board date label
- live-region announcements

### `TasksPanel.tsx`

Responsibilities:

- derive unscheduled card IDs
- register the unscheduled dropzone
- page unscheduled cards in groups of `5`
- render unscheduled cards using `TaskCard`
- expose a fixed footer pager

### `CalendarGrid.tsx`

Responsibilities:

- render the board shell and chips
- render the row loop from `rowOrder`
- render the trailing `new row` placeholder

### `RowLane.tsx`

Renders one full row:

- row header
- one cell per time block

### `RowHeaderDropZone.tsx`

Renders the row card itself and supports:

- row selection
- row-level substitute drops
- need-card auto-placement by row drop
- inline row-responsible clearing
- inline row removal

### `CalendarCell.tsx`

Renders each time cell, scheduled card slot, or empty state.

### `PeoplePanel.tsx`

Renders substitute drag sources in groups of `5` per page.

Current substitute cards are person-first rather than stat-heavy.

## 16. Detail Sheet

[src/features/layout/PlannerDetailSheet.tsx](/Users/hans/Documents/GitHub/KalenderDemo/src/features/layout/PlannerDetailSheet.tsx) is the keyboard-friendly editing surface.

It branches into:

- row detail mode
- need-card detail mode

### Need-card mode

The sheet shows:

- teacher
- class
- subject
- room
- current placement
- owned/original time
- current assignee explanation

The operator can:

- send the card to `Uplanlagt`
- place it onto another row at its current allocated time
- change the allocated time through a separate confirmed action
- assign or clear a direct substitute override

Time changes are explicitly separated from normal placement and require confirmation.

### Row mode

The row view shows:

- row title
- row assignee
- cards currently in the row

The operator can:

- assign a row-level substitute
- clear the row assignee
- remove the row

### Focus handling

The sheet is a real dialog with focus trapping, escape-to-close behavior, and focus restoration.

## 17. Shared UI Primitives

Important shared components:

- `TaskCard`
  Main lesson card used in the board, left rail, and overlay.
- `NeedCardVisual`
  Shared lesson-card visual body.
- `AssigneeBadge`
  Shared assignment status badge.
- `PersonCard`
  Substitute drag source card.
- `DragOverlayCard`
  Static drag preview.
- `PanelFrame`
  Fixed-height side rail shell.
- `SideRailPager`
  Previous/next paging controls for the side rails.

These components consume selector-derived data rather than implementing planner rules.

## 18. Motion And Feedback

The app no longer has a UI animation layer.

`src/features/motion/` now exists for timed feedback and screen-reader announcements:

- `PlannerDragFeedbackContext.tsx`
  typed feedback events
- `useDragFeedbackTimers.ts`
  short-lived accepted/rejected feedback state

Current behavior:

- drag/drop feedback is immediate
- overlay rendering is static
- state changes are not animated
- accepted actions and rejected drops still produce live-region announcements

## 19. Styling System

The app uses a CSS-first styling setup imported through `src/index.css`.

### Styling layers

- `tokens.css`
  colors, radii, typography, spacing primitives, board dimensions, and rail sizing tokens
- `layout.css`
  shell layout, full-viewport structure, panel containment, and pager layout
- `calendar.css`
  board-specific structure, row geometry, cells, and row cards
- `components.css`
  lesson cards, substitute cards, buttons, badges, and detail-sheet styling
- `responsive.css`
  breakpoint-specific layout adjustments

### Visual direction

The current design language is:

- warm cream and sand backgrounds
- sage, clay, and muted accent colors
- Fraunces for high-level headings only
- Manrope for operational UI text
- calmer cards and rails
- board-first space allocation

## 20. Accessibility Model

The UI uses accessible names and regions as part of its structure, not only for testing.

Important patterns:

- named regions:
  - `Uplanlagt`
  - `Dagstavle`
  - `Vikarer`
- explicit labels on cards, row controls, and pagers
- polite live-region announcements for accepted actions and rejected drops
- keyboard shortcuts that avoid stealing focus from editable form controls
- dialog semantics and focus handling in the detail sheet

Some semantics are intentionally carried by accessible names because the visible UI is compact.

## 21. Testing Strategy

The project has three verification layers.

### Domain unit tests

Located under `src/domain/schedule/*.test.ts`.

They cover:

- reducer rules
- drag/drop resolution
- selector behavior
- schema validation
- storage migration and loading

### App integration tests

[src/app/App.test.tsx](/Users/hans/Documents/GitHub/KalenderDemo/src/app/App.test.tsx) renders the app in JSDOM and covers:

- shell structure
- row creation and removal
- side-rail paging
- detail-sheet flows
- inline clear actions
- undo/redo behavior

### End-to-end tests

[e2e/planner.spec.ts](/Users/hans/Documents/GitHub/KalenderDemo/e2e/planner.spec.ts) covers:

- row-header auto-placement
- new-row placeholder creation
- wrong-time drop rejection
- fixed side-rail paging
- board drop-slot coverage
- footer containment
- detail-sheet time-change confirmation
- persistence and undo flows

[playwright.config.ts](/Users/hans/Documents/GitHub/KalenderDemo/playwright.config.ts) runs E2E against a fresh preview server on `127.0.0.1:4174`.

## 22. Tooling And Repo Hygiene

### Package scripts

Main scripts from [package.json](/Users/hans/Documents/GitHub/KalenderDemo/package.json):

- `npm run dev`
- `npm run build`
- `npm test`
- `npm run test:e2e`
- `npm run lint`
- `npm run preview`

### Dependencies

Important runtime dependencies:

- React
- Zustand
- Zod
- `@dnd-kit/core`
- `@dnd-kit/utilities`
- `lucide-react`
- `@fontsource/fraunces`
- `@fontsource/manrope`

### Local generated files

Normal generated artifacts are ignored, including:

- `dist`
- `test-results`
- `playwright-report`

## 23. Implementation Boundaries

When changing the app, these boundaries are intentional:

- planner rules belong in the domain layer
- view-model shaping belongs in selectors
- state mutation belongs in the reducer
- detail-sheet workflows should dispatch domain actions rather than mutate locally
- presentation components should stay focused on layout and interaction wiring

If new planner behavior is added, prefer:

1. domain types
2. reducer action
3. selector/view-model updates
4. DnD resolution changes if relevant
5. component updates last

That ordering reflects how the current app is structured today.
