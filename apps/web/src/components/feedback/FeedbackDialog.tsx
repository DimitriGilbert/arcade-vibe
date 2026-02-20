"use client";

import type { FieldConfig } from "@/lib/formedible/types";

import { z } from "zod";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { useFormedible } from "@/hooks/use-formedible";
import { trpcClient } from "@/utils/trpc";
import {
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
} from "@/components/arcade/arcade-dialog";
import { ArcadeButton } from "@/components/arcade/arcade-button";

interface FeedbackDialogProps {
  schema: z.ZodObject<z.ZodRawShape>;
  fields: FieldConfig[];
  subject: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description?: string;
}

export function FeedbackDialog({
  schema,
  fields,
  subject,
  open,
  onOpenChange,
  description = "We'd love to hear your thoughts. Your feedback helps us improve.",
}: FeedbackDialogProps) {
  const defaultValues = useMemo(() => {
    const shape = schema.shape;
    const defaults: Record<string, unknown> = {};

    for (const [key, zodType] of Object.entries(shape)) {
      if (zodType instanceof z.ZodString) {
        defaults[key] = "";
      } else if (zodType instanceof z.ZodNumber) {
        defaults[key] = 0;
      } else if (zodType instanceof z.ZodBoolean) {
        defaults[key] = false;
      } else if (zodType instanceof z.ZodArray) {
        defaults[key] = [];
      } else if (zodType instanceof z.ZodEnum) {
        defaults[key] = zodType.options[0];
      } else {
        defaults[key] = undefined;
      }
    }

    return defaults;
  }, [schema]);

  const onSubmit = useCallback(
    async ({ value }: { value: Record<string, unknown> }) => {
      try {
        await trpcClient.feedback.submit.mutate({
          subject,
          answer: value,
        });

        toast.success("Feedback submitted", {
          description: "Thank you for your feedback!",
        });

        onOpenChange(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to submit feedback";

        toast.error("Failed to submit feedback", {
          description: message,
        });
      }
    },
    [subject, onOpenChange]
  );

  const { Form } = useFormedible({
    schema,
    fields,
    formOptions: {
      defaultValues,
      onSubmit,
    },
    submitLabel: "Submit Feedback",
  });

  return (
    <ArcadeDialog open={open} onOpenChange={onOpenChange}>
      <ArcadeDialogContent size="md" showClose={true}>
        <ArcadeDialogHeader>
          <ArcadeDialogTitle>{subject}</ArcadeDialogTitle>
          <ArcadeDialogDescription>{description}</ArcadeDialogDescription>
        </ArcadeDialogHeader>
        <Form className="space-y-4" />
        <div className="flex justify-end gap-2 mt-4">
          <ArcadeButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </ArcadeButton>
        </div>
      </ArcadeDialogContent>
    </ArcadeDialog>
  );
}
