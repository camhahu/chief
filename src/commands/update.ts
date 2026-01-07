import { readIssues, writeIssues, findIssueOrExit, type Issue } from '../store.ts'
import { validateIssueFields, validateParentRef, ValidationError, parseJsonOrExit } from '../validate.ts'

const UPDATABLE_FIELDS = ['title', 'parent', 'done', 'labels', 'context', 'criteria', 'notes']

function parseUpdateInput(json: string): Partial<Issue> {
  const parsed = JSON.parse(json)

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ValidationError('Input must be a JSON object')
  }

  if ('id' in parsed) {
    throw new ValidationError('Cannot change issue id')
  }

  const unknownFields = Object.keys(parsed).filter((k) => !UPDATABLE_FIELDS.includes(k))
  if (unknownFields.length > 0) {
    console.error(
      `Warning: Unknown field(s): ${unknownFields.join(', ')}. Valid fields: ${UPDATABLE_FIELDS.join(', ')}`
    )
  }

  return parsed as Partial<Issue>
}

export async function update(idPrefix: string, jsonArg: string): Promise<void> {
  const updates = parseJsonOrExit(jsonArg, parseUpdateInput)

  const store = await readIssues()
  const issue = findIssueOrExit(store, idPrefix)

  if ('title' in updates) issue.title = updates.title!
  if ('parent' in updates) issue.parent = updates.parent!
  if ('done' in updates) issue.done = updates.done!
  if ('labels' in updates) issue.labels = updates.labels!
  if ('context' in updates) issue.context = updates.context!
  if ('criteria' in updates) issue.criteria = updates.criteria!
  if ('notes' in updates) issue.notes = updates.notes!

  try {
    validateIssueFields(issue)
    validateParentRef(issue, store.issues)
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error(err.message)
      process.exit(1)
    }
    throw err
  }

  await writeIssues(store)

  console.log(`Updated ${issue.id}`)
}
