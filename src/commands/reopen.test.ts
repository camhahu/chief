import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'reopen-test')
const CLI = join(PROJECT_ROOT, 'src', 'index.ts')
const ISSUES_PATH = join(TEST_DIR, '.issues', 'issues.json')

beforeEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
  await $`mkdir -p ${TEST_DIR}`.quiet()
  await $`bun run ${CLI} init`.cwd(TEST_DIR).quiet()
})

afterEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
})

test('chief reopen sets done to false', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).quiet()

  const result = await $`bun run ${CLI} reopen ${id}`.cwd(TEST_DIR).text()
  expect(result.trim()).toBe(`Reopened ${id}`)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].done).toBe(false)
})

test('chief reopen clears doneAt to null', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).quiet()

  const beforeReopen = await Bun.file(ISSUES_PATH).json()
  expect(beforeReopen.issues[0].doneAt).not.toBeNull()

  await $`bun run ${CLI} reopen ${id}`.cwd(TEST_DIR).quiet()

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].doneAt).toBeNull()
})

test('chief reopen fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} reopen nonexistent`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief reopen is idempotent', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).quiet()
  await $`bun run ${CLI} reopen ${id}`.cwd(TEST_DIR).quiet()
  const result = await $`bun run ${CLI} reopen ${id}`.cwd(TEST_DIR).text()

  expect(result.trim()).toBe(`Reopened ${id}`)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].done).toBe(false)
})

test('chief reopen fails without ID argument', async () => {
  const result = await $`bun run ${CLI} reopen`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief reopen <id>')
})
