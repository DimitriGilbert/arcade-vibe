"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import {
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
  ArcadeDialogFooter,
  ArcadeDialogClose,
  ArcadeButton,
} from "@/components/arcade";
import { ArcadeInput } from "@/components/arcade";

const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (confirmation: string) => void | Promise<void>;
  isDeleting?: boolean;
}

/**
 * Delete account confirmation dialog
 * Requires user to type "DELETE MY ACCOUNT" to confirm deletion
 */
export function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteAccountDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const isConfirmEnabled =
    confirmationInput === CONFIRMATION_TEXT && !isDeleting;

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationInput("");
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm(confirmationInput);
    }
  };

  return (
    <ArcadeDialog open={open} onOpenChange={handleClose}>
      <ArcadeDialogContent
        variant="default"
        size="sm"
        showClose={!isDeleting}
        className="border-destructive/50"
      >
        <ArcadeDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <ArcadeDialogTitle className="text-destructive">
              Delete Account
            </ArcadeDialogTitle>
          </div>
        </ArcadeDialogHeader>

        <div className="space-y-4">
          <ArcadeDialogDescription className="text-base">
            This action is{" "}
            <span className="font-semibold text-destructive">permanent</span> and
            cannot be undone.
          </ArcadeDialogDescription>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
            <p className="text-sm font-medium text-destructive">
              The following will be permanently deleted:
            </p>
            <ul className="text-sm text-[var(--muted-foreground)] space-y-1 list-disc list-inside">
              <li>Your profile and account data</li>
              <li>All games you&apos;ve created</li>
              <li>All prompts and themes you&apos;ve submitted</li>
              <li>Your ratings and reviews</li>
              <li>Your credit balance and transaction history</li>
              <li>API keys and integrations</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label htmlFor="delete-confirmation" className="text-sm font-medium">
              Type{" "}
              <span className="font-mono font-bold text-destructive">
                {CONFIRMATION_TEXT}
              </span>{" "}
              to confirm:
            </label>
            <ArcadeInput
              id="delete-confirmation"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={CONFIRMATION_TEXT}
              disabled={isDeleting}
              className="font-mono"
            />
          </div>
        </div>

        <ArcadeDialogFooter>
          <ArcadeDialogClose>
            <ArcadeButton variant="outline" disabled={isDeleting}>
              Cancel
            </ArcadeButton>
          </ArcadeDialogClose>
          <ArcadeButton
            variant="primary"
            disabled={!isConfirmEnabled}
            onClick={handleConfirm}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Delete My Account
              </>
            )}
          </ArcadeButton>
        </ArcadeDialogFooter>
      </ArcadeDialogContent>
    </ArcadeDialog>
  );
}
