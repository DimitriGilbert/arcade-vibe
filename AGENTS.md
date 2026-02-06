# AGENTS.md

A monorepo workspace containing a Next.js web application and tRPC API with Drizzle ORM database.

## Package Manager

This project uses **pnpm@10.10.0** with workspaces. Use `pnpm` for all package operations.

## Commands

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
pnpm run db:studio        # Open Drizzle Studio
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

| Library | Skill Command | When to Use |
|---------|---------------|-------------|
| **tRPC** | `skill trpc` | Creating/modifying tRPC routers, procedures, context |
| **TanStack Form/Formedible** | `skill formedible` | Building forms with TanStack Form or Formedible components |
| **Vercel AI SDK** | `skill vercel/ai@ai-sdk` | Building AI features with the Vercel AI SDK |

**Before adding a new library**: Use `find-skills` to check if there's an available skill that provides expert guidance.

## Code Style

### Imports

Use type imports for types only:
```typescript
import type { NextRequest } from "next/server";
import { db } from "@arcade-vibe/db";
```

### Validation

All inputs must be validated with Zod:
```typescript
import z from "zod";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
```

### tRPC Procedures

```typescript
import { db } from "@arcade-vibe/db";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "@arcade-vibe/api";

export const exampleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(todo);
  }),
});
```

### React Components

Functional components with TypeScript:
```typescript
export default function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick}>{children}</button>;
}
```

### Error Handling

- Use TRPCError in tRPC procedures
- Use toast notifications in frontend (Sonner)
- Handle errors at appropriate levels

### Naming Conventions

- Components: PascalCase (`UserProfile.tsx`)
- Utilities/functions: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Types: PascalCase (`interface UserProps`)
- Files: kebab-case for utilities, PascalCase for components

### Database Queries

Always use Drizzle ORM with type-safe queries:
```typescript
import { db } from "@arcade-vibe/db";
import { users } from "@arcade-vibe/db/schema";
import { eq } from "drizzle-orm";

const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});
```

## Progressive Disclosure

For detailed guidelines:
- TypeScript patterns: See `packages/config/tsconfig.base.json` for compiler options
- API design: Check `packages/api/src/` for tRPC router patterns
- Database: See `packages/db/` for Drizzle schema and migrations
- Authentication: See `packages/auth/src/` for Better Auth setup
