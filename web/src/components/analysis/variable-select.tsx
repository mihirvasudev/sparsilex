"use client";

import { useState, useRef, useEffect } from "react";
import type { ColumnInfo } from "@/lib/types";

interface VariableSelectProps {
  columns: ColumnInfo[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const TYPE_COLORS: Record<string, string> = {
  numeric: "text-blue-400",
  categorical: "text-green-400",
  text: "text-orange-400",
};

export function VariableSelect({ columns, value, onChange, placeholder }: VariableSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = columns.find((c) => c.name === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full h-8 px-2.5 text-xs rounded-md border border-input bg-transparent hover:bg-accent/30 transition-colors"
      >
        {selected ? (
          <span className="flex items-center gap-1.5">
            <span>{selected.name}</span>
            <span className={`text-[9px] font-mono ${TYPE_COLORS[selected.inferred_type] || "text-muted-foreground"}`}>
              {selected.inferred_type.slice(0, 3)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg py-1 max-h-48 overflow-y-auto">
          {columns.map((col) => (
            <button
              key={col.name}
              type="button"
              onClick={() => { onChange(col.name); setOpen(false); }}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs hover:bg-accent/50 transition-colors ${
                col.name === value ? "bg-accent/30" : ""
              }`}
            >
              <span>{col.name}</span>
              <span className={`text-[9px] font-mono ${TYPE_COLORS[col.inferred_type] || "text-muted-foreground"}`}>
                {col.inferred_type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
