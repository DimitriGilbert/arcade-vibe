"use client";

import { FeedbackButton } from "@/components/feedback";
import {
  leaderboardPageFeedbackSchema,
  leaderboardPageFeedbackFields,
} from "@/lib/feedback-schemas";

export function LeaderboardFeedback() {
  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md">
        Can't decide? Neither can we! Help shape this feature by sharing what you'd want to see.
      </p>
      <FeedbackButton
        schema={leaderboardPageFeedbackSchema}
        fields={leaderboardPageFeedbackFields}
        subject="Leaderboard Page Feedback"
        label="Help Us Decide"
        variant="outline"
        description="Your input drives what gets built. Tell us which view speaks to you and why."
      />
    </div>
  );
}
