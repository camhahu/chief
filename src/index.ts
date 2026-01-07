#!/usr/bin/env bun

import { init } from './commands/init.ts'
import { newIssue } from './commands/new.ts'
import { list, type ListFilter } from './commands/list.ts'
import { done } from './commands/done.ts'
import { reopen } from './commands/reopen.ts'
import { remove } from './commands/remove.ts'
import { show } from './commands/show.ts'
import { note } from './commands/note.ts'
import { update } from './commands/update.ts'
import { printMainHelp, printCommandHelp } from './help.ts'

const args = process.argv.slice(2)
const command = args[0]

const wantsHelp = args.includes('--help') || args.includes('-h')

if (!command || wantsHelp) {
  if (command && printCommandHelp(command)) {
    process.exit(0)
  }
  printMainHelp()
  process.exit(0)
}

switch (command) {
  case 'init':
    await init()
    break
  case 'new':
    if (args[1]) {
      await newIssue(args[1])
    } else {
      console.error('Usage: chief new \'{"title": "..."}\'')
      process.exit(1)
    }
    break
  case 'list': {
    const hasAll = args.includes('--all')
    const hasOpen = args.includes('--open')
    const hasDone = args.includes('--done')
    if (hasOpen && hasDone) {
      console.error('Error: --open and --done are mutually exclusive')
      process.exit(1)
    }
    let filter: ListFilter = 'open'
    if (hasAll) filter = 'all'
    if (hasOpen) filter = 'open'
    if (hasDone) filter = 'done'

    const labelArg = args.find((a) => a.startsWith('--label='))
    const label = labelArg?.slice('--label='.length)
    await list({ filter, label })
    break
  }
  case 'done':
    if (args[1]) {
      await done(args[1])
    } else {
      console.error('Usage: chief done <id>')
      process.exit(1)
    }
    break
  case 'reopen':
    if (args[1]) {
      await reopen(args[1])
    } else {
      console.error('Usage: chief reopen <id>')
      process.exit(1)
    }
    break
  case 'remove':
    if (args[1]) {
      await remove(args[1])
    } else {
      console.error('Usage: chief remove <id>')
      process.exit(1)
    }
    break
  case 'show':
    if (args[1]) {
      await show(args[1])
    } else {
      console.error('Usage: chief show <id>')
      process.exit(1)
    }
    break
  case 'note':
    if (args[1] && args[2]) {
      await note(args[1], args[2])
    } else {
      console.error('Usage: chief note <id> <text>')
      process.exit(1)
    }
    break
  case 'update':
    if (args[1] && args[2]) {
      await update(args[1], args[2])
    } else {
      console.error('Usage: chief update <id> \'{"field": "value"}\'')
      process.exit(1)
    }
    break
  default:
    console.error(`Unknown command: ${command}`)
    console.error(`Run 'chief --help' for usage.`)
    process.exit(1)
}
