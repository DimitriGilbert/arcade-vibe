"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArcadeButton } from "@/components/arcade";
import type { Report, ReportAction } from "./types";

export interface ResolutionDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (report: Report, action: ReportAction, resolutionReason: string) => void;
  isPending: boolean;
}

const ACTIONS: { action: ReportAction; icon: React.ReactNode; label: string; desc: string; active: string }[] = [
  { action: "approved", icon: <XCircle className="h-4 w-4 mx-auto mb-1" />, label: "Approve", desc: "Take action (hide game, suspend user)", active: "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]" },
  { action: "rejected", icon: <CheckCircle className="h-4 w-4 mx-auto mb-1" />, label: "Reject", desc: "No action needed", active: "bg-[var(--secondary)]/20 border-[var(--secondary)] text-[var(--secondary)]" },
  { action: "requested_changes", icon: <AlertTriangle className="h-4 w-4 mx-auto mb-1" />, label: "Request Changes", desc: "Ask for content modification", active: "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]" },
  { action: "escalated", icon: <AlertTriangle className="h-4 w-4 mx-auto mb-1" />, label: "Escalate", desc: "Send to admin review", active: "bg-[var(--destructive)]/20 border-[var(--destructive)] text-[var(--destructive)]" },
];

/** Resolution dialog for report resolution. Client component - has form state and submit actions */
export function ResolutionDialog({ report, open, onOpenChange, onResolve, isPending }: ResolutionDialogProps) {
  const [selectedAction, setSelectedAction] = useState<ReportAction | null>(null);
  const [resolutionReason, setResolutionReason] = useState("");

  const handleSubmit = () => {
    if (report && selectedAction) {
      onResolve(report, selectedAction, resolutionReason || "No reason provided");
    }
  };

  const handleClose = () => {
    setSelectedAction(null);
    setResolutionReason("");
    onOpenChange(false);
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Report</DialogTitle>
          <DialogDescription>Choose an action and provide a resolution reason</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Resolution Action</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ACTIONS.map((cfg) => (
                <button
                  key={cfg.action}
                  type="button"
                  onClick={() => setSelectedAction(cfg.action)}
                  className={`p-3 rounded-lg border text-sm transition-all ${selectedAction === cfg.action ? cfg.active : "hover:bg-[var(--muted)]/60"}`}
                >
                  {cfg.icon}
                  <span className="block">{cfg.label}</span>
                  <span className="block text-xs text-[var(--muted-foreground)] mt-1">{cfg.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Resolution Reason</Label>
            <Textarea
              placeholder="Explain your resolution decision..."
              className="min-h-[100px]"
              value={resolutionReason}
              onChange={(e) => setResolutionReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <ArcadeButton variant="outline" onClick={handleClose}>Cancel</ArcadeButton>
          <ArcadeButton variant="primary" onClick={handleSubmit} disabled={!selectedAction || isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Resolving...</> : <><Check className="h-4 w-4" /> Submit Resolution</>}
          </ArcadeButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
