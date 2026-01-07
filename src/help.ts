const commands: Record<string, { usage: string; description: string }> = {
  init: {
    usage: 'chief init',
    description: 'Initialize a new .issues directory',
  },
  new: {
    usage: "chief new '{\"title\": \"...\"}'",
    description: 'Create a new issue from JSON',
  },
  done: {
    usage: 'chief done <id>',
    description: 'Mark an issue as done',
  },
  reopen: {
    usage: 'chief reopen <id>',
    description: 'Reopen a completed issue',
  },
  remove: {
    usage: 'chief remove <id>',
    description: 'Remove an issue and its children',
  },
  note: {
    usage: 'chief note <id> <text>',
    description: 'Add a note to an issue',
  },
  list: {
    usage: 'chief list',
    description: 'List all issues',
  },
  show: {
    usage: 'chief show <id>',
    description: 'Show full details of an issue',
  },
  update: {
    usage: "chief update <id> '{\"field\": \"value\"}'",
    description: 'Update fields on an existing issue',
  },
}

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
