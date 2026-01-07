import { readIssues, writeIssues, findIssueOrExit } from '../store.ts'

export async function done(id: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(store, id)

  issue.done = true
  issue.doneAt = new Date().toISOString()
  await writeIssues(store)

  console.log(`Marked ${id} as done`)
}
