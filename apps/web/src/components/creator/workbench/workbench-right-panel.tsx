"use client";

import { History, Cpu, Settings } from "lucide-react";
import {
  ArcadeTabs,
  ArcadeTabsList,
  ArcadeTabsTrigger,
  ArcadeTabsContent,
} from "@/components/arcade";
import { WorkbenchHistoryTab } from "./workbench-history-tab";
import { WorkbenchModelsTab } from "./workbench-models-tab";
import { WorkbenchSettingsTab } from "./workbench-settings-tab";
import type { ModelSelection, ModelMetadata, ApiKey, RightPanelTab } from "./types";
import type { Visibility } from "@/lib/trpc-types";

interface WorkbenchRightPanelProps {
  activeTab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  // History tab props (now includes output functionality)
  promptId: string | null;
  selectedModels: ModelSelection[];
  activeOutputTab: string | null;
  onOutputTabChange: (id: string | null) => void;
  // Models tab props
  modelMetadata: ModelMetadata | null | undefined;
  onAddModel: (selection: ModelSelection) => void;
  onRemoveModel: (id: string) => void;
  apiKeys: ApiKey[] | undefined;
  disabled: boolean;
  // Settings tab props (only visibility now)
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
}

export function WorkbenchRightPanel({
  activeTab,
  onTabChange,
  // History/Output
  promptId,
  selectedModels,
  activeOutputTab,
  onOutputTabChange,
  // Models
  modelMetadata,
  onAddModel,
  onRemoveModel,
  apiKeys,
  disabled,
  // Settings
  visibility,
  onVisibilityChange,
}: WorkbenchRightPanelProps) {
  return (
    <ArcadeTabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as RightPanelTab)}
      className="h-full min-h-0 flex flex-col overflow-hidden"
    >
      <ArcadeTabsList variant="line" className="shrink-0">
        <ArcadeTabsTrigger variant="line" value="models">
          <Cpu className="h-3.5 w-3.5" />
          Models
        </ArcadeTabsTrigger>
        <ArcadeTabsTrigger variant="line" value="history">
          <History className="h-3.5 w-3.5" />
          History
        </ArcadeTabsTrigger>
        <ArcadeTabsTrigger variant="line" value="settings">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </ArcadeTabsTrigger>
      </ArcadeTabsList>

      <ArcadeTabsContent value="models" className="flex-1 min-h-0 overflow-auto mt-0 p-3">
        <WorkbenchModelsTab
          modelMetadata={modelMetadata}
          selectedModels={selectedModels}
          onAddModel={onAddModel}
          onRemoveModel={onRemoveModel}
          apiKeys={apiKeys}
          disabled={disabled}
        />
      </ArcadeTabsContent>

      <ArcadeTabsContent value="history" className="flex-1 min-h-0 overflow-hidden mt-0">
        <WorkbenchHistoryTab
          promptId={promptId}
          selectedModels={selectedModels}
          activeOutputTab={activeOutputTab}
          onOutputTabChange={onOutputTabChange}
          disabled={disabled}
        />
      </ArcadeTabsContent>

      <ArcadeTabsContent value="settings" className="flex-1 min-h-0 overflow-auto mt-0 p-3">
        <WorkbenchSettingsTab
          visibility={visibility}
          onVisibilityChange={onVisibilityChange}
        />
      </ArcadeTabsContent>
    </ArcadeTabs>
  );
}
