# Architecture Overview

This document describes the system architecture of Protokol App, a React 18 + TypeScript PWA for health and protocol tracking.

## Directory Structure

```
src/
├── app/                    # Application shell and routing
│   ├── main.tsx           # Entry point, dayjs plugins
│   ├── App.tsx            # Root component with providers
│   ├── router.tsx         # React Router v6 configuration
│   └── Menu.tsx           # Bottom navigation + FAB
├── database/              # RxDB initialization
│   └── setup.ts           # Database setup, collections, hooks
├── category/              # Core data schemas
│   ├── category.ts        # Category schema, types, hooks
│   ├── event.ts           # Event schema, types, hooks
│   ├── target.ts          # Target schema, status calculation
│   └── CategorySelect.tsx # Reusable category selector
├── analytics/             # Analytics feature
│   ├── graph.ts           # Graph schema, types, hooks
│   └── TableGraph.tsx     # Table visualization component
├── home/                  # Home page components
│   ├── Home.tsx           # Main home page, selectedDate atom
│   ├── TargetList.tsx     # Daily targets with progress
│   ├── EventsList.tsx     # Event log display
│   └── EventsDialog.tsx   # Event creation/edit form
├── styling/               # Theme and styling
│   ├── theme.tsx          # MUI theme configuration
│   └── Heading.tsx        # Section header component
├── Analytics.tsx          # Analytics page with charts
├── Targets.tsx            # Targets management page
├── Settings.tsx           # Category CRUD + backup/restore
├── MeasureSelect.tsx      # Unit type selector + converters
├── ConfirmDelete.tsx      # Delete confirmation hook
└── measurementValidation.ts # Unit validation logic
```

## Application Bootstrap Flow

```
index.html
    │
    ▼
main.tsx
    ├── Extends dayjs with UTC/timezone plugins
    ├── Imports Roboto fonts
    └── Creates React root with StrictMode
            │
            ▼
        RouterProvider
            │
            ▼
        App.tsx (root route element)
            ├── useDatabase() → RxDB initialization
            ├── Provider (RxDB context)
            ├── ThemeProvider (MUI theme)
            ├── LocalizationProvider (German locale)
            ├── Outlet (child routes)
            └── Menu (bottom navigation)
```

### Entry Point (`main.tsx`)

```typescript
// Extends dayjs for timezone handling
dayjs.extend(utc);
dayjs.extend(timezone);

// Renders app with strict mode and router
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

### App Shell (`App.tsx`)

The App component wraps all pages with necessary providers:

1. **RxDB Provider** - Provides database context to all components
2. **ThemeProvider** - Material-UI theming
3. **LocalizationProvider** - Date picker localization (German)

```typescript
export function App() {
  const db = useDatabase();
  return (
    <Provider db={db}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
          <Box sx={{ pb: 7.5 }}>
            <CssBaseline />
            <Outlet />
            <Menu />
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
}
```

## Routing

React Router v6 with nested routes under the App shell:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home` | Daily targets and events |
| `/target` | `Targets` | Goal/target management |
| `/settings` | `Settings` | Category CRUD, backup/restore |
| `/analytics` | `Analytics` | Charts and data visualization |

The router uses `basename: import.meta.env.BASE_URL` for deployment flexibility.

## Component Hierarchy

```
App
├── Menu (fixed bottom navigation + FAB)
└── [Route Content]
    ├── Home
    │   ├── DateSelect
    │   ├── TargetList
    │   │   └── EventsDialog
    │   └── EventsList
    │       └── EventsDialog
    ├── Targets
    │   └── TargetsDialog
    ├── Settings
    │   └── CategoriesDialog
    └── Analytics
        ├── AnalyticsDialog
        ├── LineGraph
        └── TableGraph
```

## State Management

### Jotai Atoms

The app uses Jotai for minimal global state:

| Atom | Location | Type | Purpose |
|------|----------|------|---------|
| `selectedDate` | `src/home/Home.tsx` | `number` | Currently selected date (timestamp) |
| `addState` | `src/app/Menu.tsx` | `boolean` | Controls "add event" dialog visibility |

```typescript
// Selected date atom - defaults to start of today
export const selectedDate = atom(dayjs().startOf("day").valueOf());

// Add dialog state - triggered by FAB
export const addState = atom(false);
```

### RxDB Reactive Hooks

All persistent data flows through RxDB hooks from `rxdb-hooks`:

- **Query hooks** (`useRxData`) - Reactive data fetching
- **Collection hooks** (`useRxCollection`) - Direct collection access for mutations

Pattern:
```typescript
// Read data reactively
const { result: categories } = useRxData<Category>("categories", (c) => c.find());

// Get collection for mutations
const collection = useGetCategoriesCollection();
collection?.insert({ id: uuid(), name: "New Category", ... });
```

## Database Layer

### RxDB Configuration

The database is initialized in `src/database/setup.ts`:

- **Storage**: Dexie (IndexedDB wrapper)
- **Database name**: `healthapp`
- **Dev mode**: AJV validation enabled

### Plugins

| Plugin | Purpose |
|--------|---------|
| `RxDBDevModePlugin` | Development validation (dev only) |
| `RxDBJsonDumpPlugin` | Backup/restore via JSON |
| `RxDBMigrationSchemaPlugin` | Schema version migrations |
| `RxDBQueryBuilderPlugin` | Query builder utilities |
| `wrappedValidateAjvStorage` | Schema validation (dev only) |

### Collections

| Collection | Schema Version | Description |
|------------|----------------|-------------|
| `categories` | v2 | Category definitions with types and units |
| `events` | v0 | Timestamped data entries |
| `targets` | v0 | Goals with RRule schedules |
| `graphs` | v2 | Analytics visualization configs |

See [DATA-SCHEMAS.md](./DATA-SCHEMAS.md) for detailed schema documentation.

## PWA Configuration

Configured via `vite-plugin-pwa` in `vite.config.ts`:

- **App name**: Protokol App
- **Register type**: Auto-update
- **Base URL**: `/protocol-app/`
- **Icons**: 192x192 and 512x512 PNG variants

```typescript
VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "Protokol App",
    short_name: "Protokol App",
    description: "App zum protokollieren diverser Ereignisse",
    theme_color: "#ffffff",
    icons: [...]
  }
})
```

## Key Architectural Patterns

### Offline-First

All data persists to IndexedDB via RxDB/Dexie. The app works fully offline with no server dependency.

### Reactive Data Flow

RxDB hooks provide automatic UI updates when data changes:

```
User Action → Collection Mutation → RxDB Observable → useRxData → Component Re-render
```

### German Localization

- UI labels in German
- Date picker uses German locale
- Number formatting uses comma decimal separator

### Mobile-First Design

- Bottom navigation for thumb accessibility
- Centered FAB for primary action
- Fixed 7.5rem bottom padding for navigation bar
- Target device: Samsung Galaxy A10 (budget Android)
