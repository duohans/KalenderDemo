import { TIME_BLOCK_ORDER } from './constants.ts'
import type {
  AssignmentMode,
  NeedCard,
  PlannerState,
  Row,
  ScheduledNeedCard,
  Substitute,
  Teacher,
  TimeBlockId,
} from './types.ts'

export type RowTitle = {
  full: string
  compact: string
}

export type RowDisplayModel = {
  row: Row
  title: RowTitle
  responsible: Substitute | null
  teachers: Teacher[]
  cardCount: number
  rowAccent: string
  secondaryLabel: string
  canClearResponsible: boolean
}

export type NeedCardDisplayModel = {
  card: NeedCard
  teacher: Teacher | null
  effectiveAssignee: Substitute | null
  assignmentMode: AssignmentMode
  hasConflict: boolean
  classLabel: string
  subjectLabel: string
  teacherAccent: string
  rowAccent: string
  assigneeAccent: string
  statusLabel: string
}

const NEUTRAL_ACCENT = '#d1d5db'

function isScheduledNeedCard(card: NeedCard): card is ScheduledNeedCard {
  return (
    card.placement === 'scheduled' &&
    typeof card.rowId === 'string' &&
    typeof card.timeBlockId === 'string'
  )
}

function toFirstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? ''
}

function possessiveFirstName(name: string) {
  const firstName = toFirstName(name)

  return firstName ? `${firstName}s` : ''
}

function formatTeacherTitle(names: string[]) {
  if (names.length === 0) {
    return 'Ledig rad'
  }

  if (names.length === 1) {
    return `${possessiveFirstName(names[0])} timer`
  }

  if (names.length === 2) {
    return `${possessiveFirstName(names[0])} & ${possessiveFirstName(names[1])} timer`
  }

  return 'Div timer'
}

function splitNeedCardTitle(title: string) {
  const trimmed = title.trim()
  const match = trimmed.match(/^(.*)\s+(\d{1,2}[A-Za-zÆØÅæøå])$/u)

  if (!match) {
    return {
      subjectLabel: trimmed,
      classLabel: trimmed,
    }
  }

  return {
    subjectLabel: match[1].trim(),
    classLabel: match[2].toUpperCase(),
  }
}

export function buildCellKey(rowId: string, timeBlockId: TimeBlockId) {
  return `${rowId}::${timeBlockId}`
}

export function selectTeacherById(state: PlannerState, teacherId: string | null): Teacher | null {
  if (!teacherId) {
    return null
  }

  return state.teachers[teacherId] ?? null
}

export function selectSubstituteById(
  state: PlannerState,
  substituteId: string | null,
): Substitute | null {
  if (!substituteId) {
    return null
  }

  return state.substitutes[substituteId] ?? null
}

export function selectScheduledNeedCards(state: PlannerState) {
  return state.needCardOrder
    .map((cardId) => state.needCards[cardId])
    .filter((card): card is NeedCard => Boolean(card))
    .filter(isScheduledNeedCard)
}

export function selectUnscheduledNeedCardIds(state: PlannerState) {
  return state.needCardOrder.filter(
    (cardId) => state.needCards[cardId]?.placement === 'unscheduled',
  )
}

export function selectCellNeedCardIdMap(state: PlannerState) {
  const map = new Map<string, string>()

  selectScheduledNeedCards(state).forEach((card) => {
    map.set(buildCellKey(card.rowId, card.timeBlockId), card.id)
  })

  return map
}

export function selectNeedCardIdAtCell(
  state: PlannerState,
  rowId: string,
  timeBlockId: TimeBlockId,
) {
  return selectCellNeedCardIdMap(state).get(buildCellKey(rowId, timeBlockId)) ?? null
}

export function selectRowCards(state: PlannerState, rowId: string) {
  return selectScheduledNeedCards(state)
    .filter((card) => card.rowId === rowId)
    .sort((left, right) => {
      const byTime =
        TIME_BLOCK_ORDER[left.timeBlockId] - TIME_BLOCK_ORDER[right.timeBlockId]

      return byTime !== 0 ? byTime : left.title.localeCompare(right.title, 'nb')
    })
}

export function selectRowTeacherIds(state: PlannerState, rowId: string) {
  const teacherIds = new Set(
    selectRowCards(state, rowId).map((card) => card.sourceTeacherId),
  )

  return state.teacherOrder.filter((teacherId) => teacherIds.has(teacherId))
}

export function selectRowTeachers(state: PlannerState, rowId: string) {
  return selectRowTeacherIds(state, rowId)
    .map((teacherId) => state.teachers[teacherId])
    .filter((teacher): teacher is Teacher => Boolean(teacher))
}

export function selectRowTitle(state: PlannerState, rowId: string): RowTitle {
  const row = state.rows[rowId]

  if (!row) {
    return { full: '', compact: '' }
  }

  const responsible = selectSubstituteById(state, row.rowResponsibleId)
  const teachers = selectRowTeachers(state, rowId)
  const teacherFirstNames = teachers.map((teacher) => toFirstName(teacher.name))

  if (responsible) {
    const responsibleFirstName = toFirstName(responsible.name)
    const title = `${possessiveFirstName(responsibleFirstName)} vikartimer`

    return {
      full: title,
      compact: title,
    }
  }

  const title = formatTeacherTitle(teacherFirstNames)

  return {
    full: title,
    compact: title,
  }
}

export function selectRowDisplayModel(state: PlannerState, rowId: string): RowDisplayModel | null {
  const row = state.rows[rowId]

  if (!row) {
    return null
  }

  const title = selectRowTitle(state, rowId)
  const responsible = selectSubstituteById(state, row.rowResponsibleId)
  const teachers = selectRowTeachers(state, rowId)
  const cardCount = selectRowCards(state, rowId).length

  return {
    row,
    title,
    responsible,
    teachers,
    cardCount,
    rowAccent: responsible?.accentColor ?? NEUTRAL_ACCENT,
    secondaryLabel:
      cardCount === 0
        ? 'Ingen timer'
        : `${cardCount} ${cardCount === 1 ? 'time' : 'timer'}`,
    canClearResponsible: Boolean(responsible),
  }
}

export function selectEffectiveAssigneeId(state: PlannerState, cardId: string) {
  const card = state.needCards[cardId]

  if (!card) {
    return null
  }

  if (card.explicitAssigneeId) {
    return card.explicitAssigneeId
  }

  if (card.placement === 'scheduled' && card.rowId) {
    return state.rows[card.rowId]?.rowResponsibleId ?? null
  }

  return null
}

export function selectEffectiveNeedCardAssignee(state: PlannerState, cardId: string) {
  return selectSubstituteById(state, selectEffectiveAssigneeId(state, cardId))
}

export function selectNeedCardAssignmentMode(
  state: PlannerState,
  cardId: string,
): AssignmentMode {
  const card = state.needCards[cardId]

  if (!card) {
    return 'unassigned'
  }

  if (card.explicitAssigneeId) {
    return 'explicit'
  }

  if (card.placement === 'scheduled' && card.rowId && state.rows[card.rowId]?.rowResponsibleId) {
    return 'inherited'
  }

  return 'unassigned'
}

export function selectNeedCardConflict(state: PlannerState, cardId: string) {
  const card = state.needCards[cardId]

  if (!card) {
    return true
  }

  if (card.placement === 'unscheduled') {
    return card.rowId !== null || card.timeBlockId !== null
  }

  if (!card.rowId || !card.timeBlockId) {
    return true
  }

  const row = state.rows[card.rowId]

  if (!row) {
    return true
  }

  const collisionCount = selectScheduledNeedCards(state).filter(
    (candidate) =>
      candidate.rowId === card.rowId && candidate.timeBlockId === card.timeBlockId,
  ).length

  return collisionCount > 1
}

export function selectNeedCardDisplayModel(
  state: PlannerState,
  cardId: string,
): NeedCardDisplayModel | null {
  const card = state.needCards[cardId]

  if (!card) {
    return null
  }

  const teacher = selectTeacherById(state, card.sourceTeacherId)
  const effectiveAssignee = selectEffectiveNeedCardAssignee(state, card.id)
  const assignmentMode = selectNeedCardAssignmentMode(state, card.id)
  const hasConflict = selectNeedCardConflict(state, card.id)
  const rowAccent =
    card.placement === 'scheduled' && card.rowId
      ? selectSubstituteById(state, state.rows[card.rowId]?.rowResponsibleId)?.accentColor ??
        NEUTRAL_ACCENT
      : NEUTRAL_ACCENT
  const { classLabel, subjectLabel } = splitNeedCardTitle(card.title)

  return {
    card,
    teacher,
    effectiveAssignee,
    assignmentMode,
    hasConflict,
    classLabel,
    subjectLabel,
    teacherAccent: teacher?.accentColor ?? card.accentColor,
    rowAccent,
    assigneeAccent: effectiveAssignee?.accentColor ?? rowAccent,
    statusLabel: card.placement === 'scheduled' ? 'Planlagt' : 'Uplanlagt',
  }
}

export function selectCanDropNeedCardInCell(
  state: PlannerState,
  cardId: string,
  rowId: string,
  timeBlockId: TimeBlockId,
) {
  const card = state.needCards[cardId]
  const row = state.rows[rowId]

  if (!card || !row) {
    return false
  }

  return selectScheduledNeedCards(state).every((candidate) => {
    if (candidate.id === card.id) {
      return true
    }

    return !(
      candidate.rowId === rowId && candidate.timeBlockId === timeBlockId
    )
  })
}

export function selectRow(state: PlannerState, rowId: string): Row | null {
  return state.rows[rowId] ?? null
}

export function selectPlannerSummary(state: PlannerState) {
  const total = state.needCardOrder.length
  const scheduled = selectScheduledNeedCards(state).length
  const explicitlyAssigned = state.needCardOrder.filter(
    (cardId) => selectNeedCardAssignmentMode(state, cardId) === 'explicit',
  ).length
  const inherited = state.needCardOrder.filter(
    (cardId) => selectNeedCardAssignmentMode(state, cardId) === 'inherited',
  ).length

  return {
    total,
    scheduled,
    unscheduled: total - scheduled,
    explicitlyAssigned,
    inherited,
  }
}
