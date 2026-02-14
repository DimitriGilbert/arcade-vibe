import { router } from "@arcade-vibe/api";
import { modelConfigRouter } from "./models";
import { directActionsRouter } from "./direct";
import { plansRouter } from "./plans";
import { libraryPatternsRouter } from "./library-patterns";
import { tierCostsRouter } from "./tier-costs";
import { statsRouter } from "./stats";

/**
 * Admin Router
 *
 * Combines all admin sub-routers:
 * - models: Model configuration management (activate/deactivate, pricing, add new models)
 * - direct: Direct admin actions (hide game, suspend user, update scoring weights, get moderation queue)
 * - plans: Subscription plan management (get, update, toggle active)
 * - libraryPatterns: Allowed library pattern management (create, update, delete, add to/remove from themes)
 * - tierCosts: Tier credit cost management (get, update, reset to defaults)
 * - stats: Platform statistics and audit log (getStats, getActions)
 */
export const adminRouter = router({
  models: modelConfigRouter,
  direct: directActionsRouter,
  plans: plansRouter,
  libraryPatterns: libraryPatternsRouter,
  tierCosts: tierCostsRouter,
  stats: statsRouter,
});
