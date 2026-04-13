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
        <StatRow label="Missing" value={`${column.missing_count} (${column.missing_pct}%)`} />
        {column.unique_values !== undefined && <StatRow label="Unique" value={column.unique_values} />}
      </div>

      {column.inferred_type === "numeric" && (
        <div className="space-y-0 border-t border-border pt-2">
          {column.mean !== undefined && <StatRow label="Mean" value={column.mean} />}
          {column.median !== undefined && <StatRow label="Median" value={column.median} />}
          {column.std !== undefined && <StatRow label="Std Dev" value={column.std} />}
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
