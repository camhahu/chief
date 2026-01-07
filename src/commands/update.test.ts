import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir, issuesPath } = setupTestDir('update-test')

test('chief update merges fields into existing issue', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"original title"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"title":"updated title","context":"new context"}'`
    .cwd(testDir)
    .text()
  expect(result.trim()).toBe(`Updated ${id}`)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].title).toBe('updated title')
  expect(content.issues[0].context).toBe('new context')
})

test('chief update leaves omitted fields unchanged', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test","labels":["bug"],"context":"old context"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} update ${id} '{"title":"new title"}'`.cwd(testDir).quiet()

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].title).toBe('new title')
  expect(content.issues[0].labels).toEqual(['bug'])
  expect(content.issues[0].context).toBe('old context')
})

test('chief update fails when trying to change id', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"id":"newid"}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Cannot change issue id')
})

test('chief update fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} update nonexistent '{"title":"test"}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief update validates result before saving', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"title":""}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('non-empty')
})

test('chief update fails with invalid JSON', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} 'not json'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Invalid JSON')
})

test('chief update validates parent reference', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"parent":"nonexistent"}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('does not exist')
})

test('chief update can clear parent (promote to top-level)', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"parent"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  const childResult = await $`bun run ${CLI} new '{"title":"child","parent":"${parentId}"}'`
    .cwd(testDir)
    .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} update ${childId} '{"parent":null}'`
    .cwd(testDir)
    .text()
  expect(result.trim()).toBe(`Updated ${childId}`)

  const content = await Bun.file(issuesPath).json()
  const child = content.issues.find((i: { id: string }) => i.id === childId)
  expect(child.parent).toBeNull()
})

test('chief update can change parent to different issue', async () => {
  const parent1Result = await $`bun run ${CLI} new '{"title":"parent1"}'`
    .cwd(testDir)
    .text()
  const parent1Id = parent1Result.trim()

  const parent2Result = await $`bun run ${CLI} new '{"title":"parent2"}'`
    .cwd(testDir)
    .text()
  const parent2Id = parent2Result.trim()

  const childResult = await $`bun run ${CLI} new '{"title":"child","parent":"${parent1Id}"}'`
    .cwd(testDir)
    .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} update ${childId} '{"parent":"${parent2Id}"}'`
    .cwd(testDir)
    .text()
  expect(result.trim()).toBe(`Updated ${childId}`)

  const content = await Bun.file(issuesPath).json()
  const child = content.issues.find((i: { id: string }) => i.id === childId)
  expect(child.parent).toBe(parent2Id)
})

test('chief update prevents issue with children from becoming a child', async () => {
  const grandparentResult = await $`bun run ${CLI} new '{"title":"grandparent"}'`
    .cwd(testDir)
    .text()
  const grandparentId = grandparentResult.trim()

  const parentResult = await $`bun run ${CLI} new '{"title":"parent"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new '{"title":"child","parent":"${parentId}"}'`
    .cwd(testDir)
    .quiet()

  const result = await $`bun run ${CLI} update ${parentId} '{"parent":"${grandparentId}"}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('has children')
  expect(result.stderr.toString()).toContain('Max 1 level of nesting')
})

test('chief update fails without arguments', async () => {
  const result = await $`bun run ${CLI} update`.cwd(testDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage:')
})

test('chief update warns on unknown fields but still applies valid fields', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"original"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"title":"updated","typo":"ignored"}'`
    .cwd(testDir)
    .quiet()
    .nothrow()

  expect(result.exitCode).toBe(0)
  expect(result.stderr.toString()).toContain('Warning: Unknown field(s): typo')

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].title).toBe('updated')
})

test('chief update with done: true sets doneAt timestamp', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} update ${id} '{"done":true}'`.cwd(testDir).quiet()

  const content = await Bun.file(issuesPath).json()
  const issue = content.issues.find((i: { id: string }) => i.id === id)
  expect(issue.done).toBe(true)
  expect(issue.doneAt).toBeString()
  expect(new Date(issue.doneAt).getTime()).toBeGreaterThan(0)
})

test('chief update with done: false clears doneAt', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(testDir).quiet()

  let content = await Bun.file(issuesPath).json()
  let issue = content.issues.find((i: { id: string }) => i.id === id)
  expect(issue.doneAt).toBeString()

  await $`bun run ${CLI} update ${id} '{"done":false}'`.cwd(testDir).quiet()

  content = await Bun.file(issuesPath).json()
  issue = content.issues.find((i: { id: string }) => i.id === id)
  expect(issue.done).toBe(false)
  expect(issue.doneAt).toBeNull()
})
