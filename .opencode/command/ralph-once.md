---
description: Grab one task from the issue tracker and execute it
subtask: false
model: anthropic/claude-opus-4-5
---

# Execute ONE Task from Issue Tracker

Issues are managed via the chief CLI. See AGENTS.md for commands.

1. **List issues** - Run `chief list` to see open issues
2. **Select ONE task** - Pick highest priority unblocked task, run `chief show <id>` for details
3. **Execute** - Implement incrementally, follow existing patterns
4. **Verify** - Run `bun run typecheck` and `bun run test`, manually test, check acceptance criteria
5. **Mark done** - Run `chief done <id>` to mark task complete
6. **Update progress.txt** - Append progress entry (see format below), add any reusable patterns to TOP
7. **Unslop** - Run the `unslop` agent to clean up AI-generated code
8. **Re-verify** - Run `bun run typecheck` and `bun run test` again after unslopping
9. **Commit** - Stage changes and commit using format from AGENTS.md

## Bug Protocol

If you encounter ANY bug during execution:
1. Add the bug: `chief new '{"title": "...", "labels": ["bug"], "context": "...", "criteria": [...]}'`
2. Commit the change
3. Abandon current task
4. Fix the bug instead

## Progress Entry Format

Append to progress.txt:

```
## [Date] - [Issue ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

Add any reusable patterns discovered to the TOP of progress.txt.
