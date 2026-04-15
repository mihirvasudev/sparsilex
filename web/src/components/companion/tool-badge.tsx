"use client";

const TOOL_LABELS: Record<string, string> = {
  inspect_data: "Inspecting",
  clean_data: "Cleaning",
  detect_outliers: "Outliers",
  check_normality: "Normality",
  check_assumptions: "Assumptions",
  run_test: "Running test",
  create_plot: "Plotting",
  open_analysis_panel: "Opening panel",
};

const TOOL_ICONS: Record<string, string> = {
  inspect_data: "\uD83D\uDD0D",
  clean_data: "\uD83E\uDDF9",
  detect_outliers: "\u26A0",
  check_normality: "\uD83D\uDCC8",
  check_assumptions: "\u2714",
  run_test: "\u25B6",
  create_plot: "\uD83D\uDCCA",
  open_analysis_panel: "\u2699",
};

interface ToolBadgeProps {
  tool: string;
}

/**
 * Small floating badge showing the currently active tool.
 * Appears above the companion buddy during tool execution.
 */
export function ToolBadge({ tool }: ToolBadgeProps) {
  const label = TOOL_LABELS[tool] || tool;
  const icon = TOOL_ICONS[tool] || "\u2699";

  return (
    <div className="flex items-center gap-1 bg-card/90 border border-border/60 text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-fade-in whitespace-nowrap">
      <span className="text-xs">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
    </div>
  );
}
