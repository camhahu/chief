import { ISSUES_PATH_IN_CWD } from '../store.ts'

export async function init(): Promise<void> {
  const file = Bun.file(ISSUES_PATH_IN_CWD)
  if (await file.exists()) {
    console.log('Already initialized')
    console.log(ISSUES_PATH_IN_CWD)
    return
  }

  await Bun.write(ISSUES_PATH_IN_CWD, '{"issues":[]}\n')
  console.log(ISSUES_PATH_IN_CWD)
}
