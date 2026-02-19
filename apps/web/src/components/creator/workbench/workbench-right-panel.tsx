"use client";

import { Code, History, Cpu, Settings } from "lucide-react";
import {
  ArcadeTabs,
  ArcadeTabsList,
  ArcadeTabsTrigger,
  ArcadeTabsContent,
} from "@/components/arcade";
import { WorkbenchOutputTab } from "./workbench-output-tab";
import { WorkbenchHistoryTab } from "./workbench-history-tab";
import { WorkbenchModelsTab } from "./workbench-models-tab";
import { WorkbenchSettingsTab } from "./workbench-settings-tab";
import type { ModelSelection, ModelMetadata, ApiKey, RightPanelTab } from "./types";
import type { ThemeList, Visibility } from "@/lib/trpc-types";

interface WorkbenchRightPanelProps {
  activeTab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  // Output tab props
  activeOutputTab: string | null;
  selectedModels: ModelSelection[];
  onOutputTabChange: (id: string) => void;
  // History tab props
  promptId: string | null;
  // Models tab props
  modelMetadata: ModelMetadata | null | undefined;
  onAddModel: (selection: ModelSelection) => void;
  onRemoveModel: (id: string) => void;
  apiKeys: ApiKey[] | undefined;
  disabled: boolean;
  // Settings tab props
  themes: ThemeList[] | undefined;
  themesLoading: boolean;
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
}

export function WorkbenchRightPanel({
  activeTab,
  onTabChange,
  // Output
  activeOutputTab,
  selectedModels,
  onOutputTabChange,
  // History
  promptId,
  // Models
  modelMetadata,
  onAddModel,
  onRemoveModel,
  apiKeys,
  disabled,
  // Settings
  themes,
  themesLoading,
  selectedTheme,
  onSelectTheme,
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
        <ArcadeTabsTrigger variant="line" value="output">
          <Code className="h-3.5 w-3.5" />
          Output
        </ArcadeTabsTrigger>
        <ArcadeTabsTrigger variant="line" value="history">
          <History className="h-3.5 w-3.5" />
          History
        </ArcadeTabsTrigger>
        <ArcadeTabsTrigger variant="line" value="models">
          <Cpu className="h-3.5 w-3.5" />
          Models
        </ArcadeTabsTrigger>
        <ArcadeTabsTrigger variant="line" value="settings">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </ArcadeTabsTrigger>
      </ArcadeTabsList>

      <ArcadeTabsContent value="output" className="flex-1 min-h-0 overflow-hidden mt-0">
        <WorkbenchOutputTab
          activeOutputTab={activeOutputTab}
          selectedModels={selectedModels}
          onOutputTabChange={onOutputTabChange}
        />
      </ArcadeTabsContent>

      <ArcadeTabsContent value="history" className="flex-1 min-h-0 overflow-hidden mt-0">
        <WorkbenchHistoryTab promptId={promptId} />
      </ArcadeTabsContent>

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

      <ArcadeTabsContent value="settings" className="flex-1 min-h-0 overflow-auto mt-0 p-3">
        <WorkbenchSettingsTab
          themes={themes}
          themesLoading={themesLoading}
          selectedTheme={selectedTheme}
          onSelectTheme={onSelectTheme}
          visibility={visibility}
          onVisibilityChange={onVisibilityChange}
        />
      </ArcadeTabsContent>
    </ArcadeTabs>
  );
}
