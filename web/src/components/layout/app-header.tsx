"use client";

import { ANALYSIS_CATEGORIES, ANALYSIS_REGISTRY } from "@/lib/analyses";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type WorkspaceMode = "menu" | "code";

interface AppHeaderProps {
  onSelectAnalysis: (testName: string) => void;
  onToggleAgent: () => void;
  onToggleCleaning: () => void;
  onSave: () => void;
  onShare: () => void;
  agentOpen: boolean;
  cleaningOpen: boolean;
  hasData: boolean;
  filename?: string | null;
  rows?: number;
  columnCount?: number;
  mode?: WorkspaceMode;
  onModeChange?: (mode: WorkspaceMode) => void;
}

export function AppHeader({
  onSelectAnalysis,
  onToggleAgent,
  onToggleCleaning,
  onSave,
  onShare,
  agentOpen,
  cleaningOpen,
  hasData,
  filename,
  rows,
  columnCount,
  mode = "menu",
  onModeChange,
}: AppHeaderProps) {
  return (
    <header className="flex items-center h-10 border-b border-border bg-card/80 backdrop-blur-sm px-3 gap-1 shrink-0">
      <div className="flex items-center gap-2 mr-6">
        <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SparsileX</span>
        <span className="text-[9px] text-muted-foreground/60 font-mono">0.1</span>
      </div>

      {/* Dataset info pill */}
      {hasData && filename && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/40 border border-border/40 mr-3">
          <span className="text-[10px] text-muted-foreground/70 max-w-[120px] truncate">{filename}</span>
          {rows !== undefined && columnCount !== undefined && (
            <span className="text-[9px] text-muted-foreground/40 font-mono shrink-0">
              {rows.toLocaleString()}r × {columnCount}c
            </span>
          )}
        </div>
      )}

      {/* Mode toggle (Menu / Code) */}
      {onModeChange && hasData && (
        <div className="flex items-center gap-0.5 mr-3 p-0.5 rounded-md bg-muted/40 border border-border/40">
          <button
            onClick={() => onModeChange("menu")}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
              mode === "menu"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Point-and-click analysis menus"
          >
            Menu
          </button>
          <button
            onClick={() => onModeChange("code")}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
              mode === "code"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="R code editor + REPL"
          >
            Code
          </button>
        </div>
      )}

      {mode === "menu" && <nav className="flex items-center gap-0.5">
        {ANALYSIS_CATEGORIES.map((cat) => {
          const hasAnalyses = cat.analyses.length > 0;
          if (!hasAnalyses) {
            return (
              <Button
                key={cat.name}
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground cursor-default opacity-50"
                disabled
              >
                {cat.name}
              </Button>
            );
          }
          return (
            <DropdownMenu key={cat.name}>
              <DropdownMenuTrigger
                disabled={!hasData}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-7 px-3 hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {cat.name}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {cat.analyses.map((testName) => {
                  const def = ANALYSIS_REGISTRY[testName];
                  return (
                    <DropdownMenuItem
                      key={testName}
                      onClick={() => onSelectAnalysis(testName)}
                    >
                      {def?.display_name || testName}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </nav>}

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onSave}
          disabled={!hasData}
          title="Save project (Cmd+S)"
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onShare}
          disabled={!hasData}
          title="Share project"
        >
          Share
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button
          variant={cleaningOpen ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={onToggleCleaning}
          disabled={!hasData}
        >
          Clean
        </Button>
        <Button
          variant={agentOpen ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onToggleAgent}
          disabled={!hasData}
        >
          <span className="text-sm">&#10024;</span> Agent
        </Button>
      </div>
    </header>
  );
}
