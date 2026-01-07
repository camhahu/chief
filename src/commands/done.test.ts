import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'done-test')
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

test('chief done marks issue as done', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).text()
  expect(result.trim()).toBe(`Marked ${id} as done`)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].done).toBe(true)
})

test('chief done sets doneAt timestamp', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const before = new Date().toISOString()
  await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).quiet()
  const after = new Date().toISOString()

  const content = await Bun.file(ISSUES_PATH).json()
  const doneAt = content.issues[0].doneAt
  expect(typeof doneAt).toBe('string')
  expect(doneAt >= before).toBe(true)
  expect(doneAt <= after).toBe(true)
})

test('chief done fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} done nonexistent`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief done is idempotent', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).quiet()

  const contentBefore = await Bun.file(ISSUES_PATH).json()
  const doneAtBefore = contentBefore.issues[0].doneAt

  const result = await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).text()
  expect(result.trim()).toBe(`Already done`)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].done).toBe(true)
  expect(content.issues[0].doneAt).toBe(doneAtBefore)
})

test('chief done fails without ID argument', async () => {
  const result = await $`bun run ${CLI} done`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief done <id>')
})
