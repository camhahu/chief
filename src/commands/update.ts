import { readIssues, writeIssues, findIssueOrExit, type Issue } from '../store.ts'
import { validateIssueFields, validateParentRef, ValidationError } from '../validate.ts'

function parseUpdateInput(json: string): Partial<Issue> {
  const parsed = JSON.parse(json)

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ValidationError('Input must be a JSON object')
  }

  if ('id' in parsed) {
    throw new ValidationError('Cannot change issue id')
  }

  return parsed as Partial<Issue>
}

export async function update(idPrefix: string, jsonArg: string): Promise<void> {
  let updates: Partial<Issue>
  try {
    updates = parseUpdateInput(jsonArg)
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
