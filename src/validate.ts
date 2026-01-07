import type { Issue, IssuesStore } from './store'
import { ALL_FIELD_NAMES, validateField } from './schema.ts'
import { ValidationError } from './errors.ts'

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

export function parseJsonOrExit<T>(json: string, parse: (json: string) => T): T {
  try {
    return parse(json)
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('Invalid JSON:', err.message)
    } else if (err instanceof ValidationError) {
      console.error(err.message)
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

  const obj = issue as Record<string, unknown>

  for (const fieldName of ALL_FIELD_NAMES) {
    validateField(fieldName, obj[fieldName])
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

export function validateStore(store: IssuesStore): void {
  if (!Array.isArray(store.issues)) {
    throw new ValidationError('Store must have an issues array')
  }

  const seenIds = new Set<string>()

  for (const issue of store.issues) {
    validateIssueFields(issue)

    if (seenIds.has(issue.id)) {
      throw new ValidationError(`Duplicate issue id: ${issue.id}`)
    }
    seenIds.add(issue.id)
  }

  for (const issue of store.issues) {
    validateParentRef(issue, store.issues)
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
