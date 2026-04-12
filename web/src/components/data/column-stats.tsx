"use client";

import type { ColumnInfo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ColumnStatsProps {
  column: ColumnInfo;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono">{value}</span>
    </div>
  );
}

export function ColumnStats({ column }: ColumnStatsProps) {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium truncate">{column.name}</h3>
        <Badge variant="outline" className="text-[10px]">
          {column.inferred_type}
        </Badge>
      </div>

      <div className="space-y-0.5 border-t border-border pt-2">
        <StatRow label="Type" value={column.dtype} />
        <StatRow label="Missing" value={`${column.missing_count} (${column.missing_pct}%)`} />
        {column.unique_values !== undefined && (
          <StatRow label="Unique" value={column.unique_values} />
        )}
      </div>

      {column.inferred_type === "numeric" && (
        <div className="space-y-0.5 border-t border-border pt-2">
          {column.mean !== undefined && <StatRow label="Mean" value={column.mean} />}
          {column.median !== undefined && <StatRow label="Median" value={column.median} />}
          {column.std !== undefined && <StatRow label="Std Dev" value={column.std} />}
          {column.min !== undefined && <StatRow label="Min" value={column.min} />}
          {column.max !== undefined && <StatRow label="Max" value={column.max} />}
        </div>
      )}

      {column.sample_values && column.sample_values.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-xs text-muted-foreground mb-1">Values</p>
          <div className="flex flex-wrap gap-1">
            {column.sample_values.map((v, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {String(v)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
