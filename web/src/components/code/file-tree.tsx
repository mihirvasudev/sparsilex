"use client";

import { useState } from "react";

export interface CodeFile {
  id: string;
  name: string;
  language: "r" | "python" | "sql" | "markdown";
  content: string;
  modified?: boolean;
}

interface FileTreeProps {
  files: CodeFile[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string, language: "r" | "python" | "sql" | "markdown") => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

function langIcon(lang: CodeFile["language"]): string {
  return { r: "R", python: "Py", sql: "SQL", markdown: "md" }[lang];
}

function langColor(lang: CodeFile["language"]): string {
  return {
    r: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    python: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    sql: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    markdown: "text-muted-foreground bg-muted border-border",
  }[lang];
}

export function FileTree({ files, activeId, onSelect, onAdd, onDelete }: FileTreeProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = () => {
    const n = name.trim();
    if (!n) { setAdding(false); return; }
    const ext = n.split(".").pop()?.toLowerCase();
    const lang: CodeFile["language"] =
      ext === "py" ? "python" :
      ext === "sql" ? "sql" :
      ext === "md" || ext === "rmd" || ext === "qmd" ? "markdown" :
      "r";
    const finalName = ext ? n : `${n}.R`;
    onAdd(finalName, lang);
    setName("");
    setAdding(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 bg-card/40">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          Files
        </span>
        <button
          onClick={() => setAdding(true)}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors leading-none"
          title="New file"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-auto p-1">
        {adding && (
          <div className="mb-1">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setName(""); setAdding(false); }
              }}
              placeholder="analysis.R"
              className="w-full px-2 py-1 text-[11px] bg-background border border-border rounded font-mono focus:outline-none focus:border-primary"
            />
          </div>
        )}
        {files.length === 0 && !adding ? (
          <p className="text-[11px] text-muted-foreground/50 p-2 text-center">
            No files yet. Click <strong>+</strong> to create one.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {files.map((f) => (
              <li key={f.id} className="group">
                <button
                  onClick={() => onSelect(f.id)}
                  className={`w-full text-left px-2 py-1 rounded text-[11.5px] flex items-center gap-1.5 transition-colors ${
                    activeId === f.id
                      ? "bg-accent/50 text-foreground"
                      : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                  }`}
                >
                  <span className={`inline-block shrink-0 text-[8.5px] font-mono px-1 py-0.5 rounded border ${langColor(f.language)}`}>
                    {langIcon(f.language)}
                  </span>
                  <span className="font-mono truncate flex-1">{f.name}</span>
                  {f.modified && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" title="unsaved" />
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(f.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all text-[10px] leading-none"
                      title="Delete file"
                    >
                      &#215;
                    </button>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
