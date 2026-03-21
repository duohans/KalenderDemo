# App Domain Specification

## Planner Intent

The application is a substitute planning board for schools. It represents lesson coverage needs across a fixed day view where time runs horizontally and planning lanes run vertically.

## Core Entities

### Teacher

- `id`
- `name`
- `firstName`

Teachers are the original lesson owners. A need card always preserves its source teacher identity even when moved between rows.

### Substitute

- `id`
- `name`
- `firstName`
- `initials`
- `avatarColor?`

Substitutes can be assigned to rows or directly to individual need cards.

### TimeBlock

- `id`
- `label`
- `start`
- `end`
- `order`

Phase 1 uses a fixed day view with six blocks:

- `08:30-09:30`
- `09:30-10:30`
- `10:30-11:30`
- `11:30-12:30`
- `12:30-13:30`
- `13:30-14:30`

### Row

- `id`
- `order`
- `rowResponsibleId`

Rows are stable planning lanes.

Rules:

- rows do not auto-merge
- rows do not collapse into each other
- cards move between rows
- row titles are derived, never stored as source of truth

### NeedCard

- `id`
- `title`
- `sourceTeacherId`
- `rowId`
- `timeBlockId`
- `explicitAssigneeId`
- `color?`

Need cards are concrete lesson coverage needs.

Rules:

- one card per cell in MVP
- moving a card preserves `sourceTeacherId`
- moving a card preserves `explicitAssigneeId`
- dropping into an occupied cell is invalid in MVP

## Planner State Shape

The normalized state shape is:

```ts
type PlannerState = {
  teachers: Teacher[]
  substitutes: Substitute[]
  timeBlocks: TimeBlock[]
  rows: Row[]
  needCards: NeedCard[]
}
```

## Assignment Rules

These rules are exact and implemented as pure selectors:

- a row-responsible substitute is the default substitute for all cards in that row
- a card can also have an explicit substitute override
- explicit card assignment overrides row assignment
- if neither exists, the card is unassigned

Derived rule:

```ts
effectiveAssigneeId = card.explicitAssigneeId ?? row.rowResponsibleId ?? null
```

## Row Title Rules

Row titles are always derived from current state.

If a row has a row-responsible substitute:

- title = `"{SubstituteFirstName}s vikartimer"`

If a row has no row-responsible substitute:

- with exactly one source teacher in the row:
  `"{TeacherFirstName}s timer"`
- with exactly two source teachers in the row:
  `"{Teacher1FirstName}s & {Teacher2FirstName}s timer"`
- with three or more source teachers in the row:
  `"Div timer"`

Implementation detail for deterministic output:

- when two teachers are shown in the title, they are ordered alphabetically by `firstName`

## Validity Rules

### Card Move Validity

A card move is valid only when:

- the card exists
- the target row exists
- the target time block exists
- the destination cell is empty or already occupied by the same card

### Invalid Drop Cases

- missing row
- missing time block
- missing card
- destination cell already occupied by another card

## Layout Constraints

- the planner uses a three-area layout: `Uplanlagt`, planner board, `Vikarer`
- left and right tools have equal fixed width
- left and right tools match the planner board height
- no inner scrolling inside cards, row headers, or tool panels
- rows have equal fixed height
- the center planner board is the dominant surface
- empty cells should stay visually quiet
- helper text should live mostly in tooltips

## Visual Semantics

### Row Header

Must show:

- dominant responsible avatar if assigned
- compact derived row title
- source teacher chips

Must act as:

- a row ownership surface
- a future drop target for assigning a substitute to the row

### Need Card

Must show only essential information:

- lesson title
- source teacher marker when useful
- assignment state through visual treatment

Assignment states:

- row inherited
- explicit override
- unassigned

## Deferred Domain Questions

- whether an explicit ordering rule beyond alphabetical naming is needed for two-teacher titles
- how `Uplanlagt` should model truly unscheduled needs if row-less cards are introduced later
- whether week view should preserve identical row identities across days or use per-day row snapshots
