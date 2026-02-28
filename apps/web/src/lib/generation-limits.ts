const DEFAULT_GENERATION_CONCURRENCY_LIMIT = 4;
const MIN_GENERATION_CONCURRENCY_LIMIT = 1;
const MAX_GENERATION_CONCURRENCY_LIMIT = 4;

function parseGenerationConcurrencyLimit(rawValue: string | undefined): number {
  if (!rawValue) {
    return DEFAULT_GENERATION_CONCURRENCY_LIMIT;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsedValue)) {
    return DEFAULT_GENERATION_CONCURRENCY_LIMIT;
  }

  return Math.min(
    MAX_GENERATION_CONCURRENCY_LIMIT,
    Math.max(MIN_GENERATION_CONCURRENCY_LIMIT, parsedValue),
  );
}

export const GENERATION_CONCURRENCY_LIMIT = parseGenerationConcurrencyLimit(
  process.env.NEXT_PUBLIC_GENERATION_CONCURRENCY_LIMIT,
);
