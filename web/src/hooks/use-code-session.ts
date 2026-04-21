"use client";

import { useCallback, useRef, useState } from "react";
import type { ReplLine } from "@/components/code/repl-output";
import type { EnvObject } from "@/components/code/env-inspector";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CodeSessionState {
  lines: ReplLine[];
  objects: EnvObject[];
  running: boolean;
  error: string | null;
}

export function useCodeSession(sessionId: string | null) {
  const [state, setState] = useState<CodeSessionState>({
    lines: [],
    objects: [],
    running: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const lineSeqRef = useRef(0);

  const newLineId = () => `line-${Date.now()}-${lineSeqRef.current++}`;

  const addLines = useCallback((newLines: Omit<ReplLine, "id">[]) => {
    setState((s) => ({
      ...s,
      lines: [...s.lines, ...newLines.map((l) => ({ ...l, id: newLineId() }))],
    }));
  }, []);

  const refreshEnvironment = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API}/api/session/${sessionId}/environment`);
      if (!res.ok) return;
      const data = await res.json();
      setState((s) => ({ ...s, objects: data.objects || [] }));
    } catch {
      // swallow — env refresh is best-effort
    }
  }, [sessionId]);

  const run = useCallback(
    async (code: string) => {
      if (!sessionId) return;
      if (!code.trim()) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Echo the input
      const trimmed = code.trim();
      addLines([
        { type: "input", text: trimmed.length > 400 ? trimmed.slice(0, 400) + "..." : trimmed },
      ]);
      setState((s) => ({ ...s, running: true, error: null }));

      try {
        const res = await fetch(`${API}/api/session/${sessionId}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          addLines([{ type: "error", text: `HTTP ${res.status}: ${text}` }]);
          setState((s) => ({ ...s, running: false, error: `HTTP ${res.status}` }));
          return;
        }

        if (!res.body) {
          setState((s) => ({ ...s, running: false, error: "No response body" }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n");
          buffer = parts.pop() || "";

          for (const line of parts) {
            if (!line.startsWith("data: ")) continue;
            try {
              const ev = JSON.parse(line.slice(6));
              if (ev.type === "output") {
                addLines([{ type: "output", text: ev.data }]);
              } else if (ev.type === "error") {
                addLines([{ type: "error", text: ev.data }]);
              } else if (ev.type === "plot") {
                addLines([
                  {
                    type: "plot",
                    text: "",
                    imageData: ev.data,
                    imageFormat: (ev.format as "png" | "jpeg") ?? "png",
                  },
                ]);
              } else if (ev.type === "done") {
                addLines([
                  {
                    type: "meta",
                    text: `[done in ${ev.duration_ms}ms]`,
                  },
                ]);
              }
            } catch {
              // skip malformed
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "unknown error";
        addLines([{ type: "error", text: message }]);
        setState((s) => ({ ...s, error: message }));
      } finally {
        setState((s) => ({ ...s, running: false }));
        // Refresh env after every successful run
        refreshEnvironment();
      }
    },
    [sessionId, addLines, refreshEnvironment]
  );

  const clear = useCallback(() => {
    setState((s) => ({ ...s, lines: [] }));
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, running: false }));
  }, []);

  return {
    ...state,
    run,
    clear,
    stop,
    refreshEnvironment,
  };
}
