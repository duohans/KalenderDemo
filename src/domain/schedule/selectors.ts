import { TIME_BLOCK_ORDER, TIME_BLOCKS } from './constants.ts'
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
  statusAssignee: Substitute | null
  assignmentMode: AssignmentMode
  statusTone: AssignmentMode | 'conflict'
  hasConflict: boolean
  classLabel: string
  subjectLabel: string
  teacherAccent: string
  rowAccent: string
  assigneeAccent: string
  statusLabel: string
  statusDetail: string
}

export type PlannerSummaryItem = {
  id: string
  title: string
  timeLabel: string
  rowTitle: string
  sourceTeacherName: string
}

export type PlannerSummaryViewModel = {
  total: number
  scheduled: number
  unscheduled: number
  explicitlyAssigned: number
  inherited: number
  coveredCards: number
  coverageRate: number
  unassignedCards: number
  explicitOverrides: number
  rowAssignments: number
  substituteCount: number
  unassignedItems: PlannerSummaryItem[]
}

export type SubstituteWorkload = {
  substitute: Substitute
  rowAssignments: number
  explicitOverrides: number
  effectiveCoverageCount: number
}

const NEUTRAL_ACCENT = '#d1d5db'
const UNSCHEDULED_ROW_TITLE = 'Uplanlagt'
const UNKNOWN_ROW_TITLE = 'Ukjent rad'
const UNKNOWN_TEACHER_NAME = 'Ukjent lærer'
const NO_TIME_LABEL = 'Uten tidspunkt'
const TIME_BLOCK_LABELS = TIME_BLOCKS.reduce<Record<TimeBlockId, string>>(
  (accumulator, block) => {
    accumulator[block.id] = block.label
    return accumulator
  },
  {
    '08:30': '08:30-09:30',
    '09:30': '09:30-10:30',
    '10:30': '10:30-11:30',
    '11:30': '11:30-12:30',
    '12:30': '12:30-13:30',
    '13:30': '13:30-14:30',
  },
)

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
const plannerSummaryCache = new WeakMap<PlannerState, PlannerSummaryViewModel>()
const substituteWorkloadCache = new WeakMap<PlannerState, SubstituteWorkload[]>()

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

function getTimeBlockLabel(timeBlockId: TimeBlockId | null) {
  return timeBlockId ? TIME_BLOCK_LABELS[timeBlockId] : NO_TIME_LABEL
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
  const statusTone: NeedCardDisplayModel['statusTone'] = hasConflict
    ? 'conflict'
    : assignmentMode
  const statusAssignee = hasConflict || assignmentMode === 'unassigned' ? null : effectiveAssignee

  let statusLabel = 'Udekket'
  let statusDetail = 'Ingen vikar'

  if (statusTone === 'conflict') {
    statusLabel = 'Konflikt'
    statusDetail = 'Flere kort i samme rute'
  } else if (statusTone === 'explicit') {
    statusLabel = 'Direkte'
    statusDetail = effectiveAssignee?.name ?? 'Vikar valgt'
  } else if (statusTone === 'inherited') {
    statusLabel = 'Via rad'
    statusDetail = effectiveAssignee?.name ?? 'Arver fra rad'
  }

  const nextDisplayModel = {
    card,
    teacher,
    effectiveAssignee,
    statusAssignee,
    assignmentMode,
    statusTone,
    hasConflict,
    classLabel,
    subjectLabel,
    teacherAccent: teacher?.accentColor ?? card.accentColor,
    rowAccent,
    assigneeAccent: effectiveAssignee?.accentColor ?? rowAccent,
    statusLabel,
    statusDetail,
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

export function selectPlannerSummary(state: PlannerState): PlannerSummaryViewModel {
  const cached = plannerSummaryCache.get(state)

  if (cached) {
    return cached
  }

  const total = state.needCardOrder.length
  const scheduled = selectScheduledNeedCards(state).length
  const explicitlyAssigned = state.needCardOrder.filter(
    (cardId) => selectNeedCardAssignmentMode(state, cardId) === 'explicit',
  ).length
  const inherited = state.needCardOrder.filter(
    (cardId) => selectNeedCardAssignmentMode(state, cardId) === 'inherited',
  ).length
  const rowAssignments = state.rowOrder.filter(
    (rowId) => state.rows[rowId]?.rowResponsibleId !== null,
  ).length
  const coveredCards = state.needCardOrder.filter(
    (cardId) => selectEffectiveAssigneeId(state, cardId) !== null,
  ).length
  const unassignedItems = state.needCardOrder
    .map((cardId) => {
      const card = state.needCards[cardId]

      if (!card || selectEffectiveAssigneeId(state, cardId) !== null) {
        return null
      }

      const teacher = selectTeacherById(state, card.sourceTeacherId)
      const rowTitle =
        card.placement === 'scheduled' && card.rowId
          ? selectRowTitle(state, card.rowId).compact || UNKNOWN_ROW_TITLE
          : UNSCHEDULED_ROW_TITLE

      return {
        item: {
          id: card.id,
          title: card.title,
          timeLabel: getTimeBlockLabel(card.timeBlockId),
          rowTitle,
          sourceTeacherName: teacher?.name ?? UNKNOWN_TEACHER_NAME,
        },
        sortOrder: card.timeBlockId ? TIME_BLOCK_ORDER[card.timeBlockId] : Number.MAX_SAFE_INTEGER,
      }
    })
    .filter((entry): entry is { item: PlannerSummaryItem; sortOrder: number } => entry !== null)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      const rowCompare = left.item.rowTitle.localeCompare(right.item.rowTitle, 'nb')

      if (rowCompare !== 0) {
        return rowCompare
      }

      return left.item.title.localeCompare(right.item.title, 'nb')
    })
    .map((entry) => entry.item)
  const unassignedCards = unassignedItems.length

  const nextSummary = {
    total,
    scheduled,
    unscheduled: total - scheduled,
    explicitlyAssigned,
    inherited,
    coveredCards,
    coverageRate: total === 0 ? 0 : coveredCards / total,
    unassignedCards,
    explicitOverrides: explicitlyAssigned,
    rowAssignments,
    substituteCount: state.substituteOrder.length,
    unassignedItems,
  }

  plannerSummaryCache.set(state, nextSummary)
  return nextSummary
}

export function selectSubstituteWorkloads(state: PlannerState): SubstituteWorkload[] {
  const cached = substituteWorkloadCache.get(state)

  if (cached) {
    return cached
  }

  const workloads = state.substituteOrder
    .map((substituteId) => {
      const substitute = state.substitutes[substituteId]
      const rowAssignments = state.rowOrder.filter(
        (rowId) => state.rows[rowId]?.rowResponsibleId === substituteId,
      ).length
      const explicitOverrides = state.needCardOrder.filter(
        (cardId) => state.needCards[cardId]?.explicitAssigneeId === substituteId,
      ).length
      const effectiveCoverageCount = state.needCardOrder.filter(
        (cardId) => selectEffectiveAssigneeId(state, cardId) === substituteId,
      ).length

      return {
        substitute,
        rowAssignments,
        explicitOverrides,
        effectiveCoverageCount,
      }
    })
    .filter((workload): workload is SubstituteWorkload => Boolean(workload.substitute))
    .sort((left, right) => {
      if (right.effectiveCoverageCount !== left.effectiveCoverageCount) {
        return right.effectiveCoverageCount - left.effectiveCoverageCount
      }

      return left.substitute.name.localeCompare(right.substitute.name, 'nb')
    })

  substituteWorkloadCache.set(state, workloads)
  return workloads
}
