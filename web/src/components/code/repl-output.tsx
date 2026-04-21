"use client";

import { useEffect, useRef } from "react";

export interface ReplLine {
  id: string;
  type: "input" | "output" | "error" | "meta" | "plot";
  text: string;
  /** For plot lines: base64-encoded image data (no data: prefix). */
  imageData?: string;
  imageFormat?: "png" | "jpeg";
}

interface ReplOutputProps {
  lines: ReplLine[];
  running?: boolean;
}

/**
 * Streaming REPL output pane. Auto-scrolls when new content arrives,
 * unless the user has scrolled up.
 */
export function ReplOutput({ lines, running }: ReplOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (gap < 100) el.scrollTop = el.scrollHeight;
  }, [lines, running]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-auto bg-background/80 font-mono text-[11px] leading-relaxed p-2"
      style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
    >
      {lines.length === 0 && !running ? (
        <div className="text-muted-foreground/50 p-3 text-center">
          Run code to see output here.
          <br />
          <span className="text-[10px]">
            <kbd className="px-1 border border-border/50 rounded">&#8984;</kbd> Enter — run line ·
            <kbd className="ml-1 px-1 border border-border/50 rounded">&#8984;&#8679;</kbd> Enter — run file
          </span>
        </div>
      ) : (
        <div>
          {lines.map((l) => {
            if (l.type === "plot" && l.imageData) {
              const fmt = l.imageFormat ?? "png";
              return (
                <div key={l.id} className="my-2 rounded border border-border/40 bg-background p-1">
                  <img
                    src={`data:image/${fmt};base64,${l.imageData}`}
                    alt="R plot"
                    className="max-w-full rounded"
                  />
                </div>
              );
            }
            return (
              <pre
                key={l.id}
                className={
                  l.type === "error"
                    ? "text-destructive whitespace-pre-wrap break-words m-0 py-0.5"
                    : l.type === "input"
                    ? "text-muted-foreground/70 whitespace-pre-wrap break-words m-0 py-0.5"
                    : l.type === "meta"
                    ? "text-muted-foreground/50 whitespace-pre-wrap break-words m-0 py-0.5"
                    : "text-foreground whitespace-pre-wrap break-words m-0 py-0.5"
                }
              >
                {l.text}
              </pre>
            );
          })}
          {running && (
            <div className="text-primary/60 py-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
              <span className="text-[10px]">running...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
