# Contributing to Avkash

Thanks for your interest in contributing to Avkash! This guide will help you get started.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**

   ```bash
   git clone https://github.com/<your-username>/avkash.git
   cd avkash
   ```

3. **Set up the development environment** by following the [README](README.md#getting-started)

4. **Create a branch** for your change:

   ```bash
   git checkout -b feat/your-feature-name
   ```

## Branch Naming

Use a prefix that matches the type of change:

- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation changes
- `refactor/` — Code refactoring
- `chore/` — Maintenance tasks

## Commit Messages

This project uses [commitlint](https://commitlint.js.org/) to enforce conventional commits. Every commit message must follow this format:

```
type(scope): message
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Scopes:** `setup`, `config`, `deps`, `feature`, `bug`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `release`, `other`

**Examples:**

```
feat(feature): add bulk leave approval
fix(bug): fix timezone offset in timeline view
docs(docs): update environment variables table
refactor(refactor): extract leave validation logic
```

## Code Quality

Pre-commit hooks run automatically via husky and lint-staged. They will:

- Run type checking (`tsc`)
- Format code with Prettier
- Lint with ESLint

You can also run these manually:

```bash
pnpm lint          # Check for lint errors
pnpm lint-fix      # Auto-fix lint errors
pnpm format        # Check formatting
pnpm format:fix    # Auto-fix formatting
```

## Pull Requests

1. Make sure your branch is up to date with `main`
2. Ensure all checks pass (`pnpm lint`, `pnpm format`, `pnpm build`)
3. Write a clear PR title following the commit convention (e.g., `feat(feature): add bulk leave approval`)
4. Describe what your PR does and why in the description
5. Link any related issues

## Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/zero8dotdev/avkash/issues) with a clear description and steps to reproduce.
