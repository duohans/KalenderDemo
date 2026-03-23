import {
  pointerWithin,
  rectIntersection,
  type Active,
  type CollisionDetection,
  type Over,
} from '@dnd-kit/core'

import {
  selectCanDropNeedCardInCell,
  selectCanDropNeedCardInRow,
} from './selectors.ts'
import type { NeedCard, PlannerAction, PlannerState, TimeBlockId } from './types.ts'

export type PlannerNeedCardDragItem = {
  type: 'need-card'
  cardId: string
  from:
    | { type: 'unscheduled-panel' }
    | { type: 'calendar-cell'; rowId: string; timeBlockId: TimeBlockId }
}

export type PlannerSubstituteDragItem = {
  type: 'substitute'
  substituteId: string
  from: { type: 'substitute-pool' }
}

export type PlannerDragItem = PlannerNeedCardDragItem | PlannerSubstituteDragItem

export type PlannerDropTarget =
  | { type: 'unscheduled-panel' }
  | { type: 'calendar-cell'; rowId: string; timeBlockId: TimeBlockId }
  | { type: 'row-header'; rowId: string }
  | { type: 'new-row-placeholder' }
  | { type: 'need-card'; cardId: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function createNeedCardDragItem(card: NeedCard): PlannerNeedCardDragItem {
  if (card.placement === 'unscheduled' || !card.rowId || !card.timeBlockId) {
    return {
      type: 'need-card',
      cardId: card.id,
      from: { type: 'unscheduled-panel' },
    }
  }

  return {
    type: 'need-card',
    cardId: card.id,
    from: {
      type: 'calendar-cell',
      rowId: card.rowId,
      timeBlockId: card.timeBlockId,
    },
  }
}

export function isPlannerDragItem(value: unknown): value is PlannerDragItem {
  if (!isObject(value) || typeof value.type !== 'string') {
    return false
  }

  if (value.type === 'need-card') {
    return typeof value.cardId === 'string'
  }

  if (value.type === 'substitute') {
    return typeof value.substituteId === 'string'
  }

  return false
}

export function isPlannerDropTarget(value: unknown): value is PlannerDropTarget {
  if (!isObject(value) || typeof value.type !== 'string') {
    return false
  }

  switch (value.type) {
    case 'unscheduled-panel':
      return true
    case 'calendar-cell':
      return typeof value.rowId === 'string' && typeof value.timeBlockId === 'string'
    case 'row-header':
      return typeof value.rowId === 'string'
    case 'new-row-placeholder':
      return true
    case 'need-card':
      return typeof value.cardId === 'string'
    default:
      return false
  }
}

export function getPlannerDragItem(active: Active | null) {
  const current = active?.data.current
  return isPlannerDragItem(current) ? current : null
}

export function getPlannerDropTarget(over: Over | null) {
  const current = over?.data.current
  return isPlannerDropTarget(current) ? current : null
}

export const plannerCollisionDetection: CollisionDetection = (args) => {
  const activeItem = getPlannerDragItem(args.active)

  if (!activeItem) {
    return rectIntersection(args)
  }

  const droppableContainers = args.droppableContainers.filter((container) => {
    const current = container.data.current

    if (!isPlannerDropTarget(current)) {
      return false
    }

    if (activeItem.type === 'need-card') {
      return (
        current.type === 'unscheduled-panel' ||
        current.type === 'calendar-cell' ||
        current.type === 'row-header' ||
        current.type === 'new-row-placeholder'
      )
    }

    return current.type === 'row-header' || current.type === 'need-card'
  })

  const nextArgs = { ...args, droppableContainers }
  const pointerCollisions = pointerWithin(nextArgs)

  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(nextArgs)
}

export function canDropOnTarget(
  state: PlannerState,
  activeItem: PlannerDragItem,
  target: PlannerDropTarget,
) {
  if (activeItem.type === 'need-card') {
    if (target.type === 'unscheduled-panel') {
      return Boolean(state.needCards[activeItem.cardId])
    }

    if (target.type === 'calendar-cell') {
      return selectCanDropNeedCardInCell(
        state,
        activeItem.cardId,
        target.rowId,
        target.timeBlockId,
      )
    }

    if (target.type === 'row-header') {
      return selectCanDropNeedCardInRow(state, activeItem.cardId, target.rowId)
    }

    if (target.type === 'new-row-placeholder') {
      return Boolean(state.needCards[activeItem.cardId])
    }

    return false
  }

  if (target.type === 'row-header') {
    return Boolean(
      state.rows[target.rowId] && state.substitutes[activeItem.substituteId],
    )
  }

  if (target.type === 'need-card') {
    return Boolean(
      state.needCards[target.cardId] && state.substitutes[activeItem.substituteId],
    )
  }

  return false
}

export function resolveDrop(
  state: PlannerState,
  activeItem: PlannerDragItem | null,
  target: PlannerDropTarget | null,
): PlannerAction | null {
  if (!activeItem || !target || !canDropOnTarget(state, activeItem, target)) {
    return null
  }

  if (activeItem.type === 'need-card') {
    if (target.type === 'unscheduled-panel') {
      return {
        type: 'moveNeedCardToUnscheduled',
        cardId: activeItem.cardId,
      }
    }

    if (target.type === 'calendar-cell') {
      return {
        type: 'moveNeedCardToCell',
        cardId: activeItem.cardId,
        rowId: target.rowId,
        timeBlockId: target.timeBlockId,
      }
    }

    if (target.type === 'row-header') {
      const card = state.needCards[activeItem.cardId]

      if (!card) {
        return null
      }

      return {
        type: 'moveNeedCardToCell',
        cardId: activeItem.cardId,
        rowId: target.rowId,
        timeBlockId: card.allocatedTimeBlockId,
      }
    }

    if (target.type === 'new-row-placeholder') {
      return {
        type: 'createRow',
        cardId: activeItem.cardId,
      }
    }

    return null
  }

  if (target.type === 'row-header') {
    return {
      type: 'assignSubstituteToRow',
      rowId: target.rowId,
      substituteId: activeItem.substituteId,
    }
  }

  if (target.type === 'need-card') {
    return {
      type: 'assignSubstituteToNeedCard',
      cardId: target.cardId,
      substituteId: activeItem.substituteId,
    }
  }

  return null
}
