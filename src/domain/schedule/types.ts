export type TimeBlockId =
  | '08:30'
  | '09:30'
  | '10:30'
  | '11:30'
  | '12:30'
  | '13:30'

export type Teacher = {
  id: string
  name: string
  avatarInitials: string
  accentColor: string
}

export type Substitute = {
  id: string
  name: string
  avatarInitials: string
  accentColor: string
}

export type Row = {
  id: string
  order: number
  rowResponsibleId: string | null
}

export type NeedCard = {
  id: string
  title: string
  subtitle: string
  sourceTeacherId: string
  placement: 'unscheduled' | 'scheduled'
  rowId: string | null
  timeBlockId: TimeBlockId | null
  explicitAssigneeId: string | null
  accentColor: string
}

export type ScheduledNeedCard = NeedCard & {
  placement: 'scheduled'
  rowId: string
  timeBlockId: TimeBlockId
}

export type TimeBlock = {
  id: TimeBlockId
  label: string
  start: string
  end: string
}

export type AssignmentMode = 'unassigned' | 'inherited' | 'explicit'

export type PlannerState = {
  version: number
  teachers: Record<string, Teacher>
  teacherOrder: string[]
  substitutes: Record<string, Substitute>
  substituteOrder: string[]
  rows: Record<string, Row>
  rowOrder: string[]
  needCards: Record<string, NeedCard>
  needCardOrder: string[]
}

export type PlannerAction =
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
      type: 'assignSubstituteToRow'
      rowId: string
      substituteId: string
    }
  | {
      type: 'clearRowResponsible'
      rowId: string
    }
  | {
      type: 'assignSubstituteToNeedCard'
      cardId: string
      substituteId: string
    }
  | {
      type: 'clearNeedCardExplicitAssignee'
      cardId: string
    }
