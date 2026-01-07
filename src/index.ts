#!/usr/bin/env bun

import { init } from './commands/init.ts'
import { newIssue } from './commands/new.ts'
import { list } from './commands/list.ts'
import { done } from './commands/done.ts'
import { reopen } from './commands/reopen.ts'
import { remove } from './commands/remove.ts'
import { show } from './commands/show.ts'

const args = process.argv.slice(2)
const command = args[0]

function printHelp() {
  console.log(`chief - A simple issue tracker

Usage: chief <command> [options]

Commands:
  init        Initialize a new .issues directory
  new         Create a new issue
  done        Mark an issue as done
  reopen      Reopen a done issue
  remove      Remove an issue
  note        Add a note to an issue
  criteria    Add or remove acceptance criteria
  label       Add or remove labels
  edit        Edit an issue in $EDITOR
  list        List all issues
  show        Show details of an issue
  status      Show project status

Options:
  --help      Show help for a command

Run 'chief <command> --help' for more information on a command.`)
}

function printUnknownCommand(cmd: string) {
  console.error(`Unknown command: ${cmd}`)
  console.error(`Run 'chief --help' for usage.`)
  process.exit(1)
}

if (!command || command === '--help' || command === '-h') {
  printHelp()
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
  case 'list':
    await list()
    break
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
  default:
    printUnknownCommand(command)
}
