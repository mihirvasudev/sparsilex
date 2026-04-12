"use client";

import type { AnalysisResult } from "@/lib/types";
import { StatsTable } from "./stats-table";
import { AssumptionChecks } from "./assumption-checks";

interface ResultsPanelProps {
  results: AnalysisResult[];
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      {results.map((result, i) => (
        <div key={result.result_id || i} className="border border-border rounded-lg bg-card">
          <div className="px-3 py-2 border-b border-border">
            <h3 className="text-sm font-medium">{result.test_display_name}</h3>
          </div>
          <div className="p-3 space-y-3">
            <StatsTable statistics={result.statistics} testName={result.test_name} />
            {Object.keys(result.assumption_checks).length > 0 && (
              <AssumptionChecks checks={result.assumption_checks} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
