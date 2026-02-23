---
name: kiro-context
description: Answer version-specific npm package questions by cloning the package repository for an exact version and querying it with kiro-cli. Use this when package APIs, examples, migration behavior, or version differences must be verified from source instead of memory.
---

# Kiro Context

Run the bundled script to resolve a package repository from npm metadata, clone the exact version context, and ask `kiro-cli` against that source tree.

## Run

```bash
node scripts/query-package-context.mjs --package "@scope/name@1.2.3" --question "How do I configure X in this version?"
```

## Inputs

- Provide `--package` in `name@version` form. Scoped packages are supported (example: `@tanstack/react-query@5.90.5`).
- Provide a single clear `--question` that targets one outcome.
- Optionally provide `--cache-dir` (default: `./.package-cache`).

## Workflow

- Resolve `repository.url` from npm metadata.
- Normalize the repository URL and clone the repo shallowly into cache.
- Run `kiro-cli chat` from the cloned repository.
- Return only the resulting answer text.

## Troubleshooting

- If npm metadata has no usable repository URL, fail fast and ask for a different package version.
- If the cached folder exists without `.git`, replace it before cloning.
- If `kiro-cli` is missing or unauthenticated, install/login first, then rerun.

Implementation: `scripts/query-package-context.mjs`
