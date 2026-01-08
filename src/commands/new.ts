import { readIssues, writeIssues, type Issue } from '../store.ts'
import { generateId } from '../id.ts'
import { validateNewIssue, validateOrExit, parseJsonOrExit, resolveParentIdOrExit } from '../validate.ts'
import { ISSUE_DEFAULTS, NewIssueInputSchema } from '../schema.ts'

function parseInput(json: string) {
  return NewIssueInputSchema.parse(JSON.parse(json))
}

export async function newIssue(jsonArg: string): Promise<void> {
  const input = parseJsonOrExit(jsonArg, parseInput)

  const store = await readIssues()
  const id = generateId(store.issues.map((i) => i.id))

  const issue: Issue = {
    ...ISSUE_DEFAULTS,
    ...input,
    id,
    parent: resolveParentIdOrExit(store, input.parent ?? null),
  }

  validateOrExit(() => validateNewIssue(issue, store.issues))

  store.issues.push(issue)
  await writeIssues(store)

  console.log(id)
}
