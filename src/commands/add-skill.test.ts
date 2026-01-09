import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir } = setupTestDir('add-skill-test', { init: false })

test('chief add-skill opencode installs skill files to project', async () => {
  const result = await $`bun run ${CLI} add-skill opencode`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines).toHaveLength(1)
  expect(lines[0]).toBe('.opencode/skill/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.opencode/skill/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
  expect(skillFile).toContain('chief init')
  expect(skillFile).toContain('Parent/Child Issues')
  expect(skillFile).toContain('Labels')
})

test('chief add-skill claude installs to .claude/skills path', async () => {
  const result = await $`bun run ${CLI} add-skill claude`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe('.claude/skills/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.claude/skills/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill cursor installs to .cursor/skills path', async () => {
  const result = await $`bun run ${CLI} add-skill cursor`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe('.cursor/skills/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.cursor/skills/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill github installs to .github/skill path', async () => {
  const result = await $`bun run ${CLI} add-skill github`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe('.github/skill/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.github/skill/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill vscode installs to .vscode/skill path', async () => {
  const result = await $`bun run ${CLI} add-skill vscode`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe('.vscode/skill/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.vscode/skill/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill codex installs to .codex/skill path', async () => {
  const result = await $`bun run ${CLI} add-skill codex`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe('.codex/skill/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.codex/skill/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill amp installs to .amp/skills path', async () => {
  const result = await $`bun run ${CLI} add-skill amp`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe('.amp/skills/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.amp/skills/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill goose installs to .goose/skills path', async () => {
  const result = await $`bun run ${CLI} add-skill goose`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe('.goose/skills/chief/SKILL.md')

  const skillFile = await Bun.file(`${testDir}/.goose/skills/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill unknown target fails', async () => {
  const result = await $`bun run ${CLI} add-skill invalid`.cwd(testDir).nothrow().quiet()

  expect(result.exitCode).toBe(1)
  const stderr = await new Response(result.stderr).text()
  expect(stderr).toContain('Unknown target: invalid')
  expect(stderr).toContain('Supported targets:')
})

test('chief add-skill github --global fails', async () => {
  const result = await $`bun run ${CLI} add-skill github --global`.cwd(testDir).nothrow().quiet()

  expect(result.exitCode).toBe(1)
  const stderr = await new Response(result.stderr).text()
  expect(stderr).toContain('does not support --global')
})

test('chief add-skill vscode --global fails', async () => {
  const result = await $`bun run ${CLI} add-skill vscode --global`.cwd(testDir).nothrow().quiet()

  expect(result.exitCode).toBe(1)
  const stderr = await new Response(result.stderr).text()
  expect(stderr).toContain('does not support --global')
})

test('chief add-skill opencode --global installs to user config', async () => {
  const globalDir = `${testDir}/fake-home`
  await $`mkdir -p ${globalDir}`.quiet()

  const result = await $`HOME=${globalDir} bun run ${CLI} add-skill opencode --global`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines).toHaveLength(1)
  expect(lines[0]).toBe(`${globalDir}/.config/opencode/skill/chief/SKILL.md`)

  const skillFile = await Bun.file(`${globalDir}/.config/opencode/skill/chief/SKILL.md`).text()
  expect(skillFile).toContain('name: chief')
})

test('chief add-skill claude --global installs to ~/.claude/skills', async () => {
  const globalDir = `${testDir}/fake-home`
  await $`mkdir -p ${globalDir}`.quiet()

  const result = await $`HOME=${globalDir} bun run ${CLI} add-skill claude --global`.cwd(testDir).text()

  const lines = result.trim().split('\n')
  expect(lines[0]).toBe(`${globalDir}/.claude/skills/chief/SKILL.md`)
})
