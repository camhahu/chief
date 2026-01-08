import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI } from './test-helpers.ts'

test('chief --help lists all commands with descriptions', async () => {
  const result = await $`bun run ${CLI} --help`.text()

  expect(result).toContain('A simple issue tracker')
  expect(result).toContain('Commands:')
  expect(result).toContain('init')
  expect(result).toContain('new')
  expect(result).toContain('done')
  expect(result).toContain('reopen')
  expect(result).toContain('remove')
  expect(result).toContain('note')
  expect(result).toContain('list')
  expect(result).toContain('show')
})

test('chief -h is alias for --help', async () => {
  const result = await $`bun run ${CLI} -h`.text()

  expect(result).toContain('A simple issue tracker')
})

test('chief with no args shows help', async () => {
  const result = await $`bun run ${CLI}`.quiet().nothrow()

  expect(result.stderr.toString()).toContain('A simple issue tracker')
})

test('chief <cmd> --help shows usage', async () => {
  const result = await $`bun run ${CLI} new --help`.text()

  expect(result).toContain('Usage: chief new')
  expect(result).toContain('Create a new issue')
})

test('chief new --help shows field schema', async () => {
  const result = await $`bun run ${CLI} new --help`.text()

  expect(result).toContain('Fields:')
  expect(result).toContain('title')
  expect(result).toContain('(required)')
  expect(result).toContain('labels')
  expect(result).toContain('string[]')
  expect(result).toContain('context')
  expect(result).toContain('criteria')
  expect(result).toContain('parent')
  expect(result).toContain('notes')
})

test('chief <cmd> -h is alias for --help', async () => {
  const result = await $`bun run ${CLI} done -h`.text()

  expect(result).toContain('Usage: chief done')
  expect(result).toContain('<id>')
})

test('unknown command prints error to stderr and exits 1', async () => {
  const result = await $`bun run ${CLI} unknowncommand`.quiet().nothrow()

  expect(result.stderr.toString()).toContain("unknown command 'unknowncommand'")
  expect(result.exitCode).toBe(1)
})

test('missing required argument prints error to stderr and exits 1', async () => {
  const result = await $`bun run ${CLI} done`.quiet().nothrow()

  expect(result.stderr.toString()).toContain("missing required argument 'id'")
  expect(result.exitCode).toBe(1)
})
