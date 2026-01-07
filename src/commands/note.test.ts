import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir, issuesPath } = setupTestDir('note-test')

test('chief note appends timestamped note to issue', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} note ${id} "this is a note"`.cwd(testDir).text()
  expect(result.trim()).toBe(`Added note to ${id}`)

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].notes).toHaveLength(1)
  expect(content.issues[0].notes[0]).toMatch(/^\d{4}-\d{2}-\d{2}: this is a note$/)
})

test('chief note fails with unknown ID', async () => {
  const result = await $`bun run ${CLI} note nonexistent "some note"`.cwd(testDir).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Issue nonexistent not found')
})

test('chief note fails without text argument', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} note ${id}`.cwd(testDir).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief note <id> <text>')
})

test('chief note fails without any arguments', async () => {
  const result = await $`bun run ${CLI} note`.cwd(testDir).nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage: chief note <id> <text>')
})

test('chief note appends multiple notes', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"test issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} note ${id} "first note"`.cwd(testDir).quiet()
  await $`bun run ${CLI} note ${id} "second note"`.cwd(testDir).quiet()

  const content = await Bun.file(issuesPath).json()
  expect(content.issues[0].notes).toHaveLength(2)
  expect(content.issues[0].notes[0]).toMatch(/: first note$/)
  expect(content.issues[0].notes[1]).toMatch(/: second note$/)
})
