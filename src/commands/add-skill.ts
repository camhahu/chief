const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/camhahu/chief/main'

const SKILL_FILES = ['skill/SKILL.md', 'skill/references/planning.md', 'skill/references/labels.md']

const TARGET_PATHS: Record<string, { project: string; global: string | null }> = {
  opencode: { project: '.opencode/skill/chief', global: '.config/opencode/skill/chief' },
  cursor: { project: '.cursor/skills/chief', global: '.cursor/skills/chief' },
  claude: { project: '.claude/skills/chief', global: '.claude/skills/chief' },
  amp: { project: '.amp/skills/chief', global: '.config/amp/skill/chief' },
  goose: { project: '.goose/skills/chief', global: '.config/goose/skill/chief' },
  github: { project: '.github/skill/chief', global: null },
  vscode: { project: '.vscode/skill/chief', global: null },
  codex: { project: '.codex/skill/chief', global: '.codex/skill/chief' },
}

const TARGETS = Object.keys(TARGET_PATHS)

const PROJECT_ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '')

async function fetchFile(path: string): Promise<string> {
  const localPath = `${PROJECT_ROOT}/${path}`
  const localFile = Bun.file(localPath)
  if (await localFile.exists()) {
    return localFile.text()
  }

  const url = `${GITHUB_RAW_BASE}/${path}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.text()
}

function destPath(sourcePath: string): string {
  return sourcePath.replace('skill/', '')
}

export async function addSkill(target: string, global: boolean): Promise<void> {
  const paths = TARGET_PATHS[target]
  if (!paths) {
    console.error(`Unknown target: ${target}`)
    console.error(`Supported targets: ${TARGETS.join(', ')}`)
    process.exit(1)
  }

  let basePath: string
  if (global) {
    if (!paths.global) {
      console.error(`Target ${target} does not support --global`)
      process.exit(1)
    }
    const home = process.env.HOME ?? process.env.USERPROFILE
    basePath = `${home}/${paths.global}`
  } else {
    basePath = paths.project
  }

  const files = await Promise.all(
    SKILL_FILES.map(async (file) => {
      const content = await fetchFile(file)
      const dest = destPath(file)
      return { dest, content }
    })
  )

  for (const { dest, content } of files) {
    const fullPath = `${basePath}/${dest}`
    await Bun.write(fullPath, content)
    console.log(fullPath)
  }
}

export { TARGETS }
