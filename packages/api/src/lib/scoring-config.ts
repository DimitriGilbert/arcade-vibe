export const SCORING_CONFIG = {
  bayesian: {
    priorRatingCount: 20,
    confidenceScale: 15,
  },
  players: {
    saturation: 25,
  },
  plays: {
    saturation: 60,
  },
  engagement: {
    shortThresholdSeconds: 30,
    ratingThresholdSeconds: 60,
    p75CapSeconds: 300,
    weights: {
      retention30: 0.45,
      retention60: 0.35,
      p75Playtime: 0.2,
    },
  },
  efficiency: {
    baselineInputTokens: 800,
    maxPenaltyInputTokens: 6000,
  },
  tier: {
    scale: 0.08,
    minFactor: 0.9,
    maxFactor: 1.12,
  },
  weights: {
    quality: 0.34,
    engagement: 0.22,
    players: 0.16,
    plays: 0.1,
    replay: 0.08,
    efficiency: 0.1,
  },
  recalculation: {
    batchSize: 50,
    delayBetweenBatchesMs: 100,
  },
} as const;

export type ScoringConfig = typeof SCORING_CONFIG;
