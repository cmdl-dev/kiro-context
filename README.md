# kiro-context

`kiro-context` is a small helper project for answering version-specific npm package questions by querying the package source directly.

It includes a script that:
- resolves a package repository from npm metadata,
- clones that repository into a local cache,
- runs `kiro-cli` against the cloned codebase,
- prints the answer for your question.

## Requirements

- Node.js 18+
- `npm` and `git` available in `PATH`
- `kiro-cli` installed and authenticated

## Usage

Run the script with a package specifier (`name@version`) and a clear question:

```bash
node scripts/query-package-context.mjs --question "How do I invalidate a query after mutation?" --package "@tanstack/react-query@5.90.5"
```

Optional:

- `--cache-dir` (default: `./.package-cache`)

Example with a custom cache directory:

```bash
node scripts/query-package-context.mjs --question "How can I implement pagination with useInfiniteQuery?" --package "@tanstack/react-query@5.90.5" --cache-dir "./tmp/package-cache"
```

## How package resolution works

For the provided `name@version`, the script calls `npm view` to resolve repository metadata, normalizes common Git URL formats, and clones the repository with `--depth 1`.

If the target cache directory already exists but is not a valid git clone, it is replaced before cloning.

## Included skill definition

`SKILL.md` describes this workflow as a reusable Kiro skill (`kiro-context`) and provides prompt guidance for package questions.
