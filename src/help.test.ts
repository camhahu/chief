import { expect, test } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..')
const CLI = join(PROJECT_ROOT, 'src', 'index.ts')

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
  const proc = Bun.spawn(['bun', 'run', CLI, 'unknowncommand'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited

  expect(stderr).toContain('Unknown command: unknowncommand')
  expect(stderr).toContain("Run 'chief --help' for usage.")
  expect(exitCode).toBe(1)
})

test('missing required argument prints error to stderr and exits 1', async () => {
  const proc = Bun.spawn(['bun', 'run', CLI, 'done'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited

  expect(stderr).toContain('Usage: chief done <id>')
  expect(exitCode).toBe(1)
})
