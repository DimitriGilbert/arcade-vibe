"use client";

import type { FieldConfig } from "@/lib/formedible/types";
import type { z } from "zod";

import { useState, useCallback } from "react";

import { ArcadeButton } from "@/components/arcade/arcade-button";
import { FeedbackDialog } from "./FeedbackDialog";

interface FeedbackButtonProps {
  schema: z.ZodObject<z.ZodRawShape>;
  fields: FieldConfig[];
  subject: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "glow";
  description?: string;
}

export function FeedbackButton({
  schema,
  fields,
  subject,
  label = "Feedback",
  variant = "outline",
  description,
}: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
  }, []);

  return (
    <>
      <ArcadeButton variant={variant} onClick={() => setOpen(true)} type="button">
        {label}
      </ArcadeButton>
      <FeedbackDialog
        schema={schema}
        fields={fields}
        subject={subject}
        open={open}
        onOpenChange={handleOpenChange}
        description={description}
      />
    </>
  );
}
