"use client";

import type { ColumnInfo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataGridProps {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  totalRows: number;
  onColumnClick?: (col: ColumnInfo) => void;
  selectedColumn?: string | null;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    numeric: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    categorical: "bg-green-500/15 text-green-400 border-green-500/20",
    text: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    ordinal: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    datetime: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  };
  return (
    <span
      className={`inline-flex text-[9px] px-1 py-0.5 rounded font-mono border ${
        colors[type] || "bg-muted text-muted-foreground"
      }`}
    >
      {type.slice(0, 3)}
    </span>
  );
}

export function DataGrid({
  columns,
  rows,
  totalRows,
  onColumnClick,
  selectedColumn,
}: DataGridProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
        <span className="text-xs text-muted-foreground">
          {totalRows} rows &times; {columns.length} columns
        </span>
        <span className="text-xs text-muted-foreground">
          Showing 1&ndash;{Math.min(rows.length, totalRows)}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th className="px-2 py-1.5 text-left font-mono text-muted-foreground border-b border-border w-10">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.name}
                    className={`px-2 py-1.5 text-left border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                      selectedColumn === col.name ? "bg-accent" : ""
                    }`}
                    onClick={() => onColumnClick?.(col)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate">{col.name}</span>
                      <TypeBadge type={col.inferred_type} />
                    </div>
                    {col.missing_count > 0 && (
                      <span className="text-[9px] text-orange-400">
                        {col.missing_count} missing
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-accent/30"
                >
                  <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                  {columns.map((col) => (
                    <td key={col.name} className="px-2 py-1">
                      {row[col.name] == null ? (
                        <span className="text-muted-foreground/40 italic">NA</span>
                      ) : (
                        String(row[col.name])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
