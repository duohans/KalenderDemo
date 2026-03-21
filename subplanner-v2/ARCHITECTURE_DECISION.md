# Architecture Decision Record

## Goal

Build a new substitute scheduling planner from scratch in `subplanner-v2` with a maintainable foundation that can support richer drag-and-drop behavior, persistence, and later server integration without coupling the planner rules to React rendering.

## Chosen Stack

- React 19 for the UI runtime
- TypeScript for typed domain and component boundaries
- Vite for fast local iteration and production builds
- Tailwind CSS v4 for token-driven styling without a heavy component framework
- TanStack Router for route composition without tying planner state to a page component
- TanStack Query for future server synchronization and cache orchestration
- Zustand for local planner state and persistence-friendly actions
- Zod for runtime-safe domain parsing and future API boundary validation
- dnd-kit for custom planner interactions on DOM elements
- motion for a lightweight baseline motion layer
- react-aria-components for accessible tooltip and overlay primitives
- date-fns for time and date formatting
- lucide-react for consistent lightweight icons
- clsx and tailwind-merge for class composition
- Vitest and Playwright for domain and end-to-end testing

## Architecture Shape

The app is split into four layers:

1. Domain layer
   Pure schemas, types, rules, and validation.
   This layer owns row title derivation, effective assignee logic, occupancy checks, and move validation.

2. State layer
   Zustand store with normalized planner state, UI state, and pure action boundaries.
   The store is persistence-ready and can later be adapted to server synchronization without rewriting planner rules.

3. UI layer
   Reusable planner components and UI primitives.
   The planner board is a DOM-based CSS Grid, not a generic scheduler library.

4. Interaction layer
   Reserved for dnd-kit sensors, drop targets, drag overlay, and motion presets.
   This stays separate from the domain so drag behavior remains replaceable and testable.

## Why This Fits This App

- The planner is rule-heavy, not form-heavy. A separate domain layer prevents business rules from leaking into card and row components.
- The board needs precise row and time alignment. A custom CSS Grid layout gives predictable geometry without calendar-library constraints.
- Row assignees and card overrides create derived state. Normalized entities plus selectors keep these derivations explicit and testable.
- Future week view and backend sync require stable data boundaries. Zod schemas and store actions create that contract early.
- dnd-kit is a better fit than a generic calendar because row headers, cards, and cells all have custom drop semantics.

## Tradeoffs

- A custom planner board requires more upfront implementation than using a scheduler library.
- Zustand keeps state simple, but cross-tab sync and optimistic server reconciliation will need explicit work later.
- Tailwind CSS keeps styling fast and composable, but design consistency depends on disciplined token usage.
- Code-based TanStack Router avoids generated route files during type checks, but it gives up some file-based routing convenience.
- The first pass prioritizes structure and correctness over polished drag animation.

## Rejected Alternatives

### Generic calendar or scheduler package

Rejected because the core interaction model is not a standard calendar. The row header is a first-class assignment target and card assignment rules are planner-specific.

### Canvas-based board

Rejected because accessibility, hit targets, responsive layout, and maintainable component composition are better served by DOM elements.

### Heavy UI kit

Rejected because the app needs a distinct layout language and rigid planner-specific surfaces, not generic dashboard primitives.

### Redux

Rejected because the current scope does not justify the extra ceremony. Zustand is enough for local planner state while keeping room for later server orchestration through TanStack Query.

### Keeping planner logic inside React components

Rejected because row naming, effective assignee derivation, and cell occupancy validation must remain independently testable and reusable by future drag handlers.

## Phase 1 Decision Summary

This pass establishes:

- a route-driven app shell
- normalized planner entities
- a tested domain rules module
- a persistence-ready store
- a rigid three-area day-view board shell

Drag-and-drop interaction wiring is intentionally deferred until the domain and layout surfaces are stable.
