import { beforeEach, afterEach } from 'bun:test'
import { $ } from 'bun'

export const PROJECT_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')

export const CLI = `${PROJECT_ROOT}/src/index.ts`

export interface TestContext {
  testDir: string
  issuesPath: string
}

interface SetupOptions {
  init?: boolean
  createIssuesDir?: boolean
}

export function setupTestDir(name: string, options?: SetupOptions): TestContext {
  const testDir = `${PROJECT_ROOT}/.testfiles/${name}`
  const issuesPath = `${testDir}/.issues/issues.json`
  const shouldInit = options?.init ?? true
  const createIssuesDir = options?.createIssuesDir ?? false

  beforeEach(async () => {
    await $`rm -rf ${testDir}`.quiet()
    await $`mkdir -p ${testDir}`.quiet()
    await $`mkdir -p ${testDir}/.git`.quiet()
    await Bun.write(`${testDir}/.git/HEAD`, '')
    if (createIssuesDir) {
      await $`mkdir -p ${testDir}/.issues`.quiet()
      await Bun.write(issuesPath, '{"issues":[]}\n')
    } else if (shouldInit) {
      await $`bun run ${CLI} init`.cwd(testDir).quiet()
    }
  })

  afterEach(async () => {
    await $`rm -rf ${testDir}`.quiet()
  })

  return { testDir, issuesPath }
}
