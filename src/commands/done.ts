import { readIssues, writeIssues } from '../store.ts'

export async function done(id: string): Promise<void> {
  const store = await readIssues()

  const issue = store.issues.find((i) => i.id === id)
  if (!issue) {
    console.error(`Issue ${id} not found`)
    process.exit(1)
  }

  issue.done = true
  await writeIssues(store)

  console.log(`Marked ${id} as done`)
}
