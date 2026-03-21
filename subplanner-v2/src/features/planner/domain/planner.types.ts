import { z } from 'zod'

const entityIdSchema = z.string().min(1)
const hhmmSchema = z.string().regex(/^\d{2}:\d{2}$/)

export const teacherSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  firstName: z.string().min(1),
})

export const substituteSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  firstName: z.string().min(1),
  initials: z.string().min(1).max(4),
  avatarColor: z.string().min(1).optional(),
})

export const timeBlockSchema = z.object({
  id: entityIdSchema,
  label: z.string().min(1),
  start: hhmmSchema,
  end: hhmmSchema,
  order: z.number().int().nonnegative(),
})

export const rowSchema = z.object({
  id: entityIdSchema,
  order: z.number().int().nonnegative(),
  rowResponsibleId: entityIdSchema.nullable(),
})

export const needCardSchema = z.object({
  id: entityIdSchema,
  title: z.string().min(1),
  sourceTeacherId: entityIdSchema,
  rowId: entityIdSchema,
  timeBlockId: entityIdSchema,
  explicitAssigneeId: entityIdSchema.nullable(),
  color: z.string().min(1).optional(),
})

export const plannerStateSchema = z.object({
  teachers: z.array(teacherSchema),
  substitutes: z.array(substituteSchema),
  timeBlocks: z.array(timeBlockSchema),
  rows: z.array(rowSchema),
  needCards: z.array(needCardSchema),
})

export type Teacher = z.infer<typeof teacherSchema>
export type Substitute = z.infer<typeof substituteSchema>
export type TimeBlock = z.infer<typeof timeBlockSchema>
export type Row = z.infer<typeof rowSchema>
export type NeedCard = z.infer<typeof needCardSchema>
export type PlannerState = z.infer<typeof plannerStateSchema>
