# chief

Local issue tracking in `.issues/issues.json`.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/camhahu/chief/main/install.sh | bash
```

Add to PATH if not already:

```bash
export PATH="${HOME}/.local/bin:${PATH}"
```

## Quick Start

```bash
chief init                                    # Initialize .issues directory
chief new '{"title": "Fix login bug"}'        # Create an issue
chief list                                    # See open issues
chief show abc                                # View full details (prefix match)
chief done abc                                # Mark complete
```

## Commands

| Command | Description |
|---------|-------------|
| `chief init` | Initialize `.issues` directory |
| `chief list` | List open issues |
| `chief list --all` | Include completed issues |
| `chief list --done` | Show only completed |
| `chief list --label <name>` | Filter by label |
| `chief show <id>` | View full issue details |
| `chief new '<json>'` | Create new issue |
| `chief done <id>` | Mark issue complete |
| `chief reopen <id>` | Reopen completed issue |
| `chief remove <id>` | Delete issue and children |
| `chief update <id> '<json>'` | Update issue fields |
| `chief note <id> "text"` | Add note to issue |

ID prefixes work: `chief show ab` matches `abc123` if unambiguous.

### Creating Issues

```bash
chief new '{"title": "Add login page", "labels": ["feature"], "context": "Users need auth", "criteria": ["Email form", "OAuth"]}'
```

Fields: `title` (required), `labels`, `context`, `criteria`, `parent`, `notes`

## AI Agent Integration

Chief includes skill documentation for AI coding assistants. See [skill/SKILL.md](skill/SKILL.md) for integration details.

## Contributing

```bash
bun install                    # Install dependencies
bun run build                  # Compile to dist/chief
bun run typecheck              # Type checking
bun run test                   # Integration tests
```

Create test files in `.testfiles/` (gitignored).
