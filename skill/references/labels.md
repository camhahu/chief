# Labels

```bash
chief new '{"title": "...", "labels": ["bug"]}'      # Create with labels
chief update <id> '{"labels": ["bug", "urgent"]}'    # Update labels
chief list --label bug                               # Filter by label
```

## Common Labels

| Label    | Usage                        |
| -------- | ---------------------------- |
| bug      | Broken behavior              |
| feature  | New functionality            |
| docs     | Documentation                |
| refactor | Code cleanup                 |
| test     | Test coverage                |
| blocked  | Waiting on dependency        |

## Examples

```bash
chief new '{"title": "Login fails on Safari", "labels": ["bug"]}'
chief new '{"title": "Security issue", "labels": ["bug", "critical"]}'
chief list --label critical
chief list --all --label bug
```

## Updating Labels

```bash
chief update abc123 '{"labels": ["bug", "urgent"]}'  # Replaces existing
chief update abc123 '{"labels": []}'                 # Remove all
```
