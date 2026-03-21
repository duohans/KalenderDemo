# Implementation Plan

## Objective

Ship a production-grade foundation for a substitute scheduling planner without carrying over the previous MVP architecture.

## Phase Breakdown

### Phase 1: Foundation

- scaffold new app in `subplanner-v2`
- install core stack
- configure Tailwind, routing, query client, tests, and aliases
- define Zod schemas and normalized domain types
- implement pure planner selectors and validation rules
- add seeded mock data
- create architecture and domain docs

Status in this pass:

- in progress and mostly implemented

### Phase 2: Planner Shell

- build a rigid three-area layout
- keep left and right tools visually matched
- make the center board dominant
- implement fixed day-view time blocks
- implement equal row heights and quiet empty cells
- render seeded rows and need cards with derived titles

Status in this pass:

- implemented as the first usable shell

### Phase 3: Core Components

- harden row header, need card, tool panel, avatar, and tooltip primitives
- refine minimal affordances
- expand visual states and density rules

Status:

- partially started where needed for phase 2

### Phase 4: Planner Rules

- finalize row title derivation edge cases
- finalize teacher chip logic
- implement explicit ledig-rad logic if required
- expand move and assignment validation coverage

Status:

- core assignment and move rules implemented
- some naming and overflow details deferred

### Phase 5: Drag and Drop

- add dnd-kit sensors
- add drag overlay
- wire substitute-to-row assignment
- wire substitute-to-card override assignment
- wire card movement between rows and cells
- surface invalid drop feedback

Status:

- deferred until foundation and shell are stable

### Phase 6: Persistence

- harden localStorage persistence
- add serialization guards and migrations
- prepare API-facing state boundaries

Status:

- persistence-ready store shape established
- full serialization strategy still to complete

### Phase 7: Testing

- unit tests for pure domain rules
- store tests for persistence behavior
- end-to-end tests for core planner flows

Status:

- initial unit and smoke e2e coverage added in this pass

### Phase 8: Motion Polish

- drag lift
- valid target emphasis
- invalid drop feedback
- settle motion
- reduced motion support

Status:

- deferred

## Milestones

1. Foundations compile and test cleanly.
2. A seeded day-view planner shell renders with derived row titles and assignment states.
3. Drag-and-drop can be added without rewriting the state or domain layer.
4. Persistence and API integration can layer on top of the same normalized planner model.

## Priority Order

### Now

- correctness of domain rules
- maintainable file structure
- rigid board geometry
- clean seeded state and selectors

### Next

- dnd-kit interaction layer
- assignment drop targets
- drag overlay
- invalid drop messaging

### Later

- week view
- backend sync
- compact overflow modes
- richer motion polish
- filtering and operator workflows

## Risks To Watch

- letting UI components become the only home for planner rules
- introducing internal scrolling to solve density problems
- overfitting the shell to the seed data before DnD exists
- allowing route, store, and selector responsibilities to blur together
