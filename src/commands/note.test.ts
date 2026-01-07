import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'note-test')
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

test('chief note appends timestamped note to issue', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} note ${id} "this is a note"`.cwd(TEST_DIR).text()
  expect(result.trim()).toBe(`Added note to ${id}`)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].notes).toHaveLength(1)
  expect(content.issues[0].notes[0]).toMatch(/^\d{4}-\d{2}-\d{2}: this is a note$/)
})

test('chief note fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} note nonexistent "some note"`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief note fails without text argument', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} note ${id}`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief note <id> <text>')
})

test('chief note fails without any arguments', async () => {
  const result = await $`bun run ${CLI} note`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief note <id> <text>')
})

test('chief note appends multiple notes', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} note ${id} "first note"`.cwd(TEST_DIR).quiet()
  await $`bun run ${CLI} note ${id} "second note"`.cwd(TEST_DIR).quiet()

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].notes).toHaveLength(2)
  expect(content.issues[0].notes[0]).toMatch(/: first note$/)
  expect(content.issues[0].notes[1]).toMatch(/: second note$/)
})
