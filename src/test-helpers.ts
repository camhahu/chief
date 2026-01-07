import { beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

export const PROJECT_ROOT = join(import.meta.dir, '..')

export const CLI = join(PROJECT_ROOT, 'src', 'index.ts')

export interface TestContext {
  testDir: string
  issuesPath: string
}

interface SetupOptions {
  init?: boolean
  createIssuesDir?: boolean
}

export function setupTestDir(name: string, options?: SetupOptions): TestContext {
  const testDir = join(PROJECT_ROOT, '.testfiles', name)
  const issuesPath = join(testDir, '.issues', 'issues.json')
  const shouldInit = options?.init ?? true
  const createIssuesDir = options?.createIssuesDir ?? false

  beforeEach(async () => {
    await $`rm -rf ${testDir}`.quiet()
    await $`mkdir -p ${testDir}`.quiet()
    if (createIssuesDir) {
      await $`mkdir -p ${join(testDir, '.issues')}`.quiet()
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
