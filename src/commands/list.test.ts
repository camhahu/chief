import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, PROJECT_ROOT, setupTestDir } from '../test-helpers.ts'

const { testDir, issuesPath } = setupTestDir('list-test')

test('chief list shows "No issues" when empty', async () => {
  const result = await $`bun run ${CLI} list`.cwd(testDir).text()
  expect(result.trim()).toBe('No issues')
})

test('chief list shows issue with ID, title, and done status', async () => {
  await $`bun run ${CLI} new '{"title":"Test issue"}'`.cwd(testDir).quiet()

  const result = await $`bun run ${CLI} list`.cwd(testDir).text()
  expect(result).toMatch(/^[0-9a-f]{6} \[ \] Test issue\s*$/)
})

test('chief list shows labels inline', async () => {
  await $`bun run ${CLI} new '{"title":"Bug fix","labels":["bug","urgent"]}'`
    .cwd(testDir)
    .quiet()

  const result = await $`bun run ${CLI} list`.cwd(testDir).text()
  expect(result).toContain('[bug, urgent]')
})

test('chief list indents children under parents', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Parent task"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child task', parent: parentId })}`
    .cwd(testDir)
    .quiet()

  const result = await $`bun run ${CLI} list`.cwd(testDir).text()
  const lines = result.trim().split('\n')
  expect(lines).toHaveLength(2)
  expect(lines[0]).toMatch(/^[0-9a-f]{6} \[ \] Parent task$/)
  expect(lines[1]).toMatch(/^  [0-9a-f]{6} \[ \] Child task$/)
})

test('chief list distinguishes done issues', async () => {
  const result = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(testDir)
    .text()
  const id = result.trim()

  const content = await Bun.file(issuesPath).json()
  content.issues[0].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --all`.cwd(testDir).text()
  expect(listResult).toContain('[x]')
  expect(listResult).toContain(id)
})

test('chief list fails without .issues directory', async () => {
  const emptyDir = `${PROJECT_ROOT}/.testfiles/list-no-init`
  await $`rm -rf ${emptyDir}`.quiet()
  await $`mkdir -p ${emptyDir}`.quiet()

  const result = await $`bun run ${CLI} list`.cwd(emptyDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('chief init')

  await $`rm -rf ${emptyDir}`.quiet()
})

test('chief list --open shows only open issues', async () => {
  await $`bun run ${CLI} new '{"title":"Open task"}'`.cwd(testDir).quiet()
  const doneResult = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(testDir)
    .text()
  const doneId = doneResult.trim()

  const content = await Bun.file(issuesPath).json()
  const idx = content.issues.findIndex((i: { id: string }) => i.id === doneId)
  content.issues[idx].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --open`.cwd(testDir).text()
  expect(listResult).toContain('Open task')
  expect(listResult).not.toContain('Done task')
})

test('chief list --done shows only done issues', async () => {
  await $`bun run ${CLI} new '{"title":"Open task"}'`.cwd(testDir).quiet()
  const doneResult = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(testDir)
    .text()
  const doneId = doneResult.trim()

  const content = await Bun.file(issuesPath).json()
  const idx = content.issues.findIndex((i: { id: string }) => i.id === doneId)
  content.issues[idx].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --done`.cwd(testDir).text()
  expect(listResult).toContain('Done task')
  expect(listResult).not.toContain('Open task')
})

test('chief list --open and --done are mutually exclusive', async () => {
  const result = await $`bun run ${CLI} list --open --done`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('mutually exclusive')
})

test('chief list --open shows "No issues" when all are done', async () => {
  const result = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(testDir)
    .text()
  const id = result.trim()

  const content = await Bun.file(issuesPath).json()
  content.issues[0].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --open`.cwd(testDir).text()
  expect(listResult.trim()).toBe('No issues')
})

test('chief list --open filters children when parent matches', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Open parent"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new ${JSON.stringify({ title: 'Open child', parent: parentId })}`
    .cwd(testDir)
    .quiet()
  const doneChildResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'Done child', parent: parentId })}`
      .cwd(testDir)
      .text()
  const doneChildId = doneChildResult.trim()

  const content = await Bun.file(issuesPath).json()
  const idx = content.issues.findIndex(
    (i: { id: string }) => i.id === doneChildId
  )
  content.issues[idx].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --open`.cwd(testDir).text()
  expect(listResult).toContain('Open parent')
  expect(listResult).toContain('Open child')
  expect(listResult).not.toContain('Done child')
})

test('chief list --label=bug shows only issues with bug label', async () => {
  await $`bun run ${CLI} new '{"title":"Bug issue","labels":["bug"]}'`
    .cwd(testDir)
    .quiet()
  await $`bun run ${CLI} new '{"title":"Feature issue","labels":["feature"]}'`
    .cwd(testDir)
    .quiet()
  await $`bun run ${CLI} new '{"title":"No label issue"}'`.cwd(testDir).quiet()

  const listResult = await $`bun run ${CLI} list --label=bug`
    .cwd(testDir)
    .text()
  expect(listResult).toContain('Bug issue')
  expect(listResult).not.toContain('Feature issue')
  expect(listResult).not.toContain('No label issue')
})

test('chief list --label combines with --open', async () => {
  await $`bun run ${CLI} new '{"title":"Open bug","labels":["bug"]}'`
    .cwd(testDir)
    .quiet()
  const doneBugResult =
    await $`bun run ${CLI} new '{"title":"Done bug","labels":["bug"]}'`
      .cwd(testDir)
      .text()
  const doneBugId = doneBugResult.trim()
  await $`bun run ${CLI} new '{"title":"Open feature","labels":["feature"]}'`
    .cwd(testDir)
    .quiet()

  const content = await Bun.file(issuesPath).json()
  const idx = content.issues.findIndex(
    (i: { id: string }) => i.id === doneBugId
  )
  content.issues[idx].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --label=bug --open`
    .cwd(testDir)
    .text()
  expect(listResult).toContain('Open bug')
  expect(listResult).not.toContain('Done bug')
  expect(listResult).not.toContain('Open feature')
})

test('chief list --label shows parent if child matches', async () => {
  const parentResult =
    await $`bun run ${CLI} new '{"title":"Parent without label"}'`
      .cwd(testDir)
      .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child with bug label', parent: parentId, labels: ['bug'] })}`
    .cwd(testDir)
    .quiet()

  const listResult = await $`bun run ${CLI} list --label=bug`
    .cwd(testDir)
    .text()
  expect(listResult).toContain('Parent without label')
  expect(listResult).toContain('Child with bug label')
})

test('chief list --label shows "No issues" when no matches', async () => {
  await $`bun run ${CLI} new '{"title":"Feature issue","labels":["feature"]}'`
    .cwd(testDir)
    .quiet()

  const listResult = await $`bun run ${CLI} list --label=bug`
    .cwd(testDir)
    .text()
  expect(listResult.trim()).toBe('No issues')
})

test('chief list hides done issues by default', async () => {
  await $`bun run ${CLI} new '{"title":"Open task"}'`.cwd(testDir).quiet()
  const doneResult = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(testDir)
    .text()
  const doneId = doneResult.trim()

  const content = await Bun.file(issuesPath).json()
  const idx = content.issues.findIndex((i: { id: string }) => i.id === doneId)
  content.issues[idx].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list`.cwd(testDir).text()
  expect(listResult).toContain('Open task')
  expect(listResult).not.toContain('Done task')
})

test('chief list --all shows both open and done issues', async () => {
  await $`bun run ${CLI} new '{"title":"Open task"}'`.cwd(testDir).quiet()
  const doneResult = await $`bun run ${CLI} new '{"title":"Done task"}'`
    .cwd(testDir)
    .text()
  const doneId = doneResult.trim()

  const content = await Bun.file(issuesPath).json()
  const idx = content.issues.findIndex((i: { id: string }) => i.id === doneId)
  content.issues[idx].done = true
  await Bun.write(issuesPath, JSON.stringify(content, null, 2) + '\n')

  const listResult = await $`bun run ${CLI} list --all`.cwd(testDir).text()
  expect(listResult).toContain('Open task')
  expect(listResult).toContain('Done task')
})
