import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { PromptVersion } from "@/lib/trpc-types";

export interface UseVersionHistoryReturn {
  versions: PromptVersion[];
  selectedVersionId: string | null;
  isViewingOldVersion: boolean;
  selectVersion: (versionId: string, onContentChange: (content: string) => void) => void;
  createNewVersion: () => void;
  isLoading: boolean;
}

export function useVersionHistory(promptId: string | null): UseVersionHistoryReturn {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isViewingOldVersion, setIsViewingOldVersion] = useState(false);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["prompt-versions", promptId],
    queryFn: async () => {
      if (!promptId) return [];
      return await trpcClient.prompts.listVersions.query({ promptId });
    },
    enabled: !!promptId,
  });

  const selectVersion = useCallback(
    (versionId: string, onContentChange: (content: string) => void) => {
      const versionData = versions?.find((v: PromptVersion) => v.id === versionId);
      if (versionData) {
        onContentChange(versionData.content);
        setSelectedVersionId(versionId);
        setIsViewingOldVersion(versionId !== promptId);
      }
    },
    [versions, promptId]
  );

  const createNewVersion = useCallback(() => {
    setIsViewingOldVersion(false);
  }, []);

  return {
    versions: versions ?? [],
    selectedVersionId,
    isViewingOldVersion,
    selectVersion,
    createNewVersion,
    isLoading,
  };
}
