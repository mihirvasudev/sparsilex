"use client";

import { useState, useCallback, useEffect } from "react";
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
import { loadProject } from "@/lib/api";
import { CompanionOverlay } from "@/components/companion/companion-overlay";
import { useCompanion } from "@/hooks/use-companion";
import { useVoice } from "@/hooks/use-voice";
import { resolveTarget, highlightTarget } from "@/lib/companion-targets";
import { CodeWorkspace } from "@/components/code/code-workspace";
import type { ColumnInfo } from "@/lib/types";
import type { WorkspaceMode } from "@/components/layout/app-header";

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
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("menu");

  // Voice + Companion buddy — Clicky-style AI companion
  const voice = useVoice();
  const companion = useCompanion({
    agentSteps: agent.steps,
    agentIsRunning: agent.isRunning,
  });

  // When voice captures a final transcript, send it to the agent
  useEffect(() => {
    if (voice.finalTranscript && dataset.datasetId) {
      companion.stopListening();
      agent.sendMessage(dataset.datasetId, voice.finalTranscript);
      voice.clearFinalTranscript();
    }
  }, [voice.finalTranscript]); // eslint-disable-line react-hooks/exhaustive-deps

  // TTS: speak the response when agent finishes (if speech enabled)
  useEffect(() => {
    if (companion.state === "idle" && companion.responseText && voice.speechEnabled) {
      voice.speak(companion.responseText);
    }
  }, [companion.state]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Share project
  const handleShare = useCallback(async () => {
    if (!dataset.datasetId) return;
    try {
      const res = await fetch(`${API}/api/share/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: dataset.datasetId,
          analyses: analysis.results,
          title: dataset.filename || "SparsileX Analysis",
        }),
      });
      const data = await res.json();
      const url = `${window.location.origin}/shared/${data.share_id}`;
      await navigator.clipboard.writeText(url);
      alert(`Share link copied to clipboard!\n${url}`);
    } catch {
      alert("Failed to create share link");
    }
  }, [dataset.datasetId, dataset.filename, analysis.results]);

  // Handle agent UI actions (pre-fill analysis panel + companion pointing)
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
        } else if (action === "point_at") {
          companion.pointAt(
            data.target as string,
            data.label as string
          );
          // Highlight target element and return buddy after 3s
          setTimeout(() => {
            const coords = resolveTarget(data.target as string);
            if (coords) highlightTarget(data.target as string);
            setTimeout(() => companion.pointingDone(), 3000);
          }, 500);
        }
      },
      [analysis, companion]
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

  const handleLoadProject = useCallback(async (file: File) => {
    try {
      const proj = await loadProject(file);
      dataset.loadFromProject(proj);
      // Restore saved analyses
      if (proj.analyses?.length) {
        analysis.restoreResults(proj.analyses);
      }
    } catch (err) {
      alert(`Failed to load project: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dataset, analysis]);

  const handleAgentSend = useCallback(
    (message: string) => {
      if (dataset.datasetId) {
        agent.sendMessage(dataset.datasetId, message);
      }
    },
    [dataset.datasetId, agent]
  );

  return (
    <div className="flex flex-col h-screen relative">
      {/* Companion buddy overlay */}
      {dataset.datasetId && (
        <CompanionOverlay
          state={companion.state}
          responseText={companion.responseText}
          isStreaming={companion.isStreaming}
          activeTool={companion.activeTool}
          audioLevel={voice.audioLevel}
          onBuddyClick={() => {
            if (companion.state === "sleeping") {
              companion.wake();
            } else if (companion.state === "idle" && voice.isSupported) {
              companion.startListening();
              voice.startListening();
            } else if (companion.state === "listening") {
              voice.stopListening();
              companion.stopListening();
            } else if (companion.state === "responding" && voice.isSpeaking) {
              voice.cancelSpeech();
            }
          }}
          onDismissBubble={companion.dismissBubble}
        />
      )}

      <AppHeader
        onSelectAnalysis={handleSelectAnalysis}
        onToggleAgent={() => setAgentOpen((o) => !o)}
        onToggleCleaning={() => setCleaningOpen((o) => !o)}
        onSave={handleSave}
        onShare={handleShare}
        agentOpen={agentOpen}
        cleaningOpen={cleaningOpen}
        hasData={!!dataset.datasetId}
        filename={dataset.filename}
        rows={dataset.rows}
        columnCount={dataset.columns.length}
        mode={workspaceMode}
        onModeChange={setWorkspaceMode}
      />

      {!dataset.datasetId ? (
        <WelcomeScreen
          onUpload={dataset.uploadFile}
          onLoadSample={handleLoadSample}
          onLoadProject={handleLoadProject}
          isLoading={dataset.isLoading}
        />
      ) : workspaceMode === "code" ? (
        <CodeWorkspace sessionId={dataset.datasetId} />
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

            {/* Analysis run error */}
            {analysis.stage === "error" && analysis.error && (
              <div className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <div>
                  <p className="font-medium">Analysis failed</p>
                  <p className="text-[11px] text-destructive/60 mt-0.5">{analysis.error}</p>
                </div>
                <button onClick={analysis.clearSelection} className="ml-auto text-muted-foreground/50 hover:text-muted-foreground text-xs shrink-0">✕</button>
              </div>
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
            <ResultsPanel
              results={analysis.results}
              onRemove={analysis.removeResult}
              onClearAll={analysis.clearResults}
            />

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
