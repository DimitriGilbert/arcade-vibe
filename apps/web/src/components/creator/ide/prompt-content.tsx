"use client";

import { useRef } from "react";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface MonacoEditor {
  onDidChangeCursorPosition: (callback: (e: { position: { lineNumber: number; column: number } }) => void) => void;
}

export interface PromptContentProps {
  content: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  onCursorChange?: (line: number, column: number) => void;
}

export function PromptContent({
  content,
  onChange,
  readOnly,
  onCursorChange,
}: PromptContentProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<MonacoEditor | null>(null);

  const handleEditorDidMount = (editorInstance: MonacoEditor) => {
    editorRef.current = editorInstance;
    editorInstance.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });
  };

  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={content}
        onChange={(value) => onChange(value ?? "")}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
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
