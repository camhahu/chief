import { readIssues, IssuesNotFoundError, type Issue } from '../store.ts'
import { RESET, DIM, GREEN } from '../color.ts'

function formatIssue(issue: Issue, indent: string = ''): string {
  const status = issue.done ? `${GREEN}[x]${RESET}` : '[ ]'
  const labels = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : ''
  const line = `${issue.id} ${status} ${issue.title}${labels}`
  return issue.done ? `${indent}${DIM}${line}${RESET}` : `${indent}${line}`
}

export async function list(): Promise<void> {
  let store
  try {
    store = await readIssues()
  } catch (err) {
    if (err instanceof IssuesNotFoundError) {
      console.error(err.message)
      process.exit(1)
    }
    throw err
  }

  if (store.issues.length === 0) {
    console.log('No issues')
    return
  }

  const parents = store.issues.filter((i) => i.parent === null)
  const childrenByParent = new Map<string, Issue[]>()

  for (const issue of store.issues) {
    if (issue.parent !== null) {
      const children = childrenByParent.get(issue.parent) ?? []
      children.push(issue)
      childrenByParent.set(issue.parent, children)
    }
  }

  for (const parent of parents) {
    console.log(formatIssue(parent))
    const children = childrenByParent.get(parent.id) ?? []
    for (const child of children) {
      console.log(formatIssue(child, '  '))
    }
  }
}
