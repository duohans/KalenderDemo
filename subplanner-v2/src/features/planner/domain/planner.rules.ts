import type { NeedCard, PlannerState, Row, Teacher, TimeBlock } from '@/features/planner/domain/planner.types'

export type AssignmentMode = 'explicit' | 'row' | 'unassigned'

export type MoveValidationFailureReason =
  | 'missing-card'
  | 'missing-row'
  | 'missing-time-block'
  | 'occupied-cell'

export type MoveValidationResult =
  | { ok: true }
  | { ok: false; reason: MoveValidationFailureReason }

export function sortRows(rows: Row[]) {
  return [...rows].sort((left, right) => left.order - right.order)
}

export function sortTimeBlocks(timeBlocks: TimeBlock[]) {
  return [...timeBlocks].sort((left, right) => left.order - right.order)
}

export function getRowById(planner: PlannerState, rowId: string) {
  return planner.rows.find((row) => row.id === rowId) ?? null
}

export function getNeedCardById(planner: PlannerState, cardId: string) {
  return planner.needCards.find((card) => card.id === cardId) ?? null
}

export function getTimeBlockById(planner: PlannerState, timeBlockId: string) {
  return planner.timeBlocks.find((timeBlock) => timeBlock.id === timeBlockId) ?? null
}

export function getNeedCardsForRow(planner: PlannerState, rowId: string) {
  const timeBlockOrder = new Map(
    planner.timeBlocks.map((timeBlock) => [timeBlock.id, timeBlock.order]),
  )

  return planner.needCards
    .filter((card) => card.rowId === rowId)
    .sort(
      (left, right) =>
        (timeBlockOrder.get(left.timeBlockId) ?? 0) - (timeBlockOrder.get(right.timeBlockId) ?? 0),
    )
}

export function getSourceTeachersForRow(planner: PlannerState, rowId: string) {
  const teacherById = new Map(planner.teachers.map((teacher) => [teacher.id, teacher]))
  const uniqueTeachers = new Map<string, Teacher>()

  getNeedCardsForRow(planner, rowId).forEach((card) => {
    const teacher = teacherById.get(card.sourceTeacherId)

    if (teacher) {
      uniqueTeachers.set(teacher.id, teacher)
    }
  })

  return [...uniqueTeachers.values()].sort((left, right) =>
    left.firstName.localeCompare(right.firstName, 'nb'),
  )
}

export function getEffectiveAssigneeId(card: NeedCard, row: Row) {
  return card.explicitAssigneeId ?? row.rowResponsibleId ?? null
}

export function getAssignmentMode(card: NeedCard, row: Row): AssignmentMode {
  if (card.explicitAssigneeId) {
    return 'explicit'
  }

  if (row.rowResponsibleId) {
    return 'row'
  }

  return 'unassigned'
}

export function getNeedCardAtCell(
  planner: PlannerState,
  rowId: string,
  timeBlockId: string,
  ignoreCardId?: string,
) {
  return (
    planner.needCards.find(
      (card) =>
        card.rowId === rowId &&
        card.timeBlockId === timeBlockId &&
        card.id !== ignoreCardId,
    ) ?? null
  )
}

export function isCellOccupied(
  planner: PlannerState,
  rowId: string,
  timeBlockId: string,
  ignoreCardId?: string,
) {
  return getNeedCardAtCell(planner, rowId, timeBlockId, ignoreCardId) !== null
}

export function validateNeedCardMove(
  planner: PlannerState,
  input: { cardId: string; rowId: string; timeBlockId: string },
): MoveValidationResult {
  const card = getNeedCardById(planner, input.cardId)

  if (!card) {
    return { ok: false, reason: 'missing-card' }
  }

  if (!getRowById(planner, input.rowId)) {
    return { ok: false, reason: 'missing-row' }
  }

  if (!getTimeBlockById(planner, input.timeBlockId)) {
    return { ok: false, reason: 'missing-time-block' }
  }

  if (isCellOccupied(planner, input.rowId, input.timeBlockId, card.id)) {
    return { ok: false, reason: 'occupied-cell' }
  }

  return { ok: true }
}

export function deriveRowTitle(planner: PlannerState, row: Row) {
  const rowResponsible = row.rowResponsibleId
    ? planner.substitutes.find((substitute) => substitute.id === row.rowResponsibleId) ?? null
    : null

  if (rowResponsible) {
    return `${rowResponsible.firstName}s vikartimer`
  }

  const sourceTeachers = getSourceTeachersForRow(planner, row.id)

  if (sourceTeachers.length === 1) {
    return `${sourceTeachers[0].firstName}s timer`
  }

  if (sourceTeachers.length === 2) {
    return `${sourceTeachers[0].firstName}s & ${sourceTeachers[1].firstName}s timer`
  }

  if (sourceTeachers.length >= 3) {
    return 'Div timer'
  }

  return 'Ledig rad'
}
