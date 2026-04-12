"use client";

import { Badge } from "@/components/ui/badge";

interface StatsTableProps {
  statistics: Record<string, number | string>;
}

const DISPLAY_ORDER = [
  { key: "t_statistic", label: "t" },
  { key: "degrees_of_freedom", label: "df" },
  { key: "p_value", label: "p" },
  { key: "cohens_d", label: "Cohen's d" },
  { key: "mean_difference", label: "Mean Difference" },
  { key: "ci_lower", label: "CI Lower" },
  { key: "ci_upper", label: "CI Upper" },
  { key: "mean_group1", label: "Mean (Group 1)" },
  { key: "mean_group2", label: "Mean (Group 2)" },
  { key: "std_group1", label: "SD (Group 1)" },
  { key: "std_group2", label: "SD (Group 2)" },
  { key: "n_group1", label: "n (Group 1)" },
  { key: "n_group2", label: "n (Group 2)" },
];

function formatValue(key: string, value: number | string): string {
  if (typeof value === "string") return value;
  if (key === "p_value") {
    if (value < 0.001) return "< .001";
    return value.toFixed(4).replace(/^0/, "");
  }
  if (key === "degrees_of_freedom") return String(Math.round(value));
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(3);
}

function effectSizeLabel(d: number): { label: string; color: string } {
  const abs = Math.abs(d);
  if (abs < 0.2) return { label: "negligible", color: "text-muted-foreground" };
  if (abs < 0.5) return { label: "small", color: "text-yellow-400" };
  if (abs < 0.8) return { label: "medium", color: "text-orange-400" };
  return { label: "large", color: "text-red-400" };
}

export function StatsTable({ statistics }: StatsTableProps) {
  const g1Label = statistics.group1_label || "Group 1";
  const g2Label = statistics.group2_label || "Group 2";
  const pValue = typeof statistics.p_value === "number" ? statistics.p_value : 1;
  const significant = pValue < 0.05;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`text-[10px] ${
            significant
              ? "text-green-400 border-green-500/30"
              : "text-muted-foreground border-border"
          }`}
        >
          {significant ? "Significant" : "Not significant"} (p {formatValue("p_value", pValue)})
        </Badge>
        {typeof statistics.cohens_d === "number" && (
          <Badge variant="outline" className="text-[10px]">
            {effectSizeLabel(statistics.cohens_d).label} effect
          </Badge>
        )}
      </div>

      <table className="w-full text-xs">
        <tbody>
          {DISPLAY_ORDER.map(({ key, label }) => {
            if (statistics[key] === undefined) return null;
            let displayLabel = label;
            if (key === "mean_group1") displayLabel = `Mean (${g1Label})`;
            if (key === "mean_group2") displayLabel = `Mean (${g2Label})`;
            if (key === "std_group1") displayLabel = `SD (${g1Label})`;
            if (key === "std_group2") displayLabel = `SD (${g2Label})`;
            if (key === "n_group1") displayLabel = `n (${g1Label})`;
            if (key === "n_group2") displayLabel = `n (${g2Label})`;

            return (
              <tr key={key} className="border-b border-border/30">
                <td className="py-1 pr-4 text-muted-foreground">{displayLabel}</td>
                <td className="py-1 font-mono text-right">
                  {formatValue(key, statistics[key])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
