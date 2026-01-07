import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir, issuesPath } = setupTestDir('done-test')

test('chief done marks issue as done', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} done ${id}`.cwd(testDir).text()
  expect(result.trim()).toBe(`Marked ${id} as done`)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].done).toBe(true)
})

test('chief done sets doneAt timestamp', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const before = new Date().toISOString()
  await $`bun run ${CLI} done ${id}`.cwd(testDir).quiet()
  const after = new Date().toISOString()

  const content = await Bun.file(issuesPath).json()
  const doneAt = content.issues[0].doneAt
  expect(typeof doneAt).toBe('string')
  expect(doneAt >= before).toBe(true)
  expect(doneAt <= after).toBe(true)
})

test('chief done fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} done nonexistent`.cwd(testDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief done is idempotent', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(testDir).quiet()

  const contentBefore = await Bun.file(issuesPath).json()
  const doneAtBefore = contentBefore.issues[0].doneAt

  const result = await $`bun run ${CLI} done ${id}`.cwd(testDir).text()
  expect(result.trim()).toBe(`Already done`)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].done).toBe(true)
  expect(content.issues[0].doneAt).toBe(doneAtBefore)
})

test('chief done fails without ID argument', async () => {
  const result = await $`bun run ${CLI} done`.cwd(testDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief done <id>')
})
