import type { PlannerAction, PlannerState } from '../../domain/schedule/types.ts'
import {
  usePlannerDispatch,
  usePlannerHistory,
  usePlannerSelection,
  usePlannerSelectionActions,
  usePlannerState,
} from '../../store/plannerStore.ts'

export function useSchedule() {
  const state = usePlannerState((plannerState) => plannerState)
  const dispatch = usePlannerDispatch()

  return { state, dispatch }
}

export function useScheduleState<T>(selector: (state: PlannerState) => T) {
  return usePlannerState(selector)
}

export function useScheduleDispatch() {
  return usePlannerDispatch()
}

export function useScheduleSelection() {
  return usePlannerSelection()
}

export function useScheduleSelectionActions() {
  return usePlannerSelectionActions()
}

export function useScheduleHistoryActions() {
  return usePlannerHistory()
}

export function useScheduleDispatchAction() {
  const dispatch = usePlannerDispatch()

  return (action: PlannerAction) => dispatch(action)
}
