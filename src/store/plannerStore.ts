import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { plannerReducer } from '../domain/schedule/reducer.ts'
import type { PlannerAction, PlannerState } from '../domain/schedule/types.ts'
import type { PlannerSelection } from '../features/layout/plannerSelection.ts'
import { loadPlannerState, savePlannerState } from '../services/storage.ts'

type PlannerHistoryState = {
  past: PlannerState[]
  future: PlannerState[]
}

type PlannerStoreState = {
  state: PlannerState
  selection: PlannerSelection | null
  history: PlannerHistoryState
  canUndo: boolean
  canRedo: boolean
  dispatch: (action: PlannerAction) => void
  openSelection: (selection: PlannerSelection) => void
  closeSelection: () => void
  undo: () => void
  redo: () => void
}

const initialPlannerState = loadPlannerState()

function toHistoryState(history: PlannerHistoryState) {
  return {
    history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}

function createStoreSnapshot(state: PlannerState): Pick<
  PlannerStoreState,
  'state' | 'selection' | 'history' | 'canUndo' | 'canRedo'
> {
  return {
    state,
    selection: null,
    ...toHistoryState({ past: [], future: [] }),
  }
}

export const usePlannerStore = create<PlannerStoreState>((set, get) => ({
  ...createStoreSnapshot(initialPlannerState),
  dispatch: (action) => {
    const current = get()
    const nextState = plannerReducer(current.state, action)

    if (nextState === current.state) {
      return
    }

    const history = {
      past: [...current.history.past, current.state],
      future: [],
    }

    savePlannerState(nextState)
    set({
      state: nextState,
      ...toHistoryState(history),
    })
  },
  openSelection: (selection) => {
    set({ selection })
  },
  closeSelection: () => {
    set({ selection: null })
  },
  undo: () => {
    const current = get()

    if (current.history.past.length === 0) {
      return
    }

    const nextState = current.history.past[current.history.past.length - 1]
    const history = {
      past: current.history.past.slice(0, -1),
      future: [current.state, ...current.history.future],
    }

    savePlannerState(nextState)
    set({
      state: nextState,
      ...toHistoryState(history),
    })
  },
  redo: () => {
    const current = get()

    if (current.history.future.length === 0) {
      return
    }

    const [nextState, ...remainingFuture] = current.history.future
    const history = {
      past: [...current.history.past, current.state],
      future: remainingFuture,
    }

    savePlannerState(nextState)
    set({
      state: nextState,
      ...toHistoryState(history),
    })
  },
}))

export function usePlannerState<T>(selector: (state: PlannerState) => T) {
  return usePlannerStore((store) => selector(store.state))
}

export function usePlannerDispatch() {
  return usePlannerStore((store) => store.dispatch)
}

export function usePlannerSelection() {
  return usePlannerStore((store) => store.selection)
}

export function usePlannerSelectionActions() {
  const openSelectionAction = usePlannerStore((store) => store.openSelection)
  const closeSelectionAction = usePlannerStore((store) => store.closeSelection)

  return {
    closeSelection: closeSelectionAction,
    openSelection: (selection: PlannerSelection) => openSelectionAction(selection),
  }
}

export function usePlannerHistory() {
  return usePlannerStore(
    useShallow((store) => ({
      undo: store.undo,
      redo: store.redo,
      canUndo: store.canUndo,
      canRedo: store.canRedo,
    })),
  )
}

export const openSelection = (selection: PlannerSelection) => {
  usePlannerStore.getState().openSelection(selection)
}

export const closeSelection = () => {
  usePlannerStore.getState().closeSelection()
}

export const resetPlannerStore = (state = loadPlannerState()) => {
  usePlannerStore.setState(createStoreSnapshot(state))
}
