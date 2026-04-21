"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnMount, OnChange } from "@monaco-editor/react";

// Monaco is client-only — lazy-load
const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center h-full text-xs text-muted-foreground bg-[#0c0a09]">
      Loading editor...
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  language?: "r" | "python" | "sql" | "markdown";
  onChange?: (value: string) => void;
  onRunSelection?: (selectedText: string) => void;
  onRunAll?: () => void;
}

/**
 * Monaco-based editor tuned for SparsileX.
 *
 * Keybindings:
 * - Cmd/Ctrl+Enter: run selection (or current line if no selection)
 * - Cmd/Ctrl+Shift+Enter: run whole file
 */
export function CodeEditor({
  value,
  language = "r",
  onChange,
  onRunSelection,
  onRunAll,
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Keep latest callbacks in refs so the Monaco commands always use fresh versions
  const runSelRef = useRef(onRunSelection);
  const runAllRef = useRef(onRunAll);
  useEffect(() => {
    runSelRef.current = onRunSelection;
    runAllRef.current = onRunAll;
  }, [onRunSelection, onRunAll]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Cmd/Ctrl + Enter — run selection or current line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      if (!selection || !model) return;
      let text = model.getValueInRange(selection);
      if (!text.trim()) {
        const lineNo = selection.startLineNumber;
        text = model.getLineContent(lineNo);
      }
      if (text.trim()) runSelRef.current?.(text);
    });

    // Cmd/Ctrl + Shift + Enter — run whole file
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => runAllRef.current?.()
    );
  };

  const handleChange: OnChange = (val) => {
    onChange?.(val ?? "");
  };

  return (
    <div className="flex-1 min-h-0">
      <Monaco
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onMount={handleMount}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 10, bottom: 10 },
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          renderLineHighlight: "line",
          lineNumbersMinChars: 3,
          folding: true,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
