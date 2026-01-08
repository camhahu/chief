import { readIssues, writeIssues, findIssue } from '../store.ts'
import { findIssueOrExit } from '../validate.ts'

export async function done(idPrefix: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(findIssue(store, idPrefix))

  if (issue.done) {
    console.log(`Already done`)
    return
  }

  issue.done = true
  issue.doneAt = new Date().toISOString()
  await writeIssues(store)

  console.log(`Marked ${issue.id} as done`)
}
