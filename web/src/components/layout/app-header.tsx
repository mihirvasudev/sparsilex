"use client";

import { ANALYSIS_CATEGORIES, ANALYSIS_REGISTRY } from "@/lib/analyses";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onSelectAnalysis: (testName: string) => void;
  onToggleAgent: () => void;
  agentOpen: boolean;
  hasData: boolean;
}

export function AppHeader({
  onSelectAnalysis,
  onToggleAgent,
  agentOpen,
  hasData,
}: AppHeaderProps) {
  return (
    <header className="flex items-center h-10 border-b border-border bg-card/80 backdrop-blur-sm px-3 gap-1 shrink-0">
      <div className="flex items-center gap-2 mr-6">
        <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SparsileX</span>
        <span className="text-[9px] text-muted-foreground/60 font-mono">0.1</span>
      </div>

      <nav className="flex items-center gap-0.5">
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
      </nav>

      <div className="ml-auto">
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
