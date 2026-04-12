"use client";

import { ANALYSIS_REGISTRY } from "@/lib/analyses";
import type { ColumnInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AnalysisOptionsProps {
  testName: string;
  columns: ColumnInfo[];
  variables: Record<string, string>;
  options: Record<string, unknown>;
  onSetVariable: (slot: string, column: string) => void;
  onSetOption: (name: string, value: unknown) => void;
  onRun: () => void;
  onClose: () => void;
  isRunning: boolean;
  isAiSuggested?: boolean;
}

export function AnalysisOptions({
  testName,
  columns,
  variables,
  options,
  onSetVariable,
  onSetOption,
  onRun,
  onClose,
  isRunning,
  isAiSuggested,
}: AnalysisOptionsProps) {
  const def = ANALYSIS_REGISTRY[testName];
  if (!def) return null;

  const canRun = def.variables
    .filter((v) => v.required)
    .every((v) => variables[v.slot]);

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{def.display_name}</h3>
          {isAiSuggested && (
            <Badge variant="outline" className="text-[9px] text-primary border-primary/30">
              AI suggested
            </Badge>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Variable slots */}
        {def.variables.map((slot) => {
          const filtered = columns.filter((c) =>
            slot.accept.includes(c.inferred_type as "numeric" | "categorical")
          );
          return (
            <div key={slot.slot}>
              <label className="text-xs text-muted-foreground block mb-1">
                {slot.label}
                {slot.required && <span className="text-destructive ml-0.5">*</span>}
              </label>
              <select
                value={variables[slot.slot] || ""}
                onChange={(e) => onSetVariable(slot.slot, e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
              >
                <option value="" disabled>
                  Select {slot.label.toLowerCase()}
                </option>
                {filtered.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {/* Options */}
        <div className="border-t border-border pt-3 space-y-2">
          {def.options.map((opt) => {
            if (opt.depends_on && !options[opt.depends_on]) return null;

            if (opt.type === "boolean") {
              const checked = options[opt.name] !== undefined ? !!options[opt.name] : !!opt.default;
              return (
                <div key={opt.name} className="flex items-center gap-2">
                  <Checkbox
                    id={opt.name}
                    checked={checked}
                    onCheckedChange={(v) => onSetOption(opt.name, v)}
                  />
                  <label htmlFor={opt.name} className="text-xs cursor-pointer">
                    {opt.label}
                  </label>
                </div>
              );
            }

            if (opt.type === "number") {
              const value =
                options[opt.name] !== undefined ? options[opt.name] : opt.default;
              return (
                <div key={opt.name}>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {opt.label}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={String(value)}
                    onChange={(e) => onSetOption(opt.name, parseFloat(e.target.value))}
                    className="h-7 text-xs w-24"
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        <Button
          onClick={onRun}
          disabled={!canRun || isRunning}
          className="w-full h-8 text-xs"
          size="sm"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
              Running...
            </span>
          ) : (
            <span>&#9654; Run Analysis</span>
          )}
        </Button>
      </div>
    </div>
  );
}
