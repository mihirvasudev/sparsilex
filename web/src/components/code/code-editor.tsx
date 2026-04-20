"use client";

import { useEffect, useRef } from "react";

interface CodeEditorProps {
  value: string;
  language?: "r" | "python" | "sql" | "markdown";
  onChange?: (value: string) => void;
  onRunSelection?: (selectedText: string) => void;
  onRunAll?: () => void;
}

/**
 * Lightweight code editor built on a textarea + gutter with line numbers.
 *
 * This is a clean MVP: no syntax highlighting, but it handles:
 * - Monospace typography + line numbers
 * - Tab inserts 2 spaces (not focus-jump)
 * - Cmd/Ctrl+Enter: run selection (or current line if no selection)
 * - Cmd/Ctrl+Shift+Enter: run whole file
 *
 * Monaco integration is a follow-up once the Next.js peer-dep noise
 * settles; the editor contract here stays identical so it's a drop-in
 * replacement later.
 */
export function CodeEditor({
  value,
  onChange,
  onRunSelection,
  onRunAll,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = value.split("\n").length;
  const gutter = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1).join("\n");

  // Sync gutter scroll with textarea
  useEffect(() => {
    const ta = textareaRef.current;
    const gut = gutterRef.current;
    if (!ta || !gut) return;
    const onScroll = () => { gut.scrollTop = ta.scrollTop; };
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;

    // Cmd/Ctrl + Enter — run selection or current line
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart, selectionEnd } = ta;
      let text = value.slice(selectionStart, selectionEnd);
      if (!text.trim()) {
        // Fall back to the line containing the cursor
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        const lineEnd = value.indexOf("\n", selectionStart);
        text = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
      }
      if (text.trim()) onRunSelection?.(text);
      return;
    }

    // Cmd/Ctrl + Shift + Enter — run whole file
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      onRunAll?.();
      return;
    }

    // Tab inserts 2 spaces (and supports shift-tab to unindent)
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd } = ta;
      if (e.shiftKey) {
        // Unindent: if start of line has 2+ spaces, remove them
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        const prefix = value.slice(lineStart, lineStart + 2);
        if (prefix === "  ") {
          const next = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onChange?.(next);
          requestAnimationFrame(() => {
            ta.selectionStart = selectionStart - 2;
            ta.selectionEnd = selectionEnd - 2;
          });
        }
      } else {
        const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
        onChange?.(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + 2;
        });
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 flex bg-[#0c0a09]">
      {/* Line-number gutter */}
      <div
        ref={gutterRef}
        className="shrink-0 overflow-hidden py-2 pl-2 pr-3 text-right text-muted-foreground/40 select-none whitespace-pre"
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
          fontSize: "12.5px",
          lineHeight: "1.55",
          minWidth: `${String(lines).length + 1}ch`,
        }}
      >
        {gutter}
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="flex-1 min-w-0 resize-none bg-transparent text-[#e2e8f0] p-2 focus:outline-none font-mono"
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
          fontSize: "12.5px",
          lineHeight: "1.55",
          tabSize: 2,
          whiteSpace: "pre",
          overflowWrap: "normal",
          overflowX: "auto",
        }}
      />
    </div>
  );
}
