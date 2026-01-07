import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI } from './test-helpers.ts'

test('chief --help lists all commands with descriptions', async () => {
  const result = await $`bun run ${CLI} --help`.text()

  expect(result).toContain('chief - A simple issue tracker')
  expect(result).toContain('Commands:')
  expect(result).toContain('init')
  expect(result).toContain('new')
  expect(result).toContain('done')
  expect(result).toContain('reopen')
  expect(result).toContain('remove')
  expect(result).toContain('note')
  expect(result).toContain('list')
  expect(result).toContain('show')
  expect(result).toContain("Run 'chief <command> --help'")
})

test('chief -h is alias for --help', async () => {
  const result = await $`bun run ${CLI} -h`.text()

  expect(result).toContain('chief - A simple issue tracker')
})

test('chief with no args shows help', async () => {
  const result = await $`bun run ${CLI}`.text()

  expect(result).toContain('chief - A simple issue tracker')
})

test('chief <cmd> --help shows usage', async () => {
  const result = await $`bun run ${CLI} new --help`.text()

  expect(result).toContain('Usage: chief new')
  expect(result).toContain('Create a new issue')
})

test('chief <cmd> -h is alias for --help', async () => {
  const result = await $`bun run ${CLI} done -h`.text()

  expect(result).toContain('Usage: chief done <id>')
})

test('unknown command prints error to stderr and exits 1', async () => {
  const result = await $`bun run ${CLI} unknowncommand`.nothrow()

  expect(result.stderr.toString()).toContain('Unknown command: unknowncommand')
  expect(result.stderr.toString()).toContain("Run 'chief --help' for usage.")
  expect(result.exitCode).toBe(1)
})

test('missing required argument prints error to stderr and exits 1', async () => {
  const result = await $`bun run ${CLI} done`.nothrow()

  expect(result.stderr.toString()).toContain('Usage: chief done <id>')
  expect(result.exitCode).toBe(1)
})
