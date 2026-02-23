---
name: kiro-context
description: Ask version-specific package questions against the package source by cloning the package repository and querying it with kiro-cli. Use this for package APIs, usage patterns, examples, and behavior questions.
---

# Kiro Context Skill

Use this skill when you need an accurate answer about a specific npm package version.

## When to Apply

- Package usage/API questions
- Behavior differences between versions
- Questions where examples from the package repo matter
- Cases where model memory may be stale

## Command

```bash
node scripts/script.js --question "<clear, specific question>" --package "<package@version>"
```

Notes:
- Replace placeholders with real values.
- Keep quotes around both arguments.
- `--package` must be in `<name@version>` format.

## Good Question Style

Ask one clear question that points to one answer.

### Good
- `How can I implement pagination with useInfiniteQuery in TanStack Query?`
- `How do I invalidate a query after a mutation in @tanstack/react-query v5?`

### Weak
- `Pagination TanStack Query?`
- `React Query stuff?`

## What This Skill Does

- Resolves the package repository from npm metadata
- Clones the repo shallowly into the cache directory
- Runs `kiro-cli` in that repo directory
- Returns an answer based on repository code and examples when available

Implementation reference: `scripts/script.js`
