import { commands } from './commands.ts'

export function printMainHelp(): void {
  console.log(`chief - A simple issue tracker

Usage: chief <command> [options]

Commands:`)

  const maxLen = Math.max(...Object.keys(commands).map((k) => k.length))
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${cmd.description}`)
  }

  console.log(`
Options:
  --help, -h  Show help for a command

Run 'chief <command> --help' for more information on a command.`)
}

export function printCommandHelp(command: string): boolean {
  const cmd = commands[command]
  if (!cmd) {
    return false
  }

  console.log(`${cmd.description}

Usage: ${cmd.usage}`)
  return true
}
