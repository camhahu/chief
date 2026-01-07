import { readIssues, writeIssues, type Issue } from '../store.ts'
import { generateId } from '../id.ts'
import { validateNewIssue, ValidationError, validateOrExit, parseJsonOrExit } from '../validate.ts'
import { getDefault } from '../schema.ts'

function parseInput(json: string): Partial<Issue> {
  const parsed = JSON.parse(json)

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ValidationError('Input must be a JSON object')
  }

  if (typeof parsed.title !== 'string' || parsed.title.length === 0) {
    throw new ValidationError('Input must have a non-empty title')
  }

  return parsed as Partial<Issue>
}

export async function newIssue(jsonArg: string): Promise<void> {
  const input = parseJsonOrExit(jsonArg, parseInput)

  const store = await readIssues()
  const id = generateId(store.issues.map((i) => i.id))

  const issue: Issue = {
    id,
    title: input.title!,
    parent: input.parent ?? getDefault('parent'),
    done: input.done ?? getDefault('done'),
    doneAt: input.doneAt ?? getDefault('doneAt'),
    labels: input.labels ?? getDefault('labels'),
    context: input.context ?? getDefault('context'),
    criteria: input.criteria ?? getDefault('criteria'),
    notes: input.notes ?? getDefault('notes'),
  }

  validateOrExit(() => validateNewIssue(issue, store.issues))

  store.issues.push(issue)
  await writeIssues(store)

  console.log(id)
}
