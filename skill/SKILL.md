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

## Commands

```bash
chief init                             # Initialize .issues directory
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

ID prefixes work: `chief show ab` matches `abc123` if unambiguous.

## Creating Issues

```bash
chief new '{"title": "Add login page", "labels": ["feature"], "context": "Users need to authenticate", "criteria": ["Email/password form", "OAuth support"]}'
```

Fields: `title` (required), `labels`, `context`, `criteria`, `parent`, `notes`

## Labels

```bash
chief new '{"title": "...", "labels": ["bug"]}'      # Create with labels
chief update <id> '{"labels": ["bug", "urgent"]}'    # Update labels
chief list --label bug                               # Filter by label
```

Common labels: `bug`, `feature`, `docs`, `refactor`, `test`, `blocked`

## Parent/Child Issues

```bash
chief new '{"title": "...", "parent": "<id>"}'   # Create subtask
chief update <id> '{"parent": null}'             # Make top-level
chief update <id> '{"parent": "<new-id>"}'       # Change parent
```

Example:
```bash
chief new '{"title": "User authentication", "labels": ["feature"]}'
# Output: Created issue abc123

chief new '{"title": "Design login form", "parent": "abc123"}'
chief new '{"title": "Implement OAuth", "parent": "abc123"}'

chief list
# abc123 [ ] User authentication [feature]
#   def456 [ ] Design login form
#   ghi789 [ ] Implement OAuth
```

Rules:
- One level deep only (no grandchildren)
- `chief remove` deletes issue and all children
- An issue with children cannot become a child
