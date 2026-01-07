import { readIssues, findIssueOrExit } from '../store.ts'
import { RESET, DIM, BOLD, GREEN } from '../color.ts'

function formatSection(label: string, content: string): string {
  return `${DIM}${label}:${RESET} ${content}`
}

function formatList(items: string[]): string {
  return items.map((item) => `  - ${item}`).join('\n')
}

export async function show(id: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(store, id)

  const status = issue.done ? `${GREEN}done${RESET}` : 'open'
  const parent = issue.parent
    ? store.issues.find((i) => i.id === issue.parent)
    : null

  console.log(`${BOLD}${issue.title}${RESET}`)
  console.log(formatSection('ID', issue.id))
  console.log(formatSection('Status', status))

  if (issue.doneAt) {
    console.log(formatSection('Completed', issue.doneAt))
  }

  if (issue.labels.length > 0) {
    console.log(formatSection('Labels', issue.labels.join(', ')))
  }

  if (parent) {
    console.log(formatSection('Parent', `${parent.id} - ${parent.title}`))
  }

  if (issue.context) {
    console.log('')
    console.log(`${DIM}Context:${RESET}`)
    console.log(issue.context)
  }

  if (issue.criteria.length > 0) {
    console.log('')
    console.log(`${DIM}Criteria:${RESET}`)
    console.log(formatList(issue.criteria))
  }

  if (issue.notes.length > 0) {
    console.log('')
    console.log(`${DIM}Notes:${RESET}`)
    console.log(formatList(issue.notes))
  }

  const children = store.issues.filter((i) => i.parent === id)
  if (children.length > 0) {
    console.log('')
    console.log(`${DIM}Children:${RESET}`)
    for (const child of children) {
      const childStatus = child.done ? `${GREEN}[x]${RESET}` : '[ ]'
      console.log(`  ${child.id} ${childStatus} ${child.title}`)
    }
  }
}
