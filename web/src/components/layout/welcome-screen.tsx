"use client";

import { useState } from "react";

interface WelcomeScreenProps {
  onUpload: (file: File) => void;
  onLoadSample: () => void;
  onLoadProject?: (file: File) => void;
  isLoading: boolean;
}

export function WelcomeScreen({ onUpload, onLoadSample, onLoadProject, isLoading }: WelcomeScreenProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.endsWith(".sparx") && onLoadProject) {
      onLoadProject(file);
    } else {
      onUpload(file);
    }
  };

  const openFilePicker = (accept: string, handler: (file: File) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handler(file);
    };
    input.click();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full animate-fade-in">
        {/* Logo + tagline */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            SparsileX
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            AI-native statistical analysis platform
          </p>
        </div>

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer group ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => openFilePicker(".csv,.tsv,.xlsx,.sav,.dta", onUpload)}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
              <p className="text-sm text-muted-foreground">Processing data...</p>
            </div>
          ) : isDragging ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl">&#8613;</div>
              <p className="text-sm font-medium text-primary">Drop to load</p>
            </div>
          ) : (
            <>
              <div className="text-5xl text-muted-foreground/20 group-hover:text-primary/30 transition-colors mb-4">
                &#8613;
              </div>
              <p className="text-sm font-medium group-hover:text-foreground transition-colors">
                Drop your data file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV, Excel, SPSS (.sav), Stata (.dta) · or drop a <span className="font-mono">.sparx</span> project
              </p>
            </>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={onLoadSample}
            className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Try sample data
          </button>
          <span className="text-muted-foreground/30 text-xs">·</span>
          {onLoadProject && (
            <button
              onClick={() => openFilePicker(".sparx", onLoadProject)}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Open .sparx project
            </button>
          )}
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          <Feature icon="&#9881;" title="Manual Mode" desc="Click-to-run analyses like JASP" />
          <Feature icon="&#10024;" title="AI Agent" desc="Describe your question, AI does the rest" />
          <Feature icon="&#128202;" title="29 Tests" desc="From t-tests to Bayesian & SEM" />
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex justify-center gap-6 mt-8 text-[10px] text-muted-foreground/40">
          <span>&#8984;S save</span>
          <span>&#8984;Enter run</span>
          <span>&#8984;J agent</span>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="text-lg mb-1">{icon}</div>
      <p className="text-[11px] font-medium">{title}</p>
      <p className="text-[9px] text-muted-foreground">{desc}</p>
    </div>
  );
}
