export type PlannerDragData =
  | {
      kind: 'substitute'
      id: string
    }
  | {
      kind: 'need-card'
      id: string
    }

export type PlannerDropData =
  | {
      kind: 'row'
      id: string
      rowId: string
    }
  | {
      kind: 'card'
      id: string
      cardId: string
    }
  | {
      kind: 'cell'
      id: string
      rowId: string
      timeBlockId: string
    }
