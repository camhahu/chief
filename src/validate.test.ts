import { describe, expect, test } from 'bun:test'
import {
  ValidationError,
  validateIssueFields,
  validateParentRef,
  validateStore,
  validateNewIssue,
} from './validate'
import type { Issue, IssuesStore } from './store'

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'abc123',
    title: 'Test issue',
    parent: null,
    done: false,
    labels: [],
    context: '',
    criteria: [],
    notes: [],
    ...overrides,
  }
}

describe('validateIssueFields', () => {
  test('accepts valid issue', () => {
    const issue = makeIssue()
    expect(validateIssueFields(issue)).toBe(true)
  })

  test('rejects non-object', () => {
    expect(() => validateIssueFields(null)).toThrow(ValidationError)
    expect(() => validateIssueFields('string')).toThrow(ValidationError)
    expect(() => validateIssueFields(123)).toThrow(ValidationError)
  })

  test('rejects missing or invalid id', () => {
    expect(() => validateIssueFields(makeIssue({ id: '' }))).toThrow(
      'non-empty string id'
    )
    expect(() =>
      validateIssueFields({ ...makeIssue(), id: undefined })
    ).toThrow('non-empty string id')
  })

  test('rejects missing or invalid title', () => {
    expect(() => validateIssueFields(makeIssue({ title: '' }))).toThrow(
      'non-empty string title'
    )
  })

  test('rejects invalid parent', () => {
    expect(() =>
      validateIssueFields({ ...makeIssue(), parent: 123 })
    ).toThrow('parent must be null or a string')
  })

  test('accepts null parent', () => {
    expect(validateIssueFields(makeIssue({ parent: null }))).toBe(true)
  })

  test('accepts string parent', () => {
    expect(validateIssueFields(makeIssue({ parent: 'def456' }))).toBe(
      true
    )
  })

  test('rejects invalid done', () => {
    expect(() =>
      validateIssueFields({ ...makeIssue(), done: 'yes' })
    ).toThrow('done must be a boolean')
  })

  test('rejects invalid labels', () => {
    expect(() =>
      validateIssueFields({ ...makeIssue(), labels: 'bug' })
    ).toThrow('labels must be an array')
    expect(() =>
      validateIssueFields(makeIssue({ labels: ['bug', 123] as string[] }))
    ).toThrow('labels must all be strings')
  })

  test('rejects invalid context', () => {
    expect(() =>
      validateIssueFields({ ...makeIssue(), context: null })
    ).toThrow('context must be a string')
  })

  test('rejects invalid criteria', () => {
    expect(() =>
      validateIssueFields({ ...makeIssue(), criteria: 'test' })
    ).toThrow('criteria must be an array')
  })

  test('rejects invalid notes', () => {
    expect(() =>
      validateIssueFields({ ...makeIssue(), notes: {} })
    ).toThrow('notes must be an array')
  })
})

describe('validateParentRef', () => {
  test('accepts null parent', () => {
    const issue = makeIssue({ parent: null })
    expect(() => validateParentRef(issue, [])).not.toThrow()
  })

  test('rejects self-referential parent', () => {
    const issue = makeIssue({ id: 'abc123', parent: 'abc123' })
    expect(() => validateParentRef(issue, [])).toThrow(
      'cannot be its own parent'
    )
  })

  test('rejects non-existent parent', () => {
    const issue = makeIssue({ parent: 'nonexistent' })
    expect(() => validateParentRef(issue, [])).toThrow(
      'Parent nonexistent does not exist'
    )
  })

  test('accepts existing parent', () => {
    const parent = makeIssue({ id: 'parent1' })
    const child = makeIssue({ id: 'child1', parent: 'parent1' })
    expect(() => validateParentRef(child, [parent])).not.toThrow()
  })

  test('rejects parent that is itself a child', () => {
    const grandparent = makeIssue({ id: 'gp1' })
    const parent = makeIssue({ id: 'parent1', parent: 'gp1' })
    const child = makeIssue({ id: 'child1', parent: 'parent1' })

    expect(() =>
      validateParentRef(child, [grandparent, parent])
    ).toThrow('Max 1 level of nesting allowed')
  })
})

describe('validateStore', () => {
  test('accepts empty store', () => {
    expect(() => validateStore({ issues: [] })).not.toThrow()
  })

  test('accepts valid store with issues', () => {
    const store: IssuesStore = {
      issues: [
        makeIssue({ id: 'a1' }),
        makeIssue({ id: 'b2', parent: 'a1' }),
      ],
    }
    expect(() => validateStore(store)).not.toThrow()
  })

  test('rejects store without issues array', () => {
    expect(() => validateStore({} as IssuesStore)).toThrow(
      'must have an issues array'
    )
  })

  test('rejects duplicate ids', () => {
    const store: IssuesStore = {
      issues: [makeIssue({ id: 'dup' }), makeIssue({ id: 'dup' })],
    }
    expect(() => validateStore(store)).toThrow('Duplicate issue id: dup')
  })

  test('validates parent references', () => {
    const store: IssuesStore = {
      issues: [makeIssue({ id: 'a1', parent: 'nonexistent' })],
    }
    expect(() => validateStore(store)).toThrow('does not exist')
  })
})

describe('validateNewIssue', () => {
  test('accepts valid new issue', () => {
    const existing = [makeIssue({ id: 'existing1' })]
    const newIssue = makeIssue({ id: 'new1' })
    expect(() => validateNewIssue(newIssue, existing)).not.toThrow()
  })

  test('rejects duplicate id', () => {
    const existing = [makeIssue({ id: 'existing1' })]
    const newIssue = makeIssue({ id: 'existing1' })
    expect(() => validateNewIssue(newIssue, existing)).toThrow(
      'already exists'
    )
  })

  test('accepts new issue with valid parent', () => {
    const existing = [makeIssue({ id: 'parent1' })]
    const newIssue = makeIssue({ id: 'new1', parent: 'parent1' })
    expect(() => validateNewIssue(newIssue, existing)).not.toThrow()
  })

  test('rejects new issue with invalid parent', () => {
    const existing = [makeIssue({ id: 'parent1' })]
    const newIssue = makeIssue({ id: 'new1', parent: 'nonexistent' })
    expect(() => validateNewIssue(newIssue, existing)).toThrow(
      'does not exist'
    )
  })
})
