"use client";

import { useCallback, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import type { EditorTheme } from "./types";

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
}

export function PromptContent({
  content,
  onChange,
  readOnly,
  onCursorChange,
  theme,
}: PromptContentProps) {
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoTheme = theme === "github-light" ? "arcade-github-light" : "arcade-github-dark";

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

  return (
    <div
      className="h-full [&_.monaco-editor_.margin]:!pl-4 [&_.monaco-editor_.lines-content]:!pl-4"
      style={{ backgroundColor: theme === "github-light" ? "#ffffff" : "#0d1117" }}
    >
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
    </div>
  );
}
