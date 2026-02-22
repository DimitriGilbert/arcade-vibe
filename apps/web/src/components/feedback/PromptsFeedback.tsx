"use client";

import { FeedbackButton } from "@/components/feedback";
import {
  promptsPageFeedbackSchema,
  promptsPageFeedbackFields,
} from "@/lib/feedback-schemas";

export function PromptsFeedback() {
  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md">
        Can't decide? Neither can we! Help shape this feature by sharing what you'd want to see.
      </p>
      <FeedbackButton
        schema={promptsPageFeedbackSchema}
        fields={promptsPageFeedbackFields}
        subject="Prompts Page Feedback"
        label="Help Us Decide"
        variant="outline"
        description="Your input drives what gets built. Tell us which view speaks to you and why."
      />
    </div>
  );
}
