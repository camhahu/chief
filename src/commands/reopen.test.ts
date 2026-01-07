import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir, issuesPath } = setupTestDir('reopen-test')

test('chief reopen sets done to false', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(testDir).quiet()

  const result = await $`bun run ${CLI} reopen ${id}`.cwd(testDir).text()
  expect(result.trim()).toBe(`Reopened ${id}`)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].done).toBe(false)
})

test('chief reopen clears doneAt to null', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(testDir).quiet()

  const beforeReopen = await Bun.file(issuesPath).json()
  expect(beforeReopen.issues[0].doneAt).not.toBeNull()

  await $`bun run ${CLI} reopen ${id}`.cwd(testDir).quiet()

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].doneAt).toBeNull()
})

test('chief reopen fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} reopen nonexistent`.cwd(testDir).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief reopen is idempotent', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} reopen ${id}`.cwd(testDir).text()
  expect(result.trim()).toBe(`Already open`)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].done).toBe(false)
})

test('chief reopen fails without ID argument', async () => {
  const result = await $`bun run ${CLI} reopen`.cwd(testDir).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief reopen <id>')
})
