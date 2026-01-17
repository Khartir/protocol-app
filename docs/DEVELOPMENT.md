# Development Guide

This guide covers day-to-day development workflows for Protokol App.

## Environment Setup

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **Bun**: Latest version (https://bun.sh)
- **IDE**: VS Code recommended

### VS Code Extensions

- ESLint
- TypeScript and JavaScript Language Features
- Prettier (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd healthapp

# Install dependencies
bun install

# Start development server
bun run dev
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run dev` | Start Vite dev server with HMR |
| `bun run build` | Production build to `dist/` |
| `bun run lint` | Run ESLint |
| `bun run preview` | Preview production build locally |
| `bun run generate-pwa-assets` | Generate PWA icons from source |

## Project Configuration

### TypeScript

- Strict mode enabled
- Target: ES2020
- Module: ESNext

### ESLint

- React Hooks plugin
- React Refresh plugin
- TypeScript ESLint

### Vite

- SWC for Fast Refresh
- PWA plugin configured
- Base URL: `/protocol-app/`

## Development Workflows

### Adding a New Page

1. Create page component in `src/`:
   ```typescript
   // src/NewPage.tsx
   export function NewPage() {
     return <div>New Page Content</div>;
   }
   ```

2. Add route in `src/app/router.tsx`:
   ```typescript
   {
     path: "/new-page",
     element: <NewPage />,
   },
   ```

3. Add navigation in `src/app/Menu.tsx`:
   ```typescript
   <BottomNavigationAction
     label="New Page"
     to="/new-page"
     component={Link}
     value="/new-page"
     icon={<SomeIcon />}
   />
   ```

### Adding a New Category Type

1. Add type to `categoryTypes` in `src/category/category.ts`:
   ```typescript
   export const categoryTypes = {
     // existing types...
     newType: "German Label",
   } as const;
   ```

2. Update schema enum:
   ```typescript
   type: {
     type: "string",
     enum: ["todo", "value", "valueAccumulative", "protocol", "newType"],
   },
   ```

3. Update schema version and add migration:
   ```typescript
   version: 3,
   // ...
   migrationStrategies: {
     // existing migrations...
     3: (old: Category) => old,
   },
   ```

4. Update helper functions if needed:
   ```typescript
   export const requriesInput = (type: string) => !["todo", "newType"].includes(type);
   ```

5. Handle new type in `useGetTargetStatus()` in `src/category/target.ts`

### Adding a New Collection

1. Create schema file in `src/category/` or appropriate directory:
   ```typescript
   export const newSchema = {
     version: 0,
     primaryKey: "id",
     type: "object",
     properties: {
       id: { type: "string", maxLength: 100 },
       // ... fields
     },
     required: ["id"],
   } as const;

   export type NewType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
   ```

2. Add collection in `src/database/setup.ts`:
   ```typescript
   await database.addCollections({
     // existing collections...
     newCollection: { schema: newSchema },
   });
   ```

3. Create hooks for data access:
   ```typescript
   export const useGetAllNew = () =>
     useRxData<NewType>("newCollection", (c) => c.find());

   export const useGetNewCollection = () =>
     useRxCollection<NewType>("newCollection");
   ```

### Creating Custom Hooks

#### Query Hook Pattern

```typescript
export const useGetItemsByFilter = (filter: string) => {
  return useRxData<ItemType>("collection", (collection) =>
    collection.find({
      selector: { field: { $eq: filter } },
      sort: [{ timestamp: "asc" }],
    })
  );
};
```

#### Collection Hook Pattern

```typescript
export const useGetItemsCollection = () =>
  useRxCollection<ItemType>("collection");

// Usage:
const collection = useGetItemsCollection();
await collection?.insert({ id: uuid(), ... });
await document.patch({ field: newValue });
await document.remove();
```

### Using Jotai Atoms

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

// Define atom
export const myAtom = atom<string>("default");

// Read and write
const [value, setValue] = useAtom(myAtom);

// Read only
const value = useAtomValue(myAtom);

// Write only
const setValue = useSetAtom(myAtom);
```

## Debugging

### RxDB DevMode

In development mode, RxDB DevMode plugin is enabled automatically:
- Schema validation on every operation
- Detailed error messages
- Query validation

### IndexedDB Inspection

1. Open Chrome DevTools
2. Go to Application tab
3. Expand IndexedDB in sidebar
4. Find `healthapp` database

### React DevTools

Install React DevTools browser extension for:
- Component hierarchy inspection
- Props/state debugging
- Profiler for performance

### Common Issues

**"Collection already exists"**
- Clear IndexedDB and refresh
- This happens when schema changes without proper migration

**Timezone issues with targets**
- Targets use UTC for RRule calculations
- Events use local time
- Check `dayjs().tz("utc", true)` usage

**Unit conversion errors**
- Check category config matches expected unit type
- Validate input with `validateMeasurement()`

## Performance Considerations

### Target Device

Primary target: **Samsung Galaxy A10**
- Budget Android device
- ~6.2" screen
- Limited CPU/RAM

### Optimization Tips

1. **Minimize re-renders**
   - Use `useAtomValue`/`useSetAtom` instead of `useAtom` when possible
   - Memoize expensive calculations

2. **RxDB query optimization**
   - Use specific selectors instead of fetching all
   - Limit date ranges for event queries

3. **Bundle size**
   - Vite automatically code-splits
   - Lazy load pages if needed

4. **Avoid heavy operations on main thread**
   - Large data exports can block UI
   - Consider web workers for intensive tasks

### Memory Management

- RxDB manages subscriptions automatically via hooks
- Cleanup happens on component unmount
- Avoid creating new query functions on every render

## Testing

### Manual Testing Checklist

Before deployment, test on target device:

- [ ] App loads correctly
- [ ] Date picker works
- [ ] Events can be created/edited/deleted
- [ ] Targets show correct progress
- [ ] Analytics charts render
- [ ] Offline mode works
- [ ] PWA installs correctly
- [ ] Backup/restore functions work

### Browser Testing

Test in:
- Chrome (primary)
- Firefox
- Safari (if targeting iOS)

## Deployment

### Build

```bash
bun run build
```

Output goes to `dist/` directory.

### PWA Assets

Generate icons before deployment:

```bash
bun run generate-pwa-assets
```

### GitHub Pages

The app is configured for deployment at `/protocol-app/` base URL. Adjust `vite.config.ts` if deploying elsewhere:

```typescript
export default defineConfig({
  base: "/your-base-url/",
  // ...
});
```
