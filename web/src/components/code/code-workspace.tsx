"use client";

import { useEffect, useState } from "react";
import { CodeEditor } from "./code-editor";
import { FileTree, type CodeFile } from "./file-tree";
import { EnvInspector } from "./env-inspector";
import { ReplOutput } from "./repl-output";
import { useCodeSession } from "@/hooks/use-code-session";

interface CodeWorkspaceProps {
  sessionId: string | null;
}

const DEFAULT_STARTER: CodeFile = {
  id: "analysis",
  name: "analysis.R",
  language: "r",
  content: [
    "# Welcome to sparx Code mode.",
    "# Write R here; Cmd/Ctrl+Enter runs a line or selection.",
    "# Cmd/Ctrl+Shift+Enter runs the whole file.",
    "",
    "x <- 42",
    "print(x * 2)",
    "",
  ].join("\n"),
  modified: false,
};

/**
 * Full Code-mode workspace: Files | Editor | (REPL + Env split)
 *
 * Layout at wide widths:
 *   [Files 170px] [Editor flex-1] [Right 260px]
 *                                  ├── Env (top)
 *                                  └── REPL (bottom)
 *
 * Layout at narrow widths collapses the right column under the editor.
 */
export function CodeWorkspace({ sessionId }: CodeWorkspaceProps) {
  const [files, setFiles] = useState<CodeFile[]>([DEFAULT_STARTER]);
  const [activeId, setActiveId] = useState<string | null>(DEFAULT_STARTER.id);

  const session = useCodeSession(sessionId);

  // Load environment on first mount
  useEffect(() => {
    if (sessionId) session.refreshEnvironment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const active = files.find((f) => f.id === activeId) ?? null;

  const updateActive = (content: string) => {
    if (!activeId) return;
    setFiles((fs) =>
      fs.map((f) =>
        f.id === activeId ? { ...f, content, modified: content !== f.content } : f
      )
    );
  };

  const addFile = (name: string, language: CodeFile["language"]) => {
    const id = `f-${Date.now()}`;
    const newFile: CodeFile = {
      id,
      name,
      language,
      content: "",
      modified: false,
    };
    setFiles((fs) => [...fs, newFile]);
    setActiveId(id);
  };

  const deleteFile = (id: string) => {
    setFiles((fs) => {
      const next = fs.filter((f) => f.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  return (
    <div className="flex flex-1 min-h-0 min-w-0">
      {/* Left — file tree */}
      <div className="w-[160px] shrink-0 border-r border-border bg-card/30 flex flex-col">
        <FileTree
          files={files}
          activeId={activeId}
          onSelect={setActiveId}
          onAdd={addFile}
          onDelete={deleteFile}
        />
      </div>

      {/* Center — editor + floating run bar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/30 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              {active?.name ?? "No file"}
            </span>
            {active?.modified && (
              <span className="w-1 h-1 rounded-full bg-primary/70" title="unsaved" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {session.running ? (
              <button
                onClick={session.stop}
                className="text-[10px] px-2 py-0.5 rounded bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
              >
                Stop
              </button>
            ) : (
              <>
                <button
                  onClick={() => active && session.run(active.content)}
                  disabled={!active || !sessionId}
                  className="text-[10px] px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-40"
                  title="Run whole file (Cmd+Shift+Enter)"
                >
                  &#9654; Run file
                </button>
              </>
            )}
            <button
              onClick={session.clear}
              className="text-[10px] px-2 py-0.5 rounded text-muted-foreground hover:bg-accent/30 transition-colors"
              title="Clear REPL output"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {active ? (
            <CodeEditor
              value={active.content}
              language={active.language}
              onChange={updateActive}
              onRunSelection={(sel) => session.run(sel)}
              onRunAll={() => session.run(active.content)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Create or select a file to start editing.
            </div>
          )}
        </div>
      </div>

      {/* Right — env + REPL stacked */}
      <div className="w-[280px] shrink-0 border-l border-border bg-card/30 flex flex-col">
        <div className="h-[45%] min-h-0 border-b border-border/60">
          <EnvInspector
            objects={session.objects}
            onRefresh={session.refreshEnvironment}
          />
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 bg-card/40 shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              Console
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              {session.running ? "running" : "idle"}
            </span>
          </div>
          <ReplOutput lines={session.lines} running={session.running} />
        </div>
      </div>
    </div>
  );
}
