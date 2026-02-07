"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
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
  gameplay: z.number().int().min(1).max(5).optional(),
  visuals: z.number().int().min(1).max(5).optional(),
  creativity: z.number().int().min(1).max(5).optional(),
  technical: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

export function RatingForm({ gameId, promptId, playtime, onSuccess }: RatingFormProps) {
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
        name: "gameplay",
        type: "rating",
        label: "Gameplay",
        description: "How fun and engaging is the game?",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          showValue: true,
        },
      },
      {
        name: "visuals",
        type: "rating",
        label: "Visuals",
        description: "How good do the graphics and animations look?",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          showValue: true,
        },
      },
      {
        name: "creativity",
        type: "rating",
        label: "Creativity",
        description: "How unique and innovative is the game?",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          showValue: true,
        },
      },
      {
        name: "technical",
        type: "rating",
        label: "Technical Quality",
        description: "How well-coded and bug-free is the game?",
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
        gameplay: undefined,
        visuals: undefined,
        creativity: undefined,
        technical: undefined,
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
            promptQuality: value.creativity,
            gameQuality: value.gameplay,
            themeRelevance: undefined,
          });
          toast.success("Rating submitted successfully!");
          onSuccess();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to submit rating";
          toast.error(message);
          throw error;
        }
      },
    },
  });

  return <Form className="space-y-4" />;
}
