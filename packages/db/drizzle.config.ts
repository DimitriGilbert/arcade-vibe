import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

const envPaths = [
  "../../apps/web/.env",
  "../../.env",
  ".env",
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: path.resolve(__dirname, envPath) });
  if (!result.error) {
    break;
  }
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
