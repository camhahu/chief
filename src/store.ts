import { dirname, join } from 'node:path'

const ISSUES_DIR = '.issues'
const ISSUES_FILE = 'issues.json'
const ISSUES_PATH = join(ISSUES_DIR, ISSUES_FILE)

export const ISSUES_DIR_IN_CWD = join(process.cwd(), ISSUES_DIR)
export const ISSUES_PATH_IN_CWD = join(process.cwd(), ISSUES_PATH)

export interface Issue {
  id: string
  title: string
  parent: string | null
  done: boolean
  doneAt: string | null
  labels: string[]
  context: string
  criteria: string[]
  notes: string[]
}

export interface IssuesStore {
  issues: Issue[]
}

export class IssuesNotFoundError extends Error {
  constructor() {
    super(`Could not find ${ISSUES_PATH}. Run 'chief init' to create one.`)
    this.name = 'IssuesNotFoundError'
  }
}

export async function findIssuesPath(
  startDir: string = process.cwd()
): Promise<string | null> {
  let dir = startDir

  while (true) {
    const issuesPath = join(dir, ISSUES_PATH)
    if (await Bun.file(issuesPath).exists()) {
      return issuesPath
    }

    const parent = dirname(dir)
    if (parent === dir) {
      // Reached filesystem root
      return null
    }
    dir = parent
  }
}

export async function readIssues(startDir?: string): Promise<IssuesStore> {
  const path = await findIssuesPath(startDir)
  if (!path) {
    throw new IssuesNotFoundError()
  }

  const file = Bun.file(path)
  const text = await file.text()
  return JSON.parse(text) as IssuesStore
}

export async function writeIssues(
  store: IssuesStore,
  startDir?: string
): Promise<void> {
  const path = await findIssuesPath(startDir)
  if (!path) {
    throw new IssuesNotFoundError()
  }

  const json = JSON.stringify(store, null, 2) + '\n'
  await Bun.write(path, json)
}

export function findIssueOrExit(store: IssuesStore, id: string): Issue {
  const issue = store.issues.find((i) => i.id === id)
  if (!issue) {
    console.error(`Issue ${id} not found`)
    process.exit(1)
  }
  return issue
}
