import { readIssues, writeIssues, type Issue } from '../store.ts'
import { generateId } from '../id.ts'
import { validateNewIssue, ValidationError, parseJsonOrExit } from '../validate.ts'

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
    parent: input.parent ?? null,
    done: input.done ?? false,
    doneAt: input.doneAt ?? null,
    labels: input.labels ?? [],
    context: input.context ?? '',
    criteria: input.criteria ?? [],
    notes: input.notes ?? [],
  }

  try {
    validateNewIssue(issue, store.issues)
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error(err.message)
      process.exit(1)
    }
    throw err
  }

  store.issues.push(issue)
  await writeIssues(store)

  console.log(id)
}
