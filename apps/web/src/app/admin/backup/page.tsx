"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileJson,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ArcadeButton, ArcadeCard } from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";
import type { BackupData } from "@/lib/trpc-types";

export default function BackupPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupInfo, setBackupInfo] = useState<{
    timestamp: string;
    totalRows: number;
    tableCount: number;
    tables: { name: string; rowCount: number }[];
  } | null>(null);
  const [truncateFirst, setTruncateFirst] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tableCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["admin-table-counts"],
    queryFn: () => trpcClient.admin.backup.listTableCounts.query(),
  });

  const backupMutation = useMutation({
    mutationFn: async () => {
      const result = await trpcClient.admin.backup.backup.mutate();
      return result;
    },
    onSuccess: (result) => {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup created successfully", {
        description: `${result.data.metadata.totalRows} rows across ${result.data.metadata.tableCount} tables`,
      });
    },
    onError: (error: Error) => {
      toast.error("Backup failed", { description: error.message });
    },
  });

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text) as BackupData;

      const info = await trpcClient.admin.backup.getBackupInfo.query({
        backupData,
      });

      setBackupInfo(info);
      toast.success("Backup file loaded", {
        description: `Backup from ${new Date(info.timestamp).toLocaleString()}`,
      });
    } catch (error) {
      toast.error("Invalid backup file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setSelectedFile(null);
      setBackupInfo(null);
    }
  };

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      const text = await selectedFile.text();
      const backupData = JSON.parse(text) as BackupData;

      return await trpcClient.admin.backup.restore.mutate({
        backupData,
        truncateFirst,
      });
    },
    onSuccess: (result) => {
      toast.success("Database restored successfully", {
        description: `${result.summary.totalRowsRestored} rows restored across ${result.summary.tablesProcessed} tables`,
      });
      setSelectedFile(null);
      setBackupInfo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast.error("Restore failed", { description: error.message });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Database Backup & Restore
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Create backups or restore the database from a previous backup file.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ArcadeCard>
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--foreground)] text-lg">
                Create Backup
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Export all database tables to a JSON file. This backup includes
              all user data, games, prompts, themes, and system configuration.
            </p>

            <div className="p-3 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)]">
              <div className="flex items-center gap-2 text-sm">
                <FileJson className="h-4 w-4 text-[var(--accent)]" />
                <span>Format: JSON</span>
              </div>
              {tableCounts && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Database className="h-4 w-4 text-[var(--accent)]" />
                  <span>
                    {tableCounts.totalRows.toLocaleString()} rows across{" "}
                    {tableCounts.tables.length} tables
                  </span>
                </div>
              )}
            </div>

            <ArcadeButton
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending}
              className="w-full"
            >
              {backupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Backup
                </>
              )}
            </ArcadeButton>
          </div>
        </ArcadeCard>

        <ArcadeCard>
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--foreground)] text-lg">
                Restore from Backup
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--destructive)] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-[var(--destructive)]">
                  <strong>Warning:</strong> Restoring will replace all existing
                  data. This action cannot be undone.
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="backup-file"
                className="block text-sm font-medium mb-2"
              >
                Select Backup File
              </label>
              <input
                id="backup-file"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:brightness-110 cursor-pointer"
              />
            </div>

            {backupInfo && (
              <div className="p-3 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-[var(--accent)]" />
                  <span className="font-medium">Backup Loaded</span>
                </div>
                <div className="text-sm text-[var(--muted-foreground)] space-y-1">
                  <div>
                    Created: {new Date(backupInfo.timestamp).toLocaleString()}
                  </div>
                  <div>
                    {backupInfo.totalRows.toLocaleString()} rows across{" "}
                    {backupInfo.tableCount} tables
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={truncateFirst}
                onChange={(e) => setTruncateFirst(e.target.checked)}
                className="rounded border-[var(--border)]"
              />
              <span>
                <Trash2 className="h-3 w-3 inline mr-1" />
                Clear existing data before restore
              </span>
            </label>

            <ArcadeButton
              variant="outline"
              onClick={() => restoreMutation.mutate()}
              disabled={!selectedFile || !backupInfo || restoreMutation.isPending}
              className="w-full border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
            >
              {restoreMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Restore Database
                </>
              )}
            </ArcadeButton>
          </div>
        </ArcadeCard>
      </div>

      <ArcadeCard>
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="font-semibold text-[var(--foreground)] text-lg">
              Current Database Tables
            </h3>
          </div>
        </div>
        <div className="p-4">
          {countsLoading ? (
            <LoadingState message="Loading table counts..." />
          ) : !tableCounts || tableCounts.tables.length === 0 ? (
            <EmptyState
              icon={<Database className="h-12 w-12" />}
              message="No tables found"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tableCounts.tables.map((table) => (
                <div
                  key={table.table}
                  className="p-3 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)]"
                >
                  <div className="text-xs font-mono text-[var(--muted-foreground)] truncate">
                    {table.table}
                  </div>
                  <div className="text-lg font-bold">
                    {table.count.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ArcadeCard>
    </div>
  );
}
