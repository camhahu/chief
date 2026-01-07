import { expect, test } from 'bun:test'
import { generateId } from './id.ts'

test('generateId returns 6-character hex string', () => {
  const id = generateId([])
  expect(id).toHaveLength(6)
  expect(id).toMatch(/^[0-9a-f]{6}$/)
})

test('generateId returns different IDs on subsequent calls', () => {
  const ids = new Set<string>()
  for (let i = 0; i < 100; i++) {
    ids.add(generateId([]))
  }
  expect(ids.size).toBe(100)
})

test('generateId avoids collision with existing IDs', () => {
  const existing = ['abc123', 'def456', '789abc']
  const id = generateId(existing)
  expect(existing).not.toContain(id)
})

test('generateId handles large set of existing IDs', () => {
  const existing: string[] = []
  for (let i = 0; i < 1000; i++) {
    existing.push(generateId(existing))
  }

  const newId = generateId(existing)
  expect(existing).not.toContain(newId)
  expect(newId).toHaveLength(6)
  expect(newId).toMatch(/^[0-9a-f]{6}$/)
})
