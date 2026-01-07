import { init } from './commands/init.ts'
import { newIssue } from './commands/new.ts'
import { list, type ListFilter } from './commands/list.ts'
import { done } from './commands/done.ts'
import { reopen } from './commands/reopen.ts'
import { remove } from './commands/remove.ts'
import { show } from './commands/show.ts'
import { note } from './commands/note.ts'
import { update } from './commands/update.ts'

interface Command {
  usage: string
  description: string
  handler: (args: string[]) => Promise<void>
}

function exitUsage(usage: string): never {
  console.error(`Usage: ${usage}`)
  process.exit(1)
}

function command(
  usage: string,
  description: string,
  handler: (args: string[], usage: string) => Promise<void>
): Command {
  return { usage, description, handler: (args) => handler(args, usage) }
}

export const commands: Record<string, Command> = {
  init: command('chief init', 'Initialize a new .issues directory', () => init()),

  new: command("chief new '{\"title\": \"...\"}'", 'Create a new issue from JSON', (args, usage) => {
    const json = args[0]
    if (!json) exitUsage(usage)
    return newIssue(json)
  }),

  list: command('chief list [--all | --open | --done] [--label=<name>]', 'List open issues (use --all for all)', (args) => {
    const hasOpen = args.includes('--open')
    const hasDone = args.includes('--done')
    if (hasOpen && hasDone) {
      console.error('Error: --open and --done are mutually exclusive')
      process.exit(1)
    }
    let filter: ListFilter = 'open'
    if (args.includes('--all')) filter = 'all'
    if (hasOpen) filter = 'open'
    if (hasDone) filter = 'done'

    const labelArg = args.find((a) => a.startsWith('--label='))
    const label = labelArg?.slice('--label='.length)
    return list({ filter, label })
  }),

  done: command('chief done <id>', 'Mark an issue as done', (args, usage) => {
    const id = args[0]
    if (!id) exitUsage(usage)
    return done(id)
  }),

  reopen: command('chief reopen <id>', 'Reopen a completed issue', (args, usage) => {
    const id = args[0]
    if (!id) exitUsage(usage)
    return reopen(id)
  }),

  remove: command('chief remove <id>', 'Remove an issue and its children', (args, usage) => {
    const id = args[0]
    if (!id) exitUsage(usage)
    return remove(id)
  }),

  show: command('chief show <id>', 'Show full details of an issue', (args, usage) => {
    const id = args[0]
    if (!id) exitUsage(usage)
    return show(id)
  }),

  note: command('chief note <id> <text>', 'Add a note to an issue', (args, usage) => {
    const id = args[0]
    const text = args[1]
    if (!id || !text) exitUsage(usage)
    return note(id, text)
  }),

  update: command("chief update <id> '{\"field\": \"value\"}'", 'Update fields on an existing issue', (args, usage) => {
    const id = args[0]
    const json = args[1]
    if (!id || !json) exitUsage(usage)
    return update(id, json)
  }),
}
