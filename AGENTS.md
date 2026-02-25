# AGENTS.md

A monorepo workspace containing a Next.js web application and tRPC API with Drizzle ORM database.

Use `pnpm` for all package operations.

```bash
# Build all packages
pnpm run build

# Typecheck all packages
pnpm run check-types

# Run command in specific package
pnpm run --filter <package> <command>

# Database
pnpm run db:push          # Push schema to database
pnpm run db:generate      # Generate Drizzle migrations
```

**Important**: No test commands are configured yet. Always run `pnpm run check-types` and `pnpm run build` before committing.

## Type Safety - CRITICAL

**The use of `any` is strictly prohibited.** This is a fully type-safe application.

```typescript
// ❌ NEVER do this
const data: any = await fetchSomething();
const user = data as any; // Also prohibited

// ✅ Use proper types
import type { User } from "@/types";
const data = await fetchSomething();
const user: User = data; // Type check at runtime if needed
```

**TypeScript strict mode is enabled** with these enforced rules:

- `noUncheckedIndexedAccess`
- `noUnusedLocals`
- `noUnusedParameters`
- `noFallthroughCasesInSwitch`

## Skills for Libraries

When working with libraries, **ALWAYS load the corresponding skill** first. Skills contain up-to-date best practices and patterns.

| Library                      | Skill Command            | When to Use                                                |
| ---------------------------- | ------------------------ | ---------------------------------------------------------- |
| **tRPC**                     | `skill trpc`             | Creating/modifying tRPC routers, procedures, context       |
| **TanStack Form/Formedible** | `skill formedible`       | Building forms with TanStack Form or Formedible components |
| **Vercel AI SDK**            | `skill vercel/ai@ai-sdk` | Building AI features with the Vercel AI SDK                |

**Before adding a new library**: Use `find-skills` to check if there's an available skill that provides expert guidance.

## Code Style

Use type imports for types only:

```typescript
import type { NextRequest } from "next/server";
import { db } from "@arcade-vibe/db";
```

**NO** `await import` unless absolutely necessary.

Respect the existing codebase regarding input validation and trpc usage.

Error Handling

- Use TRPCError in tRPC procedures
- Use toast notifications in frontend (Sonner)
- Handle errors at appropriate levels

Naming Conventions

- Components: PascalCase (`UserProfile.tsx`)
- Utilities/functions: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Types: PascalCase (`interface UserProps`)
- Files: kebab-case for utilities, PascalCase for components

Always use Drizzle ORM with type-safe queries:

## Type System

**The use of `any` is strictly prohibited.** This is a fully type-safe application.

### Single Source of Truth

All frontend types derive from two authoritative sources:

1. **Entity types** → tRPC RouterOutput (`@/lib/trpc-types`)
   - Game, Prompt, Theme, User, Rating, etc.
   - Derived via `inferRouterOutputs<AppRouter>`

2. **Enum types** → Database schema (`@arcade-vibe/db`)
   - GameStatus, PromptStatus, ThemeStatus, Visibility, UserRole, etc.
   - Re-exported via `@/lib/trpc-types` for convenience

### Adding New Types

1. **For entity types**: Add data to tRPC router first

   ```typescript
   // In packages/api/src/routers/newRouter.ts
   export const newRouter = router({
     getById: protectedProcedure
       .input(z.object({ id: z.string() }))
       .query(async ({ input }) => {
         /* ... */
       }),
   });
   ```

2. Derive type in `trpc-types.ts`:

   ```typescript
   export type NewEntity = RouterOutput["newRouter"]["getById"];
   ```

3. **For enum types**: Define in database schema

   ```typescript
   // In packages/db/src/schema/enums-types.ts
   export const newEnum = pgEnum("new_enum", ["value1", "value2"]);
   export type NewEnum = (typeof newEnum.enumValues)[number];
   ```

4. Re-export in `trpc-types.ts`:
   ```typescript
   import type { NewEnum as NewEnumType } from "@arcade-vibe/db";
   export type NewEnum = NewEnumType;
   ```

### Type File Location

- **Frontend types**: `apps/web/src/lib/trpc-types.ts` - All component imports
- **Database enums**: `packages/db/src/schema/enums-types.ts` - Enum definitions
- **API router**: `packages/api/src/routers/index.ts` - AppRouter composition

**YOU MUST REUSE EXISTING TYPES !** Creating types in situ in a file next to functionality is completely stupid and counterproductive ! it is as bad as using `any` as nothing is shared and it does not prevent any problems, just hide them under a rug ! THIS IS ANTI PATTERN ! JUST LIKE "any" USE ! NEVER DO THAT UNLESS ABSOLUTELY NECESSARY ! USE EXISTING TYPES !

## Progressive Disclosure

For detailed guidelines:

- TypeScript patterns: See `packages/config/tsconfig.base.json` for compiler options
- API design: Check `packages/api/src/` for tRPC router patterns
- Database: See `packages/db/` for Drizzle schema and migrations
- Authentication: See `packages/auth/src/` for Better Auth setup
