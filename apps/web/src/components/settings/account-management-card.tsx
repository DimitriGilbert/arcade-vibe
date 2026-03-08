"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import { Switch } from "@/components/ui/switch";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

/**
 * Account management card with danger zone
 * Contains account deletion and GDPR export functionality
 */
export function AccountManagementCard() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastExportDate, setLastExportDate] = useState<Date | null>(null);
  const [includeGames, setIncludeGames] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await trpcClient.user.exportData.mutate({
        includeGames,
      });
      
      if (result.success) {
        if (result.isZip && result.zipData) {
          // Handle ZIP download
          const binaryString = atob(result.zipData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "application/zip" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = result.filename ?? `user-data-export-${new Date().toISOString().split("T")[0]}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          setLastExportDate(new Date());
          toast.success("Data export complete", {
            description: "Your data including games has been downloaded as a ZIP file.",
          });
        } else if (result.data) {
          // Handle JSON download (fallback)
          const blob = new Blob([JSON.stringify(result.data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = result.filename ?? `user-data-export-${new Date().toISOString().split("T")[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          setLastExportDate(new Date());
          toast.success("Data export complete", {
            description: "Your data has been downloaded successfully.",
          });
        }
      }
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Failed to export data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteConfirm = async (confirmation: string) => {
    if (confirmation !== CONFIRMATION_TEXT) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await trpcClient.user.deleteAccount.mutate({
        confirmation,
      });

      if (result.success) {
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out from auth
        await authClient.signOut();
        
        // Close dialog
        setDeleteDialogOpen(false);
        
        // Show goodbye message
        toast.success("Account deleted", {
          description: "Your account has been permanently deleted. Goodbye!",
        });
        
        // Redirect to home
        router.push("/");
      }
    } catch (error) {
      toast.error("Deletion failed", {
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
      });
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ArcadeCard className="border-destructive/30 lg:col-span-3">
        {/* Compact Header */}
        <div className="flex items-center gap-2 p-4 border-b border-destructive/30 bg-destructive/5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <h3 className="font-medium text-destructive">Account Management</h3>
        </div>

        <div className="p-4 space-y-6">
          {/* Account Deletion Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium text-[var(--foreground)]">
                  Delete Account
                </h4>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <ArcadeButton
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="border-destructive/50 text-destructive hover:bg-destructive/10 shrink-0"
              >
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </ArcadeButton>
            </div>

            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm text-[var(--muted-foreground)]">
                  <p className="font-medium text-destructive">Warning:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>All your games, prompts, and themes will be deleted</li>
                    <li>Your ratings and reviews will be removed</li>
                    <li>Your credit balance will be lost</li>
                    <li>This action is immediate and irreversible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* GDPR Export Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium text-[var(--foreground)]">
                  Export Your Data
                </h4>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Download a copy of your personal data before deleting your
                  account.
                </p>
              </div>
              <ArcadeButton
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="shrink-0"
              >
                {isExporting ? "Exporting..." : "Export Data"}
              </ArcadeButton>
            </div>

            {/* Include Games Option */}
            <div className="flex items-center gap-3 py-2">
              <Switch
                id="include-games"
                checked={includeGames}
                onCheckedChange={setIncludeGames}
                size="default"
              />
              <div className="space-y-0.5">
                <label 
                  htmlFor="include-games"
                  className="text-sm font-medium text-[var(--foreground)] cursor-pointer"
                >
                  Include my games as HTML files
                </label>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Export your games as standalone HTML files that can be played offline
                </p>
              </div>
            </div>

            {lastExportDate && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Last export: {new Date(lastExportDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </ArcadeCard>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
