import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'list-test')
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

test('chief list --open shows only open issues', async () => {
  await $`bun run ${CLI} new '{"title":"Open task"}'`.cwd(TEST_DIR).quiet()
  const doneResult = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(TEST_DIR)
    .text()
  const doneId = doneResult.trim()

  const content = await Bun.file(ISSUES_PATH).json()
  const idx = content.issues.findIndex((i: { id: string }) => i.id === doneId)
  content.issues[idx].done = true
  await Bun.write(ISSUES_PATH, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --open`.cwd(TEST_DIR).text()
  expect(listResult).toContain('Open task')
  expect(listResult).not.toContain('Done task')
})

test('chief list --done shows only done issues', async () => {
  await $`bun run ${CLI} new '{"title":"Open task"}'`.cwd(TEST_DIR).quiet()
  const doneResult = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(TEST_DIR)
    .text()
  const doneId = doneResult.trim()

  const content = await Bun.file(ISSUES_PATH).json()
  const idx = content.issues.findIndex((i: { id: string }) => i.id === doneId)
  content.issues[idx].done = true
  await Bun.write(ISSUES_PATH, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --done`.cwd(TEST_DIR).text()
  expect(listResult).toContain('Done task')
  expect(listResult).not.toContain('Open task')
})

test('chief list --open and --done are mutually exclusive', async () => {
  const result = await $`bun run ${CLI} list --open --done`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('mutually exclusive')
})

test('chief list --open shows "No issues" when all are done', async () => {
  const result = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(TEST_DIR)
    .text()
  const id = result.trim()

  const content = await Bun.file(ISSUES_PATH).json()
  content.issues[0].done = true
  await Bun.write(ISSUES_PATH, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --open`.cwd(TEST_DIR).text()
  expect(listResult.trim()).toBe('No issues')
})

test('chief list --open filters children when parent matches', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Open parent"}'`
    .cwd(TEST_DIR)
    .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new ${JSON.stringify({ title: 'Open child', parent: parentId })}`
    .cwd(TEST_DIR)
    .quiet()
  const doneChildResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'Done child', parent: parentId })}`
      .cwd(TEST_DIR)
      .text()
  const doneChildId = doneChildResult.trim()

  const content = await Bun.file(ISSUES_PATH).json()
  const idx = content.issues.findIndex(
    (i: { id: string }) => i.id === doneChildId
  )
  content.issues[idx].done = true
  await Bun.write(ISSUES_PATH, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --open`.cwd(TEST_DIR).text()
  expect(listResult).toContain('Open parent')
  expect(listResult).toContain('Open child')
  expect(listResult).not.toContain('Done child')
})

test('chief list --label=bug shows only issues with bug label', async () => {
  await $`bun run ${CLI} new '{"title":"Bug issue","labels":["bug"]}'`
    .cwd(TEST_DIR)
    .quiet()
  await $`bun run ${CLI} new '{"title":"Feature issue","labels":["feature"]}'`
    .cwd(TEST_DIR)
    .quiet()
  await $`bun run ${CLI} new '{"title":"No label issue"}'`.cwd(TEST_DIR).quiet()

  const listResult = await $`bun run ${CLI} list --label=bug`
    .cwd(TEST_DIR)
    .text()
  expect(listResult).toContain('Bug issue')
  expect(listResult).not.toContain('Feature issue')
  expect(listResult).not.toContain('No label issue')
})

test('chief list --label combines with --open', async () => {
  await $`bun run ${CLI} new '{"title":"Open bug","labels":["bug"]}'`
    .cwd(TEST_DIR)
    .quiet()
  const doneBugResult =
    await $`bun run ${CLI} new '{"title":"Done bug","labels":["bug"]}'`
      .cwd(TEST_DIR)
      .text()
  const doneBugId = doneBugResult.trim()
  await $`bun run ${CLI} new '{"title":"Open feature","labels":["feature"]}'`
    .cwd(TEST_DIR)
    .quiet()

  const content = await Bun.file(ISSUES_PATH).json()
  const idx = content.issues.findIndex(
    (i: { id: string }) => i.id === doneBugId
  )
  content.issues[idx].done = true
  await Bun.write(ISSUES_PATH, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --label=bug --open`
    .cwd(TEST_DIR)
    .text()
  expect(listResult).toContain('Open bug')
  expect(listResult).not.toContain('Done bug')
  expect(listResult).not.toContain('Open feature')
})

test('chief list --label shows parent if child matches', async () => {
  const parentResult =
    await $`bun run ${CLI} new '{"title":"Parent without label"}'`
      .cwd(TEST_DIR)
      .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child with bug label', parent: parentId, labels: ['bug'] })}`
    .cwd(TEST_DIR)
    .quiet()

  const listResult = await $`bun run ${CLI} list --label=bug`
    .cwd(TEST_DIR)
    .text()
  expect(listResult).toContain('Parent without label')
  expect(listResult).toContain('Child with bug label')
})

test('chief list --label shows "No issues" when no matches', async () => {
  await $`bun run ${CLI} new '{"title":"Feature issue","labels":["feature"]}'`
    .cwd(TEST_DIR)
    .quiet()

  const listResult = await $`bun run ${CLI} list --label=bug`
    .cwd(TEST_DIR)
    .text()
  expect(listResult.trim()).toBe('No issues')
})
