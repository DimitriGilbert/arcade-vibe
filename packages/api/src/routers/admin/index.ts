import { router } from "@arcade-vibe/api";
import { modelConfigRouter } from "./models";
import { directActionsRouter } from "./direct";
import { plansRouter } from "./plans";

/**
 * Admin Router
 *
 * Combines all admin sub-routers:
 * - models: Model configuration management (activate/deactivate, pricing, add new models)
 * - direct: Direct admin actions (hide game, suspend user, update scoring weights, get moderation queue)
 * - plans: Subscription plan management (get, update, toggle active)
 */
export const adminRouter = router({
  models: modelConfigRouter,
  direct: directActionsRouter,
  plans: plansRouter,
});
