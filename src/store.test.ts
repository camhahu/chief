import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { setupTestDir } from './test-helpers.ts'
import {
  findIssuesPath,
  readIssues,
  writeIssues,
  findIssueOrExit,
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

test('findIssueOrExit matches exact ID', () => {
  const store: IssuesStore = {
    issues: [makeIssue('abc123', 'Test Issue')],
  }
  const issue = findIssueOrExit(store, 'abc123')
  expect(issue.id).toBe('abc123')
})

test('findIssueOrExit matches ID prefix', () => {
  const store: IssuesStore = {
    issues: [makeIssue('abc123', 'Test Issue')],
  }
  const issue = findIssueOrExit(store, 'ab')
  expect(issue.id).toBe('abc123')
})

test('findIssueOrExit matches single-char prefix', () => {
  const store: IssuesStore = {
    issues: [
      makeIssue('abc123', 'First'),
      makeIssue('def456', 'Second'),
    ],
  }
  const issue = findIssueOrExit(store, 'd')
  expect(issue.id).toBe('def456')
})
