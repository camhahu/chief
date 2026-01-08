# Parent/Child Issues

```bash
chief new '{"title": "...", "parent": "<id>"}'   # Create subtask
chief list                                        # Shows hierarchy
chief remove <id>                                 # Removes issue and children
chief update <id> '{"parent": null}'              # Make top-level
chief update <id> '{"parent": "<new-id>"}'        # Change parent
```

## Breaking Down a Feature

```bash
# Create parent issue
chief new '{"title": "User authentication", "labels": ["feature"]}'
# Output: Created issue abc123

# Add subtasks
chief new '{"title": "Design login form", "parent": "abc123"}'
chief new '{"title": "Implement OAuth", "parent": "abc123"}'
chief new '{"title": "Add password reset", "parent": "abc123"}'

# View hierarchy
chief list
```

Output:
```
abc123 [ ] User authentication [feature]
  def456 [ ] Design login form
  ghi789 [ ] Implement OAuth
  jkl012 [ ] Add password reset
```

## Completing Subtasks

```bash
chief done def456
chief list
```

Output (completed subtasks hidden by default):
```
abc123 [ ] User authentication [feature]
  ghi789 [ ] Implement OAuth
  jkl012 [ ] Add password reset
```

## Rules

- One level deep only (no grandchildren)
- `chief remove` deletes issue and all children
- An issue with children cannot become a child
