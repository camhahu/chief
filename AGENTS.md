# AGENTS.md

## Bun

- Always use Bun (never npm, pnpm, yarn, etc.)
- `bun add <pkg>` for dependencies
- `bun add -d <pkg>` for dev dependencies
- Use Bun standard library instead of Node standard library where possible

## Commands

- `bun run typecheck` - Run TypeScript type checking
- `bun run test` - Run integration tests

## Code Style

- No barrel exports
- Never add `--json` output flags to CLI commands
- No fallback logic - each piece of code should do one thing, one way

## Testing

- No unit tests, only integration tests
- After completing a new feature, manually test it and add integration test coverage
- When fixing a bug, first add a test case that reproduces the issue, then fix the bug

## Commit Message Format

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
