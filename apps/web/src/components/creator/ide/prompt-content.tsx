"use client";

import { useState, useCallback, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import { HelpCircle } from "lucide-react";
import { GuidanceBubble } from "./creator-guidance";
import { LibrariesDialog } from "./libraries-dialog";
import type { EditorTheme } from "./types";
import type { CreatorGuidanceState } from "./creator-guidance";

interface MonacoEditor {
  onDidChangeCursorPosition: (callback: (e: { position: { lineNumber: number; column: number } }) => void) => void;
}

interface MonacoInstance {
  editor: {
    defineTheme: (
      name: string,
      theme: {
        base: "vs" | "vs-dark";
        inherit: boolean;
        rules: Array<{ token: string; foreground?: string; background?: string }>;
        colors: Record<string, string>;
      }
    ) => void;
  };
}

export interface PromptContentProps {
  content: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  onCursorChange?: (line: number, column: number) => void;
  theme: EditorTheme;
  themeId: string | null;
  guidance: CreatorGuidanceState | null;
  onDismissGuidance: () => void;
}

export function PromptContent({
  content,
  onChange,
  readOnly,
  onCursorChange,
  theme,
  themeId,
  guidance,
  onDismissGuidance,
}: PromptContentProps) {
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoTheme = theme === "github-light" ? "arcade-github-light" : "arcade-github-dark";
  const [librariesOpen, setLibrariesOpen] = useState(false);

  const handleEditorDidMount = (editorInstance: MonacoEditor) => {
    editorRef.current = editorInstance;
    editorInstance.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });
  };

  const handleBeforeMount = useCallback((monaco: MonacoInstance) => {
    monaco.editor.defineTheme("arcade-github-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editorLineNumber.foreground": "#6e7681",
        "editorLineNumber.activeForeground": "#e6edf3",
        "editorCursor.foreground": "#58a6ff",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#1f2937",
        "editor.lineHighlightBackground": "#161b22",
        "editorGutter.background": "#0d1117",
      },
    });

    monaco.editor.defineTheme("arcade-github-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1f2328",
        "editorLineNumber.foreground": "#8c959f",
        "editorLineNumber.activeForeground": "#1f2328",
        "editorCursor.foreground": "#0969da",
        "editor.selectionBackground": "#dbeafe",
        "editor.inactiveSelectionBackground": "#eaeef2",
        "editor.lineHighlightBackground": "#f6f8fa",
        "editorGutter.background": "#ffffff",
      },
    });
  }, []);

  const handleAddToPrompt = useCallback((text: string) => {
    const separator = content.trimEnd().length > 0 ? "\n\n" : "";
    onChange(content.trimEnd() + separator + text);
  }, [content, onChange]);

  return (
    <div
      className="relative h-full [&_.monaco-editor_.margin]:!pl-4 [&_.monaco-editor_.lines-content]:!pl-4"
      style={{ backgroundColor: theme === "github-light" ? "#ffffff" : "#0d1117" }}
    >
      {guidance?.currentStep === "content" ? (
        <div className="absolute left-4 top-4 z-10 max-w-60">
          <GuidanceBubble
            text="Write the prompt content here."
            onDismiss={onDismissGuidance}
          />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setLibrariesOpen(true)}
        className="absolute right-3 top-3 z-10 size-7 inline-flex items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        title="View available libraries"
      >
        <HelpCircle className="size-4" />
      </button>
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={content}
        onChange={(value) => onChange(value ?? "")}
        beforeMount={handleBeforeMount}
        theme={monacoTheme}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: "on",
          wordWrap: "on",
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          readOnly,
          fontFamily: "var(--font-mono)",
        }}
      />
      <LibrariesDialog
        themeId={themeId}
        open={librariesOpen}
        onOpenChange={setLibrariesOpen}
        onAddToPrompt={handleAddToPrompt}
      />
    </div>
  );
}
