"use client";
import { useState, useCallback, useRef } from "react";
import type { AgentStep } from "@/lib/types";
import { fetchAgentChat } from "@/lib/api";

interface AgentState {
  steps: AgentStep[];
  isRunning: boolean;
  conversationId: string | null;
  error: string | null;
}

export function useAgent() {
  const [state, setState] = useState<AgentState>({
    steps: [],
    isRunning: false,
    conversationId: null,
    error: null,
  });

  const onUiAction = useRef<
    ((action: string, data: Record<string, unknown>) => void) | null
  >(null);

  const sendMessage = useCallback(
    async (datasetId: string, message: string, mode?: "menu" | "code") => {
      // Add user message as a step
      const userStep: AgentStep = {
        id: `user-${Date.now()}`,
        type: "message",
        content: message,
        timestamp: Date.now(),
      };

      setState((s) => ({
        ...s,
        steps: [...s.steps, userStep],
        isRunning: true,
        error: null,
      }));

      try {
        await fetchAgentChat(
          datasetId,
          message,
          state.conversationId || undefined,
          (event) => {
            const data = event as Record<string, unknown>;

            if (data.type === "tool_call") {
              const step: AgentStep = {
                id: (data.tool_use_id as string) || `tool-${Date.now()}`,
                type: "tool_call",
                tool: data.tool as string,
                args: data.args as Record<string, unknown>,
                timestamp: Date.now(),
              };
              setState((s) => ({ ...s, steps: [...s.steps, step] }));
            } else if (data.type === "tool_result") {
              setState((s) => ({
                ...s,
                steps: s.steps.map((step) =>
                  step.id === data.tool_use_id
                    ? { ...step, result: data.result as Record<string, unknown> }
                    : step
                ),
              }));
            } else if (data.type === "message") {
              const step: AgentStep = {
                id: `msg-${Date.now()}`,
                type: "message",
                content: data.content as string,
                timestamp: Date.now(),
              };
              setState((s) => ({ ...s, steps: [...s.steps, step] }));
            } else if (data.type === "point_at") {
              onUiAction.current?.(
                "point_at",
                data as Record<string, unknown>
              );
            } else if (data.type === "ui_action") {
              onUiAction.current?.(
                data.action as string,
                data as Record<string, unknown>
              );
            } else if (data.type === "done") {
              setState((s) => ({ ...s, isRunning: false }));
            }
          },
          mode
        );
      } catch (err) {
        setState((s) => ({
          ...s,
          isRunning: false,
          error: err instanceof Error ? err.message : "Agent error",
        }));
      }
    },
    [state.conversationId]
  );

  const setUiActionHandler = useCallback(
    (handler: (action: string, data: Record<string, unknown>) => void) => {
      onUiAction.current = handler;
    },
    []
  );

  const clearChat = useCallback(() => {
    setState({ steps: [], isRunning: false, conversationId: null, error: null });
  }, []);

  return { ...state, sendMessage, setUiActionHandler, clearChat };
}
