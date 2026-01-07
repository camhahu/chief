import type { Issue, IssuesStore } from './store'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateIssueFields(issue: unknown): issue is Issue {
  if (typeof issue !== 'object' || issue === null) {
    throw new ValidationError('Issue must be an object')
  }

  const obj = issue as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    throw new ValidationError('Issue must have a non-empty string id')
  }

  if (typeof obj.title !== 'string' || obj.title.length === 0) {
    throw new ValidationError('Issue must have a non-empty string title')
  }

  if (obj.parent !== null && typeof obj.parent !== 'string') {
    throw new ValidationError('Issue parent must be null or a string')
  }

  if (typeof obj.done !== 'boolean') {
    throw new ValidationError('Issue done must be a boolean')
  }

  if (obj.doneAt !== null && typeof obj.doneAt !== 'string') {
    throw new ValidationError('Issue doneAt must be null or a string')
  }

  if (!Array.isArray(obj.labels)) {
    throw new ValidationError('Issue labels must be an array')
  }

  if (!obj.labels.every((l) => typeof l === 'string')) {
    throw new ValidationError('Issue labels must all be strings')
  }

  if (typeof obj.context !== 'string') {
    throw new ValidationError('Issue context must be a string')
  }

  if (!Array.isArray(obj.criteria)) {
    throw new ValidationError('Issue criteria must be an array')
  }

  if (!obj.criteria.every((c) => typeof c === 'string')) {
    throw new ValidationError('Issue criteria must all be strings')
  }

  if (!Array.isArray(obj.notes)) {
    throw new ValidationError('Issue notes must be an array')
  }

  if (!obj.notes.every((n) => typeof n === 'string')) {
    throw new ValidationError('Issue notes must all be strings')
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
