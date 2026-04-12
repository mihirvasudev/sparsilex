"use client";

import { useState, useCallback } from "react";
import { useDataset } from "@/hooks/use-dataset";
import { useAnalysis } from "@/hooks/use-analysis";
import { useAgent } from "@/hooks/use-agent";
import { AppHeader } from "@/components/layout/app-header";
import { UploadZone } from "@/components/data/upload-zone";
import { DataGrid } from "@/components/data/data-grid";
import { ColumnStats } from "@/components/data/column-stats";
import { AnalysisOptions } from "@/components/analysis/analysis-options";
import { ResultsPanel } from "@/components/results/results-panel";
import { AgentPanel } from "@/components/agent/agent-panel";
import type { ColumnInfo } from "@/lib/types";

export default function AnalyzePage() {
  const dataset = useDataset();
  const analysis = useAnalysis();
  const agent = useAgent();

  const [agentOpen, setAgentOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnInfo | null>(null);
  const [isAiSuggested, setIsAiSuggested] = useState(false);

  // Handle agent UI actions (e.g., pre-fill analysis panel)
  agent.setUiActionHandler(
    useCallback(
      (action: string, data: Record<string, unknown>) => {
        if (action === "open_analysis") {
          const prefill = data.prefill as Record<string, unknown> | undefined;
          analysis.prefill(
            data.test_name as string,
            (prefill?.variables as Record<string, string>) || {},
            (prefill?.options as Record<string, unknown>) || {}
          );
          setIsAiSuggested(true);
        }
      },
      [analysis]
    )
  );

  const handleSelectAnalysis = useCallback(
    (testName: string) => {
      analysis.selectTest(testName);
      setIsAiSuggested(false);
    },
    [analysis]
  );

  const handleRun = useCallback(() => {
    if (dataset.datasetId) {
      analysis.run(dataset.datasetId);
    }
  }, [dataset.datasetId, analysis]);

  const handleAgentSend = useCallback(
    (message: string) => {
      if (dataset.datasetId) {
        agent.sendMessage(dataset.datasetId, message);
      }
    },
    [dataset.datasetId, agent]
  );

  return (
    <div className="flex flex-col h-screen">
      <AppHeader
        onSelectAnalysis={handleSelectAnalysis}
        onToggleAgent={() => setAgentOpen((o) => !o)}
        agentOpen={agentOpen}
        hasData={!!dataset.datasetId}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left: Data Grid */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {!dataset.datasetId ? (
            <div className="flex-1 p-6">
              <UploadZone onUpload={dataset.uploadFile} isLoading={dataset.isLoading} />
            </div>
          ) : (
            <div className="flex flex-1 min-h-0">
              <div className="flex-1 min-w-0">
                <DataGrid
                  columns={dataset.columns}
                  rows={dataset.preview}
                  totalRows={dataset.rows}
                  onColumnClick={setSelectedColumn}
                  selectedColumn={selectedColumn?.name}
                />
              </div>
              {selectedColumn && (
                <div className="w-56 border-l border-border shrink-0 overflow-y-auto">
                  <ColumnStats column={selectedColumn} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Options + Results + Agent */}
        <div className="w-[420px] shrink-0 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Analysis options panel */}
            {analysis.selectedTest && (
              <AnalysisOptions
                testName={analysis.selectedTest}
                columns={dataset.columns}
                variables={analysis.variables}
                options={analysis.options}
                onSetVariable={analysis.setVariable}
                onSetOption={analysis.setOption}
                onRun={handleRun}
                onClose={analysis.clearSelection}
                isRunning={analysis.stage === "running"}
                isAiSuggested={isAiSuggested}
              />
            )}

            {/* Accumulated results */}
            <ResultsPanel results={analysis.results} />

            {/* Empty state */}
            {!analysis.selectedTest && analysis.results.length === 0 && dataset.datasetId && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Select an analysis from the menu above
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  or use the Agent to get started
                </p>
              </div>
            )}
          </div>

          {/* Agent panel (bottom) */}
          {agentOpen && dataset.datasetId && (
            <div className="h-[45%] shrink-0">
              <AgentPanel
                steps={agent.steps}
                isRunning={agent.isRunning}
                onSend={handleAgentSend}
                error={agent.error}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
