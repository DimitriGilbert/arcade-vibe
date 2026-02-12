"use client";

import React from "react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

interface RatingFormProps {
  gameId: string;
  promptId: string;
  playtime: number;
  onSuccess: () => void;
}

const ratingSchema = z.object({
  overall: z.number().int().min(1).max(5),
  promptQuality: z.number().int().min(1).max(5).optional(),
  gameQuality: z.number().int().min(1).max(5).optional(),
  themeRelevance: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

export function RatingForm({
  gameId,
  promptId,
  playtime,
  onSuccess,
}: RatingFormProps) {
  const { Form } = useFormedible({
    schema: ratingSchema,
    fields: [
      {
        name: "overall",
        type: "rating",
        label: "Overall Rating",
        description: "Rate your overall experience (required)",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          showValue: true,
        },
      },
      {
        name: "promptQuality",
        type: "rating",
        label: "Prompt Quality",
        description: "How well did the game match the prompt?",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          showValue: true,
        },
      },
      {
        name: "gameQuality",
        type: "rating",
        label: "Game Quality",
        description: "How fun and well-made is the game?",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          showValue: true,
        },
      },
      {
        name: "themeRelevance",
        type: "rating",
        label: "Theme Relevance",
        description: "How well does the game fit the theme?",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          showValue: true,
        },
      },
      {
        name: "feedback",
        type: "textarea",
        label: "Feedback (Optional)",
        placeholder: "Share your thoughts about the game...",
        textareaConfig: {
          rows: 4,
          showWordCount: true,
          maxLength: 500,
        },
      },
    ],
    formOptions: {
      defaultValues: {
        overall: 5,
        promptQuality: undefined,
        gameQuality: undefined,
        themeRelevance: undefined,
        feedback: "",
      },
      onSubmit: async ({ value }) => {
        try {
          await trpcClient.ratings.create.mutate({
            gameId,
            promptId,
            rating: value.overall,
            playtime,
            feedback: value.feedback,
            promptQuality: value.promptQuality,
            gameQuality: value.gameQuality,
            themeRelevance: value.themeRelevance,
          });
          toast.success("Rating submitted successfully!");
          onSuccess();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to submit rating";
          toast.error(message);
          throw error;
        }
      },
    },
  });

  return <Form className="space-y-4" />;
}
