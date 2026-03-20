import type { PlannerAction, PlannerState } from './types.ts'

function findNeedCardAtCell(
  state: PlannerState,
  rowId: string,
  timeBlockId: string,
  excludedCardId?: string,
) {
  return Object.values(state.needCards).find((card) => {
    if (
      card.id === excludedCardId ||
      card.placement !== 'scheduled' ||
      card.rowId !== rowId
    ) {
      return false
    }

    return card.timeBlockId === timeBlockId
  })
}

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'moveNeedCardToCell': {
      const card = state.needCards[action.cardId]
      const row = state.rows[action.rowId]

      if (!card || !row) {
        return state
      }

      const occupyingCard = findNeedCardAtCell(
        state,
        action.rowId,
        action.timeBlockId,
        card.id,
      )

      if (occupyingCard) {
        return state
      }

      return {
        ...state,
        needCards: {
          ...state.needCards,
          [card.id]: {
            ...card,
            placement: 'scheduled',
            rowId: action.rowId,
            timeBlockId: action.timeBlockId,
          },
        },
      }
    }

    case 'moveNeedCardToUnscheduled': {
      const card = state.needCards[action.cardId]

      if (!card) {
        return state
      }

      return {
        ...state,
        needCards: {
          ...state.needCards,
          [card.id]: {
            ...card,
            placement: 'unscheduled',
            rowId: null,
            timeBlockId: null,
          },
        },
      }
    }

    case 'assignSubstituteToRow': {
      const row = state.rows[action.rowId]
      const substitute = state.substitutes[action.substituteId]

      if (!row || !substitute) {
        return state
      }

      return {
        ...state,
        rows: {
          ...state.rows,
          [row.id]: {
            ...row,
            rowResponsibleId: substitute.id,
          },
        },
      }
    }

    case 'clearRowResponsible': {
      const row = state.rows[action.rowId]

      if (!row || row.rowResponsibleId === null) {
        return state
      }

      return {
        ...state,
        rows: {
          ...state.rows,
          [row.id]: {
            ...row,
            rowResponsibleId: null,
          },
        },
      }
    }

    case 'assignSubstituteToNeedCard': {
      const card = state.needCards[action.cardId]
      const substitute = state.substitutes[action.substituteId]

      if (!card || !substitute) {
        return state
      }

      return {
        ...state,
        needCards: {
          ...state.needCards,
          [card.id]: {
            ...card,
            explicitAssigneeId: substitute.id,
          },
        },
      }
    }

    case 'clearNeedCardExplicitAssignee': {
      const card = state.needCards[action.cardId]

      if (!card || card.explicitAssigneeId === null) {
        return state
      }

      return {
        ...state,
        needCards: {
          ...state.needCards,
          [card.id]: {
            ...card,
            explicitAssigneeId: null,
          },
        },
      }
    }

    default:
      return state
  }
}
