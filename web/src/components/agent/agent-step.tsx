"use client";

import { useState } from "react";
import type { AgentStep } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface AgentStepViewProps {
  step: AgentStep;
}

const TOOL_ICONS: Record<string, string> = {
  inspect_data: "\uD83D\uDD0D",
  clean_data: "\uD83E\uDDF9",
  detect_outliers: "\uD83D\uDCA0",
  check_normality: "\uD83D\uDCC9",
  check_assumptions: "\u2714",
  run_test: "\uD83D\uDCCA",
  create_plot: "\uD83C\uDFA8",
  open_analysis_panel: "\u2699",
};

const TOOL_LABELS: Record<string, string> = {
  inspect_data: "Inspecting data",
  clean_data: "Cleaning data",
  detect_outliers: "Detecting outliers",
  check_normality: "Checking normality",
  check_assumptions: "Checking assumptions",
  run_test: "Running test",
  create_plot: "Creating plot",
  open_analysis_panel: "Opening analysis panel",
};

function ToolResultSummary({ tool, result }: { tool: string; result: Record<string, unknown> }) {
  const s = (v: unknown) => String(v ?? "");

  if (tool === "inspect_data") {
    const cols = result.columns as Array<Record<string, unknown>> | undefined;
    return (
      <div className="text-[11px] text-muted-foreground space-y-0.5">
        <div>{s(result.rows)} rows, {s(result.total_columns)} columns</div>
        {result.duplicate_rows ? (
          <div className="text-orange-400">{s(result.duplicate_rows)} duplicate rows</div>
        ) : null}
        {cols?.map((c) => (
          <div key={s(c.name)} className="flex items-center gap-1">
            <span className="font-mono">{s(c.name)}</span>
            <span className="text-[9px] text-muted-foreground/70">{s(c.inferred_type)}</span>
            {Number(c.missing_count) > 0 && (
              <span className="text-orange-400 text-[9px]">{s(c.missing_count)} missing</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (tool === "check_normality") {
    const groups = result.groups as Record<string, Record<string, unknown>> | undefined;
    if (groups) {
      return (
        <div className="text-[11px] space-y-0.5">
          {Object.entries(groups).map(([group, data]) => (
            <div key={group} className="flex items-center gap-2">
              <span className={data.passed ? "text-green-400" : "text-red-400"}>
                {data.passed ? "\u2713" : "\u2717"}
              </span>
              <span className="text-muted-foreground">{group}:</span>
              <span className="font-mono">W = {s(data.statistic)}, p = {s(data.p_value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="text-[11px] flex items-center gap-2">
        <span className={result.passed ? "text-green-400" : "text-red-400"}>
          {result.passed ? "\u2713" : "\u2717"}
        </span>
        <span className="font-mono">W = {s(result.statistic)}, p = {s(result.p_value)}</span>
      </div>
    );
  }

  if (tool === "run_test") {
    const stats = result.statistics as Record<string, unknown> | undefined;
    if (stats) {
      const p = Number(stats.p_value);
      return (
        <div className="text-[11px] space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono">t({s(stats.degrees_of_freedom)}) = {s(stats.t_statistic)}</span>
            <span className={`font-mono ${p < 0.05 ? "text-green-400" : "text-muted-foreground"}`}>
              p = {p < 0.001 ? "< .001" : s(p)}
            </span>
          </div>
          {stats.cohens_d !== undefined && (
            <div className="font-mono text-muted-foreground">d = {s(stats.cohens_d)}</div>
          )}
        </div>
      );
    }
  }

  if (tool === "clean_data") {
    return (
      <div className="text-[11px] text-muted-foreground">
        {s(result.action)}: {result.rows_removed !== undefined
          ? `${s(result.rows_removed)} rows removed (${s(result.rows_before)} \u2192 ${s(result.rows_after)})`
          : result.values_imputed !== undefined
          ? `${s(result.values_imputed)} values imputed`
          : JSON.stringify(result)}
      </div>
    );
  }

  if (tool === "check_assumptions") {
    return (
      <div className="text-[11px]">
        <span className={result.all_passed ? "text-green-400" : "text-orange-400"}>
          {result.all_passed ? "\u2713 All assumptions met" : "\u26A0 Violations detected"}
        </span>
      </div>
    );
  }

  return (
    <pre className="text-[10px] text-muted-foreground overflow-x-auto max-h-32">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

export function AgentStepView({ step }: AgentStepViewProps) {
  const [expanded, setExpanded] = useState(false);

  // User message
  if (step.type === "message" && !step.tool) {
    const isUser = step.id.startsWith("user-");
    return (
      <div className={`text-xs ${isUser ? "text-foreground" : "text-muted-foreground"} py-1`}>
        {isUser && <span className="text-muted-foreground mr-1.5">You:</span>}
        {step.content}
      </div>
    );
  }

  // Tool call
  if (step.type === "tool_call" && step.tool) {
    const icon = TOOL_ICONS[step.tool] || "\u2699";
    const label = TOOL_LABELS[step.tool] || step.tool;
    const hasResult = !!step.result;
    const isLoading = !hasResult;

    return (
      <div className="border-l-2 border-border pl-2 py-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs w-full hover:bg-accent/30 rounded px-1 py-0.5 transition-colors"
        >
          {isLoading ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-primary shrink-0" />
          ) : (
            <span className="shrink-0">{icon}</span>
          )}
          <span className="text-muted-foreground">{label}</span>
          {hasResult && (
            <span className="ml-auto text-muted-foreground/50 text-[10px]">
              {expanded ? "\u25B4" : "\u25BE"}
            </span>
          )}
        </button>

        {hasResult && !expanded && step.result && (
          <div className="pl-5 py-0.5">
            <ToolResultSummary tool={step.tool} result={step.result} />
          </div>
        )}

        {expanded && step.result && (
          <div className="pl-5 py-1">
            <div className="text-[10px] text-muted-foreground/50 mb-1">Input:</div>
            <pre className="text-[10px] text-muted-foreground mb-2 overflow-x-auto">
              {JSON.stringify(step.args, null, 2)}
            </pre>
            <div className="text-[10px] text-muted-foreground/50 mb-1">Output:</div>
            <pre className="text-[10px] text-muted-foreground overflow-x-auto max-h-48">
              {JSON.stringify(step.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return null;
}
