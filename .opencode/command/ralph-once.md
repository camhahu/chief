---
description: Grab a task from the PRD and execute it
subtask: false
---

# Task Execution from PRD

Execute one task from the PRD following this process:

## 1. Read and Parse the PRD
- Load the PRD document
- Identify all discrete tasks/features/requirements
- Extract dependencies between tasks
- Note acceptance criteria for each task

## 2. Prioritize Tasks
- **Filter by blockers**: Identify tasks with no dependencies (can start immediately)
- **Rank by impact**: Core functionality > enhancements > nice-to-haves
- **Consider effort**: Smaller tasks that unblock others get priority
- **Check for explicit priority markers**: P0/P1/P2, "must have"/"should have"/"could have"

## 3. Select a Task
- Pick the highest priority unblocked task
- Verify prerequisites are met (dependencies completed, context available)
- Confirm understanding of acceptance criteria

## 4. Plan the Implementation
- Break task into subtasks using TodoWrite
- Identify files to modify/create
- Research existing codebase patterns for consistency
- Document approach before writing code

## 5. Execute
- Mark task as `in_progress`
- Implement incrementally, marking subtasks complete as you go
- Follow existing code conventions

## 6. Verify
- Run tests (add new ones if needed)
- Manually test the feature
- Check against acceptance criteria
- Ensure no regressions

## 7. Commit
- Stage the relevant changes
- Create an appropriate commit message following the format below

### Commit Message Format

- First line is a concise summary starting with a verb
- Prefix first line with one of:
  - `feat:` - new feature for the user
  - `fix:` - bug fix
  - `docs:` - documentation only changes
  - `style:` - formatting, whitespace (no code change)
  - `refactor:` - code change that neither fixes a bug nor adds a feature
  - `perf:` - performance improvements
  - `test:` - adding or correcting tests
  - `build:` - build system or external dependencies
  - `ci:` - CI configuration files and scripts
  - `chore:` - other changes that don't modify src or test files
  - `revert:` - reverts a previous commit
- Followed by a blank line
- Then 1-4 dotpoints further explaining the change
  - Prefer to explain WHY from an end user perspective instead of WHAT
  - Do not include generic messages, be specific about user-facing changes
  - Do not state obvious things
  - Avoid adjectives

## 8. Complete
- Mark task as `completed`
- Update PRD/tracking doc to reflect completion

---

**Key principles:**
- Never start a task without understanding its acceptance criteria
- Always check dependencies before starting
- Break large tasks into trackable subtasks
- Verify before marking complete
- Only execute ONE task per invocation

Here is the current git status:
!`git status`

Here are recent commit messages for reference:
!`git log --oneline -10`

Additional context from user:

$ARGUMENTS
