#!/usr/bin/env bun

import { commands } from './commands.ts'
import { printMainHelp, printCommandHelp } from './help.ts'

const args = process.argv.slice(2)
const commandName = args[0]

const wantsHelp = args.includes('--help') || args.includes('-h')

if (!commandName || wantsHelp) {
  if (commandName && printCommandHelp(commandName)) {
    process.exit(0)
  }
  printMainHelp()
  process.exit(0)
}

const command = commands[commandName]
if (!command) {
  console.error(`Unknown command: ${commandName}`)
  console.error(`Run 'chief --help' for usage.`)
  process.exit(1)
}

await command.handler(args.slice(1))
