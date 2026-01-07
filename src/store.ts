const ISSUES_DIR = '.issues'
const ISSUES_FILE = 'issues.json'
const ISSUES_PATH = `${ISSUES_DIR}/${ISSUES_FILE}`

export const ISSUES_PATH_IN_CWD = `${process.cwd()}/${ISSUES_PATH}`

function dirname(path: string): string {
  const lastSlash = path.lastIndexOf('/')
  if (lastSlash === -1) return '.'
  if (lastSlash === 0) return '/'
  return path.slice(0, lastSlash)
}

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
    const issuesPath = `${dir}/${ISSUES_PATH}`
    if (await Bun.file(issuesPath).exists()) {
      return issuesPath
    }

    const parent = dirname(dir)
    if (parent === dir) {
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

export function findIssueOrExit(store: IssuesStore, idPrefix: string): Issue {
  const matches = store.issues.filter((i) => i.id.startsWith(idPrefix))

  if (matches.length === 0) {
    console.error(`Issue ${idPrefix} not found`)
    process.exit(1)
  }

  if (matches.length > 1) {
    console.error(`Ambiguous ID prefix '${idPrefix}' matches:`)
    for (const match of matches) {
      console.error(`  ${match.id} - ${match.title}`)
    }
    process.exit(1)
  }

  return matches[0]!
}
