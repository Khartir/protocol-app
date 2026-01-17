# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start Vite dev server
bun run build        # Production build
bun run lint         # Run ESLint
bun run preview      # Preview production build
bun run format       # Format code with Prettier
bun run format:check # Check formatting
bun run typecheck    # TypeScript type checking
bun run test         # Run Vitest tests
bun run test:watch   # Run tests in watch mode
```

## Development Practices

**Test-Driven Development (TDD):** Write tests before implementation for all new changes. Follow the red-green-refactor cycle:

1. Write a failing test
2. Write minimal code to pass
3. Refactor while keeping tests green

**Documentation:** Update relevant documentation (CLAUDE.md, README.md, or docs/) after implementing changes.

## Architecture Overview

This is a React 18 + TypeScript PWA for health/protocol tracking called "Protokol App". It uses RxDB for offline-first reactive data storage with IndexedDB (via Dexie).

### Target Device

Primary device: Samsung Galaxy A10 (budget Android, small screen ~6.2", limited performance)

### Tech Stack

- **Framework**: React 18 with Vite 5, SWC for Fast Refresh
- **Database**: RxDB with Dexie storage, rxdb-hooks for React integration
- **State**: Jotai atoms for minimal global state (`selectedDate`, `addState`)
- **UI**: Material-UI v6, @mui/x-charts, @mui/x-date-pickers
- **Forms**: Formik + Yup validation
- **Dates**: dayjs with UTC/timezone plugins, RRule for recurrence schedules

### Routing (React Router v6)

- `/` - Home: date picker, targets for day, events list
- `/target` - Targets/goals management with RRule schedules
- `/settings` - Category CRUD with backup/restore
- `/analytics` - Line charts for tracking trends

### Data Collections (src/database/, src/category/, src/analytics/)

**Categories** (`category.ts`) - Types: `todo`, `value`, `valueAccumulative`, `protocol`

- `valueAccumulative` supports units (volume/time/mass) via `convert` package
- Children array enables composite categories

**Events** (`event.ts`) - Timestamped data points linked to categories

**Targets** (`target.ts`) - Goals with RRule schedules, calculates completion status with color coding (red/yellow/green)

**Graphs** (`graph.ts`) - Analytics configs with aggregation modes (daily/weekly/monthly/custom) and thresholds

### Key Patterns

**RxDB hooks**: All data via custom hooks wrapping `useRxData()` and `useRxCollection()`

```typescript
const { result: categories } = useRxData<Category>("categories", (c) => c.find());
```

**Schema migrations**: Categories collection has v2 schema with migration strategies in `category.ts`

**Timezone handling**: Targets use UTC for RRule calculations. Events store local timestamps.

**Unit conversion**: `MeasureSelect.tsx` has `toBest()` for display and `toDefault()` for storage

**German UI**: All labels and messages in German

### File Organization

- `src/app/` - App shell, routing, providers, bottom navigation
- `src/database/` - RxDB setup and initialization
- `src/home/` - Home page components (TargetList, EventsList, EventsDialog)
- `src/category/` - Data schemas, hooks, CategorySelect component
- `src/analytics/` - Graph schema and hooks
- `src/styling/` - MUI theme, Heading component
- Root `src/` - Page components (Analytics, Targets, Settings)

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Architecture](docs/ARCHITECTURE.md) - System architecture, bootstrap flow, component hierarchy
- [Data Schemas](docs/DATA-SCHEMAS.md) - Complete RxDB schema reference with field descriptions
- [Development](docs/DEVELOPMENT.md) - Development workflows, debugging, adding features
- [CI and Testing](docs/CI.md) - CI pipeline, Vitest testing, Prettier formatting, Dependabot
- [Units and Conversion](docs/UNITS-AND-CONVERSION.md) - Unit conversion system (toBest, toDefault, validation)
- [RRule and Schedules](docs/RRULE-AND-SCHEDULES.md) - Recurring schedule system for targets
- [Analytics Aggregation](docs/ANALYTICS-AGGREGATION.md) - Graph aggregation modes (daily/weekly/monthly/custom)

## Git Worktrees

Worktree directory: `.worktrees/` (project-local, hidden)
