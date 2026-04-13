"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { StatsTable } from "./stats-table";
import { InteractivePlot } from "./interactive-plot";
import { AssumptionChecks } from "./assumption-checks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ResultsPanelProps {
  results: AnalysisResult[];
  onRemove?: (resultId: string) => void;
  onClearAll?: () => void;
}

function PostHocTable({ postHoc }: { postHoc: Array<Record<string, unknown>> }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs w-full hover:bg-accent/30 rounded px-2 py-1 transition-colors">
        <span className="text-muted-foreground">Post-hoc comparisons (Bonferroni)</span>
        <span className="ml-auto text-muted-foreground/50">{"\u25BE"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1 text-left text-muted-foreground font-normal">Comparison</th>
                <th className="py-1 text-right px-2 text-muted-foreground font-normal">Diff</th>
                <th className="py-1 text-right px-2 text-muted-foreground font-normal">p (Bonf.)</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {postHoc.map((ph, i) => (
                <tr key={i} className="border-b border-border/20">
                  <td className="py-1 font-sans text-xs">{String(ph.group1)} vs {String(ph.group2)}</td>
                  <td className="py-1 text-right px-2">{Number(ph.mean_diff).toFixed(3)}</td>
                  <td className={`py-1 text-right px-2 ${ph.significant ? "text-primary font-medium" : ""}`}>
                    {Number(ph.p_bonferroni) < 0.001 ? "< .001" : Number(ph.p_bonferroni).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CodeExport({ code }: { code: { r: string; python: string } }) {
  const [lang, setLang] = useState<"python" | "r">("python");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs w-full hover:bg-accent/30 rounded px-2 py-1 transition-colors">
        <span className="text-muted-foreground">Reproducible code</span>
        <span className="ml-auto text-muted-foreground/50">{"\u25BE"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1">
          <div className="flex items-center gap-1 mb-1">
            <button
              onClick={() => setLang("python")}
              className={`text-[10px] px-2 py-0.5 rounded ${lang === "python" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent/30"}`}
            >
              Python
            </button>
            <button
              onClick={() => setLang("r")}
              className={`text-[10px] px-2 py-0.5 rounded ${lang === "r" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent/30"}`}
            >
              R
            </button>
            <button onClick={handleCopy} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-[11px] text-muted-foreground bg-background/50 rounded p-2 overflow-x-auto font-mono leading-relaxed">
            {code[lang]}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function APAText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-background/50 rounded p-2.5 relative group">
      <p className="text-xs text-muted-foreground leading-relaxed italic">{text}</p>
      <button
        onClick={handleCopy}
        className="absolute top-1.5 right-1.5 text-[10px] text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "Copied!" : "Copy APA"}
      </button>
    </div>
  );
}

export function ResultsPanel({ results, onRemove, onClearAll }: ResultsPanelProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      {results.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-muted-foreground/60">{results.length} results</span>
          <button
            onClick={onClearAll}
            className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
      {results.map((result, i) => {
        const stats = result.statistics as Record<string, unknown>;
        const postHoc = stats.post_hoc as Array<Record<string, unknown>> | undefined;
        const runNumber = i + 1;

        return (
          <div key={result.result_id || i} className="border border-border rounded-lg bg-card animate-slide-up">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0">#{runNumber}</span>
              <h3 className="text-sm font-medium flex-1 truncate">{result.test_display_name}</h3>
              {onRemove && (
                <button
                  onClick={() => onRemove(result.result_id)}
                  className="text-muted-foreground/30 hover:text-muted-foreground transition-colors text-xs shrink-0 leading-none"
                  title="Remove result"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="p-3 space-y-3">
              <StatsTable statistics={result.statistics} testName={result.test_name} />

              {/* Interactive Plotly charts (preferred) */}
              {result.plotly && result.plotly.length > 0 ? (
                <div className="space-y-2">
                  {result.plotly.map((plot, pi) => (
                    <InteractivePlot key={pi} title={plot.title} spec={plot.plotly} />
                  ))}
                </div>
              ) : result.plots && result.plots.length > 0 ? (
                <div className="space-y-2">
                  {result.plots.map((plot, pi) => (
                    <div key={pi}>
                      <p className="text-[10px] text-muted-foreground mb-1">{plot.title}</p>
                      <img
                        src={`data:image/png;base64,${plot.image_base64}`}
                        alt={plot.title}
                        className="w-full rounded border border-border/30"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {result.apa_text && <APAText text={result.apa_text} />}

              {postHoc && postHoc.length > 0 && <PostHocTable postHoc={postHoc} />}

              {Object.keys(result.assumption_checks).length > 0 && (
                <AssumptionChecks checks={result.assumption_checks} />
              )}

              {result.code && <CodeExport code={result.code} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
