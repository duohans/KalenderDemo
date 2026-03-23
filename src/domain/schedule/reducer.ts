import type { NeedCard, PlannerAction, PlannerState, TimeBlockId, WeekdayId } from './types.ts'

function findNeedCardAtCell(
  state: PlannerState,
  dayId: WeekdayId,
  rowId: string,
  timeBlockId: TimeBlockId,
  excludedCardId?: string,
) {
  return Object.values(state.needCards).find((card) => {
    if (
      card.id === excludedCardId ||
      card.placement !== 'scheduled' ||
      card.dayId !== dayId ||
      card.rowId !== rowId
    ) {
      return false
    }

    return card.timeBlockId === timeBlockId
  })
}

function revalidateNeedCardPlacement(
  state: PlannerState,
  cardId: string,
  timeBlockId: TimeBlockId,
) {
  const card = state.needCards[cardId]

  if (!card) {
    return state
  }

  const unscheduledCard: NeedCard = {
    ...card,
    allocatedTimeBlockId: timeBlockId,
    placement: 'unscheduled',
    rowId: null,
    timeBlockId: null,
  }

  if (card.placement !== 'scheduled' || !card.rowId || !state.rows[card.rowId]) {
    return {
      ...state,
      needCards: {
        ...state.needCards,
        [card.id]: unscheduledCard,
      },
    }
  }

  const occupyingCard = findNeedCardAtCell(
    state,
    card.dayId,
    card.rowId,
    timeBlockId,
    card.id,
  )
  const revalidatedCard: NeedCard = occupyingCard
    ? unscheduledCard
    : {
        ...card,
        allocatedTimeBlockId: timeBlockId,
        timeBlockId,
      }

  return {
    ...state,
    needCards: {
      ...state.needCards,
      [card.id]: revalidatedCard,
    },
  }
}

function getNextRowId(state: PlannerState) {
  let nextNumber = 1

  state.rowOrder.forEach((rowId) => {
    const match = rowId.match(/^row-(\d+)$/)

    if (!match) {
      return
    }

    nextNumber = Math.max(nextNumber, Number(match[1]) + 1)
  })

  let candidateId = `row-${nextNumber}`

  while (state.rows[candidateId]) {
    nextNumber += 1
    candidateId = `row-${nextNumber}`
  }

  return candidateId
}

function createRowRecord(state: PlannerState) {
  const id = getNextRowId(state)

  return {
    id,
    order: state.rowOrder.length,
    rowResponsibleId: null,
  }
}

function removeRowRecord(state: PlannerState, rowId: string): PlannerState {
  const row = state.rows[rowId]

  if (!row) {
    return state
  }

  const nextRowOrder = state.rowOrder.filter((currentRowId) => currentRowId !== rowId)
  const nextRows = nextRowOrder.reduce<PlannerState['rows']>((accumulator, currentRowId, index) => {
    const currentRow = state.rows[currentRowId]

    if (!currentRow) {
      return accumulator
    }

    accumulator[currentRowId] = {
      ...currentRow,
      order: index,
    }

    return accumulator
  }, {})

  const nextNeedCards = Object.values(state.needCards).reduce<PlannerState['needCards']>(
    (accumulator, card) => {
      accumulator[card.id] =
        card.placement === 'scheduled' && card.rowId === rowId
          ? {
              ...card,
              placement: 'unscheduled',
              rowId: null,
              timeBlockId: null,
            }
          : card

      return accumulator
    },
    {},
  )

  return {
    ...state,
    rows: nextRows,
    rowOrder: nextRowOrder,
    needCards: nextNeedCards,
  }
}

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'createRow': {
      if (action.cardId && !state.needCards[action.cardId]) {
        return state
      }

      const nextRow = createRowRecord(state)
      const nextState: PlannerState = {
        ...state,
        rows: {
          ...state.rows,
          [nextRow.id]: nextRow,
        },
        rowOrder: [...state.rowOrder, nextRow.id],
      }

      if (!action.cardId) {
        return nextState
      }

      const card = nextState.needCards[action.cardId]

      if (!card) {
        return nextState
      }

      return {
        ...nextState,
        needCards: {
          ...nextState.needCards,
          [card.id]: {
            ...card,
            placement: 'scheduled',
            rowId: nextRow.id,
            timeBlockId: card.allocatedTimeBlockId,
          },
        },
      }
    }

    case 'removeRow':
      return removeRowRecord(state, action.rowId)

    case 'updateNeedCardAllocatedTimeBlock': {
      const card = state.needCards[action.cardId]

      if (!card || card.allocatedTimeBlockId === action.timeBlockId) {
        return state
      }

      return revalidateNeedCardPlacement(state, card.id, action.timeBlockId)
    }

    case 'moveNeedCardToCell': {
      const card = state.needCards[action.cardId]
      const row = state.rows[action.rowId]

      if (!card || !row || action.timeBlockId !== card.allocatedTimeBlockId) {
        return state
      }

      if (
        card.placement === 'scheduled' &&
        card.rowId === action.rowId &&
        card.timeBlockId === action.timeBlockId
      ) {
        return state
      }

      const occupyingCard = findNeedCardAtCell(
        state,
        card.dayId,
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
