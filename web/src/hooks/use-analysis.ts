"use client";
import { useState, useCallback } from "react";
import type { AnalysisResult } from "@/lib/types";
import { runAnalysis as apiRun } from "@/lib/api";

type Stage = "idle" | "running" | "complete" | "error";

interface AnalysisState {
  selectedTest: string | null;
  variables: Record<string, string>;
  options: Record<string, unknown>;
  results: AnalysisResult[];
  stage: Stage;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    selectedTest: null,
    variables: {},
    options: {},
    results: [],
    stage: "idle",
    error: null,
  });

  const selectTest = useCallback((testName: string) => {
    setState((s) => ({ ...s, selectedTest: testName, variables: {}, options: {} }));
  }, []);

  const setVariable = useCallback((slot: string, column: string) => {
    setState((s) => ({ ...s, variables: { ...s.variables, [slot]: column } }));
  }, []);

  const setOption = useCallback((name: string, value: unknown) => {
    setState((s) => ({ ...s, options: { ...s.options, [name]: value } }));
  }, []);

  const prefill = useCallback(
    (testName: string, vars: Record<string, string>, opts: Record<string, unknown>) => {
      setState((s) => ({
        ...s,
        selectedTest: testName,
        variables: vars,
        options: opts,
      }));
    },
    []
  );

  const run = useCallback(
    async (datasetId: string) => {
      if (!state.selectedTest) return;
      setState((s) => ({ ...s, stage: "running", error: null }));
      try {
        const result = await apiRun(
          datasetId,
          state.selectedTest,
          state.variables,
          state.options
        );
        setState((s) => ({
          ...s,
          stage: "complete",
          results: [...s.results, result],
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          stage: "error",
          error: err instanceof Error ? err.message : "Analysis failed",
        }));
      }
    },
    [state.selectedTest, state.variables, state.options]
  );

  const clearSelection = useCallback(() => {
    setState((s) => ({
      ...s,
      selectedTest: null,
      variables: {},
      options: {},
      stage: "idle",
      error: null,
    }));
  }, []);

  return { ...state, selectTest, setVariable, setOption, prefill, run, clearSelection };
}
