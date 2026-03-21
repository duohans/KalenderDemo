import {
  deriveRowTitle,
  getAssignmentMode,
  getEffectiveAssigneeId,
  getNeedCardAtCell,
  getSourceTeachersForRow,
  sortRows,
  sortTimeBlocks,
} from '@/features/planner/domain/planner.rules'
import type {
  NeedCard,
  PlannerState,
  Row,
  Substitute,
  Teacher,
  TimeBlock,
} from '@/features/planner/domain/planner.types'

export interface PlannerCardViewModel {
  card: NeedCard
  sourceTeacher: Teacher | null
  effectiveAssignee: Substitute | null
  explicitAssignee: Substitute | null
  rowResponsible: Substitute | null
  assignmentMode: 'explicit' | 'row' | 'unassigned'
  showTeacherChip: boolean
}

export interface PlannerCellViewModel {
  id: string
  rowId: string
  timeBlock: TimeBlock
  card: PlannerCardViewModel | null
}

export interface PlannerRowViewModel {
  row: Row
  title: string
  rowResponsible: Substitute | null
  sourceTeachers: Teacher[]
  cells: PlannerCellViewModel[]
}

export interface PlannerBoardViewModel {
  timeBlocks: TimeBlock[]
  rows: PlannerRowViewModel[]
}

export interface PlannerSummaryItem {
  id: string
  title: string
  timeLabel: string
  rowTitle: string
  sourceTeacherName: string
}

export interface PlannerSummaryViewModel {
  totalCards: number
  coveredCards: number
  coverageRate: number
  unassignedCards: number
  explicitOverrides: number
  rowAssignments: number
  unassignedItems: PlannerSummaryItem[]
}

export interface SubstituteWorkload {
  substitute: Substitute
  rowAssignments: number
  explicitOverrides: number
  effectiveCoverageCount: number
}

export function selectPlannerBoard(planner: PlannerState): PlannerBoardViewModel {
  const teacherById = new Map(planner.teachers.map((teacher) => [teacher.id, teacher]))
  const substituteById = new Map(planner.substitutes.map((substitute) => [substitute.id, substitute]))
  const timeBlocks = sortTimeBlocks(planner.timeBlocks)
  const rows = sortRows(planner.rows)

  return {
    timeBlocks,
    rows: rows.map((row) => {
      const sourceTeachers = getSourceTeachersForRow(planner, row.id)
      const rowResponsible = row.rowResponsibleId ? substituteById.get(row.rowResponsibleId) ?? null : null

      return {
        row,
        title: deriveRowTitle(planner, row),
        rowResponsible,
        sourceTeachers,
        cells: timeBlocks.map((timeBlock) => {
          const card = getNeedCardAtCell(planner, row.id, timeBlock.id)

          if (!card) {
            return {
              id: `${row.id}:${timeBlock.id}`,
              rowId: row.id,
              timeBlock,
              card: null,
            }
          }

          const effectiveAssigneeId = getEffectiveAssigneeId(card, row)
          const showTeacherChip = sourceTeachers.length > 1 || row.rowResponsibleId !== null

          return {
            id: `${row.id}:${timeBlock.id}`,
            rowId: row.id,
            timeBlock,
            card: {
              card,
              sourceTeacher: teacherById.get(card.sourceTeacherId) ?? null,
              effectiveAssignee: effectiveAssigneeId
                ? substituteById.get(effectiveAssigneeId) ?? null
                : null,
              explicitAssignee: card.explicitAssigneeId
                ? substituteById.get(card.explicitAssigneeId) ?? null
                : null,
              rowResponsible,
              assignmentMode: getAssignmentMode(card, row),
              showTeacherChip,
            },
          }
        }),
      }
    }),
  }
}

export function selectPlannerSummary(planner: PlannerState): PlannerSummaryViewModel {
  const rowById = new Map(planner.rows.map((row) => [row.id, row]))
  const timeBlockById = new Map(planner.timeBlocks.map((timeBlock) => [timeBlock.id, timeBlock]))
  const teacherById = new Map(planner.teachers.map((teacher) => [teacher.id, teacher]))

  let coveredCards = 0
  const unassignedItems: PlannerSummaryItem[] = []

  planner.needCards.forEach((card) => {
    const row = rowById.get(card.rowId)

    if (!row) {
      return
    }

    const effectiveAssigneeId = getEffectiveAssigneeId(card, row)

    if (effectiveAssigneeId) {
      coveredCards += 1
      return
    }

    const timeBlock = timeBlockById.get(card.timeBlockId)
    const sourceTeacher = teacherById.get(card.sourceTeacherId)

    unassignedItems.push({
      id: card.id,
      title: card.title,
      timeLabel: timeBlock?.label ?? '',
      rowTitle: deriveRowTitle(planner, row),
      sourceTeacherName: sourceTeacher?.firstName ?? 'Ukjent',
    })
  })

  return {
    totalCards: planner.needCards.length,
    coveredCards,
    coverageRate: planner.needCards.length === 0 ? 0 : coveredCards / planner.needCards.length,
    unassignedCards: unassignedItems.length,
    explicitOverrides: planner.needCards.filter((card) => card.explicitAssigneeId !== null).length,
    rowAssignments: planner.rows.filter((row) => row.rowResponsibleId !== null).length,
    unassignedItems: unassignedItems.sort((left, right) =>
      left.timeLabel.localeCompare(right.timeLabel, 'nb'),
    ),
  }
}

export function selectSubstituteWorkloads(planner: PlannerState): SubstituteWorkload[] {
  const rowById = new Map(planner.rows.map((row) => [row.id, row]))

  return [...planner.substitutes]
    .map((substitute) => {
      const rowAssignments = planner.rows.filter(
        (row) => row.rowResponsibleId === substitute.id,
      ).length
      const explicitOverrides = planner.needCards.filter(
        (card) => card.explicitAssigneeId === substitute.id,
      ).length
      const effectiveCoverageCount = planner.needCards.filter((card) => {
        const row = rowById.get(card.rowId)

        if (!row) {
          return false
        }

        return getEffectiveAssigneeId(card, row) === substitute.id
      }).length

      return {
        substitute,
        rowAssignments,
        explicitOverrides,
        effectiveCoverageCount,
      }
    })
    .sort((left, right) => {
      if (right.effectiveCoverageCount !== left.effectiveCoverageCount) {
        return right.effectiveCoverageCount - left.effectiveCoverageCount
      }

      return left.substitute.firstName.localeCompare(right.substitute.firstName, 'nb')
    })
}
