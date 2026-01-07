import { mkdir } from 'node:fs/promises'
import { ISSUES_DIR_IN_CWD, ISSUES_PATH_IN_CWD } from '../store.ts'

export async function init(): Promise<void> {
  const file = Bun.file(ISSUES_PATH_IN_CWD)
  if (await file.exists()) {
    console.log(ISSUES_PATH_IN_CWD)
    return
  }

  await mkdir(ISSUES_DIR_IN_CWD, { recursive: true })
  await Bun.write(ISSUES_PATH_IN_CWD, '{"issues":[]}\n')
  console.log(ISSUES_PATH_IN_CWD)
}
