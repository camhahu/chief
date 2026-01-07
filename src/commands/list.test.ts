import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'list-test')
const CLI = join(PROJECT_ROOT, 'src', 'index.ts')

beforeEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
  await $`mkdir -p ${TEST_DIR}`.quiet()
  await $`bun run ${CLI} init`.cwd(TEST_DIR).quiet()
})

afterEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
})

test('chief list shows "No issues" when empty', async () => {
  const result = await $`bun run ${CLI} list`.cwd(TEST_DIR).text()
  expect(result.trim()).toBe('No issues')
})

test('chief list shows issue with ID, title, and done status', async () => {
  await $`bun run ${CLI} new '{"title":"Test issue"}'`.cwd(TEST_DIR).quiet()

  const result = await $`bun run ${CLI} list`.cwd(TEST_DIR).text()
  expect(result).toMatch(/^[0-9a-f]{6} \[ \] Test issue\s*$/)
})

test('chief list shows labels inline', async () => {
  await $`bun run ${CLI} new '{"title":"Bug fix","labels":["bug","urgent"]}'`
    .cwd(TEST_DIR)
    .quiet()

  const result = await $`bun run ${CLI} list`.cwd(TEST_DIR).text()
  expect(result).toContain('[bug, urgent]')
})

test('chief list indents children under parents', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Parent task"}'`
    .cwd(TEST_DIR)
    .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child task', parent: parentId })}`
    .cwd(TEST_DIR)
    .quiet()

  const result = await $`bun run ${CLI} list`.cwd(TEST_DIR).text()
  const lines = result.trim().split('\n')
  expect(lines).toHaveLength(2)
  expect(lines[0]).toMatch(/^[0-9a-f]{6} \[ \] Parent task$/)
  expect(lines[1]).toMatch(/^  [0-9a-f]{6} \[ \] Child task$/)
})

test('chief list distinguishes done issues', async () => {
  const ISSUES_PATH = join(TEST_DIR, '.issues', 'issues.json')

  const result = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(TEST_DIR)
    .text()
  const id = result.trim()

  const content = await Bun.file(ISSUES_PATH).json()
  content.issues[0].done = true
  await Bun.write(ISSUES_PATH, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list`.cwd(TEST_DIR).text()
  expect(listResult).toContain('[x]')
  expect(listResult).toContain(id)
})

test('chief list fails without .issues directory', async () => {
  const emptyDir = join(PROJECT_ROOT, '.testfiles', 'list-no-init')
  await $`rm -rf ${emptyDir}`.quiet()
  await $`mkdir -p ${emptyDir}`.quiet()

  const result = await $`bun run ${CLI} list`.cwd(emptyDir).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('chief init')

  await $`rm -rf ${emptyDir}`.quiet()
})
