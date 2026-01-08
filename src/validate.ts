import { type Issue, type IssuesStore, IssueSchema } from './schema.ts'
import { ValidationError } from './errors.ts'
import { z } from 'zod'
import { findIssue, type FindIssueResult } from './store.ts'

export { ValidationError }

export function validateOrExit(fn: () => void): void {
  try {
    fn()
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error(err.message)
      process.exit(1)
    }
    throw err
  }
}

export function findIssueOrExit(result: FindIssueResult, label = 'Issue'): Issue {
  if ('issue' in result) {
    return result.issue
  }

  if (result.error === 'not-found') {
    console.error(`${label} ${result.idPrefix} not found`)
    process.exit(1)
  }

  console.error(`Ambiguous ${label.toLowerCase()} ID prefix '${result.idPrefix}' matches:`)
  for (const match of result.matches) {
    console.error(`  ${match.id} - ${match.title}`)
  }
  process.exit(1)
}

export function resolveParentIdOrExit(store: IssuesStore, parentIdPrefix: string | null): string | null {
  if (parentIdPrefix === null) {
    return null
  }
  return findIssueOrExit(findIssue(store, parentIdPrefix), 'Parent').id
}

function formatZodError(error: z.core.$ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Validation failed'

  const field = issue.path[0]

  if (issue.path.length > 1 && issue.code === 'invalid_type') {
    return `Issue ${String(field)} must all be strings`
  }

  return issue.message
}

export function parseJsonOrExit<T>(json: string, parse: (json: string) => T): T {
  try {
    return parse(json)
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('Invalid JSON:', err.message)
    } else if (err instanceof ValidationError) {
      console.error(err.message)
    } else if (err instanceof z.core.$ZodError) {
      console.error(formatZodError(err))
    } else {
      throw err
    }
    process.exit(1)
  }
}

export function validateIssueFields(issue: unknown): issue is Issue {
  if (typeof issue !== 'object' || issue === null) {
    throw new ValidationError('Issue must be an object')
  }

  const result = IssueSchema.safeParse(issue)
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error))
  }

  return true
}

export function validateParentRef(
  issue: Issue,
  existingIssues: Issue[]
): void {
  if (issue.parent === null) {
    return
  }

  if (issue.parent === issue.id) {
    throw new ValidationError(
      `Issue ${issue.id} cannot be its own parent`
    )
  }

  const parent = existingIssues.find((i) => i.id === issue.parent)
  if (!parent) {
    throw new ValidationError(
      `Parent ${issue.parent} does not exist`
    )
  }

  if (parent.parent !== null) {
    throw new ValidationError(
      `Parent ${issue.parent} is itself a child issue. Max 1 level of nesting allowed.`
    )
  }

  const hasChildren = existingIssues.some((i) => i.parent === issue.id)
  if (hasChildren) {
    throw new ValidationError(
      `Issue ${issue.id} has children and cannot become a child. Max 1 level of nesting allowed.`
    )
  }
}

export function validateStore(store: unknown): asserts store is IssuesStore {
  if (typeof store !== 'object' || store === null) {
    throw new ValidationError('Store must be an object')
  }

  const obj = store as Record<string, unknown>
  if (!Array.isArray(obj.issues)) {
    throw new ValidationError('Store must have an issues array')
  }

  const seenIds = new Set<string>()

  for (const issue of obj.issues) {
    validateIssueFields(issue)

    if (seenIds.has((issue as Issue).id)) {
      throw new ValidationError(`Duplicate issue id: ${(issue as Issue).id}`)
    }
    seenIds.add((issue as Issue).id)
  }

  for (const issue of obj.issues as Issue[]) {
    validateParentRef(issue, obj.issues as Issue[])
  }
}

export function validateNewIssue(
  issue: Issue,
  existingIssues: Issue[]
): void {
  validateIssueFields(issue)

  if (existingIssues.some((i) => i.id === issue.id)) {
    throw new ValidationError(`Issue id ${issue.id} already exists`)
  }

  validateParentRef(issue, existingIssues)
}
