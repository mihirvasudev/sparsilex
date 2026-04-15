"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import type { CompanionState, PointAtEvent } from "@/lib/types";

// ── Actions ──────────────────────────────────────────

type CompanionAction =
  | { type: "WAKE" }
  | { type: "SLEEP" }
  | { type: "START_LISTENING" }
  | { type: "STOP_LISTENING" }
  | { type: "AGENT_PROCESSING" }
  | { type: "AGENT_MESSAGE"; text: string }
  | { type: "AGENT_TOOL_CALL"; tool: string }
  | { type: "AGENT_TOOL_RESULT" }
  | { type: "AGENT_DONE" }
  | { type: "POINT_AT"; target: string; label: string }
  | { type: "POINTING_DONE" }
  | { type: "DISMISS_BUBBLE" }
  | { type: "RESET" };

// ── State ────────────────────────────────────────────

interface CompanionReducerState {
  state: CompanionState;
  responseText: string;
  isStreaming: boolean;
  activeTool: string | null;
  pointingTarget: PointAtEvent | null;
}

const initialState: CompanionReducerState = {
  state: "idle",
  responseText: "",
  isStreaming: false,
  activeTool: null,
  pointingTarget: null,
};

// ── Reducer ──────────────────────────────────────────

function companionReducer(
  state: CompanionReducerState,
  action: CompanionAction
): CompanionReducerState {
  switch (action.type) {
    case "WAKE":
      return { ...state, state: "idle" };

    case "SLEEP":
      return { ...state, state: "sleeping" };

    case "START_LISTENING":
      return { ...state, state: "listening", responseText: "", isStreaming: false };

    case "STOP_LISTENING":
      return { ...state, state: "processing" };

    case "AGENT_PROCESSING":
      return { ...state, state: "processing", isStreaming: false };

    case "AGENT_MESSAGE":
      return {
        ...state,
        state: "responding",
        responseText: state.responseText + action.text,
        isStreaming: true,
      };

    case "AGENT_TOOL_CALL":
      return { ...state, state: "tool_active", activeTool: action.tool };

    case "AGENT_TOOL_RESULT":
      return { ...state, activeTool: null };

    case "AGENT_DONE":
      return { ...state, state: "idle", isStreaming: false, activeTool: null };

    case "POINT_AT":
      return {
        ...state,
        state: "pointing",
        pointingTarget: { target: action.target, label: action.label },
      };

    case "POINTING_DONE":
      return { ...state, state: "responding", pointingTarget: null };

    case "DISMISS_BUBBLE":
      return { ...state, responseText: "", state: "idle" };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────

interface UseCompanionOptions {
  /** Steps from useAgent — we observe changes to drive companion state */
  agentSteps: Array<{ type: string; tool?: string; content?: string }>;
  /** Whether the agent is running */
  agentIsRunning: boolean;
}

export function useCompanion({ agentSteps, agentIsRunning }: UseCompanionOptions) {
  const [companionState, dispatch] = useReducer(companionReducer, initialState);
  const prevStepsLenRef = useRef(0);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── React to new agent steps ───────────────────────

  useEffect(() => {
    const newSteps = agentSteps.slice(prevStepsLenRef.current);
    prevStepsLenRef.current = agentSteps.length;

    for (const step of newSteps) {
      if (step.type === "tool_call" && step.tool) {
        dispatch({ type: "AGENT_TOOL_CALL", tool: step.tool });
      } else if (step.type === "message" && step.content) {
        dispatch({ type: "AGENT_MESSAGE", text: step.content });
      }
    }
  }, [agentSteps]);

  // ── React to agent running state ───────────────────

  useEffect(() => {
    if (agentIsRunning && companionState.state === "idle") {
      dispatch({ type: "AGENT_PROCESSING" });
    }
    if (!agentIsRunning && companionState.state !== "idle" && companionState.state !== "sleeping") {
      dispatch({ type: "AGENT_DONE" });
    }
  }, [agentIsRunning, companionState.state]);

  // ── Inactivity timer → sleeping ────────────────────

  useEffect(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (companionState.state === "idle") {
      inactivityTimerRef.current = setTimeout(() => {
        dispatch({ type: "SLEEP" });
      }, 60_000); // 60s of idle → sleep
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [companionState.state]);

  // ── Public API ─────────────────────────────────────

  const wake = useCallback(() => dispatch({ type: "WAKE" }), []);
  const sleep = useCallback(() => dispatch({ type: "SLEEP" }), []);
  const startListening = useCallback(() => dispatch({ type: "START_LISTENING" }), []);
  const stopListening = useCallback(() => dispatch({ type: "STOP_LISTENING" }), []);
  const dismissBubble = useCallback(() => dispatch({ type: "DISMISS_BUBBLE" }), []);
  const pointAt = useCallback(
    (target: string, label: string) => dispatch({ type: "POINT_AT", target, label }),
    []
  );
  const pointingDone = useCallback(() => dispatch({ type: "POINTING_DONE" }), []);

  return {
    ...companionState,
    dispatch,
    wake,
    sleep,
    startListening,
    stopListening,
    dismissBubble,
    pointAt,
    pointingDone,
  };
}
