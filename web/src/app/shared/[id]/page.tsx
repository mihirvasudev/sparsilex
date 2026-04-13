"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DataGrid } from "@/components/data/data-grid";
import { ResultsPanel } from "@/components/results/results-panel";
import type { ColumnInfo, AnalysisResult } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SharedProject {
  share_id: string;
  title: string;
  filename: string;
  rows: number;
  columns: ColumnInfo[];
  preview: Record<string, unknown>[];
  analyses: AnalysisResult[];
  error?: string;
}

export default function SharedPage() {
  const params = useParams();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/share/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setProject(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  if (!project || project.error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-lg font-medium">Project not found</p>
        <p className="text-sm text-muted-foreground">This share link may have expired or been removed.</p>
        <a href="/analyze" className="text-sm text-primary hover:underline mt-4">Open SparsileX</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center h-10 border-b border-border bg-card/80 px-4 shrink-0">
        <span className="font-bold text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mr-3">
          SparsileX
        </span>
        <span className="text-xs text-muted-foreground">{project.title}</span>
        <span className="ml-2 text-[9px] text-muted-foreground/50">read-only</span>
        <a href="/analyze" className="ml-auto text-xs text-primary hover:underline">
          Open in SparsileX
        </a>
      </header>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Data */}
        <div className="flex-1 min-w-0 border-r border-border">
          <DataGrid
            columns={project.columns}
            rows={project.preview}
            totalRows={project.rows}
          />
        </div>

        {/* Results */}
        <div className="w-[450px] shrink-0 overflow-y-auto p-3">
          {project.analyses.length > 0 ? (
            <ResultsPanel results={project.analyses} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">No analyses to show</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
