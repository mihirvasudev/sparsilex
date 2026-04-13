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
  if (key === "p" || key === "p_value" || key.includes("p_val")) {
    if (n < 0.001) return "< .001";
    return n.toFixed(4).replace(/^0/, "");
  }
  if (["degrees_of_freedom", "n", "df_between", "df_within", "df_model", "df_residual", "df_factor", "df_error", "successes"].includes(key) || key.startsWith("n_")) {
    return String(Math.round(n));
  }
  if (Number.isInteger(n) && Math.abs(n) < 1e6) return String(n);
  return n.toFixed(3);
}

function pFmt(v: unknown): string { return fmt("p", v); }

function effectLabel(d: number): string {
  const a = Math.abs(d);
  return a < 0.2 ? "negligible" : a < 0.5 ? "small" : a < 0.8 ? "medium" : "large";
}

function corrLabel(r: number): string {
  const a = Math.abs(r);
  return a < 0.1 ? "negligible" : a < 0.3 ? "weak" : a < 0.5 ? "moderate" : a < 0.7 ? "strong" : "very strong";
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className="border-b border-border/20">
      <td className="py-1 pr-4 text-muted-foreground text-xs">{label}</td>
      <td className={`py-1 font-mono text-right text-xs ${highlight ? "text-primary font-medium" : ""}`}>{value}</td>
    </tr>
  );
}

// ── Descriptives ────────────────────────────────────────────────────────────

function DescriptivesTable({ statistics }: { statistics: Record<string, unknown> }) {
  const cols = statistics.columns as Array<Record<string, unknown>> | undefined;
  if (!cols) return null;
  const headers = ["Variable", "n", "Mean", "Median", "SD", "Min", "Max", "Skew", "Kurt"];
  const keys = ["variable", "n", "mean", "median", "std", "min", "max", "skewness", "kurtosis"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h, i) => (
              <th key={h} className={`py-1.5 ${i === 0 ? "text-left pr-3" : "text-right px-2"} text-muted-foreground font-normal whitespace-nowrap`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {cols.map((c) => (
            <tr key={String(c.variable)} className="border-b border-border/20">
              {keys.map((k, i) => (
                <td key={k} className={`py-1.5 ${i === 0 ? "text-left pr-3 font-sans font-medium" : "text-right px-2"}`}>
                  {i === 0 ? String(c[k]) : fmt("", c[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Coefficient Table (regression) ──────────────────────────────────────────

function CoefficientTable({ coefficients, isLogistic }: { coefficients: Array<Record<string, unknown>>; isLogistic?: boolean }) {
  return (
    <div className="overflow-x-auto mt-2">
      <p className="text-[10px] text-muted-foreground mb-1">Coefficients</p>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1.5 text-left pr-3 text-muted-foreground font-normal">Predictor</th>
            <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">B</th>
            <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">SE</th>
            <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">{isLogistic ? "z" : "t"}</th>
            <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">p</th>
            {isLogistic && <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">OR</th>}
          </tr>
        </thead>
        <tbody className="font-mono">
          {coefficients.map((c) => {
            const sig = Number(c.p) < 0.05;
            return (
              <tr key={String(c.predictor)} className="border-b border-border/20">
                <td className="py-1.5 pr-3 font-sans">{String(c.predictor)}</td>
                <td className="py-1.5 text-right px-2">{fmt("", c.b)}</td>
                <td className="py-1.5 text-right px-2">{fmt("", c.se)}</td>
                <td className="py-1.5 text-right px-2">{fmt("", isLogistic ? c.z : c.t)}</td>
                <td className={`py-1.5 text-right px-2 ${sig ? "text-primary font-medium" : ""}`}>{pFmt(c.p)}</td>
                {isLogistic && <td className="py-1.5 text-right px-2">{fmt("", c.odds_ratio)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── PCA Components Table ────────────────────────────────────────────────────

function PCATable({ components }: { components: Array<Record<string, unknown>> }) {
  if (!components.length) return null;
  const allVars = Object.keys((components[0].loadings as Record<string, unknown>) || {});
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <p className="text-[10px] text-muted-foreground mb-1">Eigenvalues</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-1.5 text-left pr-3 text-muted-foreground font-normal">PC</th>
              <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">Eigenvalue</th>
              <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">% Var</th>
              <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">Cum %</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {components.map((c) => (
              <tr key={Number(c.component)} className="border-b border-border/20">
                <td className="py-1.5 pr-3 font-sans">PC{String(c.component)}</td>
                <td className="py-1.5 text-right px-2">{fmt("", c.eigenvalue)}</td>
                <td className="py-1.5 text-right px-2">{fmt("", c.variance_pct)}%</td>
                <td className="py-1.5 text-right px-2">{fmt("", c.cumulative_pct)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto">
        <p className="text-[10px] text-muted-foreground mb-1">Component Loadings</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-1.5 text-left pr-3 text-muted-foreground font-normal">Variable</th>
              {components.map((c) => (
                <th key={Number(c.component)} className="py-1.5 text-right px-2 text-muted-foreground font-normal">PC{String(c.component)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {allVars.map((v) => (
              <tr key={v} className="border-b border-border/20">
                <td className="py-1.5 pr-3 font-sans">{v}</td>
                {components.map((c) => {
                  const ld = (c.loadings as Record<string, number>)[v];
                  const strong = Math.abs(ld) >= 0.4;
                  return (
                    <td key={Number(c.component)} className={`py-1.5 text-right px-2 ${strong ? "text-primary font-medium" : ""}`}>
                      {fmt("", ld)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Group Stats Table (ANOVA/Kruskal-Wallis) ────────────────────────────────

function GroupStatsTable({ groups }: { groups: Array<Record<string, unknown>> }) {
  const hasMean = groups.some((g) => g.mean !== undefined);
  const hasMedian = groups.some((g) => g.median !== undefined);
  const hasStd = groups.some((g) => g.std !== undefined);
  const label = groups[0]?.group !== undefined ? "Group" : "Measure";
  const nameKey = groups[0]?.group !== undefined ? "group" : "measure";
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1.5 text-left pr-3 text-muted-foreground font-normal">{label}</th>
            <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">n</th>
            {hasMean && <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">Mean</th>}
            {hasMedian && <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">Median</th>}
            {hasStd && <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">SD</th>}
          </tr>
        </thead>
        <tbody className="font-mono">
          {groups.map((g, i) => (
            <tr key={i} className="border-b border-border/20">
              <td className="py-1.5 pr-3 font-sans">{String(g[nameKey])}</td>
              <td className="py-1.5 text-right px-2">{String(g.n)}</td>
              {hasMean && <td className="py-1.5 text-right px-2">{fmt("", g.mean)}</td>}
              {hasMedian && <td className="py-1.5 text-right px-2">{fmt("", g.median)}</td>}
              {hasStd && <td className="py-1.5 text-right px-2">{fmt("", g.std)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Categories Table (multinomial/binomial) ─────────────────────────────────

function CategoriesTable({ categories }: { categories: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1.5 text-left pr-3 text-muted-foreground font-normal">Category</th>
            <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">Observed</th>
            <th className="py-1.5 text-right px-2 text-muted-foreground font-normal">Expected</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {categories.map((c) => (
            <tr key={String(c.category)} className="border-b border-border/20">
              <td className="py-1.5 pr-3 font-sans">{String(c.category)}</td>
              <td className="py-1.5 text-right px-2">{String(c.observed)}</td>
              <td className="py-1.5 text-right px-2">{fmt("", c.expected)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function StatsTable({ statistics, testName }: StatsTableProps) {
  const s = statistics as Record<string, unknown>;
  const pValue = Number(s.p_value ?? 1);
  const sig = pValue < 0.05;

  // Descriptives — special table
  if (testName === "descriptives") return <DescriptivesTable statistics={s} />;

  // PCA — special layout
  if (testName === "pca") {
    const comps = s.components as Array<Record<string, unknown>> | undefined;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {String(s.n_components_extracted)} component{Number(s.n_components_extracted) > 1 ? "s" : ""} extracted
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {fmt("", s.total_variance_explained)}% variance explained
          </Badge>
        </div>
        {comps && <PCATable components={comps} />}
      </div>
    );
  }

  // Build badges
  const badges: Array<{ text: string; color?: string }> = [];
  if (s.p_value !== undefined) {
    badges.push({ text: `${sig ? "Significant" : "Not significant"} (p ${pFmt(s.p_value)})`, color: sig ? "text-green-400 border-green-500/30" : undefined });
  }
  if (s.cohens_d !== undefined) badges.push({ text: `${effectLabel(Number(s.cohens_d))} effect` });
  if (s.eta_squared !== undefined) badges.push({ text: `\u03B7\u00B2 = ${fmt("", s.eta_squared)}` });
  if (s.r !== undefined) badges.push({ text: `${corrLabel(Number(s.r))} correlation` });
  if (s.rho !== undefined) badges.push({ text: `${corrLabel(Number(s.rho))} correlation` });
  if (s.cramers_v !== undefined) badges.push({ text: `V = ${fmt("", s.cramers_v)}` });
  if (s.pseudo_r_squared !== undefined) badges.push({ text: `pseudo R\u00B2 = ${fmt("", s.pseudo_r_squared)}` });
  if (s.r_squared !== undefined && testName === "linear_regression") badges.push({ text: `R\u00B2 = ${fmt("", s.r_squared)}` });
  if (s.accuracy !== undefined) badges.push({ text: `${(Number(s.accuracy) * 100).toFixed(1)}% accuracy` });
  if (s.rank_biserial_r !== undefined) badges.push({ text: `r = ${fmt("", s.rank_biserial_r)}` });
  if (s.effect_size_r !== undefined) badges.push({ text: `r = ${fmt("", s.effect_size_r)}` });
  if (s.epsilon_squared !== undefined) badges.push({ text: `\u03B5\u00B2 = ${fmt("", s.epsilon_squared)}` });
  if (s.odds_ratio !== undefined && testName === "fisher_exact") badges.push({ text: `OR = ${fmt("", s.odds_ratio)}` });

  // Build key-value rows
  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [];
  const add = (k: string, label: string, hl?: boolean) => { if (s[k] !== undefined) rows.push({ label, value: fmt(k, s[k]), highlight: hl }); };

  // Test statistic
  add("t_statistic", "t");
  add("f_statistic", "F");
  add("chi_square", "\u03C7\u00B2");
  add("u_statistic", "U");
  add("w_statistic", "W");
  add("h_statistic", "H");
  add("r", "r", true);
  add("rho", "\u03C1", true);
  add("r_squared", "R\u00B2");
  add("adj_r_squared", "Adj. R\u00B2");
  add("odds_ratio", "Odds Ratio");

  // Degrees of freedom
  add("degrees_of_freedom", "df");
  add("df_between", "df (between)");
  add("df_within", "df (within)");
  add("df_model", "df (model)");
  add("df_residual", "df (residual)");
  add("df_factor", "df (factor)");
  add("df_error", "df (error)");

  // P-value
  if (s.p_value !== undefined) rows.push({ label: "p", value: pFmt(s.p_value), highlight: sig });

  // Effect sizes
  add("cohens_d", "Cohen's d");
  add("eta_squared", "\u03B7\u00B2");
  add("cramers_v", "Cramer's V");
  add("rank_biserial_r", "Rank-biserial r");
  add("effect_size_r", "Effect size r");
  add("epsilon_squared", "\u03B5\u00B2");

  // Means & differences
  add("mean", "Mean");
  add("test_value", "Test value");
  add("mean_difference", "Mean Difference");
  add("std", "SD");
  add("ci_lower", "CI Lower");
  add("ci_upper", "CI Upper");
  add("observed_proportion", "Observed proportion");
  add("test_proportion", "Test proportion");

  // Group comparisons
  if (s.mean_group1 !== undefined) rows.push({ label: `Mean (${s.group1_label || "Group 1"})`, value: fmt("m", s.mean_group1) });
  if (s.mean_group2 !== undefined) rows.push({ label: `Mean (${s.group2_label || "Group 2"})`, value: fmt("m", s.mean_group2) });
  if (s.median_group1 !== undefined) rows.push({ label: `Median (${s.group1_label || "Group 1"})`, value: fmt("m", s.median_group1) });
  if (s.median_group2 !== undefined) rows.push({ label: `Median (${s.group2_label || "Group 2"})`, value: fmt("m", s.median_group2) });
  if (s.std_group1 !== undefined) rows.push({ label: `SD (${s.group1_label || "Group 1"})`, value: fmt("s", s.std_group1) });
  if (s.std_group2 !== undefined) rows.push({ label: `SD (${s.group2_label || "Group 2"})`, value: fmt("s", s.std_group2) });
  if (s.n_group1 !== undefined) rows.push({ label: `n (${s.group1_label || "Group 1"})`, value: fmt("n_group1", s.n_group1) });
  if (s.n_group2 !== undefined) rows.push({ label: `n (${s.group2_label || "Group 2"})`, value: fmt("n_group2", s.n_group2) });

  // Paired / single-var
  if (s.mean_var1 !== undefined) rows.push({ label: `Mean (${s.var1_label || "Var 1"})`, value: fmt("m", s.mean_var1) });
  if (s.mean_var2 !== undefined) rows.push({ label: `Mean (${s.var2_label || "Var 2"})`, value: fmt("m", s.mean_var2) });
  if (s.median_var1 !== undefined) rows.push({ label: `Median (${s.var1_label || "Var 1"})`, value: fmt("m", s.median_var1) });
  if (s.median_var2 !== undefined) rows.push({ label: `Median (${s.var2_label || "Var 2"})`, value: fmt("m", s.median_var2) });
  add("n", "n");
  add("successes", "Successes");

  const coefficients = s.coefficients as Array<Record<string, unknown>> | undefined;
  const groups = s.groups as Array<Record<string, unknown>> | undefined;
  const categories = s.categories as Array<Record<string, unknown>> | undefined;

  return (
    <div className="space-y-2">
      {badges.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {badges.map((b, i) => (
            <Badge key={i} variant="outline" className={`text-[10px] ${b.color || ""}`}>{b.text}</Badge>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <table className="w-full">
          <tbody>
            {rows.map((r, i) => <Row key={i} label={r.label} value={r.value} highlight={r.highlight} />)}
          </tbody>
        </table>
      )}

      {coefficients && <CoefficientTable coefficients={coefficients} isLogistic={testName === "logistic_regression"} />}
      {groups && <GroupStatsTable groups={groups} />}
      {categories && <CategoriesTable categories={categories} />}
    </div>
  );
}
