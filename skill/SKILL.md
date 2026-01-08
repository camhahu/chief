---
name: chief
description: Track issues in a local JSON file
compatibility: Requires Bun runtime and chief CLI in PATH
metadata:
  author: chief-cli
  version: "1.0"
---

# chief

Local issue tracking in `.issues/issues.json`.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/camhahu/chief/main/install.sh | bash
```

## Usage

```bash
chief init                             # Initialize .issues directory

chief list                             # 1. See open issues
chief show abc123                      # 2. View full details
chief new '{"title": "Fix bug"}'       # 3. Create issue
chief done abc123                      # 4. Mark complete
```

## Commands

```bash
chief list                             # Open issues
chief list --all                       # Include completed
chief list --label bug                 # Filter by label
chief new '<json>'                     # Create issue
chief show <id>                        # View details
chief done <id>                        # Mark complete
chief reopen <id>                      # Reopen issue
chief remove <id>                      # Delete issue and children
chief update <id> '<json>'             # Update fields
chief note <id> "text"                 # Add note
```

## Creating Issues

```bash
chief new '{"title": "Add login page", "labels": ["feature"], "context": "Users need to authenticate", "criteria": ["Email/password form", "OAuth support"]}'
```

Fields: `title` (required), `labels`, `context`, `criteria`, `parent`, `notes`

ID prefixes work: `chief show ab` matches `abc123` if unambiguous.

## References

- [planning.md](references/planning.md) - Parent/child issues
- [labels.md](references/labels.md) - Labels
