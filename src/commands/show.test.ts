import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'show-test')
const CLI = join(PROJECT_ROOT, 'src', 'index.ts')

beforeEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
  await $`mkdir -p ${TEST_DIR}`.quiet()
  await $`bun run ${CLI} init`.cwd(TEST_DIR).quiet()
})

afterEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
})

test('chief show displays all issue fields', async () => {
  const issueJson = JSON.stringify({
    title: 'Test issue',
    context: 'This is the context',
    labels: ['bug', 'urgent'],
    criteria: ['First criterion', 'Second criterion'],
    notes: ['2026-01-01: First note'],
  })

  const createResult = await $`bun run ${CLI} new ${issueJson}`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} show ${id}`.cwd(TEST_DIR).text()

  expect(result).toContain('Test issue')
  expect(result).toContain(id)
  expect(result).toContain('open')
  expect(result).toContain('bug')
  expect(result).toContain('urgent')
  expect(result).toContain('This is the context')
  expect(result).toContain('First criterion')
  expect(result).toContain('Second criterion')
  expect(result).toContain('2026-01-01: First note')
})

test('chief show displays children', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Parent"}'`
    .cwd(TEST_DIR)
    .text()
  const parentId = parentResult.trim()

  const childResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child task', parent: parentId })}`
      .cwd(TEST_DIR)
      .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} show ${parentId}`.cwd(TEST_DIR).text()

  expect(result).toContain('Children:')
  expect(result).toContain(childId)
  expect(result).toContain('Child task')
})

test('chief show displays parent reference', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Parent"}'`
    .cwd(TEST_DIR)
    .text()
  const parentId = parentResult.trim()

  const childResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child task', parent: parentId })}`
      .cwd(TEST_DIR)
      .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} show ${childId}`.cwd(TEST_DIR).text()

  expect(result).toContain('Parent:')
  expect(result).toContain(parentId)
  expect(result).toContain('Parent')
})

test('chief show displays done status', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"Done issue"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(TEST_DIR).quiet()

  const result = await $`bun run ${CLI} show ${id}`.cwd(TEST_DIR).text()
  expect(result).toContain('done')
})

test('chief show fails for unknown ID', async () => {
  const result = await $`bun run ${CLI} show abcdef`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('abcdef')
  expect(result.stderr.toString()).toContain('not found')
})

test('chief show without ID prints usage', async () => {
  const result = await $`bun run ${CLI} show`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage:')
})
