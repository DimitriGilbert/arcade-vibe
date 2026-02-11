/**
 * @fileoverview Type Consolidation - Single Source of Truth
 *
 * This file is the SINGLE SOURCE OF TRUTH for all frontend types.
 * All types are automatically derived from their respective sources -
 * NEVER define manual types here.
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Type Sources                                │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Database Schema (packages/db/src/schema)                       │
 * │   └─→ Source of truth for ENUM types                           │
 * │       (GameStatus, PromptStatus, ThemeStatus, Visibility, etc.)│
 * ├─────────────────────────────────────────────────────────────────┤
 * │ tRPC Router (packages/api/src/routers)                         │
 * │   └─→ Source of truth for ENTITY shapes                        │
 * │       (Game, Prompt, Theme, User, Rating, etc.)                │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ This File (apps/web/src/lib/trpc-types.ts)                     │
 * │   └─→ Derives ALL frontend types from above sources            │
 * │       - Re-exports enum types from @arcade-vibe/db             │
 * │       - Derives entity types from inferRouterOutputs           │
 * │       - Creates extended types (GameWithRanking, etc.)         │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * IMPORT PATTERNS:
 * ```typescript
 * // ✅ CORRECT - Import entity types from this file
 * import type { Game, Prompt, Theme, User, UserProfile } from "@/lib/trpc-types";
 *
 * // ✅ CORRECT - Import enum types from this file
 * import type { GameStatus, PromptStatus, Visibility } from "@/lib/trpc-types";
 *
 * // ✅ CORRECT - Import extended/combined types
 * import type { GameWithRanking, UserExtended } from "@/lib/trpc-types";
 *
 * // ❌ WRONG - Never define manual types duplicating backend types
 * type GameStatus = "pending" | "completed"; // Forbidden!
 *
 * // ❌ WRONG - Never import directly from API package in components
 * import type { AppRouter } from "@arcade-vibe/api"; // Use trpc-types instead
 * ```
 *
 * ADDING NEW TYPES:
 * 1. For ENTITY types: Add the data to the tRPC router first
 *    (e.g., add a new procedure in packages/api/src/routers/)
 * 2. Derive the type here from RouterOutput:
 *    `export type NewEntity = RouterOutput["newRouter"]["getById"];`
 * 3. Export and use in components
 *
 * 4. For ENUM types: Define in packages/db/src/schema/enums-types.ts
 * 5. Re-export here:
 *    `export type NewEnum = NewEnumType;`
 *
 * TYPE CATEGORIES IN THIS FILE:
 * - Section 1: ENUM TYPES (re-exported from @arcade-vibe/db)
 * - Section 2: ROUTER OUTPUT TYPES (base types from tRPC)
 * - Section 3: ENTITY TYPES (derived from router outputs)
 * - Section 4: HELPER/UTILITY TYPES (extracted nested types)
 *
 * @module trpc-types
 * @see packages/db/src/schema/enums-types.ts - Enum definitions
 * @see packages/api/src/routers/index.ts - AppRouter definition
 */

import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@arcade-vibe/api/routers/index";
import type {
  GameStatus as GameStatusType,
  PromptStatus as PromptStatusType,
  ThemeStatus as ThemeStatusType,
  Visibility as VisibilityType,
  UserRole as UserRoleType,
  Provider as ProviderType,
} from "@arcade-vibe/db";

// ============================================
// ENUM TYPES (from @arcade-vibe/db)
// ============================================

/**
 * Game status values: generating, completed, failed, hidden
 * @source packages/db/src/schema/enums-types.ts
 */
export type GameStatus = GameStatusType;

/**
 * Prompt status values: draft, submitted, disqualified
 * @source packages/db/src/schema/enums-types.ts
 */
export type PromptStatus = PromptStatusType;

/**
 * Theme status values: upcoming, active, frozen, archived
 * @source packages/db/src/schema/enums-types.ts
 */
export type ThemeStatus = ThemeStatusType;

/**
 * Visibility values: private, public_on_freeze, public
 * Used by both prompts and themes.
 * @source packages/db/src/schema/enums-types.ts
 */
export type Visibility = VisibilityType;

/**
 * User role values: admin, moderator, participant, viewer
 * @source packages/db/src/schema/enums-types.ts
 */
export type UserRole = UserRoleType;

/**
 * AI provider values: openai, anthropic, google, openrouter, deepseek, glm, glm-coding-plan, moonshot, custom
 * @source packages/db/src/schema/enums-types.ts
 */
export type Provider = ProviderType;

// Aliases for frontend context clarity
/**
 * Prompt visibility - alias for Visibility
 * Used when working with prompt-specific visibility logic
 */
export type PromptVisibility = Visibility;

/**
 * Theme visibility - alias for Visibility
 * Used when working with theme-specific visibility logic
 */
export type ThemeVisibility = Visibility;

// ============================================
// ROUTER OUTPUT TYPES (base types from tRPC)
// ============================================

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

// --- Games Router ---

export type GamesOutput = RouterOutput["games"];
export type GamesInput = RouterInput["games"];

export type GameByIdOutput = GamesOutput["getById"];
export type GameListByPromptOutput = GamesOutput["listByPrompt"];
export type GameListByThemeOutput = GamesOutput["listByTheme"];
export type GameSubmitOutput = GamesOutput["submit"];
export type GameHideOutput = GamesOutput["hide"];
export type GameGetCodeOutput = GamesOutput["getCode"];

// --- Prompts Router ---

export type PromptsOutput = RouterOutput["prompts"];
export type PromptsInput = RouterInput["prompts"];

export type PromptCreateOutput = PromptsOutput["create"];
export type PromptUpdateOutput = PromptsOutput["update"];
export type PromptForkOutput = PromptsOutput["fork"];
export type PromptByIdOutput = PromptsOutput["getById"];
export type PromptListVersionsOutput = PromptsOutput["listVersions"];
export type PromptGetVersionOutput = PromptsOutput["getVersion"];
export type PromptListMineOutput = PromptsOutput["listMine"];
export type PromptListPublicOutput = PromptsOutput["listPublic"];

// --- Themes Router ---

export type ThemesOutput = RouterOutput["themes"];
export type ThemesInput = RouterInput["themes"];

export type ThemeListOutput = ThemesOutput["list"];
export type ThemeGetCurrentOutput = ThemesOutput["getCurrent"];
export type ThemeByIdOutput = ThemesOutput["getById"];
export type ThemeCreateOutput = ThemesOutput["create"];
export type ThemeUpdateOutput = ThemesOutput["update"];
export type ThemeUpdateStatusOutput = ThemesOutput["updateStatus"];

// --- Ratings Router ---

export type RatingsOutput = RouterOutput["ratings"];
export type RatingsInput = RouterInput["ratings"];

export type RatingCreateOutput = RatingsOutput["create"];
export type RatingUpdateOutput = RatingsOutput["update"];
export type RatingByGameOutput = RatingsOutput["getByGame"];
export type RatingByUserOutput = RatingsOutput["getByUser"];
export type RatingMyRatingOutput = RatingsOutput["getMyRating"];

// --- Leaderboard Router ---

export type LeaderboardOutput = RouterOutput["leaderboard"];
export type LeaderboardInput = RouterInput["leaderboard"];

export type LeaderboardGetTopOutput = LeaderboardOutput["getTop"];

// --- User Router ---

export type UserOutput = RouterOutput["user"];
export type UserInput = RouterInput["user"];

export type UserGetByNameOutput = UserOutput["getByName"];
export type UserUpdateProfileOutput = UserOutput["updateProfile"];

// --- Credits Router ---

export type CreditsOutput = RouterOutput["credits"];
export type CreditsInput = RouterInput["credits"];

export type CreditsGetUserExtendedOutput = CreditsOutput["getUserExtended"];
export type CreditsGetBalanceOutput = CreditsOutput["getBalance"];
export type CreditsGetTransactionsOutput = CreditsOutput["getTransactions"];
export type CreditsAddCreditsOutput = CreditsOutput["addCredits"];

// --- Admin Router ---

export type AdminOutput = RouterOutput["admin"];
export type AdminInput = RouterInput["admin"];

export type AdminLibraryPatternsListOutput =
  AdminOutput["libraryPatterns"]["list"];

// ============================================
// ENTITY TYPES (derived from router outputs)
// ============================================

// --- Game Entity Types ---

/**
 * Full game entity with all nested relations
 * @source RouterOutput["games"]["getById"]
 */
export type Game = GameByIdOutput;

/**
 * Game entity as returned from listByTheme (array item)
 * @source RouterOutput["games"]["listByTheme"][number]
 */
export type GameFromApi = GameListByThemeOutput[number];

/**
 * Game with ranking information for leaderboard display
 */
export type GameWithRanking = Game & {
  ranking: number | null;
};

/**
 * Extract the game entity with nested prompt and theme
 */
export type GameWithDetails = GameByIdOutput;

/**
 * Extract the nested prompt from game output to prevent circular references
 */
export type GamePrompt = NonNullable<GameByIdOutput["prompt"]>;

/**
 * Extract the nested theme from game output to prevent circular references
 */
export type GameTheme = NonNullable<GameByIdOutput["theme"]>;

// --- Prompt Entity Types ---

/**
 * Full prompt entity with all nested relations
 * @source RouterOutput["prompts"]["getById"]
 */
export type Prompt = PromptByIdOutput;

/**
 * Array of prompt entities
 */
export type PromptList = Prompt[];

/**
 * Prompt version entity from version history
 * @source RouterOutput["prompts"]["listVersions"][number]
 */
export type PromptVersion = PromptListVersionsOutput[number];

/**
 * Extract the prompt entity for direct use
 */
export type PromptEntity = PromptByIdOutput;

// --- Theme Entity Types ---

/**
 * Full theme entity with all nested relations
 * @source RouterOutput["themes"]["getById"]
 *
 * Extended with admin UI fields that may not be in tRPC output yet.
 */
export type Theme = ThemeByIdOutput & {
  systemPrompt?: string | null;
  requirements?: Record<string, unknown> | null;
};

/**
 * Theme entity as returned from list (array item)
 * @source RouterOutput["themes"]["list"][number]
 *
 * Extended with admin UI fields that may not be in tRPC output yet.
 */
export type ThemeList = ThemeListOutput[number] & {
  systemPrompt?: string | null;
  requirements?: Record<string, unknown> | null;
};

/**
 * Extract the theme entity for direct use
 */
export type ThemeEntity = ThemeByIdOutput;

// --- User Entity Types ---

/**
 * Extract the author user from game prompt to prevent circular references
 * This is the user info embedded in prompt responses
 */
export type PromptAuthor = NonNullable<GamePrompt["user"]>;

/**
 * Basic user type derived from prompt author (embedded in game data)
 * Contains: id, name, email, image
 * For public profile with createdAt, use UserProfile.
 * For extended info with credits/reputation, use UserExtended.
 */
export type User = PromptAuthor;

/**
 * Extended user profile with credits and reputation
 * @source RouterOutput["credits"]["getUserExtended"]
 */
export type UserExtended = CreditsGetUserExtendedOutput;

/**
 * User with optional extended information
 * Combines basic user with extended profile fields
 */
export type UserWithExtended = User & Partial<UserExtended>;

/**
 * Public user profile for display purposes
 * @source RouterOutput["user"]["getByName"]
 */
export type UserProfile = UserGetByNameOutput;

/**
 * Admin view of user with full details
 * Combines extended profile with name and email
 */
export type UserAdminView = UserExtended & {
  name: string;
  email: string;
};

/**
 * Extract user extended profile (includes credits and reputation)
 */
export type UserExtendedProfile = CreditsGetUserExtendedOutput;

// --- Rating Entity Types ---

/**
 * Rating entity from user's ratings list
 * @source RouterOutput["ratings"]["getByUser"][number]
 */
export type Rating = RatingByUserOutput[number];

// --- Leaderboard Entity Types ---

/**
 * Single leaderboard entry from top games
 * @source RouterOutput["leaderboard"]["getTop"] array item
 */
export type LeaderboardEntry = LeaderboardGetTopOutput extends (infer T)[]
  ? T
  : never;

/**
 * Game data nested within leaderboard entry
 */
export type LeaderboardGame = LeaderboardEntry extends { game?: infer G }
  ? NonNullable<G>
  : never;

/**
 * Prompt data nested within leaderboard game
 */
export type LeaderboardPrompt = LeaderboardGame extends { prompt?: infer P }
  ? NonNullable<P>
  : never;

/**
 * Theme data nested within leaderboard game
 */
export type LeaderboardTheme = LeaderboardGame extends { theme?: infer T }
  ? NonNullable<T>
  : never;

/**
 * Extract leaderboard entry array type
 */
export type LeaderboardEntries = LeaderboardGetTopOutput;

// ============================================
// HELPER/UTILITY TYPES
// ============================================

/**
 * Extract credit balance info
 */
export type CreditBalanceInfo = CreditsGetBalanceOutput;

/**
 * Extract credit transactions info
 */
export type CreditTransactionsInfo = CreditsGetTransactionsOutput;

// --- Library Pattern Entity Types ---

/**
 * Library pattern entity from admin list
 * @source RouterOutput["admin"]["libraryPatterns"]["list"][number]
 */
export type LibraryPattern = AdminLibraryPatternsListOutput[number];
