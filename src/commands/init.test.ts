import { expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const TEST_DIR = join(PROJECT_ROOT, '.testfiles', 'init-test')
const CLI = join(PROJECT_ROOT, 'src', 'index.ts')

beforeEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
  await $`mkdir -p ${TEST_DIR}`.quiet()
})

afterEach(async () => {
  await $`rm -rf ${TEST_DIR}`.quiet()
})

test('chief init creates .issues/issues.json in empty directory', async () => {
  const result = await $`bun run ${CLI} init`.cwd(TEST_DIR).text()

  expect(result.trim()).toBe(join(TEST_DIR, '.issues', 'issues.json'))

  const content = await Bun.file(
    join(TEST_DIR, '.issues', 'issues.json')
  ).text()
  expect(JSON.parse(content)).toEqual({ issues: [] })
})

test('chief init is idempotent', async () => {
  await $`bun run ${CLI} init`.cwd(TEST_DIR).quiet()

  await Bun.write(
    join(TEST_DIR, '.issues', 'issues.json'),
    '{"issues":[{"id":"abc123"}]}\n'
  )

  const result = await $`bun run ${CLI} init`.cwd(TEST_DIR).text()

  expect(result.trim()).toBe(join(TEST_DIR, '.issues', 'issues.json'))

  const content = await Bun.file(
    join(TEST_DIR, '.issues', 'issues.json')
  ).text()
  expect(JSON.parse(content)).toEqual({ issues: [{ id: 'abc123' }] })
})
