import { readIssues, writeIssues, findIssue } from '../store.ts'
import { findIssueOrExit } from '../validate.ts'

export async function reopen(idPrefix: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(findIssue(store, idPrefix))

  if (!issue.done) {
    console.log(`Already open`)
    return
  }

  issue.done = false
  issue.doneAt = null
  await writeIssues(store)

  console.log(`Reopened ${issue.id}`)
}
