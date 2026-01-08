import { readIssues, IssuesNotFoundError, type Issue } from '../store.ts'
import { RESET, DIM, GREEN } from '../color.ts'

export type ListFilter = 'all' | 'open' | 'done'

export interface ListOptions {
  filter: ListFilter
  label?: string
}

function formatIssue(issue: Issue, indent: string = ''): string {
  const status = issue.done ? `${GREEN}[x]${RESET}` : '[ ]'
  const labels = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : ''
  const line = `${issue.id} ${status} ${issue.title}${labels}`
  return issue.done ? `${indent}${DIM}${line}${RESET}` : `${indent}${line}`
}

function matchesFilter(issue: Issue, filter: ListFilter, label?: string): boolean {
  const statusMatch = filter === 'all' || (filter === 'open' ? !issue.done : issue.done)
  const labelMatch = !label || issue.labels.includes(label)
  return statusMatch && labelMatch
}

export async function list(options: ListOptions = { filter: 'open' }): Promise<void> {
  const { filter, label } = options

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

  const childrenByParent = new Map<string, Issue[]>()
  for (const issue of store.issues) {
    if (issue.parent !== null) {
      const children = childrenByParent.get(issue.parent) ?? []
      children.push(issue)
      childrenByParent.set(issue.parent, children)
    }
  }

  const parents = store.issues.filter((i) => i.parent === null)
  let printed = false

  for (const parent of parents) {
    const children = childrenByParent.get(parent.id) ?? []
    const matchingChildren = children.filter((c) => matchesFilter(c, filter, label))
    const parentMatches = matchesFilter(parent, filter, label)

    if (!parentMatches && matchingChildren.length === 0) continue

    console.log(formatIssue(parent))
    printed = true

    for (const child of matchingChildren) {
      console.log(formatIssue(child, '  '))
    }
  }

  if (!printed) {
    const completed = store.issues.filter((i) => i.done).length
    if (filter === 'open' && completed > 0) {
      console.log(`No active issues (${completed} completed)`)
    } else {
      console.log('No issues')
    }
  }
}
