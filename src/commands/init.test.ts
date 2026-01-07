import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir } = setupTestDir('init-test', { init: false })

test('chief init creates .issues/issues.json in empty directory', async () => {
  const result = await $`bun run ${CLI} init`.cwd(testDir).text()

  expect(result.trim()).toBe(`${testDir}/.issues/issues.json`)

  const content = await Bun.file(`${testDir}/.issues/issues.json`).text()
  expect(JSON.parse(content)).toEqual({ issues: [] })
})

test('chief init is idempotent', async () => {
  await $`bun run ${CLI} init`.cwd(testDir).quiet()

  await Bun.write(`${testDir}/.issues/issues.json`, '{"issues":[{"id":"abc123"}]}\n')

  const result = await $`bun run ${CLI} init`.cwd(testDir).text()

  expect(result.trim()).toBe(`${testDir}/.issues/issues.json`)

  const content = await Bun.file(`${testDir}/.issues/issues.json`).text()
  expect(JSON.parse(content)).toEqual({ issues: [{ id: 'abc123' }] })
})
