"use client";

import { Loader2, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArcadeButton } from "@/components/arcade";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import type { GameAdminView } from "@/lib/trpc-types";

export interface HideGameDialogProps {
  open: boolean;
  game: GameAdminView | null;
  onClose: () => void;
  onHide: (gameId: string, reason: string) => Promise<void>;
  isHiding: boolean;
}

export function HideGameDialog({
  open,
  game,
  onClose,
  onHide,
  isHiding,
}: HideGameDialogProps) {
  const schema = z.object({
    reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be at most 500 characters"),
  });

  const { Form } = useFormedible({
    schema,
    fields: [
      {
        name: "reason",
        type: "textarea",
        label: "Reason for Hiding",
        textareaConfig: { rows: 3, maxLength: 500 },
      },
    ],
    formOptions: {
      defaultValues: {
        reason: "",
      },
      onSubmit: async ({ value }) => {
        if (game) {
          await onHide(game.id, value.reason);
        }
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Hide Game</DialogTitle>
          <DialogDescription>
            Hide &quot;{game?.name ?? "Untitled"}&quot; from the platform
          </DialogDescription>
        </DialogHeader>
        <Form className="space-y-4" />
        <DialogFooter>
          <ArcadeButton variant="outline" onClick={onClose}>
            Cancel
          </ArcadeButton>
          <ArcadeButton
            variant="primary"
            disabled={isHiding}
            onClick={() => {
              // Form submission is handled by useFormedible's Form component
            }}
          >
            {isHiding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Hiding...
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Game
              </>
            )}
          </ArcadeButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
