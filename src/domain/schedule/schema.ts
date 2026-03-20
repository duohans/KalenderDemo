import { z } from 'zod'

import { STORAGE_VERSION, TIME_BLOCKS } from './constants.ts'
import type {
  NeedCard,
  PlannerState,
  Row,
  Substitute,
  Teacher,
  TimeBlockId,
} from './types.ts'

const timeBlockIdValues = TIME_BLOCKS.map((block) => block.id) as [
  TimeBlockId,
  ...TimeBlockId[],
]

function ensureOrderedRecords(
  record: Record<string, unknown>,
  order: string[],
  path: string,
  ctx: z.RefinementCtx,
) {
  order.forEach((id, index) => {
    if (!(id in record)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing record for ordered id "${id}"`,
        path: [path, index],
      })
    }
  })
}

export const timeBlockIdSchema = z.enum(timeBlockIdValues)

export const teacherSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatarInitials: z.string().min(1),
  accentColor: z.string().min(1),
}) satisfies z.ZodType<Teacher>

export const substituteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatarInitials: z.string().min(1),
  accentColor: z.string().min(1),
}) satisfies z.ZodType<Substitute>

export const rowSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  rowResponsibleId: z.string().min(1).nullable(),
}) satisfies z.ZodType<Row>

const needCardBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subtitle: z.string(),
  sourceTeacherId: z.string().min(1),
  explicitAssigneeId: z.string().min(1).nullable(),
  accentColor: z.string().min(1),
})

const scheduledNeedCardSchema = needCardBaseSchema.extend({
  placement: z.literal('scheduled'),
  rowId: z.string().min(1),
  timeBlockId: timeBlockIdSchema,
})

const unscheduledNeedCardSchema = needCardBaseSchema.extend({
  placement: z.literal('unscheduled'),
  rowId: z.null(),
  timeBlockId: z.null(),
})

export const needCardSchema = z.union([
  scheduledNeedCardSchema,
  unscheduledNeedCardSchema,
]) satisfies z.ZodType<NeedCard>

export const plannerStateSchema = z
  .object({
    version: z.literal(STORAGE_VERSION),
    teachers: z.record(z.string(), teacherSchema),
    teacherOrder: z.array(z.string()),
    substitutes: z.record(z.string(), substituteSchema),
    substituteOrder: z.array(z.string()),
    rows: z.record(z.string(), rowSchema),
    rowOrder: z.array(z.string()),
    needCards: z.record(z.string(), needCardSchema),
    needCardOrder: z.array(z.string()),
  })
  .superRefine((state, ctx) => {
    ensureOrderedRecords(state.teachers, state.teacherOrder, 'teacherOrder', ctx)
    ensureOrderedRecords(state.substitutes, state.substituteOrder, 'substituteOrder', ctx)
    ensureOrderedRecords(state.rows, state.rowOrder, 'rowOrder', ctx)
    ensureOrderedRecords(state.needCards, state.needCardOrder, 'needCardOrder', ctx)

    state.rowOrder.forEach((rowId) => {
      const row = state.rows[rowId]

      if (row?.rowResponsibleId && !state.substitutes[row.rowResponsibleId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown rowResponsibleId "${row.rowResponsibleId}"`,
          path: ['rows', rowId, 'rowResponsibleId'],
        })
      }
    })

    state.needCardOrder.forEach((cardId) => {
      const card = state.needCards[cardId]

      if (!card) {
        return
      }

      if (!state.teachers[card.sourceTeacherId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown sourceTeacherId "${card.sourceTeacherId}"`,
          path: ['needCards', cardId, 'sourceTeacherId'],
        })
      }

      if (card.explicitAssigneeId && !state.substitutes[card.explicitAssigneeId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown explicitAssigneeId "${card.explicitAssigneeId}"`,
          path: ['needCards', cardId, 'explicitAssigneeId'],
        })
      }

      if (card.placement === 'scheduled' && !state.rows[card.rowId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown rowId "${card.rowId}"`,
          path: ['needCards', cardId, 'rowId'],
        })
      }
    })
  }) satisfies z.ZodType<PlannerState>

