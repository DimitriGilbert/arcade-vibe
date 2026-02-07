#!/usr/bin/env node
/**
 * Recalculate Scores Job
 *
 * This job recalculates scores for all games in the database.
 * It can be run manually or scheduled as a cron job.
 *
 * Usage:
 *   pnpm run recalculate-scores
 */

import { recalculateAllScores } from "../lib/scoring.js";

async function main(): Promise<void> {
  console.log("========================================");
  console.log("Starting Score Recalculation Job");
  console.log("========================================\n");

  try {
    const result = await recalculateAllScores();

    console.log("\n========================================");
    console.log("Score Recalculation Job Completed");
    console.log("========================================");
    console.log(`Summary:`);
    console.log(`  Total Games: ${result.totalGames}`);
    console.log(`  Successful: ${result.successful}`);
    console.log(`  Failed: ${result.failed}`);

    if (result.failed > 0) {
      console.log(`\nFailed Game IDs:`);
      result.failedGameIds.forEach((gameId) => {
        console.log(`  - ${gameId}`);
      });
      process.exit(1);
    } else {
      console.log(`\nAll scores recalculated successfully!`);
      process.exit(0);
    }
  } catch (error) {
    console.error("\n========================================");
    console.error("Score Recalculation Job Failed");
    console.error("========================================");
    console.error(error);
    process.exit(1);
  }
}

// Run the job
main();
