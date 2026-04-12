"use client";

import type { AssumptionCheck } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface AssumptionChecksProps {
  checks: Record<string, AssumptionCheck>;
}

export function AssumptionChecks({ checks }: AssumptionChecksProps) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(checks);
  const allPassed = entries.every(([, c]) => c.passed);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs w-full hover:bg-accent/30 rounded px-2 py-1 transition-colors">
        <span
          className={`text-[10px] ${allPassed ? "text-green-400" : "text-orange-400"}`}
        >
          {allPassed ? "\u2713" : "\u26A0"}
        </span>
        <span className="text-muted-foreground">
          Assumptions: {allPassed ? "all passed" : "violations detected"}
        </span>
        <span className="ml-auto text-muted-foreground/50">
          {open ? "\u25B4" : "\u25BE"}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-1 pl-2">
          {entries.map(([key, check]) => (
            <div
              key={key}
              className="flex items-center justify-between text-xs py-0.5 px-2"
            >
              <div className="flex items-center gap-2">
                <span className={check.passed ? "text-green-400" : "text-red-400"}>
                  {check.passed ? "\u2713" : "\u2717"}
                </span>
                <span className="text-muted-foreground">
                  {check.test}
                  {check.group ? ` (${check.group})` : ""}
                </span>
              </div>
              <span className="font-mono text-muted-foreground">
                p = {check.p_value < 0.001 ? "< .001" : check.p_value.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
