import { expect, test } from 'bun:test'
import { $ } from 'bun'
import { CLI, setupTestDir } from '../test-helpers.ts'

const { testDir } = setupTestDir('show-test')

test('chief show displays all issue fields', async () => {
  const issueJson = JSON.stringify({
    title: 'Test issue',
    context: 'This is the context',
    labels: ['bug', 'urgent'],
    criteria: ['First criterion', 'Second criterion'],
    notes: ['2026-01-01: First note'],
  })

  const createResult = await $`bun run ${CLI} new ${issueJson}`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} show ${id}`.cwd(testDir).text()

  expect(result).toContain('Test issue')
  expect(result).toContain(id)
  expect(result).toContain('open')
  expect(result).toContain('bug')
  expect(result).toContain('urgent')
  expect(result).toContain('This is the context')
  expect(result).toContain('First criterion')
  expect(result).toContain('Second criterion')
  expect(result).toContain('2026-01-01: First note')
})

test('chief show displays children', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Parent"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  const childResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child task', parent: parentId })}`
      .cwd(testDir)
      .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} show ${parentId}`.cwd(testDir).text()

  expect(result).toContain('Children:')
  expect(result).toContain(childId)
  expect(result).toContain('Child task')
})

test('chief show displays parent reference', async () => {
  const parentResult = await $`bun run ${CLI} new '{"title":"Parent"}'`
    .cwd(testDir)
    .text()
  const parentId = parentResult.trim()

  const childResult =
    await $`bun run ${CLI} new ${JSON.stringify({ title: 'Child task', parent: parentId })}`
      .cwd(testDir)
      .text()
  const childId = childResult.trim()

  const result = await $`bun run ${CLI} show ${childId}`.cwd(testDir).text()

  expect(result).toContain('Parent:')
  expect(result).toContain(parentId)
  expect(result).toContain('Parent')
})

test('chief show displays done status', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"Done issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(testDir).quiet()

  const result = await $`bun run ${CLI} show ${id}`.cwd(testDir).text()
  expect(result).toContain('done')
})

test('chief show displays doneAt when present', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"Done issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  await $`bun run ${CLI} done ${id}`.cwd(testDir).quiet()

  const result = await $`bun run ${CLI} show ${id}`.cwd(testDir).text()
  expect(result).toContain('Completed:')
})

test('chief show does not display doneAt for open issues', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"Open issue"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} show ${id}`.cwd(testDir).text()
  expect(result).not.toContain('Completed:')
})

test('chief show fails for unknown ID', async () => {
  const result = await $`bun run ${CLI} show abcdef`.cwd(testDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('abcdef')
  expect(result.stderr.toString()).toContain('not found')
})

test('chief show without ID prints usage', async () => {
  const result = await $`bun run ${CLI} show`.cwd(testDir).quiet().nothrow()

  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain('Usage:')
})

test('chief show formats multiline notes with consistent indentation', async () => {
  const issueJson = JSON.stringify({
    title: 'Multiline note test',
    notes: ['2026-01-01: First line\nSecond line\nThird line'],
  })

  const createResult = await $`bun run ${CLI} new ${issueJson}`
    .cwd(testDir)
    .text()
  const id = createResult.trim()

  const result = await $`bun run ${CLI} show ${id}`.cwd(testDir).text()

  expect(result).toContain('  - 2026-01-01: First line')
  expect(result).toContain('    Second line')
  expect(result).toContain('    Third line')
})

test('chief show matches ID prefix', async () => {
  const createResult = await $`bun run ${CLI} new '{"title":"Prefix test"}'`
    .cwd(testDir)
    .text()
  const id = createResult.trim()
  const prefix = id.slice(0, 2)
  const result = await $`bun run ${CLI} show ${prefix}`.cwd(testDir).text()

  expect(result).toContain('Prefix test')
  expect(result).toContain(id)
})

test('chief show fails with ambiguous prefix', async () => {
  const result1 = await $`bun run ${CLI} new '{"title":"First"}'`
    .cwd(testDir)
    .text()
  const id1 = result1.trim()

  const result2 = await $`bun run ${CLI} new '{"title":"Second"}'`
    .cwd(testDir)
    .text()
  const id2 = result2.trim()

  let commonLen = 0
  while (commonLen < id1.length && id1[commonLen] === id2[commonLen]) {
    commonLen++
  }

  if (commonLen > 0) {
    const ambiguousPrefix = id1.slice(0, commonLen)
    const showResult = await $`bun run ${CLI} show ${ambiguousPrefix}`
      .cwd(testDir)
      .quiet()
      .nothrow()

    expect(showResult.exitCode).toBe(1)
    expect(showResult.stderr.toString()).toContain('Ambiguous')
    expect(showResult.stderr.toString()).toContain(id1)
    expect(showResult.stderr.toString()).toContain(id2)
  }
})
