export function generateId(existingIds: string[]): string {
  const existingSet = new Set(existingIds)

  while (true) {
    const bytes = crypto.getRandomValues(new Uint8Array(3))
    const id = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (!existingSet.has(id)) {
      return id
    }
  }
}
