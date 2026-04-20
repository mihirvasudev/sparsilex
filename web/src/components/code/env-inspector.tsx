"use client";

export interface EnvObject {
  name: string;
  class: string;
  shape: string;
}

interface EnvInspectorProps {
  objects: EnvObject[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const CLASS_COLORS: Record<string, string> = {
  "data.frame": "text-blue-400 border-blue-500/30 bg-blue-500/10",
  "matrix":     "text-purple-400 border-purple-500/30 bg-purple-500/10",
  "list":       "text-amber-400 border-amber-500/30 bg-amber-500/10",
  "function":   "text-pink-400 border-pink-500/30 bg-pink-500/10",
  "numeric":    "text-green-400 border-green-500/30 bg-green-500/10",
  "integer":    "text-green-400 border-green-500/30 bg-green-500/10",
  "character":  "text-orange-400 border-orange-500/30 bg-orange-500/10",
  "logical":    "text-teal-400 border-teal-500/30 bg-teal-500/10",
  "factor":     "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
};

function classColor(cls: string): string {
  for (const [key, color] of Object.entries(CLASS_COLORS)) {
    if (cls.includes(key)) return color;
  }
  return "text-muted-foreground border-border bg-muted";
}

export function EnvInspector({ objects, onRefresh, isLoading }: EnvInspectorProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 bg-card/40">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          Environment
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/50">
            {objects.length} {objects.length === 1 ? "object" : "objects"}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              title="Refresh environment"
            >
              {isLoading ? "..." : "\u21BB"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-1.5">
        {objects.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/50 p-2 text-center">
            Session is empty.
          </p>
        ) : (
          <ul className="space-y-1">
            {objects.map((obj) => (
              <li key={obj.name} className="group">
                <div className="flex items-start gap-1.5 text-[11px]">
                  <span
                    className={`inline-block shrink-0 text-[9px] font-mono px-1 py-0.5 rounded border ${classColor(
                      obj.class
                    )}`}
                  >
                    {obj.class.split("/")[0].slice(0, 4)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-foreground truncate">{obj.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground/70 truncate">
                      {obj.shape}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
