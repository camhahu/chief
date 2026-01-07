import { readIssues, writeIssues } from '../store.ts'

export async function remove(id: string): Promise<void> {
  const store = await readIssues()

  const issue = store.issues.find((i) => i.id === id)
  if (!issue) {
    console.error(`Issue ${id} not found`)
    process.exit(1)
  }

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
