import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { setupTestDir } from './test-helpers.ts'
import {
  findIssuesPath,
  readIssues,
  writeIssues,
  findIssue,
  IssuesNotFoundError,
  type IssuesStore,
} from './store.ts'

const { testDir, issuesPath } = setupTestDir('store-test', { createIssuesDir: true })

test('findIssuesPath returns path when found in current dir', async () => {
  const path = await findIssuesPath(testDir)
  expect(path).toBe(issuesPath)
})

test('findIssuesPath walks up directory tree', async () => {
  const nestedDir = `${testDir}/a/b/c`
  await $`mkdir -p ${nestedDir}`.quiet()

  const path = await findIssuesPath(nestedDir)
  expect(path).toBe(issuesPath)
})

test('findIssuesPath returns null when not found', async () => {
  const emptyDir = `${testDir}/empty`
  await $`mkdir -p ${emptyDir}`.quiet()
  await $`rm -rf ${testDir}/.issues`.quiet()

  const path = await findIssuesPath(emptyDir)
  expect(path).toBeNull()
})

test('readIssues parses JSON correctly', async () => {
  const store = await readIssues(testDir)
  expect(store).toEqual({ issues: [] })
})

test('readIssues throws IssuesNotFoundError when file missing', async () => {
  await $`rm -rf ${testDir}/.issues`.quiet()

  expect(readIssues(testDir)).rejects.toBeInstanceOf(IssuesNotFoundError)
})

test('writeIssues saves with one issue per line and trailing newline', async () => {
  const store = {
    issues: [
      {
        id: 'abc123',
        title: 'Test Issue',
        parent: null,
        done: false,
        doneAt: null,
        labels: ['bug'],
        context: 'Some context',
        criteria: ['Works'],
        notes: [],
      },
    ],
  }

  await writeIssues(store, testDir)

  const content = await Bun.file(issuesPath).text()
  const lines = content.split('\n')

  expect(lines[0]).toBe('{"issues": [')
  expect(lines[1]).toContain('"id":"abc123"')
  expect(lines[2]).toBe(']}')
  expect(content.endsWith('\n')).toBe(true)
  expect(JSON.parse(content)).toEqual(store)
})

test('writeIssues throws IssuesNotFoundError when file missing', async () => {
  await $`rm -rf ${testDir}/.issues`.quiet()

  expect(writeIssues({ issues: [] }, testDir)).rejects.toBeInstanceOf(
    IssuesNotFoundError
  )
})

const makeIssue = (id: string, title: string) => ({
  id,
  title,
  parent: null,
  done: false,
  doneAt: null,
  labels: [],
  context: '',
  criteria: [],
  notes: [],
})

test('findIssue returns issue for exact ID', () => {
  const issue = makeIssue('abc123', 'Test Issue')
  const store: IssuesStore = { issues: [issue] }
  const result = findIssue(store, 'abc123')
  expect(result).toEqual({ issue })
})

test('findIssue returns issue for ID prefix', () => {
  const issue = makeIssue('abc123', 'Test Issue')
  const store: IssuesStore = { issues: [issue] }
  const result = findIssue(store, 'ab')
  expect(result).toEqual({ issue })
})

test('findIssue returns issue for single-char prefix', () => {
  const first = makeIssue('abc123', 'First')
  const second = makeIssue('def456', 'Second')
  const store: IssuesStore = { issues: [first, second] }
  const result = findIssue(store, 'd')
  expect(result).toEqual({ issue: second })
})

test('findIssue returns not-found error when no match', () => {
  const store: IssuesStore = {
    issues: [makeIssue('abc123', 'Test Issue')],
  }
  const result = findIssue(store, 'xyz')
  expect(result).toEqual({ error: 'not-found', idPrefix: 'xyz' })
})

test('findIssue returns ambiguous error when multiple matches', () => {
  const first = makeIssue('abc123', 'First')
  const second = makeIssue('abc456', 'Second')
  const store: IssuesStore = { issues: [first, second] }
  const result = findIssue(store, 'ab')
  expect(result).toEqual({
    error: 'ambiguous',
    idPrefix: 'ab',
    matches: [first, second],
  })
})
