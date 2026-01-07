import { readIssues, writeIssues, findIssueOrExit, resolveParentIdOrExit, type Issue } from '../store.ts'
import { validateIssueFields, validateParentRef, validateOrExit, ValidationError, parseJsonOrExit } from '../validate.ts'
import { UPDATABLE_FIELD_NAMES } from '../schema.ts'

function parseUpdateInput(json: string): Partial<Issue> {
  const parsed = JSON.parse(json)

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ValidationError('Input must be a JSON object')
  }

  if ('id' in parsed) {
    throw new ValidationError('Cannot change issue id')
  }

  const validFields = new Set<string>(UPDATABLE_FIELD_NAMES)
  const unknownFields = Object.keys(parsed).filter((k) => !validFields.has(k))
  if (unknownFields.length > 0) {
    console.error(
      `Warning: Unknown field(s): ${unknownFields.join(', ')}. Valid fields: ${UPDATABLE_FIELD_NAMES.join(', ')}`
    )
  }

  return parsed as Partial<Issue>
}

export async function update(idPrefix: string, jsonArg: string): Promise<void> {
  const updates = parseJsonOrExit(jsonArg, parseUpdateInput)

  const store = await readIssues()
  const issue = findIssueOrExit(store, idPrefix)

  if ('title' in updates) issue.title = updates.title!
  if ('parent' in updates) issue.parent = resolveParentIdOrExit(store, updates.parent!)
  if ('done' in updates) {
    issue.done = updates.done!
    issue.doneAt = updates.done ? new Date().toISOString() : null
  }
  if ('labels' in updates) issue.labels = updates.labels!
  if ('context' in updates) issue.context = updates.context!
  if ('criteria' in updates) issue.criteria = updates.criteria!
  if ('notes' in updates) issue.notes = updates.notes!

  validateOrExit(() => {
    validateIssueFields(issue)
    validateParentRef(issue, store.issues)
  })

  await writeIssues(store)

  console.log(`Updated ${issue.id}`)
}
