import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { providerEnum } from "./enums";
import { user } from "./auth";
import { tierCosts } from "./credits";

// per PRD lines 1192-1202
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    keyHash: text("key_hash").notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (table) => [
    index("api_keys_userId_idx").on(table.userId),
    unique("api_keys_userId_provider_key").on(table.userId, table.provider),
  ],
);

// per PRD lines 1205-1218
export const modelConfig = pgTable(
  "model_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: providerEnum("provider").notNull(),
    modelName: text("model_name").notNull(),
    tierCostId: uuid("tier_cost_id")
      .notNull()
      .references(() => tierCosts.id, { onDelete: "restrict" }),
    costPer1kTokens: text("cost_per_1k_tokens").notNull(),
    maxTokens: integer("max_tokens").notNull(),
    supportsImages: boolean("supports_images").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("model_config_provider_modelName_key").on(
      table.provider,
      table.modelName,
    ),
    index("idx_model_config_active").on(table.isActive, table.tierCostId),
  ],
);
