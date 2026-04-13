"use client";

import { useState } from "react";
import type { ColumnInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VariableSelect } from "@/components/analysis/variable-select";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CleaningResult {
  rows: number;
  columns: ColumnInfo[];
  preview: Record<string, unknown>[];
}

interface DataCleaningProps {
  datasetId: string;
  columns: ColumnInfo[];
  onDataChanged: (result: CleaningResult) => void;
  onClose: () => void;
}

type Tab = "missing" | "filter" | "compute" | "recode";

export function DataCleaning({ datasetId, columns, onDataChanged, onClose }: DataCleaningProps) {
  const [tab, setTab] = useState<Tab>("missing");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Missing data state
  const [missingCol, setMissingCol] = useState("");
  const [imputeStrategy, setImputeStrategy] = useState("mean");

  // Filter state
  const [filterCol, setFilterCol] = useState("");
  const [filterOp, setFilterOp] = useState("not_missing");
  const [filterVal, setFilterVal] = useState("");

  // Compute state
  const [newColName, setNewColName] = useState("");
  const [expression, setExpression] = useState("");

  // Recode state
  const [recodeCol, setRecodeCol] = useState("");
  const [recodeFrom, setRecodeFrom] = useState("");
  const [recodeTo, setRecodeTo] = useState("");

  const callApi = async (endpoint: string, body: unknown) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/data/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage(data.detail || "Done");
        onDataChanged({ rows: data.rows, columns: data.columns, preview: data.preview });
      }
    } catch (e) {
      setMessage(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    }
    setLoading(false);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "missing", label: "Missing" },
    { id: "filter", label: "Filter" },
    { id: "compute", label: "Compute" },
    { id: "recode", label: "Recode" },
  ];

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium">Data Cleaning</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
      </div>

      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs text-center transition-colors ${tab === t.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3">
        {tab === "missing" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Column</label>
              <VariableSelect columns={columns} value={missingCol} onChange={setMissingCol} placeholder="Select column" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" disabled={!missingCol || loading}
                onClick={() => callApi("drop-missing", { dataset_id: datasetId, columns: [missingCol] })}>
                Drop rows
              </Button>
              <div className="flex-1">
                <select value={imputeStrategy} onChange={(e) => setImputeStrategy(e.target.value)}
                  className="w-full h-7 rounded-md border border-input bg-transparent px-2 text-xs mb-1">
                  <option value="mean">Mean</option>
                  <option value="median">Median</option>
                  <option value="mode">Mode</option>
                </select>
                <Button size="sm" className="w-full h-7 text-xs" disabled={!missingCol || loading}
                  onClick={() => callApi("impute", { dataset_id: datasetId, column: missingCol, strategy: imputeStrategy })}>
                  Impute
                </Button>
              </div>
            </div>
          </>
        )}

        {tab === "filter" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Column</label>
              <VariableSelect columns={columns} value={filterCol} onChange={setFilterCol} placeholder="Select column" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Condition</label>
              <select value={filterOp} onChange={(e) => setFilterOp(e.target.value)}
                className="w-full h-7 rounded-md border border-input bg-transparent px-2 text-xs">
                <option value="not_missing">Not missing</option>
                <option value="is_missing">Is missing</option>
                <option value="equals">Equals</option>
                <option value="not_equals">Not equals</option>
                <option value="greater_than">Greater than</option>
                <option value="less_than">Less than</option>
                <option value="contains">Contains</option>
              </select>
            </div>
            {!["is_missing", "not_missing"].includes(filterOp) && (
              <Input value={filterVal} onChange={(e) => setFilterVal(e.target.value)} placeholder="Value" className="h-7 text-xs" />
            )}
            <Button size="sm" className="w-full h-7 text-xs" disabled={!filterCol || loading}
              onClick={() => callApi("filter", { dataset_id: datasetId, column: filterCol, operator: filterOp, value: filterVal || null })}>
              Apply filter
            </Button>
          </>
        )}

        {tab === "compute" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">New column name</label>
              <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="e.g. score_diff" className="h-7 text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Expression</label>
              <Input value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="e.g. post_score - pre_score" className="h-7 text-xs" />
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Use column names + math operators</p>
            </div>
            <Button size="sm" className="w-full h-7 text-xs" disabled={!newColName || !expression || loading}
              onClick={() => callApi("compute", { dataset_id: datasetId, new_column: newColName, expression })}>
              Create column
            </Button>
          </>
        )}

        {tab === "recode" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Column</label>
              <VariableSelect columns={columns} value={recodeCol} onChange={setRecodeCol} placeholder="Select column" />
            </div>
            <div className="flex gap-2">
              <Input value={recodeFrom} onChange={(e) => setRecodeFrom(e.target.value)} placeholder="From" className="h-7 text-xs flex-1" />
              <span className="text-muted-foreground text-xs self-center">{"\u2192"}</span>
              <Input value={recodeTo} onChange={(e) => setRecodeTo(e.target.value)} placeholder="To" className="h-7 text-xs flex-1" />
            </div>
            <Button size="sm" className="w-full h-7 text-xs" disabled={!recodeCol || !recodeFrom || loading}
              onClick={() => callApi("recode", { dataset_id: datasetId, column: recodeCol, mapping: { [recodeFrom]: recodeTo } })}>
              Recode
            </Button>
          </>
        )}

        {message && (
          <p className={`text-[11px] ${message.startsWith("Error") ? "text-destructive" : "text-green-400"}`}>{message}</p>
        )}
      </div>
    </div>
  );
}
