import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'remove-test')
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

test('chief remove deletes issue from list', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} remove ${id}`.cwd(TEST_DIR).text()
  expect(result.trim()).toBe(`Removed ${id}`)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues.length).toBe(0)
})

test('chief remove fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} remove nonexistent`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief remove fails without ID argument', async () => {
  const result = await $`bun run ${CLI} remove`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief remove <id>')
})

test('chief remove deletes children recursively', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"parent issue"}'`
    .cwd(TEST_DIR)
    .text()
  const parentId = parentResult.trim()

  const child1Result =
    await $`bun run ${CLI} new '{"title":"child 1","parent":"${parentId}"}'`
      .cwd(TEST_DIR)
      .text()
  const child1Id = child1Result.trim()

  const child2Result =
    await $`bun run ${CLI} new '{"title":"child 2","parent":"${parentId}"}'`
      .cwd(TEST_DIR)
      .text()
  const child2Id = child2Result.trim()

  const result = await $`bun run ${CLI} remove ${parentId}`.cwd(TEST_DIR).text()
  expect(result.trim()).toContain(`Removed ${parentId} and children:`)
  expect(result.trim()).toContain(child1Id)
  expect(result.trim()).toContain(child2Id)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues.length).toBe(0)
})

test('chief remove deletes only the issue when no children', async () => {
  await $`bun run ${CLI} new '{"title":"other issue"}'`.cwd(TEST_DIR).quiet()

  const targetResult = await $`bun run ${CLI} new '{"title":"target issue"}'`
    .cwd(TEST_DIR)
    .text()
  const targetId = targetResult.trim()

  await $`bun run ${CLI} remove ${targetId}`.cwd(TEST_DIR).quiet()

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues.length).toBe(1)
  expect(content.issues[0].title).toBe('other issue')
})
