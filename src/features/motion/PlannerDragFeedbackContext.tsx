import { createContext, useContext } from 'react'

import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type { PlannerAction, TimeBlockId } from '../../domain/schedule/types.ts'

export type PlannerMotionEventBase =
  | {
      type: 'assignSubstituteToRow'
      rowId: string
      substituteId: string
    }
  | {
      type: 'assignSubstituteToNeedCard'
      cardId: string
      substituteId: string
    }
  | {
      type: 'moveNeedCardToCell'
      cardId: string
      rowId: string
      timeBlockId: TimeBlockId
    }
  | {
      type: 'moveNeedCardToUnscheduled'
      cardId: string
    }
  | {
      type: 'clearRowResponsible'
      rowId: string
    }
  | {
      type: 'clearNeedCardExplicitAssignee'
      cardId: string
    }

export type PlannerMotionEvent = PlannerMotionEventBase & {
  key: number
}

export type RejectedDrag = {
  key: number
  item: PlannerDragItem
}

type PlannerDragFeedbackContextValue = {
  pushMotionEvent: (event: PlannerMotionEventBase) => void
}

const PlannerDragFeedbackContext = createContext<PlannerDragFeedbackContextValue>({
  pushMotionEvent: () => undefined,
})

export function actionToMotionEvent(
  action: PlannerAction,
): PlannerMotionEventBase | null {
  switch (action.type) {
    case 'assignSubstituteToRow':
    case 'assignSubstituteToNeedCard':
    case 'moveNeedCardToCell':
    case 'moveNeedCardToUnscheduled':
    case 'clearRowResponsible':
    case 'clearNeedCardExplicitAssignee':
      return action
    default:
      return null
  }
}

export const PlannerDragFeedbackProvider = PlannerDragFeedbackContext.Provider

export function usePlannerDragFeedback() {
  return useContext(PlannerDragFeedbackContext)
}
