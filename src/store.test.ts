import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'
import {
  findIssuesPath,
  readIssues,
  writeIssues,
  IssuesNotFoundError,
} from './store.ts'

const TEST_DIR = join(import.meta.dir, '..', '.testfiles', 'store-test')

beforeEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
  await $`mkdir -p ${join(TEST_DIR, '.issues')}`.quiet()
  await Bun.write(join(TEST_DIR, '.issues', 'issues.json'), '{"issues":[]}\n')
})

afterEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
})

test('findIssuesPath returns path when found in current dir', async () => {
  const path = await findIssuesPath(TEST_DIR)
  expect(path).toBe(join(TEST_DIR, '.issues', 'issues.json'))
})

test('findIssuesPath walks up directory tree', async () => {
  const nestedDir = join(TEST_DIR, 'a', 'b', 'c')
  await $`mkdir -p ${nestedDir}`.quiet()

  const path = await findIssuesPath(nestedDir)
  expect(path).toBe(join(TEST_DIR, '.issues', 'issues.json'))
})

test('findIssuesPath returns null when not found', async () => {
  const emptyDir = join(TEST_DIR, 'empty')
  await $`mkdir -p ${emptyDir}`.quiet()
  await $`rm -rf ${join(TEST_DIR, '.issues')}`.quiet()

  const path = await findIssuesPath(emptyDir)
  expect(path).toBeNull()
})

test('readIssues parses JSON correctly', async () => {
  const store = await readIssues(TEST_DIR)
  expect(store).toEqual({ issues: [] })
})

test('readIssues throws IssuesNotFoundError when file missing', async () => {
  await $`rm -rf ${join(TEST_DIR, '.issues')}`.quiet()

  expect(readIssues(TEST_DIR)).rejects.toBeInstanceOf(IssuesNotFoundError)
})

test('writeIssues saves with 2-space indent and trailing newline', async () => {
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

  await writeIssues(store, TEST_DIR)

  const content = await Bun.file(
    join(TEST_DIR, '.issues', 'issues.json')
  ).text()

  // Verify 2-space indentation
  expect(content).toContain('  "issues"')
  expect(content).toContain('    {')
  // Verify trailing newline
  expect(content.endsWith('\n')).toBe(true)
  // Verify content parses back correctly
  expect(JSON.parse(content)).toEqual(store)
})

test('writeIssues throws IssuesNotFoundError when file missing', async () => {
  await $`rm -rf ${join(TEST_DIR, '.issues')}`.quiet()

  expect(writeIssues({ issues: [] }, TEST_DIR)).rejects.toBeInstanceOf(
    IssuesNotFoundError
  )
})
