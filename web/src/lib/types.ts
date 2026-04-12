export interface ColumnInfo {
  name: string;
  dtype: string;
  inferred_type: "numeric" | "categorical" | "ordinal" | "datetime" | "text";
  missing_count: number;
  missing_pct: number;
  unique_values?: number;
  sample_values?: (string | number)[];
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
}

export interface DatasetResponse {
  dataset_id: string;
  filename: string;
  rows: number;
  columns: ColumnInfo[];
  preview: Record<string, unknown>[];
}

export interface PreviewResponse {
  dataset_id: string;
  rows: Record<string, unknown>[];
  total_rows: number;
  offset: number;
  limit: number;
}

// Analysis registry types
export interface VariableSlotDef {
  slot: string;
  label: string;
  accept: ("numeric" | "categorical")[];
  required: boolean;
  max_groups?: number;
}

export interface OptionDef {
  name: string;
  type: "boolean" | "number" | "select";
  default: boolean | number | string;
  label: string;
  depends_on?: string;
  choices?: string[];
}

export interface AnalysisDef {
  display_name: string;
  category: string;
  variables: VariableSlotDef[];
  options: OptionDef[];
}

// Results types
export interface AssumptionCheck {
  test: string;
  group?: string;
  statistic: number;
  p_value: number;
  passed: boolean;
}

export interface AnalysisResult {
  result_id: string;
  test_name: string;
  test_display_name: string;
  statistics: Record<string, number | string>;
  assumption_checks: Record<string, AssumptionCheck>;
}

// Agent types
export type AgentEventType =
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "ui_action"
  | "message"
  | "done";

export interface AgentEvent {
  type: AgentEventType;
  content?: string;
  tool?: string;
  tool_use_id?: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
  action?: string;
  test_name?: string;
  prefill?: Record<string, unknown>;
}

export interface AgentStep {
  id: string;
  type: "thinking" | "tool_call" | "message";
  tool?: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
  content?: string;
  timestamp: number;
}
