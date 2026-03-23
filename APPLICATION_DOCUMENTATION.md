# KalenderDemo Application Documentation

This document describes the maintained app as it works now.

Use [README.md](./README.md) for the short overview.
Use this file for the current runtime model, domain invariants, architecture boundaries, and implementation map.

## 1. Product Overview

KalenderDemo is a browser-only substitute scheduling planner for a school timetable.

It currently supports two operator-facing modes:

- `Dag`
  the main planning and editing surface
- `Uke`
  an overview and navigation surface

The app has:

- no backend
- no server state
- no route-based navigation model
- local persistence only through `localStorage`

## 2. View Modes

### Day view

Day view is the primary workspace.

It uses a three-area layout:

- left: `Uplanlagt`
- center: `Dagstavle`
- right: `Vikarer`

The center board is transposed relative to the older horizontal-time layout:

- Y axis = fixed lesson time blocks
- X axis = planning rows/lanes
- left first column = sticky time axis
- top row = lane headers

### Week view

Week view is an overview and navigation surface.

It uses:

- X axis = Monday to Friday
- Y axis = the same fixed lesson time blocks used in day view

Week view does not show the day-view side rails.

Its job is to:

- show the whole week at a glance
- open a day from a selected day/time cell
- open a lesson detail sheet from a week mini card

It is not a full drag-and-drop planning surface in the current version.

## 3. Current Day-View Layout

The current day board is a transposed timetable/editor.

### Board axes

- first column = sticky time rail
- remaining columns = user-managed planning rows
- trailing header column = `new row` placeholder

### Shared geometry

The transposed board uses one shared column template for:

- the top header row
- the body rows

That shared template is:

- first track = fixed time-axis width
- middle tracks = fixed lane widths
- trailing track = new-row placeholder / body spacer

This is why:

- the `TID` header aligns with the time cells
- the lane headers align with the lesson columns
- the first lesson column starts to the right of the time rail

### Time rail

The time rail is the real first grid column, not a visual overlay.

It is:

- sticky on horizontal scroll
- fully opaque
- separated from the main grid by a dedicated vertical divider

## 4. Current Week-View Layout

Week view renders a timetable-style weekly overview.

### Grid structure

- header row = weekday buttons
- first column = time labels
- body = one cell per `day + time block`

### Cell behavior

Each week cell contains the scheduled lessons for that weekday/time slot.

Mini-card behavior:

- visible mini cards render side by side, not as a vertical list
- visible cards share equal width inside the cell
- up to `3` mini cards are shown
- additional lessons collapse into `+N`

### Week interactions

- click a weekday header or empty/tappable cell to open that day in day view
- click a mini lesson card to open the detail sheet while staying in week view
- the detail sheet can then open the same lesson in day view via `Åpne i dagvisning`

## 5. Core Domain Entities

The planner uses a normalized data model.

### `Teacher`

The original teacher attached to a lesson card.

### `Substitute`

A substitute who can be assigned to:

- a full row
- a single lesson card

### `Row`

A user-managed planning lane.

A row may have:

- `rowResponsibleId`

### `NeedCard`

A lesson that may be:

- unscheduled
- scheduled into a row/time cell
- covered by a row-level substitute
- directly overridden by an explicit substitute

Important stable fields on `NeedCard`:

- `sourceTeacherId`
- `dayId`
- `allocatedTimeBlockId`
- `explicitAssigneeId`

## 6. Time And Week Model

Time is fixed to six lesson blocks:

- `08:30-09:30`
- `09:30-10:30`
- `10:30-11:30`
- `11:30-12:30`
- `12:30-13:30`
- `13:30-14:30`

Weekdays are fixed to:

- `monday`
- `tuesday`
- `wednesday`
- `thursday`
- `friday`

The canonical definitions live in:

- `src/domain/schedule/constants.ts`

## 7. Core Invariants

These rules belong to the domain layer, not to JSX.

1. A need card keeps its `sourceTeacherId`.
2. A need card keeps its `dayId`.
3. A need card keeps its `allocatedTimeBlockId` as its owned/original time.
4. A board cell may contain at most one need card.
5. A row-level assignee is the default substitute for scheduled cards in that row.
6. An explicit card-level assignee overrides the row-level assignee.
7. Effective assignee precedence is:

```ts
card.explicitAssigneeId ??
  (card.placement === 'scheduled' ? row.rowResponsibleId : null) ??
  null
```

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
11. Normal drag-and-drop may not freely rewrite a lesson's time block.
12. Substitute dragging only assigns substitutes to row headers or individual need cards.

## 8. Scheduling Model

The current planner distinguishes between:

- owned/original time
  `allocatedTimeBlockId`
- visible scheduled placement
  `rowId + timeBlockId`

Normal planning respects owned time.

Allowed need-card moves:

- unscheduled -> existing row header
  auto-place into that row at `allocatedTimeBlockId`
- unscheduled -> new-row placeholder
  create a row and auto-place there at `allocatedTimeBlockId`
- scheduled -> unscheduled panel
  allowed
- scheduled -> matching cell in another row
  allowed if the target time matches `allocatedTimeBlockId`
- arbitrary wrong-time cell
  rejected

Changing a lesson's time is not a drag action.

## 9. Row Model

Rows are user-managed.

Current behavior:

- seeded state starts with `1` real row
- rows are stored in `rows` plus `rowOrder`
- rows can be created explicitly
- rows can be created by dropping a need card onto the new-row placeholder
- rows can be removed
- removing a row sends its scheduled cards back to `Uplanlagt`
- remaining rows are reindexed for deterministic ordering

Important UI note:

Because the current day board is transposed, the new-row affordance appears as a trailing header column on the right edge of the board rather than as a bottom placeholder row.

## 10. Side Rails

The side rails are used in day view only.

### `Uplanlagt`

Responsibilities:

- unscheduled lesson cards
- drop target for sending a scheduled card back out of the board
- allocated/original time shown on the card

Behavior:

- fixed-height rail
- paged in groups of `5`
- overflow handled by paging, not normal scrolling

### `Vikarer`

Responsibilities:

- substitute drag sources
- quick scan of available substitutes

Behavior:

- fixed-height rail
- paged in groups of `5`
- person-first card layout

## 11. Detail Sheet

`src/features/layout/PlannerDetailSheet.tsx` is the main keyboard-friendly editing surface.

It supports:

- row detail mode
- need-card detail mode

### Need-card mode

The sheet shows:

- class
- subject
- room
- teacher
- current row placement
- owned/original time
- current effective assignment

The operator can:

- move the card to another row
- send the card to `Uplanlagt`
- change the owned/original time with explicit confirmation
- assign or clear a direct substitute override

Time changes are explicitly separate from normal placement.

### Row mode

The operator can:

- assign a row-level substitute
- clear the row-level substitute
- remove the row

### Week-view behavior

When a lesson is opened from week view:

- the detail sheet opens while week view stays visible in the background
- the sheet exposes `Åpne i dagvisning`

## 12. Drag And Drop Model

Drag behavior is defined in:

- `src/domain/schedule/dnd.ts`

The top-level orchestration lives in:

- `src/features/layout/PlannerPage.tsx`

### Drag item types

- `need-card`
- `substitute`

### Drop target types

- `unscheduled-panel`
- `calendar-cell`
- `row-header`
- `new-row-placeholder`
- `need-card`

### Need-card semantics

- `need-card -> unscheduled-panel`
  `moveNeedCardToUnscheduled`
- `need-card -> calendar-cell`
  only valid when the day and time are allowed for that card
- `need-card -> row-header`
  auto-place using the card's `allocatedTimeBlockId`
- `need-card -> new-row-placeholder`
  create a new row and place the card there

### Substitute semantics

- `substitute -> row-header`
  assign row responsibility
- `substitute -> need-card`
  create or replace a direct override

### Collision filtering

`plannerCollisionDetection` filters available droppable containers by drag item type before falling back to pointer/rect collision logic.

## 13. Reducer Responsibilities

Planner mutations are centralized in:

- `src/domain/schedule/reducer.ts`

Current actions:

- `createRow`
- `removeRow`
- `updateNeedCardAllocatedTimeBlock`
- `moveNeedCardToCell`
- `moveNeedCardToUnscheduled`
- `assignSubstituteToRow`
- `clearRowResponsible`
- `assignSubstituteToNeedCard`
- `clearNeedCardExplicitAssignee`

Important guarantees:

- wrong-time placement is rejected
- day mismatches are rejected through validation before placement
- collisions are prevented
- row removal unschedules its cards
- allocated-time changes revalidate placement immediately
- explicit card overrides are preserved unless explicitly changed

## 14. Selector Layer

The selector layer lives in:

- `src/domain/schedule/selectors.ts`

It does more than lookups.

It derives:

- scheduled-card indexing
- collision checks
- row titles
- effective assignees
- assignment mode
- planner summary metrics
- substitute workloads
- day-view display models
- week-view grid models

### Important selector families

Structural selectors:

- `selectCellNeedCardIdMap`
- `selectScheduledNeedCards`
- `selectUnscheduledNeedCardIds`
- `selectRowCards`

Validation selectors:

- `selectCanDropNeedCardInCell`
- `selectCanDropNeedCardInRow`
- `selectCanPlaceNeedCardInCell`

View-model selectors:

- `selectPlannerSummary`
- `selectRowDisplayModel`
- `selectNeedCardDisplayModel`
- `selectSubstituteWorkloads`
- `selectWeekGridViewModel`

### Week-grid derivation

`selectWeekGridViewModel` builds:

- weekday headers
- time-block rows
- each `day + time block` cell's scheduled lesson cards
- compact mini-card metadata such as status tone, accent colors, and assignee identity

## 15. Store, Selection, And History

The Zustand store lives in:

- `src/store/plannerStore.ts`

It owns:

- current planner state
- current selection
- undo history
- redo history

Dispatch behavior:

1. read current state
2. run `plannerReducer`
3. bail if unchanged
4. push previous state into `past`
5. clear `future`
6. persist the next state
7. update the store

Undo/redo restore full planner snapshots and persist them again after restoration.

Selection is stored separately from planner data and drives the detail sheet.

## 16. Persistence

Persistence lives in:

- `src/domain/schedule/storage.ts`
- `src/domain/schedule/schema.ts`

Current persistence details:

- storage key: `substitute-planner:v2`
- current schema version: `5`
- stored version `3` and `4` documents are migrated forward
- migration backfills modern card fields such as:
  - `allocatedTimeBlockId`
  - `dayId`
- invalid persisted data falls back to seeded planner state

## 17. Seed State

Seeded planner data is created by:

- `src/domain/schedule/seed.ts`

Current seed characteristics:

- `1` initial row
- several teachers
- several substitutes
- a mix of scheduled and unscheduled cards
- every need card includes:
  - `dayId`
  - `allocatedTimeBlockId`
- current seeded examples are concentrated on `monday`

The seed serves both as demo content and as persistence fallback.

## 18. Main UI Composition

### `src/features/layout/PlannerPage.tsx`

Owns:

- `DndContext`
- pointer sensor setup
- drag lifecycle handlers
- summary chips
- view-mode switching
- undo/redo controls
- keyboard shortcuts
- live-region announcements
- detail-sheet mounting
- static drag overlay

### `src/features/calendar/CalendarGrid.tsx`

Owns:

- transposed day-view board shell
- board header chips
- sticky `TID` column header
- lane header row
- transposed body rows

### `src/features/week/WeekView.tsx`

Owns:

- week timetable shell
- weekday header buttons
- time rows
- compact mini cards

### `src/features/tasks/TasksPanel.tsx`

Owns:

- `Uplanlagt` drop zone
- paged unscheduled cards
- fixed footer pager

### `src/features/people/PeoplePanel.tsx`

Owns:

- paged substitute cards
- fixed footer pager

### `src/features/shared/`

Important shared primitives:

- `TaskCard`
- `NeedCardVisual`
- `AssigneeBadge`
- `PersonCard`
- `DragOverlayCard`
- `PanelFrame`
- `SideRailPager`

### Legacy helper

`src/features/calendar/RowLane.tsx` still exists in the tree, but the live day board is now rendered directly by the transposed `CalendarGrid` path.

## 19. Styling System

Styling is CSS-first and split across:

- `src/styles/tokens.css`
- `src/styles/layout.css`
- `src/styles/calendar.css`
- `src/styles/components.css`
- `src/styles/responsive.css`

Current visual direction:

- warm cream/sand board
- muted sage and clay accents
- Fraunces only for high-level headings
- Manrope for operational UI text
- calm card shells
- compact but readable timetable geometry

## 20. Motion And Feedback

The app no longer has a visual animation layer.

Current behavior:

- drag overlay is static
- state changes are immediate
- hover/focus states are not animated

`src/features/motion/` now exists for announcement timing and feedback state, not for animated transitions.

## 21. Accessibility

Important accessibility patterns:

- named regions for major planner areas
- keyboard-operable buttons, pagers, and view toggles
- dialog semantics and focus trapping in the detail sheet
- live-region feedback for accepted actions and rejected drops
- accessible names on compact controls and cards

## 22. Testing

### Unit and domain tests

Located under:

- `src/domain/schedule/*.test.ts`

They cover:

- reducer rules
- selector behavior
- drag/drop resolution
- schema validation
- storage migration

### App-level tests

- `src/app/App.test.tsx`

They cover:

- shell structure
- row creation/removal
- side-rail paging
- detail-sheet flows
- keyboard behavior

### End-to-end tests

- `e2e/planner.spec.ts`

They cover:

- row-header auto-placement
- new-row placeholder creation
- wrong-time rejection
- fixed side rails and paging
- footer containment
- detail-sheet time confirmation
- week-view behavior
- persistence and undo/redo

## 23. Package Scripts

Main scripts from `package.json`:

- `npm run dev`
- `npm run build`
- `npm test`
- `npm run test:e2e`
- `npm run lint`
- `npm run preview`

## 24. Implementation Boundaries

When changing the app, keep these boundaries:

- planner rules belong in the domain layer
- derived UI state belongs in selectors
- planner mutation belongs in the reducer
- drag/drop semantics belong in `dnd.ts` plus selector validation
- presentation components should stay focused on layout and interaction wiring

Preferred order when adding behavior:

1. types and constants
2. reducer action and mutation rules
3. selectors / derived view models
4. drag/drop resolution if relevant
5. component and style changes last
