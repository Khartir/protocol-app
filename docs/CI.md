# CI and Testing

This document covers the Continuous Integration pipeline, testing setup, and code quality tools.

## CI Pipeline

The CI runs on GitHub Actions for all pushes to `main` and pull requests.

**Workflow file:** `.github/workflows/ci.yaml`

### Pipeline Steps

| Step       | Command                         | Description                               |
| ---------- | ------------------------------- | ----------------------------------------- |
| Install    | `bun install --frozen-lockfile` | Install dependencies with locked versions |
| Lint       | `bun run lint`                  | Run ESLint                                |
| Format     | `bun run format:check`          | Check Prettier formatting                 |
| Type check | `bun run typecheck`             | Run TypeScript type checking              |
| Test       | `bun run test`                  | Run Vitest tests                          |
| Build      | `bun run build`                 | Production build                          |
| Security   | `bun audit`                     | Check for vulnerable dependencies         |

### Concurrency

The workflow uses concurrency groups to cancel in-progress runs when new commits are pushed:

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

## Testing

### Framework

- **Vitest** - Vite-native test runner with Jest-compatible API
- **Testing Library** - React component testing utilities
- **jsdom** - DOM environment for tests

### Configuration

**Config file:** `vitest.config.ts`

```typescript
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./src/test/setup.ts"],
  include: ["src/**/*.{test,spec}.{ts,tsx}"],
}
```

### Test Commands

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `bun run test`          | Run all tests once             |
| `bun run test:watch`    | Run tests in watch mode        |
| `bun run test:coverage` | Run tests with coverage report |

### Writing Tests

Place test files next to the code they test or in `src/test/`:

```typescript
// src/test/example.test.ts
import { describe, it, expect } from "vitest";

describe("Example", () => {
  it("should work", () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Setup File

**Path:** `src/test/setup.ts`

The setup file configures:

- Vitest globals type definitions
- jest-dom matchers for DOM assertions

```typescript
/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";
```

## Code Formatting

### Prettier

**Config file:** `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Commands

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `bun run format`       | Format all files                 |
| `bun run format:check` | Check formatting without changes |

### Ignored Files

**Config file:** `.prettierignore`

- `dist/` - Build output
- `node_modules/` - Dependencies
- `bun.lockb` - Lock file

## Linting

### ESLint

**Config file:** `eslint.config.js`

Uses ESLint 9 flat config with:

- TypeScript support (`typescript-eslint`)
- React hooks rules (`eslint-plugin-react-hooks`)
- React refresh rules (`eslint-plugin-react-refresh`)
- Prettier integration (`eslint-config-prettier`)

### Command

```bash
bun run lint
```

## Type Checking

Runs TypeScript compiler without emitting files:

```bash
bun run typecheck
```

Uses strict mode from `tsconfig.app.json`:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

## Dependency Management

### Dependabot

**Config file:** `.github/dependabot.yml`

Automatically creates PRs for dependency updates:

- Weekly schedule
- Groups dev and prod dependencies separately
- Max 10 open PRs

### Security Audits

Run `bun audit` to check for known vulnerabilities in dependencies.

## Local Development

Before pushing, run the full CI check locally:

```bash
bun run lint && bun run format:check && bun run typecheck && bun run test && bun run build
```

Or run individual checks as needed during development.
