#!/usr/bin/env bun

import { Command } from 'commander'
import { init } from './commands/init.ts'
import { newIssue } from './commands/new.ts'
import { list, type ListFilter } from './commands/list.ts'
import { done } from './commands/done.ts'
import { reopen } from './commands/reopen.ts'
import { remove } from './commands/remove.ts'
import { show } from './commands/show.ts'
import { note } from './commands/note.ts'
import { update } from './commands/update.ts'

const program = new Command()

program.name('chief').description('A simple issue tracker').version('0.1.0')

program
  .command('init')
  .description('Initialize a new .issues directory')
  .action(() => init())

program
  .command('new')
  .description('Create a new issue from JSON')
  .argument('<json>', 'JSON object with issue data')
  .action((json: string) => newIssue(json))

program
  .command('list')
  .description('List issues')
  .option('--all', 'Show all issues')
  .option('--open', 'Show only open issues')
  .option('--done', 'Show only completed issues')
  .option('--label <name>', 'Filter by label')
  .action((options: { all?: boolean; open?: boolean; done?: boolean; label?: string }) => {
    const filterFlags = [options.all, options.open, options.done].filter(Boolean)
    if (filterFlags.length > 1) {
      console.error('Error: --all, --open, and --done are mutually exclusive')
      process.exit(1)
    }
    let filter: ListFilter = 'open'
    if (options.all) filter = 'all'
    if (options.done) filter = 'done'
    return list({ filter, label: options.label })
  })

program
  .command('done')
  .description('Mark an issue as done')
  .argument('<id>', 'Issue ID or prefix')
  .action((id: string) => done(id))

program
  .command('reopen')
  .description('Reopen a completed issue')
  .argument('<id>', 'Issue ID or prefix')
  .action((id: string) => reopen(id))

program
  .command('remove')
  .description('Remove an issue and its children')
  .argument('<id>', 'Issue ID or prefix')
  .action((id: string) => remove(id))

program
  .command('show')
  .description('Show full details of an issue')
  .argument('<id>', 'Issue ID or prefix')
  .action((id: string) => show(id))

program
  .command('note')
  .description('Add a note to an issue')
  .argument('<id>', 'Issue ID or prefix')
  .argument('<text>', 'Note text')
  .action((id: string, text: string) => note(id, text))

program
  .command('update')
  .description('Update fields on an existing issue')
  .argument('<id>', 'Issue ID or prefix')
  .argument('<json>', 'JSON object with fields to update')
  .action((id: string, json: string) => update(id, json))

program.parse()
