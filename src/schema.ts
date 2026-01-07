import { z } from 'zod'

const nullableString = (fieldName: string) =>
  z.union([z.string(), z.null()], { error: `Issue ${fieldName} must be null or a string` })

export const IssueSchema = z.object({
  id: z
    .string({ error: 'Issue must have a non-empty string id' })
    .min(1, 'Issue must have a non-empty string id'),
  title: z
    .string({ error: 'Issue must have a non-empty string title' })
    .min(1, 'Issue must have a non-empty string title'),
  parent: nullableString('parent'),
  done: z.boolean({ error: 'Issue done must be a boolean' }),
  doneAt: nullableString('doneAt'),
  labels: z.array(z.string(), { error: 'Issue labels must be an array' }),
  context: z.string({ error: 'Issue context must be a string' }),
  criteria: z.array(z.string(), { error: 'Issue criteria must be an array' }),
  notes: z.array(z.string(), { error: 'Issue notes must be an array' }),
})

export type Issue = z.infer<typeof IssueSchema>

export const IssuesStoreSchema = z.object({
  issues: z.array(IssueSchema),
})

export type IssuesStore = z.infer<typeof IssuesStoreSchema>

export const NewIssueInputSchema = z.object({
  title: z.string({ error: 'Input must have a non-empty title' }).min(1, 'Input must have a non-empty title'),
  parent: z.string().nullable().optional(),
  done: z.boolean().optional(),
  doneAt: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  context: z.string().optional(),
  criteria: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
})

export type NewIssueInput = z.infer<typeof NewIssueInputSchema>

export const UpdateIssueInputSchema = z.object({
  title: z.string().min(1, 'Issue must have a non-empty string title').optional(),
  parent: z.string().nullable().optional(),
  done: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
  context: z.string().optional(),
  criteria: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
})

export type UpdateIssueInput = z.infer<typeof UpdateIssueInputSchema>

export const ISSUE_DEFAULTS = {
  parent: null,
  done: false,
  doneAt: null,
  labels: [],
  context: '',
  criteria: [],
  notes: [],
} satisfies Omit<Issue, 'id' | 'title'>

export const UPDATABLE_FIELD_NAMES = [
  'title',
  'parent',
  'done',
  'labels',
  'context',
  'criteria',
  'notes',
] as const
