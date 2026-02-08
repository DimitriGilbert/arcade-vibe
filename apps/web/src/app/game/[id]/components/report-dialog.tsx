import {
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
  ArcadeButton,
} from "@/components/arcade";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
  isSubmitting: boolean;
}

export function ReportDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ReportDialogProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reason = formData.get("reason") as string;
    const description = formData.get("description") as string;

    if (!reason || reason === "other") {
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      return;
    }

    await onSubmit(reason, description);
  };

  return (
    <ArcadeDialog open={isOpen} onOpenChange={onClose}>
      <ArcadeDialogContent>
        <ArcadeDialogHeader>
          <ArcadeDialogTitle>Report Game</ArcadeDialogTitle>
          <ArcadeDialogDescription>
            Please provide a reason for reporting this game
          </ArcadeDialogDescription>
        </ArcadeDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              name="reason"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              required
            >
              <option value="">Select a reason</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="malicious">Malicious code/behavior</option>
              <option value="copyright">Copyright violation</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe why you're reporting this game... (minimum 20 characters)"
              className="w-full min-h-[120px] px-3 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <ArcadeButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </ArcadeButton>
            <ArcadeButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-[var(--destructive)] hover:bg-[var(--destructive)]/80"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </ArcadeButton>
          </div>
        </form>
      </ArcadeDialogContent>
    </ArcadeDialog>
  );
}
