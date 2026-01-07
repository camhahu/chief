---
description: Grab one task from the PRD and execute it
subtask: false
---

# Execute ONE Task from PRD

The PRD is located at `prd.json` in the project root.

1. **Read PRD** - Parse all tasks, dependencies, and acceptance criteria
2. **Select ONE task** - Pick highest priority unblocked task
3. **Execute** - Implement incrementally, follow existing patterns
4. **Verify** - Run `bun run typecheck` and `bun run test`, manually test, check acceptance criteria
5. **Update PRD** - Mark task as completed
6. **Commit** - Stage changes and commit using format from AGENTS.md

## Bug Protocol

If you encounter ANY bug during execution:
1. Immediately add the bug to the PRD
2. Commit the PRD update
3. Abandon current task
4. Fix the bug instead
