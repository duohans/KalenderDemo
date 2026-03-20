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

type ScheduledIndex = {
  cards: ScheduledNeedCard[]
  cellNeedCardIdMap: Map<string, string>
  cellCollisionCountMap: Map<string, number>
  rowCardsMap: Map<string, ScheduledNeedCard[]>
}

const scheduledIndexCache = new WeakMap<PlannerState, ScheduledIndex>()
const rowTeacherIdsCache = new WeakMap<PlannerState, Map<string, string[]>>()
const rowTeachersCache = new WeakMap<PlannerState, Map<string, Teacher[]>>()
const rowTitleCache = new WeakMap<PlannerState, Map<string, RowTitle>>()
const rowDisplayModelCache = new WeakMap<PlannerState, Map<string, RowDisplayModel | null>>()
const needCardDisplayModelCache = new WeakMap<
  PlannerState,
  Map<string, NeedCardDisplayModel | null>
>()

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

function getStateScopedMap<T>(cache: WeakMap<PlannerState, Map<string, T>>, state: PlannerState) {
  let scopedMap = cache.get(state)

  if (!scopedMap) {
    scopedMap = new Map<string, T>()
    cache.set(state, scopedMap)
  }

  return scopedMap
}

function getScheduledIndex(state: PlannerState): ScheduledIndex {
  const cached = scheduledIndexCache.get(state)

  if (cached) {
    return cached
  }

  const cards: ScheduledNeedCard[] = []
  const cellNeedCardIdMap = new Map<string, string>()
  const cellCollisionCountMap = new Map<string, number>()
  const rowCardsMap = new Map<string, ScheduledNeedCard[]>()

  state.needCardOrder.forEach((cardId) => {
    const card = state.needCards[cardId]

    if (!card || !isScheduledNeedCard(card)) {
      return
    }

    cards.push(card)

    const cellKey = buildCellKey(card.rowId, card.timeBlockId)
    cellNeedCardIdMap.set(cellKey, card.id)
    cellCollisionCountMap.set(cellKey, (cellCollisionCountMap.get(cellKey) ?? 0) + 1)

    const rowCards = rowCardsMap.get(card.rowId) ?? []
    rowCards.push(card)
    rowCardsMap.set(card.rowId, rowCards)
  })

  rowCardsMap.forEach((rowCards) => {
    rowCards.sort((left, right) => {
      const byTime =
        TIME_BLOCK_ORDER[left.timeBlockId] - TIME_BLOCK_ORDER[right.timeBlockId]

      return byTime !== 0 ? byTime : left.title.localeCompare(right.title, 'nb')
    })
  })

  const nextIndex = {
    cards,
    cellNeedCardIdMap,
    cellCollisionCountMap,
    rowCardsMap,
  }

  scheduledIndexCache.set(state, nextIndex)
  return nextIndex
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
  return getScheduledIndex(state).cards
}

export function selectUnscheduledNeedCardIds(state: PlannerState) {
  return state.needCardOrder.filter(
    (cardId) => state.needCards[cardId]?.placement === 'unscheduled',
  )
}

export function selectCellNeedCardIdMap(state: PlannerState) {
  return getScheduledIndex(state).cellNeedCardIdMap
}

export function selectNeedCardIdAtCell(
  state: PlannerState,
  rowId: string,
  timeBlockId: TimeBlockId,
) {
  return getScheduledIndex(state).cellNeedCardIdMap.get(buildCellKey(rowId, timeBlockId)) ?? null
}

export function selectRowCards(state: PlannerState, rowId: string) {
  return getScheduledIndex(state).rowCardsMap.get(rowId) ?? []
}

export function selectRowTeacherIds(state: PlannerState, rowId: string) {
  const cached = getStateScopedMap(rowTeacherIdsCache, state).get(rowId)

  if (cached) {
    return cached
  }

  const teacherIds = new Set(selectRowCards(state, rowId).map((card) => card.sourceTeacherId))
  const nextTeacherIds = state.teacherOrder.filter((teacherId) => teacherIds.has(teacherId))

  getStateScopedMap(rowTeacherIdsCache, state).set(rowId, nextTeacherIds)
  return nextTeacherIds
}

export function selectRowTeachers(state: PlannerState, rowId: string) {
  const cached = getStateScopedMap(rowTeachersCache, state).get(rowId)

  if (cached) {
    return cached
  }

  const nextTeachers = selectRowTeacherIds(state, rowId)
    .map((teacherId) => state.teachers[teacherId])
    .filter((teacher): teacher is Teacher => Boolean(teacher))

  getStateScopedMap(rowTeachersCache, state).set(rowId, nextTeachers)
  return nextTeachers
}

export function selectRowTitle(state: PlannerState, rowId: string): RowTitle {
  const cached = getStateScopedMap(rowTitleCache, state).get(rowId)

  if (cached) {
    return cached
  }

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

    const nextTitle = {
      full: title,
      compact: title,
    }

    getStateScopedMap(rowTitleCache, state).set(rowId, nextTitle)
    return nextTitle
  }

  const title = formatTeacherTitle(teacherFirstNames)

  const nextTitle = {
    full: title,
    compact: title,
  }

  getStateScopedMap(rowTitleCache, state).set(rowId, nextTitle)
  return nextTitle
}

export function selectRowDisplayModel(state: PlannerState, rowId: string): RowDisplayModel | null {
  const cached = getStateScopedMap(rowDisplayModelCache, state).get(rowId)

  if (cached !== undefined) {
    return cached
  }

  const row = state.rows[rowId]

  if (!row) {
    getStateScopedMap(rowDisplayModelCache, state).set(rowId, null)
    return null
  }

  const title = selectRowTitle(state, rowId)
  const responsible = selectSubstituteById(state, row.rowResponsibleId)
  const teachers = selectRowTeachers(state, rowId)
  const cardCount = selectRowCards(state, rowId).length

  const nextDisplayModel = {
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

  getStateScopedMap(rowDisplayModelCache, state).set(rowId, nextDisplayModel)
  return nextDisplayModel
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

  const collisionCount =
    getScheduledIndex(state).cellCollisionCountMap.get(
      buildCellKey(card.rowId, card.timeBlockId),
    ) ?? 0

  return collisionCount > 1
}

export function selectNeedCardDisplayModel(
  state: PlannerState,
  cardId: string,
): NeedCardDisplayModel | null {
  const cached = getStateScopedMap(needCardDisplayModelCache, state).get(cardId)

  if (cached !== undefined) {
    return cached
  }

  const card = state.needCards[cardId]

  if (!card) {
    getStateScopedMap(needCardDisplayModelCache, state).set(cardId, null)
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

  const nextDisplayModel = {
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

  getStateScopedMap(needCardDisplayModelCache, state).set(cardId, nextDisplayModel)
  return nextDisplayModel
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

  const occupyingCardId = selectNeedCardIdAtCell(state, rowId, timeBlockId)

  return occupyingCardId === null || occupyingCardId === card.id
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
