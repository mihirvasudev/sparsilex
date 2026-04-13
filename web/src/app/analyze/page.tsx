"use client";

import { useState, useCallback } from "react";
import { useDataset } from "@/hooks/use-dataset";
import { useAnalysis } from "@/hooks/use-analysis";
import { useAgent } from "@/hooks/use-agent";
import { AppHeader } from "@/components/layout/app-header";
import { DataGrid } from "@/components/data/data-grid";
import { ColumnStats } from "@/components/data/column-stats";
import { generateSampleCSV } from "@/lib/sample-data";
import { WelcomeScreen } from "@/components/layout/welcome-screen";
import { OnboardingTour } from "@/components/layout/onboarding-tour";
import { AnalysisOptions } from "@/components/analysis/analysis-options";
import { ResultsPanel } from "@/components/results/results-panel";
import { AgentPanel } from "@/components/agent/agent-panel";
import { DataCleaning } from "@/components/data/data-cleaning";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { ColumnInfo } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AnalyzePage() {
  const dataset = useDataset();
  const analysis = useAnalysis();
  const agent = useAgent();

  const [agentOpen, setAgentOpen] = useState(false);
  const [cleaningOpen, setCleaningOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnInfo | null>(null);
  const [isAiSuggested, setIsAiSuggested] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Save project
  const handleSave = useCallback(async () => {
    if (!dataset.datasetId) return;
    const url = `${API}/api/project/save?dataset_id=${dataset.datasetId}&analyses=${encodeURIComponent(JSON.stringify(analysis.results))}`;
    const res = await fetch(url, { method: "POST" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (dataset.filename || "project").replace(/\.\w+$/, "") + ".sparx";
    a.click();
  }, [dataset.datasetId, dataset.filename, analysis.results]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleSave,
    onRun: () => { if (dataset.datasetId) analysis.run(dataset.datasetId); },
    onToggleAgent: () => setAgentOpen((o) => !o),
  });

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

  const handleLoadSample = useCallback(() => {
    dataset.uploadFile(generateSampleCSV());
    // Show tour after data loads
    setTimeout(() => setShowTour(true), 1500);
  }, [dataset]);

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
        onToggleCleaning={() => setCleaningOpen((o) => !o)}
        onSave={handleSave}
        agentOpen={agentOpen}
        cleaningOpen={cleaningOpen}
        hasData={!!dataset.datasetId}
      />

      {!dataset.datasetId ? (
        <WelcomeScreen onUpload={dataset.uploadFile} onLoadSample={handleLoadSample} isLoading={dataset.isLoading} />
      ) : (
      <div className="flex flex-1 min-h-0">
        {/* Left: Data Grid */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
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
                <ColumnStats
                  column={selectedColumn}
                  datasetId={dataset.datasetId || undefined}
                  onTypeChanged={() => {
                    if (dataset.datasetId) {
                      fetch(`${API}/api/data/${dataset.datasetId}/preview?offset=0&limit=100`)
                        .then((r) => r.json())
                        .then((data) => dataset.refreshFromCleaningResult({ rows: data.total_rows, columns: dataset.columns, preview: data.rows }));
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Options + Results + Agent */}
        <div className="w-[420px] shrink-0 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Data cleaning panel */}
            {cleaningOpen && dataset.datasetId && (
              <DataCleaning
                datasetId={dataset.datasetId}
                columns={dataset.columns}
                onDataChanged={(result) => dataset.refreshFromCleaningResult(result)}
                onClose={() => setCleaningOpen(false)}
              />
            )}

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
      )}
      <OnboardingTour active={showTour} onComplete={() => setShowTour(false)} />
    </div>
  );
}
