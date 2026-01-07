import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'update-test')
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

test('chief update merges fields into existing issue', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"original title"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"title":"updated title","context":"new context"}'`
    .cwd(TEST_DIR)
    .text()
  expect(result.trim()).toBe(`Updated ${id}`)

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].title).toBe('updated title')
  expect(content.issues[0].context).toBe('new context')
})

test('chief update leaves omitted fields unchanged', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test","labels":["bug"],"context":"old context"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} update ${id} '{"title":"new title"}'`.cwd(TEST_DIR).quiet()

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].title).toBe('new title')
  expect(content.issues[0].labels).toEqual(['bug'])
  expect(content.issues[0].context).toBe('old context')
})

test('chief update fails when trying to change id', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"id":"newid"}'`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Cannot change issue id')
})

test('chief update fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} update nonexistent '{"title":"test"}'`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief update validates result before saving', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"title":""}'`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('non-empty')
})

test('chief update fails with invalid JSON', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} 'not json'`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Invalid JSON')
})

test('chief update validates parent reference', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"parent":"nonexistent"}'`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('does not exist')
})

test('chief update can clear parent (promote to top-level)', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"parent"}'`
    .cwd(TEST_DIR)
    .text()
  const parentId = parentResult.trim()

  const childResult = await $`bun run ${CLI} new '{"title":"child","parent":"${parentId}"}'`
    .cwd(TEST_DIR)
    .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} update ${childId} '{"parent":null}'`
    .cwd(TEST_DIR)
    .text()
  expect(result.trim()).toBe(`Updated ${childId}`)

  const content = await Bun.file(ISSUES_PATH).json()
  const child = content.issues.find((i: { id: string }) => i.id === childId)
  expect(child.parent).toBeNull()
})

test('chief update can change parent to different issue', async () => {
  const parent1Result = await $`bun run ${CLI} new '{"title":"parent1"}'`
    .cwd(TEST_DIR)
    .text()
  const parent1Id = parent1Result.trim()

  const parent2Result = await $`bun run ${CLI} new '{"title":"parent2"}'`
    .cwd(TEST_DIR)
    .text()
  const parent2Id = parent2Result.trim()

  const childResult = await $`bun run ${CLI} new '{"title":"child","parent":"${parent1Id}"}'`
    .cwd(TEST_DIR)
    .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} update ${childId} '{"parent":"${parent2Id}"}'`
    .cwd(TEST_DIR)
    .text()
  expect(result.trim()).toBe(`Updated ${childId}`)

  const content = await Bun.file(ISSUES_PATH).json()
  const child = content.issues.find((i: { id: string }) => i.id === childId)
  expect(child.parent).toBe(parent2Id)
})

test('chief update prevents issue with children from becoming a child', async () => {
  const grandparentResult = await $`bun run ${CLI} new '{"title":"grandparent"}'`
    .cwd(TEST_DIR)
    .text()
  const grandparentId = grandparentResult.trim()

  const parentResult = await $`bun run ${CLI} new '{"title":"parent"}'`
    .cwd(TEST_DIR)
    .text()
  const parentId = parentResult.trim()

  await $`bun run ${CLI} new '{"title":"child","parent":"${parentId}"}'`
    .cwd(TEST_DIR)
    .quiet()

  const result = await $`bun run ${CLI} update ${parentId} '{"parent":"${grandparentId}"}'`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('has children')
  expect(result.stderr.toString()).toContain('Max 1 level of nesting')
})

test('chief update fails without arguments', async () => {
  const result = await $`bun run ${CLI} update`.cwd(TEST_DIR).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage:')
})

test('chief update warns on unknown fields but still applies valid fields', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"original"}'`
    .cwd(TEST_DIR)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} update ${id} '{"title":"updated","typo":"ignored"}'`
    .cwd(TEST_DIR)
    .nothrow()

  expect(result.exitCode).toBe(0)
  expect(result.stderr.toString()).toContain('Warning: Unknown field(s): typo')

  const content = await Bun.file(ISSUES_PATH).json()
  expect(content.issues[0].title).toBe('updated')
})
