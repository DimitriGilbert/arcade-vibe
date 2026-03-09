"use client";

import {
  creatorPageFeedbackSchema,
  creatorPageFeedbackFields,
} from "@/lib/feedback-schemas";
import { FeedbackButton } from "./FeedbackButton";

interface CreatorFeedbackButtonProps {
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "glow";
}

export function CreatorFeedbackButton({
  label = "Help Us Decide",
  variant = "outline",
}: CreatorFeedbackButtonProps) {
  return (
    <FeedbackButton
      schema={creatorPageFeedbackSchema}
      fields={creatorPageFeedbackFields}
      subject="Creator Page Feedback"
      label={label}
      variant={variant}
      description="Your input drives what gets built. Tell us which editor feels right and what would make it better."
    />
  );
}
