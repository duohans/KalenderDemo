import { useStore } from 'zustand'
import { createJSONStorage, persist, type PersistStorage } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

import { plannerStateSchema, type PlannerState } from '@/features/planner/domain/planner.types'
import { validateNeedCardMove } from '@/features/planner/domain/planner.rules'
import { seedPlannerState } from '@/features/planner/state/planner-seed'
import { formatPlannerDayLabel } from '@/features/planner/utils/planner-date'

export const PLANNER_STORAGE_KEY = 'subplanner-v2:planner'

interface PlannerUiState {
  dayLabel: string
  activeDragId: string | null
  highlightedCellId: string | null
}

interface PersistedPlannerState {
  planner: PlannerState
  ui: Pick<PlannerUiState, 'dayLabel'>
}

export interface PlannerStoreState {
  planner: PlannerState
  ui: PlannerUiState
  hydratePlanner: (planner: PlannerState) => void
  resetPlanner: () => void
  setRowResponsible: (rowId: string, substituteId: string | null) => void
  setCardExplicitAssignee: (cardId: string, substituteId: string | null) => void
  moveNeedCard: (input: { cardId: string; rowId: string; timeBlockId: string }) => boolean
  setActiveDragId: (dragId: string | null) => void
  setHighlightedCellId: (cellId: string | null) => void
}

const defaultUiState: PlannerUiState = {
  dayLabel: formatPlannerDayLabel(),
  activeDragId: null,
  highlightedCellId: null,
}

function createPlannerStorage() {
  return createJSONStorage<PersistedPlannerState>(() => localStorage)
}

function createInitialStoreState(): Pick<PlannerStoreState, 'planner' | 'ui'> {
  return {
    planner: seedPlannerState,
    ui: defaultUiState,
  }
}

export function createPlannerStore(
  storage: PersistStorage<PersistedPlannerState> | undefined = createPlannerStorage(),
) {
  return createStore<PlannerStoreState>()(
    persist(
      (set, get) => ({
        ...createInitialStoreState(),
        hydratePlanner: (planner) => {
          set((state) => ({
            ...state,
            planner: plannerStateSchema.parse(planner),
          }))
        },
        resetPlanner: () => {
          set({
            ...createInitialStoreState(),
          })
        },
        setRowResponsible: (rowId, substituteId) => {
          set((state) => ({
            ...state,
            planner: {
              ...state.planner,
              rows: state.planner.rows.map((row) =>
                row.id === rowId ? { ...row, rowResponsibleId: substituteId } : row,
              ),
            },
          }))
        },
        setCardExplicitAssignee: (cardId, substituteId) => {
          set((state) => ({
            ...state,
            planner: {
              ...state.planner,
              needCards: state.planner.needCards.map((card) =>
                card.id === cardId ? { ...card, explicitAssigneeId: substituteId } : card,
              ),
            },
          }))
        },
        moveNeedCard: (input) => {
          const result = validateNeedCardMove(get().planner, input)

          if (!result.ok) {
            return false
          }

          set((state) => ({
            ...state,
            planner: {
              ...state.planner,
              needCards: state.planner.needCards.map((card) =>
                card.id === input.cardId
                  ? {
                      ...card,
                      rowId: input.rowId,
                      timeBlockId: input.timeBlockId,
                    }
                  : card,
              ),
            },
          }))

          return true
        },
        setActiveDragId: (dragId) => {
          set((state) => ({
            ...state,
            ui: {
              ...state.ui,
              activeDragId: dragId,
            },
          }))
        },
        setHighlightedCellId: (cellId) => {
          set((state) => ({
            ...state,
            ui: {
              ...state.ui,
              highlightedCellId: cellId,
            },
          }))
        },
      }),
      {
        name: PLANNER_STORAGE_KEY,
        storage,
        version: 1,
        partialize: (state) => ({
          planner: state.planner,
          ui: {
            dayLabel: state.ui.dayLabel,
          },
        }),
        merge: (persistedState, currentState) => {
          const typed = persistedState as Partial<PersistedPlannerState> | undefined

          return {
            ...currentState,
            planner: typed?.planner
              ? plannerStateSchema.parse(typed.planner)
              : currentState.planner,
            ui: {
              ...currentState.ui,
              dayLabel: typed?.ui?.dayLabel ?? currentState.ui.dayLabel,
            },
          }
        },
      },
    ),
  )
}

export const plannerStore = createPlannerStore()

export function usePlannerStore<T>(selector: (state: PlannerStoreState) => T) {
  return useStore(plannerStore, selector)
}
