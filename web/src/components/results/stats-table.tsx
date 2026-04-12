"use client";

import { Badge } from "@/components/ui/badge";

interface StatsTableProps {
  statistics: Record<string, unknown>;
  testName?: string;
}

function fmt(key: string, value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "string") return value;
  const n = Number(value);
  if (key.includes("p_value")) {
    if (n < 0.001) return "< .001";
    return n.toFixed(4).replace(/^0/, "");
  }
  if (key.includes("degrees_of_freedom") || key === "n" || key.startsWith("n_") || key === "df_between" || key === "df_within") {
    return String(Math.round(n));
  }
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3);
}

function effectLabel(d: number): string {
  const a = Math.abs(d);
  if (a < 0.2) return "negligible";
  if (a < 0.5) return "small";
  if (a < 0.8) return "medium";
  return "large";
}

function correlationLabel(r: number): string {
  const a = Math.abs(r);
  if (a < 0.1) return "negligible";
  if (a < 0.3) return "weak";
  if (a < 0.5) return "moderate";
  if (a < 0.7) return "strong";
  return "very strong";
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className="border-b border-border/30">
      <td className="py-1 pr-4 text-muted-foreground text-xs">{label}</td>
      <td className={`py-1 font-mono text-right text-xs ${highlight ? "text-primary font-medium" : ""}`}>{value}</td>
    </tr>
  );
}

function DescriptivesTable({ statistics }: { statistics: Record<string, unknown> }) {
  const cols = statistics.columns as Array<Record<string, unknown>> | undefined;
  if (!cols) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1 text-left text-muted-foreground font-normal">Variable</th>
            <th className="py-1 text-right text-muted-foreground font-normal">n</th>
            <th className="py-1 text-right text-muted-foreground font-normal">Mean</th>
            <th className="py-1 text-right text-muted-foreground font-normal">Median</th>
            <th className="py-1 text-right text-muted-foreground font-normal">SD</th>
            <th className="py-1 text-right text-muted-foreground font-normal">Min</th>
            <th className="py-1 text-right text-muted-foreground font-normal">Max</th>
            <th className="py-1 text-right text-muted-foreground font-normal">Skew</th>
            <th className="py-1 text-right text-muted-foreground font-normal">Kurt</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {cols.map((c) => (
            <tr key={String(c.variable)} className="border-b border-border/30">
              <td className="py-1 font-sans">{String(c.variable)}</td>
              <td className="py-1 text-right">{String(c.n)}</td>
              <td className="py-1 text-right">{fmt("", c.mean)}</td>
              <td className="py-1 text-right">{fmt("", c.median)}</td>
              <td className="py-1 text-right">{fmt("", c.std)}</td>
              <td className="py-1 text-right">{fmt("", c.min)}</td>
              <td className="py-1 text-right">{fmt("", c.max)}</td>
              <td className="py-1 text-right">{fmt("", c.skewness)}</td>
              <td className="py-1 text-right">{fmt("", c.kurtosis)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupStatsTable({ groups }: { groups: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1 text-left text-muted-foreground font-normal">Group</th>
            <th className="py-1 text-right text-muted-foreground font-normal">n</th>
            <th className="py-1 text-right text-muted-foreground font-normal">Mean</th>
            <th className="py-1 text-right text-muted-foreground font-normal">SD</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {groups.map((g) => (
            <tr key={String(g.group)} className="border-b border-border/30">
              <td className="py-1 font-sans">{String(g.group)}</td>
              <td className="py-1 text-right">{String(g.n)}</td>
              <td className="py-1 text-right">{fmt("", g.mean)}</td>
              <td className="py-1 text-right">{fmt("", g.std)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatsTable({ statistics, testName }: StatsTableProps) {
  const s = statistics as Record<string, unknown>;
  const pValue = Number(s.p_value ?? 1);
  const significant = pValue < 0.05;

  // Descriptives — special layout
  if (testName === "descriptives") {
    return <DescriptivesTable statistics={s} />;
  }

  return (
    <div className="space-y-2">
      {/* Significance + effect badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {s.p_value !== undefined && (
          <Badge
            variant="outline"
            className={`text-[10px] ${significant ? "text-green-400 border-green-500/30" : "text-muted-foreground"}`}
          >
            {significant ? "Significant" : "Not significant"} (p {fmt("p_value", s.p_value)})
          </Badge>
        )}
        {s.cohens_d !== undefined && (
          <Badge variant="outline" className="text-[10px]">
            {effectLabel(Number(s.cohens_d))} effect
          </Badge>
        )}
        {s.eta_squared !== undefined && (
          <Badge variant="outline" className="text-[10px]">
            {"\u03B7\u00B2"} = {fmt("", s.eta_squared)}
          </Badge>
        )}
        {s.r !== undefined && (
          <Badge variant="outline" className="text-[10px]">
            {correlationLabel(Number(s.r))} correlation
          </Badge>
        )}
        {s.cramers_v !== undefined && (
          <Badge variant="outline" className="text-[10px]">
            V = {fmt("", s.cramers_v)}
          </Badge>
        )}
      </div>

      {/* Main stats table */}
      <table className="w-full">
        <tbody>
          {/* T-test stats */}
          {s.t_statistic !== undefined && <StatRow label="t" value={fmt("t", s.t_statistic)} />}
          {s.f_statistic !== undefined && <StatRow label="F" value={fmt("f", s.f_statistic)} />}
          {s.chi_square !== undefined && <StatRow label={"\u03C7\u00B2"} value={fmt("chi", s.chi_square)} />}
          {s.r !== undefined && <StatRow label="r" value={fmt("r", s.r)} highlight />}
          {s.r_squared !== undefined && <StatRow label="R\u00B2" value={fmt("r2", s.r_squared)} />}
          {s.degrees_of_freedom !== undefined && <StatRow label="df" value={fmt("degrees_of_freedom", s.degrees_of_freedom)} />}
          {s.df_between !== undefined && <StatRow label="df (between)" value={fmt("df_between", s.df_between)} />}
          {s.df_within !== undefined && <StatRow label="df (within)" value={fmt("df_within", s.df_within)} />}
          {s.p_value !== undefined && <StatRow label="p" value={fmt("p_value", s.p_value)} highlight={significant} />}
          {s.cohens_d !== undefined && <StatRow label="Cohen's d" value={fmt("d", s.cohens_d)} />}
          {s.eta_squared !== undefined && <StatRow label={"\u03B7\u00B2"} value={fmt("eta", s.eta_squared)} />}
          {s.cramers_v !== undefined && <StatRow label="Cramer's V" value={fmt("v", s.cramers_v)} />}
          {s.mean_difference !== undefined && <StatRow label="Mean Difference" value={fmt("md", s.mean_difference)} />}
          {s.ci_lower !== undefined && <StatRow label="CI Lower" value={fmt("ci", s.ci_lower)} />}
          {s.ci_upper !== undefined && <StatRow label="CI Upper" value={fmt("ci", s.ci_upper)} />}

          {/* Group means */}
          {s.mean_group1 !== undefined && <StatRow label={`Mean (${s.group1_label || "Group 1"})`} value={fmt("m", s.mean_group1)} />}
          {s.mean_group2 !== undefined && <StatRow label={`Mean (${s.group2_label || "Group 2"})`} value={fmt("m", s.mean_group2)} />}
          {s.std_group1 !== undefined && <StatRow label={`SD (${s.group1_label || "Group 1"})`} value={fmt("s", s.std_group1)} />}
          {s.std_group2 !== undefined && <StatRow label={`SD (${s.group2_label || "Group 2"})`} value={fmt("s", s.std_group2)} />}
          {s.n_group1 !== undefined && <StatRow label={`n (${s.group1_label || "Group 1"})`} value={fmt("n_group1", s.n_group1)} />}
          {s.n_group2 !== undefined && <StatRow label={`n (${s.group2_label || "Group 2"})`} value={fmt("n_group2", s.n_group2)} />}

          {/* Paired t-test */}
          {s.mean_var1 !== undefined && <StatRow label={`Mean (${s.var1_label || "Var 1"})`} value={fmt("m", s.mean_var1)} />}
          {s.mean_var2 !== undefined && <StatRow label={`Mean (${s.var2_label || "Var 2"})`} value={fmt("m", s.mean_var2)} />}
          {s.n !== undefined && <StatRow label="n" value={fmt("n", s.n)} />}
        </tbody>
      </table>

      {/* ANOVA group stats */}
      {Array.isArray(s.groups) && <GroupStatsTable groups={s.groups as Array<Record<string, unknown>>} />}
    </div>
  );
}
