export const SCORING_CONFIG = {
  weights: {
    quality: 0.4,
    difficulty: 0.25,
    efficiency: 0.2,
    engagement: 0.1,
    popularity: 0.05,
  },
  quality: {
    minRatingCount: 10,
    maxScore: 20,
    ratingToScoreMultiplier: 4,
  },
  difficulty: {
    maxScore: 20,
    defaultMultiplier: 1.0,
  },
  efficiency: {
    maxScore: 20,
    tokenBaseline: 1000,
  },
  engagement: {
    maxScore: 20,
    maxPlaytimeSeconds: 300,
    buckets: {
      veryShort: { maxSeconds: 30, label: "very_short" },
      short: { maxSeconds: 60, label: "short" },
      medium: { maxSeconds: 180, label: "medium" },
      long: { maxSeconds: 300, label: "long" },
      veryLong: { maxSeconds: Infinity, label: "very_long" },
    },
  },
  popularity: {
    maxScore: 20,
    logBase: 100,
  },
  recalculation: {
    batchSize: 50,
    delayBetweenBatchesMs: 100,
  },
} as const;

export type PlaytimeBucket = (typeof SCORING_CONFIG.engagement.buckets)[keyof typeof SCORING_CONFIG.engagement.buckets]["label"];

export function getPlaytimeBucket(seconds: number): PlaytimeBucket {
  const { buckets } = SCORING_CONFIG.engagement;
  if (seconds <= buckets.veryShort.maxSeconds) return buckets.veryShort.label;
  if (seconds <= buckets.short.maxSeconds) return buckets.short.label;
  if (seconds <= buckets.medium.maxSeconds) return buckets.medium.label;
  if (seconds <= buckets.long.maxSeconds) return buckets.long.label;
  return buckets.veryLong.label;
}

export type ScoringConfig = typeof SCORING_CONFIG;
