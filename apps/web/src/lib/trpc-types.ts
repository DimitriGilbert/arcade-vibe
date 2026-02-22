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
import type {
  ThemeMediaConfig as ThemeMediaConfigType,
  ImageSlot as ImageSlotType,
} from "@arcade-vibe/db/schema/media-types";

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

/**
 * Media configuration for themes
 * Defines image slots and Strudel audio settings
 * @source packages/db/src/schema/media-types.ts
 */
export type ThemeMediaConfig = ThemeMediaConfigType;

/**
 * Image slot definition within ThemeMediaConfig
 * @source packages/db/src/schema/media-types.ts
 */
export type ImageSlot = ImageSlotType;

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
export type GameGetRawCodeOutput = GamesOutput["getRawCode"];

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
export type PromptGetPublicByIdOutput = PromptsOutput["getPublicById"];
export type PromptListGamesByPromptOutput = PromptsOutput["listGamesByPrompt"];
export type PromptListForksByPromptOutput = PromptsOutput["listForksByPrompt"];

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

export type AdminStatsGetStatsOutput = AdminOutput["stats"]["getStats"];
export type AdminStatsGetActionsOutput = AdminOutput["stats"]["getActions"];

export type AdminDirectGetGamesOutput = AdminOutput["direct"]["getGames"];

// --- Feedback Router ---

export type FeedbackOutput = RouterOutput["feedback"];
export type FeedbackInput = RouterInput["feedback"];

export type FeedbackListOutput = FeedbackOutput["list"];
export type FeedbackGetByIdOutput = FeedbackOutput["getById"];
export type FeedbackDeleteOutput = FeedbackOutput["delete"];

// --- Models Router ---

export type ModelsOutput = RouterOutput["models"];
export type ModelsInput = RouterInput["models"];

export type ModelsListWithStatsOutput = ModelsOutput["listWithStats"];
export type ModelsGetByIdWithStatsOutput = ModelsOutput["getByIdWithStats"];
export type ModelsListGamesByModelOutput = ModelsOutput["listGamesByModel"];

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
 * @source RouterOutput["games"]["listByTheme"]["games"][number]
 */
export type GameFromApi = NonNullable<GameListByThemeOutput>["games"][number];

/**
 * Game with ranking information for leaderboard display
 */
export type GameWithRanking = Game & {
  ranking: number | null;
  tierCost?: { slug: string } | null;
  modelName?: string;
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

/**
 * Game media data (strudel code and media URLs)
 * @source packages/db/src/schema/games.ts
 */
export type GameMedia = {
  strudelCode: string | null;
  mediaUrls: Record<string, string> | null;
};

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
 * @warning DRIFT RISK: Manual type extensions below
 * The following fields are manually extended and NOT derived from the tRPC router.
 * If the backend schema changes, these extensions may become out of sync.
 * TODO: Move these fields to the tRPC router output to eliminate drift risk.
 *
 * Manually extended fields:
 * - systemPrompt?: string | null
 * - requirements?: Record<string, unknown> | null
 * - mediaConfig?: ThemeMediaConfig | null
 */
export type Theme = ThemeByIdOutput & {
  systemPrompt?: string | null;
  requirements?: Record<string, unknown> | null;
  mediaConfig?: ThemeMediaConfig | null;
};

/**
 * Theme entity as returned from list (array item)
 * @source RouterOutput["themes"]["list"][number]
 *
 * @warning DRIFT RISK: Same manual extensions as Theme type above.
 * These fields may not exist in the actual API response.
 */
export type ThemeList = ThemeListOutput[number] & {
  systemPrompt?: string | null;
  requirements?: Record<string, unknown> | null;
  mediaConfig?: ThemeMediaConfig | null;
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
 * @source RouterOutput["leaderboard"]["getTop"]["entries"][number]
 */
export type LeaderboardEntry = NonNullable<LeaderboardGetTopOutput>["entries"][number];

/**
 * Creator info within leaderboard entry
 */
export type LeaderboardCreator = LeaderboardEntry["creator"];

/**
 * Tier info within leaderboard entry
 */
export type LeaderboardTier = NonNullable<LeaderboardEntry["tier"]>;

/**
 * Theme info within leaderboard entry
 */
export type LeaderboardThemeInfo = NonNullable<LeaderboardEntry["theme"]>;

/**
 * Extract leaderboard result type (includes pagination info)
 */
export type LeaderboardResult = LeaderboardGetTopOutput;

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

export type AdminStats = AdminStatsGetStatsOutput;

export type AdminAction = AdminStatsGetActionsOutput["actions"][number];

export type GameAdminView = AdminDirectGetGamesOutput[number];

// --- Feedback Entity Types ---

/**
 * Feedback entity from feedback list
 * @source RouterOutput["feedback"]["list"][number]
 */
export type Feedback = FeedbackListOutput[number];

// --- Admin Email Router Types ---

export type AdminEmailOutput = AdminOutput["email"];
export type AdminEmailInput = AdminInput["email"];

/**
 * User data for email targeting with aggregated stats
 * @source RouterOutput["admin"]["email"]["getFilteredUsers"]["users"][number]
 */
export type UserForEmail = NonNullable<AdminEmailOutput["getFilteredUsers"]>["users"][number];

/**
 * Email log entry
 * @source RouterOutput["admin"]["email"]["getLogs"]["logs"][number]
 */
export type EmailLog = NonNullable<AdminEmailOutput["getLogs"]>["logs"][number];

/**
 * Email statistics by status and type
 * @source RouterOutput["admin"]["email"]["getStats"]
 */
export type EmailStats = AdminEmailOutput["getStats"];

/**
 * Filter options for user targeting
 * @source RouterInput["admin"]["email"]["getFilteredUsers"]["filters"]
 */
export type UserFilterInput = AdminEmailInput["getFilteredUsers"]["filters"];

/**
 * Sort configuration for user listing
 * @source RouterInput["admin"]["email"]["getFilteredUsers"]["sort"]
 */
export type SortConfigInput = AdminEmailInput["getFilteredUsers"]["sort"];

/**
 * Sort field options for user listing
 */
export type SortField = SortConfigInput["field"];

/**
 * Sort order options
 */
export type SortOrder = SortConfigInput["order"];

// --- Models Entity Types ---

export type ModelWithStats = ModelsListWithStatsOutput[number];
export type ModelDetail = ModelsGetByIdWithStatsOutput;
export type ModelGame = ModelsListGamesByModelOutput[number];
