import { readIssues, writeIssues, findIssue } from '../store.ts'
import { findIssueOrExit } from '../validate.ts'

export async function remove(idPrefix: string): Promise<void> {
  const store = await readIssues()
  const issue = findIssueOrExit(findIssue(store, idPrefix))
  const id = issue.id

  const childIds = store.issues.filter((i) => i.parent === id).map((i) => i.id)
  const idsToRemove = new Set([id, ...childIds])
  store.issues = store.issues.filter((i) => !idsToRemove.has(i.id))

  await writeIssues(store)

  if (childIds.length === 0) {
    console.log(`Removed ${id}`)
  } else {
    console.log(`Removed ${id} and children: ${childIds.join(', ')}`)
  }
}
