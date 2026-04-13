"use client";

import { useState } from "react";
import { ANALYSIS_REGISTRY } from "@/lib/analyses";
import type { ColumnInfo, OptionDef } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VariableSelect } from "./variable-select";

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

function OptionControl({ opt, value, onChange }: { opt: OptionDef; value: unknown; onChange: (v: unknown) => void }) {
  if (opt.type === "boolean") {
    const checked = value !== undefined ? !!value : !!opt.default;
    return (
      <div className="flex items-center gap-2">
        <Checkbox id={opt.name} checked={checked} onCheckedChange={onChange} />
        <label htmlFor={opt.name} className="text-xs cursor-pointer">{opt.label}</label>
      </div>
    );
  }

  if (opt.type === "number") {
    const val = value !== undefined ? value : opt.default;
    return (
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground shrink-0">{opt.label}</label>
        <Input
          type="number"
          step={opt.step || 0.01}
          min={opt.min}
          max={opt.max}
          value={String(val)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-6 text-xs w-20 ml-auto"
        />
      </div>
    );
  }

  if (opt.type === "select" && opt.choices) {
    const val = value !== undefined ? String(value) : String(opt.default);
    return (
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{opt.label}</label>
        <select
          value={val}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-7 rounded-md border border-input bg-transparent px-2 text-xs"
        >
          {opt.choices.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}

function OptionGroup({ name, options, values, onChange }: {
  name: string;
  options: OptionDef[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border/50 pt-1.5 mt-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
      >
        <span className="text-[9px]">{open ? "\u25BC" : "\u25B6"}</span>
        <span>{name}</span>
      </button>
      {open && (
        <div className="pl-3 pt-1 space-y-1.5">
          {options.map((opt) => (
            <OptionControl key={opt.name} opt={opt} value={values[opt.name]} onChange={(v) => onChange(opt.name, v)} />
          ))}
        </div>
      )}
    </div>
  );
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

  // Split options into ungrouped and grouped
  const ungrouped = def.options.filter((o) => !o.group && !(o.depends_on && !options[o.depends_on]));
  const groups: Record<string, OptionDef[]> = {};
  for (const opt of def.options) {
    if (opt.group) {
      if (opt.depends_on && !options[opt.depends_on]) continue;
      if (!groups[opt.group]) groups[opt.group] = [];
      groups[opt.group].push(opt);
    }
  }

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
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
      </div>

      {def.description && (
        <p className="px-3 pt-2 text-[10px] text-muted-foreground/70">{def.description}</p>
      )}

      <div className="p-3 space-y-2.5">
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
              <VariableSelect
                columns={filtered}
                value={variables[slot.slot] || ""}
                onChange={(v) => onSetVariable(slot.slot, v)}
                placeholder={`Select ${slot.label.toLowerCase()}`}
              />
            </div>
          );
        })}

        {/* Ungrouped options */}
        {ungrouped.length > 0 && (
          <div className="space-y-2 pt-1">
            {ungrouped.map((opt) => (
              <OptionControl key={opt.name} opt={opt} value={options[opt.name]} onChange={(v) => onSetOption(opt.name, v)} />
            ))}
          </div>
        )}

        {/* Grouped options (collapsible) */}
        {Object.entries(groups).map(([groupName, groupOpts]) => (
          <OptionGroup
            key={groupName}
            name={groupName}
            options={groupOpts}
            values={options}
            onChange={onSetOption}
          />
        ))}

        <Button
          onClick={onRun}
          disabled={!canRun || isRunning}
          className="w-full h-8 text-xs mt-2"
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
