"use client";

import { useState } from "react";
import type { ColumnInfo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ColumnStatsProps {
  column: ColumnInfo;
  datasetId?: string;
  onTypeChanged?: () => void;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-mono">{value}</span>
    </div>
  );
}

export function ColumnStats({ column, datasetId, onTypeChanged }: ColumnStatsProps) {
  const [label, setLabel] = useState("");
  const [editingLabel, setEditingLabel] = useState(false);

  const handleSetType = async (newType: string) => {
    if (!datasetId) return;
    await fetch(`${API}/api/data/set-type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, column: column.name, column_type: newType }),
    });
    onTypeChanged?.();
  };

  const handleSaveLabel = async () => {
    if (!datasetId || !label.trim()) return;
    await fetch(`${API}/api/data/set-label`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, column: column.name, label: label.trim() }),
    });
    setEditingLabel(false);
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium truncate">{column.name}</h3>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {column.inferred_type}
        </Badge>
      </div>

      {/* Variable label */}
      {editingLabel ? (
        <div className="flex gap-1">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label..." className="h-6 text-[10px] flex-1" onKeyDown={(e) => { if (e.key === "Enter") handleSaveLabel(); }} />
          <button onClick={handleSaveLabel} className="text-[10px] text-primary">Save</button>
        </div>
      ) : (
        <button onClick={() => setEditingLabel(true)} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground">
          + Add label
        </button>
      )}

      {/* Type override */}
      <div>
        <p className="text-[10px] text-muted-foreground/60 mb-1">Column type</p>
        <div className="flex gap-1">
          {["numeric", "categorical", "ordinal"].map((t) => (
            <button
              key={t}
              onClick={() => handleSetType(t)}
              className={`text-[9px] px-1.5 py-0.5 rounded border ${
                column.inferred_type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-0 border-t border-border pt-2">
        <StatRow label="Type" value={column.dtype} />
        <div className="flex justify-between items-center py-0.5">
          <span className="text-[11px] text-muted-foreground">Missing</span>
          <span className="text-[11px] font-mono">{column.missing_count} ({column.missing_pct}%)</span>
        </div>
        {/* Data completeness bar */}
        <div className="mt-0.5 mb-1 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60"
            style={{ width: `${100 - column.missing_pct}%` }}
          />
        </div>
        {column.unique_values !== undefined && <StatRow label="Unique" value={column.unique_values} />}
      </div>

      {column.inferred_type === "numeric" && (
        <div className="space-y-0 border-t border-border pt-2">
          {column.min !== undefined && column.max !== undefined && column.mean !== undefined && (
            <div className="mb-2">
              <div className="flex justify-between text-[9px] text-muted-foreground/50 mb-0.5">
                <span>{Number(column.min).toFixed(2)}</span>
                <span className="text-primary/70">μ={Number(column.mean).toFixed(2)}</span>
                <span>{Number(column.max).toFixed(2)}</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-border overflow-hidden">
                {/* Range fill */}
                <div className="absolute inset-0 bg-primary/10 rounded-full" />
                {/* Mean marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary/70 rounded-full"
                  style={{
                    left: `${((Number(column.mean) - Number(column.min)) / (Number(column.max) - Number(column.min))) * 100}%`
                  }}
                />
                {/* Median marker (if available) */}
                {column.median !== undefined && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-400/50 rounded-full"
                    style={{
                      left: `${((Number(column.median) - Number(column.min)) / (Number(column.max) - Number(column.min))) * 100}%`
                    }}
                  />
                )}
              </div>
            </div>
          )}
          {column.mean !== undefined && <StatRow label="Mean" value={Number(column.mean).toFixed(3)} />}
          {column.median !== undefined && <StatRow label="Median" value={Number(column.median).toFixed(3)} />}
          {column.std !== undefined && <StatRow label="Std Dev" value={Number(column.std).toFixed(3)} />}
          {column.min !== undefined && <StatRow label="Min" value={column.min} />}
          {column.max !== undefined && <StatRow label="Max" value={column.max} />}
        </div>
      )}

      {column.sample_values && column.sample_values.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-[10px] text-muted-foreground/60 mb-1">Values</p>
          <div className="flex flex-wrap gap-1">
            {column.sample_values.map((v, i) => (
              <Badge key={i} variant="secondary" className="text-[9px]">{String(v)}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
