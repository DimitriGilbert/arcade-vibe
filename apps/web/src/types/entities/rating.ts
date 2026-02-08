import type { RouterOutput } from "@/lib/trpc-types";

export type Rating = RouterOutput["ratings"]["getByUser"][number];
