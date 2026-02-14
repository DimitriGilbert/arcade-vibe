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

export const modelConfig = pgTable(
  "model_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    unique("model_config_modelName_key").on(table.modelName),
    index("idx_model_config_active").on(table.isActive, table.tierCostId),
  ],
);

export const modelProviders = pgTable(
  "model_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelConfigId: uuid("model_config_id")
      .notNull()
      .references(() => modelConfig.id, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("model_providers_modelConfigId_provider_key").on(
      table.modelConfigId,
      table.provider,
    ),
    index("model_providers_provider_idx").on(table.provider),
  ],
);
