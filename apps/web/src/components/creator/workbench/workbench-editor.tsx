"use client";

import Editor from "@monaco-editor/react";

interface WorkbenchEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function WorkbenchEditor({ value, onChange, disabled }: WorkbenchEditorProps) {
  return (
    <div className="h-full min-h-0 border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          lineNumbers: "on",
          wordWrap: "on",
          fontSize: 13,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          readOnly: disabled,
          fontFamily: "JetBrains Mono, Menlo, Monaco, monospace",
          fontLigatures: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          renderLineHighlight: "all",
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
