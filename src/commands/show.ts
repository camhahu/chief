import { readIssues } from '../store.ts'

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const GREEN = '\x1b[32m'

function formatSection(label: string, content: string): string {
  return `${DIM}${label}:${RESET} ${content}`
}

function formatList(items: string[]): string {
  return items.map((item) => `  - ${item}`).join('\n')
}

export async function show(id: string): Promise<void> {
  const store = await readIssues()

  const issue = store.issues.find((i) => i.id === id)
  if (!issue) {
    console.error(`Issue ${id} not found`)
    process.exit(1)
  }

  const status = issue.done ? `${GREEN}done${RESET}` : 'open'
  const parent = issue.parent
    ? store.issues.find((i) => i.id === issue.parent)
    : null

  console.log(`${BOLD}${issue.title}${RESET}`)
  console.log(formatSection('ID', issue.id))
  console.log(formatSection('Status', status))

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
