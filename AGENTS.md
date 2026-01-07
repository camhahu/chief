# AGENTS.md

- Always use Bun (never npm, pnpm, etc.)
- Use Bun standard library instead of Node standard library where possible
- No barrel exports
- Never add `--json` output flags to CLI commands
- No fallback logic - each piece of code should do one thing, one way
- No unit tests, only integration tests
- After completing a new feature, manually test it and add integration test coverage
- When fixing a bug, first add a test case that reproduces the issue, then fix the bug
