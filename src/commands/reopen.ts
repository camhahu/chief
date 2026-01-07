import { readIssues, writeIssues, findIssueOrExit } from '../store.ts'

export async function reopen(id: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(store, id)

  if (!issue.done) {
    console.log(`Already open`)
    return
  }

  issue.done = false
  issue.doneAt = null
  await writeIssues(store)

  console.log(`Reopened ${id}`)
}
