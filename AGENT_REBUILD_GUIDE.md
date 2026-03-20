# AI Rebuild Guide

This document explains the vital runtime logic, files, and rebuild order for the substitute scheduling app in this repository. It is written for another AI agent that needs to rebuild the app sequentially without changing the product model.

## Product Summary

The app is a rigid three-part planning board:

- Left tool: `Uplanlagt`
- Center surface: schedule grid
- Right tool: `Vikarer`

Core interaction model:

- Need cards represent lessons that must be placed.
- Rows can have a row-responsible substitute.
- Individual need cards can have an explicit substitute override.
- Need cards can move between rows and time cells, or back to `Uplanlagt`.
- Need cards always keep their original teacher identity.
- Row titles are fully derived from current row state.
- All state is local and persisted to `localStorage`.
- There is no backend.

## Non-Negotiable Domain Rules

These rules define the product. Preserve them exactly if rebuilding.

1. A need card keeps `sourceTeacherId` forever, even if moved to a different row.
2. A row-level assignee is the default assignee for cards in that row.
3. An explicit card assignee overrides the row-level assignee.
4. Effective assignee logic is:

```ts
effectiveAssigneeId =
  card.explicitAssigneeId ??
  row.rowResponsibleId ??
  null
```

5. Rows never auto-merge.
6. Only one need card may occupy a given `(rowId, timeBlockId)` cell.
7. Unscheduled cards must have `placement: 'unscheduled'`, `rowId: null`, and `timeBlockId: null`.
8. Scheduled cards must have `placement: 'scheduled'`, plus valid `rowId` and `timeBlockId`.
9. Need-card dragging only moves need cards between schedule cells and `Uplanlagt`.
10. Substitute dragging only assigns substitutes to row headers or individual need cards.

## App Boot Flow

Runtime entry is simple:

1. `src/main.tsx` mounts React and global CSS.
2. `src/app/App.tsx` wraps the app in `ScheduleProvider`.
3. `src/features/schedule/ScheduleProvider.tsx` loads persisted planner state and exposes `{ state, dispatch }`.
4. `src/features/layout/PlannerPage.tsx` renders the entire planner shell, drag context, and overlay.

## Vital State Shape

The source of truth lives in `src/domain/schedule/types.ts`.

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

Core entities:

- `Teacher`: source identity for the original teacher on a lesson card.
- `Substitute`: assignable substitute person.
- `Row`: visual lane plus `rowResponsibleId`.
- `NeedCard`: lesson card with scheduling placement and optional explicit assignee.
- `TimeBlockId`: fixed time slots from `08:30` through `13:30`.

## Seed, Storage, and Persistence

### `src/domain/schedule/constants.ts`

Vital exports:

- `STORAGE_KEY = 'substitute-planner:v2'`
- `STORAGE_VERSION = 3`
- `TIME_BLOCKS`
- `TIME_BLOCK_ID_SET`
- `TIME_BLOCK_ORDER`

Why it matters:

- `TIME_BLOCKS` defines the grid columns.
- `TIME_BLOCK_ORDER` is used to sort row cards consistently.
- Storage versioning is enforced during persistence validation.

### `src/domain/schedule/seed.ts`

Vital function:

- `createSeedPlannerState()`

Purpose:

- Creates the initial full demo state for teachers, substitutes, rows, and need cards.
- Provides the fallback state whenever persisted data is absent or invalid.

### `src/domain/schedule/storage.ts`

Vital functions:

- `loadPlannerState()`
- `savePlannerState(state)`
- `migrateStoredPlannerState(value)`

Purpose:

- Validates localStorage JSON before using it.
- Falls back to seed state if data is malformed or stale.
- Ensures card placement integrity and foreign-key integrity before accepting stored state.

### `src/features/schedule/ScheduleProvider.tsx`

Vital behavior:

- Uses `useReducer(plannerReducer, undefined, loadPlannerState)`.
- Saves state back to localStorage after a 200ms debounce.

This is the only persistence layer.

## Reducer: All State Mutations

The reducer is intentionally small. Rebuild it before rebuilding the UI.

### `src/domain/schedule/reducer.ts`

Vital function:

- `plannerReducer(state, action)`

Supported actions:

- `moveNeedCardToCell`
- `moveNeedCardToUnscheduled`
- `assignSubstituteToRow`
- `clearRowResponsible`
- `assignSubstituteToNeedCard`
- `clearNeedCardExplicitAssignee`

Important reducer behavior:

- `findNeedCardAtCell(...)` rejects collisions so a cell cannot contain two cards.
- Moving a card never changes `sourceTeacherId`.
- Moving a card does not clear `explicitAssigneeId`.
- Assigning a row substitute does not clear explicit card overrides.
- Clearing a row substitute only affects inherited cards; explicit card assignees remain.

## Selectors: Most Important Derived Logic

The selectors file is the main derivation layer. Another agent should rebuild this carefully before rebuilding the UI.

### `src/domain/schedule/selectors.ts`

Vital functions:

- `buildCellKey(rowId, timeBlockId)`
- `selectTeacherById(state, teacherId)`
- `selectSubstituteById(state, substituteId)`
- `selectScheduledNeedCards(state)`
- `selectUnscheduledNeedCardIds(state)`
- `selectCellNeedCardIdMap(state)`
- `selectNeedCardIdAtCell(state, rowId, timeBlockId)`
- `selectRowCards(state, rowId)`
- `selectRowTeacherIds(state, rowId)`
- `selectRowTeachers(state, rowId)`
- `selectRowTitle(state, rowId)`
- `selectRowDisplayModel(state, rowId)`
- `selectEffectiveAssigneeId(state, cardId)`
- `selectEffectiveNeedCardAssignee(state, cardId)`
- `selectNeedCardAssignmentMode(state, cardId)`
- `selectNeedCardConflict(state, cardId)`
- `selectNeedCardDisplayModel(state, cardId)`
- `selectCanDropNeedCardInCell(state, cardId, rowId, timeBlockId)`

### Row title rules

Current title logic is:

- If a row has a row-responsible substitute:
  - `"{SubstituteFirstName}s vikartimer"`
  - Example: `Kaspers vikartimer`
- If no row substitute exists:
  - 0 teachers: `Ledig rad`
  - 1 teacher: `"{Teacher}s timer"`
  - 2 teachers: `"{Teacher1} & {Teacher2}s timer"`
  - 3+ teachers: `Div timer`

### Need-card display derivation

`selectNeedCardDisplayModel(...)` does the UI-facing derivation work:

- resolves original teacher
- resolves effective assignee
- computes assignment mode: `unassigned`, `inherited`, `explicit`
- computes conflict status
- splits titles like `Naturfag 7B` into:
  - `subjectLabel = Naturfag`
  - `classLabel = 7B`
- computes row accent and assignee accent colors

This selector is the bridge between raw data and card rendering.

## Drag and Drop: Critical Interaction Logic

The drag system is split into three layers:

1. drag item / drop target typing
2. collision and drop resolution rules
3. UI orchestration in `PlannerPage`

### `src/domain/schedule/dnd.ts`

Vital exports:

- `createNeedCardDragItem(card)`
- `getPlannerDragItem(active)`
- `getPlannerDropTarget(over)`
- `plannerCollisionDetection`
- `canDropOnTarget(state, activeItem, target)`
- `resolveDrop(state, activeItem, target)`

Drag item types:

- `need-card`
- `substitute`

Drop target types:

- `unscheduled-panel`
- `calendar-cell`
- `row-header`
- `need-card`

Critical rules:

- Need cards may only drop on `unscheduled-panel` or `calendar-cell`.
- Substitutes may only drop on `row-header` or `need-card`.
- `plannerCollisionDetection` filters droppables by active drag type before calling `pointerWithin` and `rectIntersection`.
- `resolveDrop(...)` maps valid drag/drop combinations directly to reducer actions.

### Drop mapping

- Need card -> unscheduled panel:
  - `moveNeedCardToUnscheduled`
- Need card -> calendar cell:
  - `moveNeedCardToCell`
- Substitute -> row header:
  - `assignSubstituteToRow`
- Substitute -> need card:
  - `assignSubstituteToNeedCard`

## Planner Orchestration

### `src/features/layout/PlannerPage.tsx`

This is the top-level interaction controller.

Vital responsibilities:

- creates the `DndContext`
- configures the pointer sensor
- stores current `activeDrag`
- stores current selection for the detail sheet
- tracks `dragVector` for richer overlay motion
- captures `overlaySize`
- tracks `dropAnimationKind`
- tracks recent motion events, rejected drags, and need-card handoff state
- dispatches reducer actions after `resolveDrop(...)`
- renders the three-column shell
- renders `DragOverlay`

Vital handlers:

- `handleDragStart`
- `handleDragMove`
- `handleDragEnd`
- inline row-clear handler `handleClearRowResponsible`
- motion helpers:
  - `pushDropHandoff`
  - `pushMotionEvent`
  - `pushRejectedDrag`

## Main UI Composition

### Left tool: `src/features/tasks/TasksPanel.tsx`

Responsibilities:

- renders the `Uplanlagt` tray
- acts as the droppable return target for need cards
- lists unscheduled card IDs from `selectUnscheduledNeedCardIds`
- renders each unscheduled card as a `TaskCard` with `variant="panel"`

### Right tool: `src/features/people/PeoplePanel.tsx`

Responsibilities:

- renders the `Vikarer` tray
- lists substitutes in `substituteOrder`
- renders each substitute as a draggable `PersonCard`

### Shared tray shell: `src/features/shared/PanelFrame.tsx`

Responsibilities:

- shared visual shell for both tool panels
- shared title, meta count, tooltip, header style, and body structure

### Center grid: `src/features/calendar/CalendarGrid.tsx`

Responsibilities:

- renders time headers from `TIME_BLOCKS`
- builds the cell-to-card map via `selectCellNeedCardIdMap`
- renders one `RowLane` per `rowOrder`
- owns the mounted `PlannerDetailSheet`

### Row composition: `src/features/calendar/RowLane.tsx`

Responsibilities:

- renders one row header plus one cell per time block
- passes selection and active drag state to row header and cells

### Row header: `src/features/calendar/RowHeaderDropZone.tsx`

Responsibilities:

- row-level drop target for substitutes
- uses `selectRowDisplayModel`
- shows:
  - dominant responsible avatar
  - derived row title
  - up to 2 teacher chips, then `+N`
  - clear row-responsible action
  - minimal drop hint icon
- opens the row detail sheet on click or keyboard activation

### Calendar cells: `src/features/calendar/CalendarCell.tsx`

Responsibilities:

- droppable target for need-card movement
- renders either:
  - `TaskCard` if occupied
  - `EmptyCellState` if empty
- animates valid/invalid target state

### Empty cells: `src/features/calendar/EmptyCellState.tsx`

Responsibilities:

- quiet default empty-cell rendering
- clearer affordance only during need-card drag

## Need Cards and Assignment UI

### Shared presentational shell: `src/features/shared/NeedCardVisual.tsx`

This is the actual card UI shell and should be reused in any rebuild.

Responsibilities:

- renders the card band, teacher marker, body, and marker slot
- accepts `variant`:
  - `grid`
  - `panel`
  - `overlay`
  - `detail`
- uses `NeedCardDisplayModel` to style assignment and row accents

### Interactive need card: `src/features/shared/TaskCard.tsx`

This is one of the most important files in the app.

Responsibilities:

- makes a need card draggable
- makes the same card droppable for substitute assignment
- opens need-card details on click
- suppresses click if the pointer movement was actually a drag
- renders the shared `NeedCardVisual`
- renders the assignment marker via `AssigneeBadge`
- participates in drag handoff and motion feedback

Important detail:

- A need card is both:
  - an object you can move between cells/trays
  - a drop target for assigning a substitute directly

### Assignment token: `src/features/shared/AssigneeBadge.tsx`

Responsibilities:

- renders the assignee badge for:
  - explicit assignment
  - inherited assignment
  - unassigned state
- supports compact and detail density
- supports inline clear action for explicit assignment

### Substitute cards: `src/features/shared/PersonCard.tsx`

Responsibilities:

- draggable substitute source
- shows substitute avatar and formatted name
- collapses long names to `FirstName L.` when needed

## Detail Sheet

### `src/features/layout/PlannerDetailSheet.tsx`

Responsibilities:

- shows details for either a selected row or selected need card
- closes on backdrop click or `Escape`
- for need cards shows:
  - class
  - subject
  - room
  - source teacher
  - time and row placement
  - assignment details
  - clear explicit assignment action when relevant
- for rows shows:
  - row responsible substitute
  - derived title
  - card count
  - row cards list
  - clear row responsibility action

## Motion and Drag Feedback

There is a dedicated motion layer. Rebuild behavior first, then polish with motion.

### `src/features/motion/PlannerDragFeedbackContext.tsx`

Purpose:

- shares transient motion state across the board:
  - `dragVector`
  - `recentEvent`
  - `rejectedDrag`
  - `dropHandoff`

Key helpers:

- `actionToDropHandoff(action)`
- `actionToMotionEvent(action)`

### `src/features/motion/plannerMotion.ts`

Purpose:

- shared motion tokens and animation helpers
- overlay lift and rest transforms
- target activation motion
- receive and reject motion
- custom need-card drop animation logic

Vital exports:

- `plannerLayoutSpring`
- `plannerHoverSpring`
- `plannerTargetSpring`
- `plannerReceiveSpring`
- `plannerPickupSpring`
- `plannerPulseTransition`
- `plannerRejectTransition`
- `getOverlayDragAnimation(...)`
- `getOverlayRestAnimation(...)`
- `getTargetActivationAnimation(...)`
- `getReceiveAnimation(...)`
- `getRejectAnimation(...)`

Important current detail:

- need-card drag/drop uses a custom drop animation so the overlay stays the same object through pickup, travel, and settle
- the same `NeedCardVisual` shell is used for both the idle card and overlay card

### `src/features/shared/DragOverlayCard.tsx`

Responsibilities:

- renders the active overlay for:
  - dragged need cards
  - dragged substitutes
- uses the same need-card shell for overlay mode
- uses `overlaySize` so the dragged card matches the measured source footprint

## Styling

### `src/index.css`

This file is large and important.

It contains:

- planner layout geometry
- fixed row and card sizing
- card, row, tool, and detail-sheet styling
- drag/drop classes
- overlay settle classes
- motion-supporting CSS hooks

If rebuilding from scratch, keep the logic in TypeScript and reintroduce the CSS after structural parity is working.

## Tests That Define Expected Behavior

Existing tests live in:

- `src/domain/schedule/reducer.test.ts`
- `src/domain/schedule/selectors.test.ts`
- `src/app/App.test.tsx`

Important tested behaviors:

- need cards can be scheduled into empty cells
- occupied cells reject a move
- moved cards keep teacher identity and explicit assignees
- returning to `Uplanlagt` keeps explicit assignees
- row assignee and explicit assignee precedence works
- clearing a row assignee falls back correctly
- row title derivation follows current naming rules
- app shell renders the three main surfaces
- row and card detail sheets open correctly
- inline clear actions work without opening the detail sheet

## Recommended Sequential Rebuild Order

This is the safest rebuild order for another AI agent.

### 1. Rebuild the domain model first

Implement:

- `types.ts`
- `constants.ts`
- `seed.ts`

Done when:

- the app can produce a full seed state with teachers, substitutes, rows, and cards.

### 2. Rebuild persistence

Implement:

- `storage.ts`
- `ScheduleProvider.tsx`
- `ScheduleContext.ts`
- `useSchedule.ts`

Done when:

- state loads from localStorage or seed data
- state saves after reducer changes

### 3. Rebuild reducer actions

Implement:

- `plannerReducer`
- `findNeedCardAtCell`

Done when:

- all six planner actions mutate state correctly
- cell collisions are rejected

### 4. Rebuild selectors before UI

Implement the selector surface in `selectors.ts`.

Done when:

- row titles derive correctly
- card display models derive correctly
- effective assignee logic is correct
- row card sorting is stable

### 5. Rebuild the static shell

Implement:

- `App.tsx`
- `PlannerPage.tsx` without DnD first
- `PanelFrame.tsx`
- `CalendarGrid.tsx`
- `RowLane.tsx`
- `TimeHeader.tsx`

Done when:

- the app renders left tool, center grid, and right tool from real state

### 6. Rebuild shared presentational primitives

Implement:

- `NeedCardVisual.tsx`
- `AssigneeBadge.tsx`
- `PersonCard.tsx`
- `EmptyCellState.tsx`

Done when:

- cards, substitutes, and empty cells render with correct derived labels and states

### 7. Rebuild interactive card and row components

Implement:

- `TaskCard.tsx`
- `RowHeaderDropZone.tsx`
- `CalendarCell.tsx`
- `TasksPanel.tsx`
- `PeoplePanel.tsx`

Done when:

- cards open details
- row headers open details
- inline clear actions work

### 8. Rebuild the detail sheet

Implement:

- `PlannerDetailSheet.tsx`
- selection helpers in `plannerSelection.ts`

Done when:

- selecting a row or card opens the correct detail content
- detail sheet actions mutate state correctly

### 9. Rebuild drag-and-drop logic

Implement:

- `dnd.ts`
- DnD orchestration in `PlannerPage.tsx`

Done when:

- need cards move between cells and `Uplanlagt`
- substitutes assign to rows and cards
- invalid targets are rejected

### 10. Rebuild motion last

Implement:

- `PlannerDragFeedbackContext.tsx`
- `plannerMotion.ts`
- `DragOverlayCard.tsx`
- motion hooks inside `TaskCard`, `RowHeaderDropZone`, `CalendarCell`, `TasksPanel`, and `PersonCard`

Done when:

- idle UI stays calm
- drag pickup, hover, drop, reject, and receive states are smooth
- need-card overlay feels like the same object during drag and settle

### 11. Reapply CSS and visual polish

Use `src/index.css` as the styling source of truth after the React structure matches.

Done when:

- fixed heights, rigid layout, and tool panel proportions match the current app

### 12. Recreate the test surface

Rebuild the existing tests or their equivalent coverage.

Done when:

- reducer invariants
- selector invariants
- app-shell behaviors

are all protected.

## Practical Advice For Another Agent

- Rebuild domain logic before visual polish.
- Do not put business rules inside presentational components.
- Keep selectors as the main UI-facing derivation layer.
- Keep `PlannerPage` as the orchestration layer, not the business-logic layer.
- Reuse one need-card shell for panel, grid, and overlay states.
- Reintroduce motion only after raw drag/drop correctness is working.
- Treat `src/index.css` as a second source of product knowledge, not just paint.

## Minimum Validation Checklist

After any rebuild, verify all of these:

1. `npm test`
2. `npm run build`
3. `npm run lint`
4. Drag a need card from `Uplanlagt` into an empty cell.
5. Drag a scheduled card back to `Uplanlagt`.
6. Drop a substitute on a row header and confirm inherited assignment.
7. Drop a substitute on a need card and confirm explicit override.
8. Clear a row assignee and confirm explicit card overrides remain.
9. Clear an explicit card assignee and confirm row inheritance returns if present.
10. Refresh the page and confirm state persists.

## Fast Mental Model

If you only remember one thing, remember this:

- `PlannerState` is the source of truth.
- `plannerReducer` changes it.
- `selectors.ts` turns it into UI-friendly meaning.
- `dnd.ts` turns drag/drop combinations into reducer actions.
- `PlannerPage` wires everything together.
- `NeedCardVisual` and `AssigneeBadge` are the core visual primitives.

