import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir, issuesPath } = setupTestDir('remove-test')

test('chief remove deletes issue from list', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} remove ${id}`.cwd(testDir).text()
  expect(result.trim()).toBe(`Removed ${id}`)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues.length).toBe(0)
})

test('chief remove fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} remove nonexistent`.cwd(testDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief remove fails without ID argument', async () => {
  const result = await $`bun run ${CLI} remove`.cwd(testDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain("missing required argument 'id'")
})

test('chief remove deletes children recursively', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"parent issue"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  const child1Result =
    await $`bun run ${CLI} new '{"title":"child 1","parent":"${parentId}"}'`
      .cwd(testDir)
      .text()
  const child1Id = child1Result.trim()

  const child2Result =
    await $`bun run ${CLI} new '{"title":"child 2","parent":"${parentId}"}'`
      .cwd(testDir)
      .text()
  const child2Id = child2Result.trim()

  const result = await $`bun run ${CLI} remove ${parentId}`.cwd(testDir).text()
  expect(result.trim()).toContain(`Removed ${parentId} and children:`)
  expect(result.trim()).toContain(child1Id)
  expect(result.trim()).toContain(child2Id)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues.length).toBe(0)
})

test('chief remove deletes only the issue when no children', async () => {
  await $`bun run ${CLI} new '{"title":"other issue"}'`.cwd(testDir).quiet()

  const targetResult = await $`bun run ${CLI} new '{"title":"target issue"}'`
    .cwd(testDir)
    .text()
  const targetId = targetResult.trim()

  await $`bun run ${CLI} remove ${targetId}`.cwd(testDir).quiet()

  const content = await Bun.file(issuesPath).json()
  expect(content.issues.length).toBe(1)
  expect(content.issues[0].title).toBe('other issue')
})
