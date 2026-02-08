import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@arcade-vibe/api/routers/index";

/**
 * Centralized tRPC type exports for the Arcade Vibe frontend.
 *
 * This file provides type-safe access to all tRPC router outputs and inputs,
 * making it easy to use tRPC data throughout the application.
 */

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

/**
 * ============================================
 * GAMES TYPES
 * ============================================
 */

export type GamesOutput = RouterOutput["games"];
export type GamesInput = RouterInput["games"];

export type GameByIdOutput = GamesOutput["getById"];
export type GameListByPromptOutput = GamesOutput["listByPrompt"];
export type GameListByThemeOutput = GamesOutput["listByTheme"];
export type GameSubmitOutput = GamesOutput["submit"];
export type GameHideOutput = GamesOutput["hide"];
export type GameGetCodeOutput = GamesOutput["getCode"];

/**
 * ============================================
 * PROMPTS TYPES
 * ============================================
 */

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

/**
 * ============================================
 * THEMES TYPES
 * ============================================
 */

export type ThemesOutput = RouterOutput["themes"];
export type ThemesInput = RouterInput["themes"];

export type ThemeListOutput = ThemesOutput["list"];
export type ThemeGetCurrentOutput = ThemesOutput["getCurrent"];
export type ThemeByIdOutput = ThemesOutput["getById"];
export type ThemeCreateOutput = ThemesOutput["create"];
export type ThemeUpdateOutput = ThemesOutput["update"];
export type ThemeUpdateStatusOutput = ThemesOutput["updateStatus"];

/**
 * ============================================
 * RATINGS TYPES
 * ============================================
 */

export type RatingsOutput = RouterOutput["ratings"];
export type RatingsInput = RouterInput["ratings"];

export type RatingCreateOutput = RatingsOutput["create"];
export type RatingUpdateOutput = RatingsOutput["update"];
export type RatingByGameOutput = RatingsOutput["getByGame"];
export type RatingByUserOutput = RatingsOutput["getByUser"];
export type RatingMyRatingOutput = RatingsOutput["getMyRating"];

/**
 * ============================================
 * LEADERBOARD TYPES
 * ============================================
 */

export type LeaderboardOutput = RouterOutput["leaderboard"];
export type LeaderboardInput = RouterInput["leaderboard"];

export type LeaderboardGetTopOutput = LeaderboardOutput["getTop"];

/**
 * ============================================
 * USER & AUTH TYPES
 * ============================================
 */

export type UserOutput = RouterOutput["user"];
export type UserInput = RouterInput["user"];

export type UserUpdateProfileOutput = UserOutput["updateProfile"];

/**
 * ============================================
 * CREDITS TYPES
 * ============================================
 */

export type CreditsOutput = RouterOutput["credits"];
export type CreditsInput = RouterInput["credits"];

export type CreditsGetUserExtendedOutput = CreditsOutput["getUserExtended"];
export type CreditsGetBalanceOutput = CreditsOutput["getBalance"];
export type CreditsGetTransactionsOutput = CreditsOutput["getTransactions"];
export type CreditsAddCreditsOutput = CreditsOutput["addCredits"];

/**
 * ============================================
 * HELPER TYPES
 * ============================================
 */

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
 * Extract the author user from game prompt to prevent circular references
 */
export type PromptAuthor = NonNullable<GamePrompt["user"]>;

/**
 * Extract the prompt entity
 */
export type PromptEntity = PromptByIdOutput;

/**
 * Extract the theme entity
 */
export type ThemeEntity = ThemeByIdOutput;

/**
 * Extract leaderboard entry array type
 */
export type LeaderboardEntries = LeaderboardGetTopOutput;

/**
 * Extract user extended profile (includes credits and reputation)
 */
export type UserExtendedProfile = CreditsGetUserExtendedOutput;

/**
 * Extract credit balance info
 */
export type CreditBalanceInfo = CreditsGetBalanceOutput;

/**
 * Extract credit transactions info
 */
export type CreditTransactionsInfo = CreditsGetTransactionsOutput;
