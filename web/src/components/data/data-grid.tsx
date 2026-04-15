"use client";

import { useState, useMemo } from "react";
import type { ColumnInfo } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

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
      className={`inline-flex text-[9px] px-1 py-0.5 rounded font-mono border shrink-0 ${
        colors[type] || "bg-muted text-muted-foreground"
      }`}
    >
      {type.slice(0, 3)}
    </span>
  );
}

type SortDir = "asc" | "desc";

export function DataGrid({
  columns,
  rows,
  totalRows,
  onColumnClick,
  selectedColumn,
}: DataGridProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");

  const handleHeaderClick = (col: ColumnInfo) => {
    onColumnClick?.(col);
  };

  const handleSortClick = (e: React.MouseEvent, colName: string) => {
    e.stopPropagation();
    if (sortCol === colName) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colName);
      setSortDir("asc");
    }
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => String(row[col.name] ?? "").toLowerCase().includes(q))
    );
  }, [rows, search, columns]);

  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const an = Number(av);
      const bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn)) {
        return sortDir === "asc" ? an - bn : bn - an;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [filteredRows, sortCol, sortDir]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card shrink-0">
        <span className="text-xs text-muted-foreground shrink-0">
          {totalRows.toLocaleString()} &times; {columns.length}
        </span>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter rows..."
          className="h-6 text-xs flex-1 min-w-0"
        />
        {(sortCol || search) && (
          <button
            onClick={() => { setSortCol(null); setSearch(""); }}
            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
          >
            Reset
          </button>
        )}
        <span className="text-[10px] text-muted-foreground/50 shrink-0">
          {sortedRows.length !== totalRows ? `${sortedRows.length} shown` : `1–${Math.min(rows.length, totalRows)}`}
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
                    className={`px-2 py-1.5 text-left border-b border-border cursor-pointer hover:bg-accent/50 transition-colors group select-none ${
                      selectedColumn === col.name ? "bg-accent" : ""
                    }`}
                    onClick={() => handleHeaderClick(col)}
                    data-companion-target={`column:${col.name}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate">{col.name}</span>
                      <TypeBadge type={col.inferred_type} />
                      <button
                        onClick={(e) => handleSortClick(e, col.name)}
                        className={`ml-auto shrink-0 text-[9px] leading-none transition-colors ${
                          sortCol === col.name
                            ? "text-primary"
                            : "text-muted-foreground/20 group-hover:text-muted-foreground/50"
                        }`}
                        title={`Sort by ${col.name}`}
                      >
                        {sortCol === col.name
                          ? sortDir === "asc" ? "▲" : "▼"
                          : "⇅"}
                      </button>
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
              {sortedRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-accent/30"
                >
                  <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      className={`px-2 py-1 ${selectedColumn === col.name ? "bg-accent/20" : ""}`}
                    >
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
