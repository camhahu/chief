import { dirname, join } from 'node:path'

const ISSUES_DIR = '.issues'
const ISSUES_FILE = 'issues.json'
const ISSUES_PATH = join(ISSUES_DIR, ISSUES_FILE)

export interface Issue {
  id: string
  title: string
  parent: string | null
  done: boolean
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

/**
 * Walk up the directory tree from cwd looking for .issues/issues.json
 * Returns the path to the issues.json file if found
 */
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

/**
 * Read and parse the issues.json file
 * Throws IssuesNotFoundError if file not found
 */
export async function readIssues(startDir?: string): Promise<IssuesStore> {
  const path = await findIssuesPath(startDir)
  if (!path) {
    throw new IssuesNotFoundError()
  }

  const file = Bun.file(path)
  const text = await file.text()
  return JSON.parse(text) as IssuesStore
}

/**
 * Write issues to the issues.json file with consistent 2-space formatting
 * Throws IssuesNotFoundError if file not found
 */
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

/**
 * Get the path where issues.json should be created (in cwd)
 */
export function getInitPath(): string {
  return join(process.cwd(), ISSUES_PATH)
}

/**
 * Get the directory where .issues should be created (in cwd)
 */
export function getInitDir(): string {
  return join(process.cwd(), ISSUES_DIR)
}
