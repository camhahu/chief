import { readIssues, writeIssues, findIssue } from '../store.ts'
import { validateIssueFields, validateParentRef, validateOrExit, parseJsonOrExit, findIssueOrExit, resolveParentIdOrExit } from '../validate.ts'
import { UPDATABLE_FIELD_NAMES, UpdateIssueInputSchema } from '../schema.ts'
import { ValidationError } from '../errors.ts'

function parseUpdateInput(json: string) {
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

  return UpdateIssueInputSchema.parse(parsed)
}

export async function update(idPrefix: string, jsonArg: string): Promise<void> {
  const updates = parseJsonOrExit(jsonArg, parseUpdateInput)

  const store = await readIssues()
  const issue = findIssueOrExit(findIssue(store, idPrefix))

  if (updates.title !== undefined) issue.title = updates.title
  if (updates.parent !== undefined) issue.parent = resolveParentIdOrExit(store, updates.parent)
  if (updates.done !== undefined) {
    issue.done = updates.done
    issue.doneAt = updates.done ? new Date().toISOString() : null
  }
  if (updates.labels !== undefined) issue.labels = updates.labels
  if (updates.context !== undefined) issue.context = updates.context
  if (updates.criteria !== undefined) issue.criteria = updates.criteria
  if (updates.notes !== undefined) issue.notes = updates.notes

  validateOrExit(() => {
    validateIssueFields(issue)
    validateParentRef(issue, store.issues)
  })

  await writeIssues(store)

  console.log(`Updated ${issue.id}`)
}
