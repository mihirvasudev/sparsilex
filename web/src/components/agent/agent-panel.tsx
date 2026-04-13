"use client";

import { useState, useRef, useEffect } from "react";
import type { AgentStep } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentStepView } from "./agent-step";

interface AgentPanelProps {
  steps: AgentStep[];
  isRunning: boolean;
  onSend: (message: string) => void;
  error: string | null;
}

export function AgentPanel({ steps, isRunning, onSend, error }: AgentPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  const handleSubmit = () => {
    if (!input.trim() || isRunning) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full border-t border-border bg-card">
      <div className="flex items-center px-3 py-1.5 border-b border-border">
        <span className="text-xs font-medium flex items-center gap-1.5">
          <span className="text-sm">&#10024;</span> Research Agent
        </span>
        {isRunning && (
          <span className="ml-2 text-[10px] text-primary animate-pulse">thinking...</span>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-3 space-y-2">
          {steps.length === 0 && (
            <div className="py-4 space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Describe what you want to know. The agent inspects, analyzes, and interprets.
              </p>
              <div className="space-y-1.5">
                {[
                  "Explore this dataset and suggest relevant analyses",
                  "Are there significant differences between groups?",
                  "Check assumptions and run the most appropriate test",
                  "Summarize key findings in APA format",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="w-full text-left text-[10px] text-muted-foreground/60 hover:text-muted-foreground bg-muted/20 hover:bg-muted/40 rounded px-2.5 py-1.5 transition-colors truncate"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {steps.map((step) => (
            <AgentStepView key={step.id} step={step} />
          ))}
          {isRunning && steps[steps.length - 1]?.type !== "tool_call" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-primary" />
              Thinking...
            </div>
          )}
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Compare scores between groups..."
            className="min-h-[36px] max-h-[100px] text-xs resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!input.trim() || isRunning}
            className="h-9 px-3 text-xs shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
