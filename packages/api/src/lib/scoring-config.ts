export const SCORING_CONFIG = {
  bayesian: {
    priorRatingCount: 20,
    confidenceScale: 15,
  },
  quality: {
    multiplierScale: 0.25,
    minMultiplier: 0.85,
    maxMultiplier: 1.25,
  },
  time: {
    minimumCountedSeconds: 15,
    maxCountedSecondsPerSession: 900,
    pointsPerLogUnit: 450,
  },
  reach: {
    log10Scale: 0.12,
    minMultiplier: 1,
    maxMultiplier: 1.35,
  },
  replay: {
    pointsPerRepeat: 80,
    pointsPerReplayRatio: 140,
  },
  efficiency: {
    baselineInputTokens: 800,
    maxPenaltyInputTokens: 6000,
    maxBonusPoints: 120,
    maxPenaltyPoints: 220,
  },
  tier: {
    scale: 0.06,
    minFactor: 0.95,
    maxFactor: 1.1,
  },
  recalculation: {
    batchSize: 50,
    delayBetweenBatchesMs: 100,
  },
} as const;

export type ScoringConfig = typeof SCORING_CONFIG;
