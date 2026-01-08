export type { Issue, IssuesStore } from './schema.ts'

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

    if (await Bun.file(`${dir}/.git/HEAD`).exists()) {
      return null
    }

    const parent = dirname(dir)
    if (parent === dir) {
      return null
    }
    dir = parent
  }
}

import type { IssuesStore } from './schema.ts'

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

  const lines = store.issues.map((issue) => JSON.stringify(issue))
  const json = `{"issues": [\n${lines.join(',\n')}\n]}\n`
  await Bun.write(path, json)
}

import type { Issue } from './schema.ts'

export type FindIssueResult =
  | { issue: Issue }
  | { error: 'not-found'; idPrefix: string }
  | { error: 'ambiguous'; idPrefix: string; matches: Issue[] }

export function findIssue(store: IssuesStore, idPrefix: string): FindIssueResult {
  const matches = store.issues.filter((i) => i.id.startsWith(idPrefix))

  if (matches.length === 0) {
    return { error: 'not-found', idPrefix }
  }

  if (matches.length > 1) {
    return { error: 'ambiguous', idPrefix, matches }
  }

  return { issue: matches[0]! }
}
