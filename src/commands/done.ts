import { readIssues, writeIssues, findIssueOrExit } from '../store.ts'

export async function done(idPrefix: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(store, idPrefix)

  if (issue.done) {
    console.log(`Already done`)
    return
  }

  issue.done = true
  issue.doneAt = new Date().toISOString()
  await writeIssues(store)

  console.log(`Marked ${issue.id} as done`)
}
