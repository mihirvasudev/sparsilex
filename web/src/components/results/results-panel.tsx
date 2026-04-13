"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { StatsTable } from "./stats-table";
import { AssumptionChecks } from "./assumption-checks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ResultsPanelProps {
  results: AnalysisResult[];
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

export function ResultsPanel({ results }: ResultsPanelProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      {results.map((result, i) => {
        const stats = result.statistics as Record<string, unknown>;
        const postHoc = stats.post_hoc as Array<Record<string, unknown>> | undefined;

        return (
          <div key={result.result_id || i} className="border border-border rounded-lg bg-card">
            <div className="px-3 py-2 border-b border-border">
              <h3 className="text-sm font-medium">{result.test_display_name}</h3>
            </div>
            <div className="p-3 space-y-3">
              <StatsTable statistics={result.statistics} testName={result.test_name} />

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
