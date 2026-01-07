import { ValidationError } from './errors.ts'

function validateNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ValidationError(`Issue must have a non-empty string ${fieldName}`)
  }
}

function validateNullableString(value: unknown, fieldName: string): void {
  if (value !== null && typeof value !== 'string') {
    throw new ValidationError(`Issue ${fieldName} must be null or a string`)
  }
}

function validateBoolean(value: unknown, fieldName: string): void {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`Issue ${fieldName} must be a boolean`)
  }
}

function validateString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`Issue ${fieldName} must be a string`)
  }
}

function validateStringArray(value: unknown, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`Issue ${fieldName} must be an array`)
  }
  if (!value.every((item) => typeof item === 'string')) {
    throw new ValidationError(`Issue ${fieldName} must all be strings`)
  }
}

export const ISSUE_FIELDS = {
  id: { default: '', validate: validateNonEmptyString },
  title: { default: '', validate: validateNonEmptyString },
  parent: { default: null as string | null, validate: validateNullableString },
  done: { default: false, validate: validateBoolean },
  doneAt: { default: null as string | null, validate: validateNullableString },
  labels: { default: [] as string[], validate: validateStringArray },
  context: { default: '', validate: validateString },
  criteria: { default: [] as string[], validate: validateStringArray },
  notes: { default: [] as string[], validate: validateStringArray },
}

export type IssueFieldName = keyof typeof ISSUE_FIELDS

export const ALL_FIELD_NAMES = Object.keys(ISSUE_FIELDS) as IssueFieldName[]

export const UPDATABLE_FIELD_NAMES = ALL_FIELD_NAMES.filter(
  (name) => name !== 'id' && name !== 'doneAt'
)

export function getDefault<K extends IssueFieldName>(
  field: K
): (typeof ISSUE_FIELDS)[K]['default'] {
  return ISSUE_FIELDS[field].default
}

export function validateField(fieldName: IssueFieldName, value: unknown): void {
  ISSUE_FIELDS[fieldName].validate(value, fieldName)
}
