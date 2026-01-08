import { readIssues, writeIssues, findIssue } from '../store.ts'
import { findIssueOrExit } from '../validate.ts'

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function note(idPrefix: string, text: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(findIssue(store, idPrefix))

  const timestampedNote = `${formatDate(new Date())}: ${text}`
  issue.notes.push(timestampedNote)
  await writeIssues(store)

  console.log(`Added note to ${issue.id}`)
}
