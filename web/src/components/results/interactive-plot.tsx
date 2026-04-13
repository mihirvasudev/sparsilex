"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">Loading plot...</div> });

interface PlotlySpec {
  data: Record<string, unknown>[];
  layout: Record<string, unknown>;
}

interface InteractivePlotProps {
  title: string;
  spec: PlotlySpec;
}

export function InteractivePlot({ title, spec }: InteractivePlotProps) {
  const [expanded, setExpanded] = useState(false);

  const layout = {
    ...spec.layout,
    width: undefined,
    height: expanded ? 500 : 280,
    autosize: true,
  };

  const config: Partial<Plotly.Config> = {
    displayModeBar: true,
    displaylogo: false,
    toImageButtonOptions: {
      format: "png",
      filename: title.replace(/\s+/g, "_").toLowerCase(),
      height: 600,
      width: 800,
      scale: 2,
    },
  };

  return (
    <div className="border border-border/30 rounded overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 bg-card/50">
        <p className="text-[10px] text-muted-foreground">{title}</p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[9px] text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <Plot
        data={spec.data as Plotly.Data[]}
        layout={layout as Partial<Plotly.Layout>}
        config={config}
        useResizeHandler
        className="w-full"
        style={{ width: "100%", height: expanded ? 500 : 280 }}
      />
    </div>
  );
}
