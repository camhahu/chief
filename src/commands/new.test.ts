import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir, issuesPath } = setupTestDir('new-test')

test('chief new creates issue with minimal JSON', async () => {
  const result = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()

  const id = result.trim()
  expect(id).toMatch(/^[0-9a-f]{6}$/)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues).toHaveLength(1)
  expect(content.issues[0]).toEqual({
    id,
    title: 'test issue',
    parent: null,
    done: false,
    doneAt: null,
    labels: [],
    context: '',
    criteria: [],
    notes: [],
  })
})

test('chief new applies user-provided fields', async () => {
  const input = JSON.stringify({
    title: 'custom issue',
    labels: ['bug', 'urgent'],
    context: 'some context',
    criteria: ['criterion 1'],
    notes: ['note 1'],
  })

  const result = await $`bun run ${CLI} new ${input}`.cwd(testDir).text()

  const id = result.trim()
  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0]).toEqual({
    id,
    title: 'custom issue',
    parent: null,
    done: false,
    doneAt: null,
    labels: ['bug', 'urgent'],
    context: 'some context',
    criteria: ['criterion 1'],
    notes: ['note 1'],
  })
})

test('chief new validates parent reference', async () => {
  const result = await $`bun run ${CLI} new '{"title":"child","parent":"nonexistent"}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Parent nonexistent does not exist')
})

test('chief new generates unique IDs', async () => {
  await $`bun run ${CLI} new '{"title":"first"}'`.cwd(testDir).quiet()
  await $`bun run ${CLI} new '{"title":"second"}'`.cwd(testDir).quiet()
  await $`bun run ${CLI} new '{"title":"third"}'`.cwd(testDir).quiet()

  const content = await Bun.file(issuesPath).json()
  const ids = content.issues.map((i: { id: string }) => i.id)
  const uniqueIds = new Set(ids)
  expect(uniqueIds.size).toBe(3)
})

test('chief new fails with invalid JSON', async () => {
  const result = await $`bun run ${CLI} new 'not json'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Invalid JSON')
})

test('chief new fails without title', async () => {
  const result = await $`bun run ${CLI} new '{"labels":["bug"]}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('non-empty title')
})

test('chief new can create child issue with valid parent', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"parent"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  const childResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'child', parent: parentId })}`
      .cwd(testDir)
      .text()
  const childId = childResult.trim()

  const content = await Bun.file(issuesPath).json()
  const child = content.issues.find((i: { id: string }) => i.id === childId)
  expect(child.parent).toBe(parentId)
})

test('chief new rejects nested children (max 1 level)', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"parent"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  const childResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'child', parent: parentId })}`
      .cwd(testDir)
      .text()
  const childId = childResult.trim()

  const grandchildResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'grandchild', parent: childId })}`
      .cwd(testDir)
      .quiet()
      .nothrow()

  expect(grandchildResult.exitCode).toBe(1)
  expect(grandchildResult.stderr.toString()).toContain('Max 1 level of nesting')
})
