import type { FieldConfig } from "@/lib/formedible/types";
import { z } from "zod";

/**
 * Schema for the Creator landing page feedback form.
 * Collects user's preferred editor, overall rating, and improvement suggestions.
 */
export const creatorPageFeedbackSchema = z.object({
  preferredEditor: z.enum(["workbench", "inbox", "filebrowser"]).optional(),
  rating: z.number().min(1).max(5),
  improvements: z.string().optional(),
});

export type CreatorPageFeedbackValues = z.infer<typeof creatorPageFeedbackSchema>;

/**
 * Field configuration for the Creator landing page feedback form.
 */
export const creatorPageFeedbackFields: FieldConfig[] = [
  {
    name: "preferredEditor",
    type: "select",
    label: "Which editor do you prefer?",
    placeholder: "Select an editor",
    options: [
      { value: "workbench", label: "Workbench" },
      { value: "inbox", label: "Inbox" },
      { value: "filebrowser", label: "File Browser" },
    ],
  },
  {
    name: "rating",
    type: "rating",
    label: "How would you rate your experience?",
    ratingConfig: {
      max: 5,
      allowHalf: false,
      showValue: true,
    },
  },
  {
    name: "improvements",
    type: "textarea",
    label: "What could be improved?",
    placeholder: "Share your thoughts...",
    textareaConfig: {
      rows: 4,
      showWordCount: true,
      maxLength: 500,
    },
  },
];

/**
 * Schema for the individual editor feedback forms.
 * Collects rating, layout preference, missing features, and bug reports.
 */
export const leaderboardPageFeedbackSchema = z.object({
  preferredView: z.enum(["arena", "dashboard", "magazine"]).optional(),
  rating: z.number().min(1).max(5),
  whatYouLiked: z.string().optional(),
  improvements: z.string().optional(),
});

export type LeaderboardPageFeedbackValues = z.infer<typeof leaderboardPageFeedbackSchema>;

export const leaderboardPageFeedbackFields: FieldConfig[] = [
  {
    name: "preferredView",
    type: "select",
    label: "Which view style do you prefer?",
    placeholder: "Select a view",
    options: [
      { value: "arena", label: "Arena (Competitive)" },
      { value: "dashboard", label: "Dashboard (Analytics)" },
      { value: "magazine", label: "Magazine (Curated)" },
    ],
  },
  {
    name: "rating",
    type: "rating",
    label: "How excited are you about this feature?",
    ratingConfig: {
      max: 5,
      allowHalf: false,
      showValue: true,
    },
  },
  {
    name: "whatYouLiked",
    type: "textarea",
    label: "What resonated with you?",
    placeholder: "Tell us what caught your eye...",
    textareaConfig: {
      rows: 3,
      showWordCount: true,
      maxLength: 300,
    },
  },
  {
    name: "improvements",
    type: "textarea",
    label: "What would make this better?",
    placeholder: "Ideas, features, or changes you'd love to see...",
    textareaConfig: {
      rows: 3,
      showWordCount: true,
      maxLength: 300,
    },
  },
];

export const editorFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  layout: z.enum(["love_it", "its_ok", "needs_work"]).optional(),
  missingFeatures: z.string().optional(),
  bugs: z.string().optional(),
});

export type EditorFeedbackValues = z.infer<typeof editorFeedbackSchema>;

/**
 * Field configuration for the individual editor feedback forms.
 */
export const editorFeedbackFields: FieldConfig[] = [
  {
    name: "rating",
    type: "rating",
    label: "How would you rate this editor?",
    ratingConfig: {
      max: 5,
      allowHalf: false,
      showValue: true,
    },
  },
  {
    name: "layout",
    type: "radio",
    label: "What do you think of the layout?",
    options: [
      { value: "love_it", label: "Love it!" },
      { value: "its_ok", label: "It's okay" },
      { value: "needs_work", label: "Needs work" },
    ],
  },
  {
    name: "missingFeatures",
    type: "textarea",
    label: "Any missing features?",
    placeholder: "What would make this editor better?",
    textareaConfig: {
      rows: 3,
      showWordCount: true,
      maxLength: 300,
    },
  },
  {
    name: "bugs",
    type: "textarea",
    label: "Found any bugs?",
    placeholder: "Describe any issues you encountered...",
    textareaConfig: {
      rows: 3,
      showWordCount: true,
      maxLength: 300,
    },
  },
];
