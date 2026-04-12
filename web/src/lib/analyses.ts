import type { AnalysisDef } from "./types";

export const ANALYSIS_REGISTRY: Record<string, AnalysisDef> = {
  // ── Descriptives ────────────────────────────────────────────────
  descriptives: {
    display_name: "Descriptive Statistics",
    category: "Descriptives",
    variables: [{ slot: "columns", label: "Variables", accept: ["numeric"], required: true }],
    options: [
      { name: "central_tendency", type: "boolean", default: true, label: "Central tendency" },
      { name: "dispersion", type: "boolean", default: true, label: "Dispersion" },
      { name: "distribution", type: "boolean", default: true, label: "Distribution shape" },
    ],
  },

  // ── T-Tests ─────────────────────────────────────────────────────
  one_sample_ttest: {
    display_name: "One-Sample T-Test",
    category: "T-Tests",
    variables: [{ slot: "variable", label: "Variable", accept: ["numeric"], required: true }],
    options: [
      { name: "test_value", type: "number", default: 0, label: "Test value" },
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (Cohen's d)" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
    ],
  },
  independent_ttest: {
    display_name: "Independent Samples T-Test",
    category: "T-Tests",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "grouping", label: "Grouping Variable", accept: ["categorical"], required: true, max_groups: 2 },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (Cohen's d)" },
      { name: "ci", type: "boolean", default: true, label: "Confidence interval" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level", depends_on: "ci" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
      { name: "descriptives", type: "boolean", default: true, label: "Descriptive statistics" },
    ],
  },
  welch_ttest: {
    display_name: "Welch's T-Test",
    category: "T-Tests",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "grouping", label: "Grouping Variable", accept: ["categorical"], required: true, max_groups: 2 },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (Cohen's d)" },
    ],
  },
  paired_ttest: {
    display_name: "Paired Samples T-Test",
    category: "T-Tests",
    variables: [
      { slot: "variable1", label: "Variable 1 (Pre)", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2 (Post)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (Cohen's d)" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
    ],
  },
  mann_whitney: {
    display_name: "Mann-Whitney U Test",
    category: "T-Tests",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "grouping", label: "Grouping Variable", accept: ["categorical"], required: true, max_groups: 2 },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Rank-biserial correlation" },
    ],
  },
  wilcoxon: {
    display_name: "Wilcoxon Signed-Rank Test",
    category: "T-Tests",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [],
  },

  // ── ANOVA ───────────────────────────────────────────────────────
  one_way_anova: {
    display_name: "One-Way ANOVA",
    category: "ANOVA",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (eta-squared)" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
      { name: "descriptives", type: "boolean", default: true, label: "Group descriptives" },
    ],
  },
  repeated_measures_anova: {
    display_name: "Repeated Measures ANOVA",
    category: "ANOVA",
    variables: [
      { slot: "measures", label: "Repeated Measures (select multiple)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (eta-squared)" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Sphericity check" },
    ],
  },
  ancova: {
    display_name: "ANCOVA",
    category: "ANOVA",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor", accept: ["categorical"], required: true },
      { slot: "covariate", label: "Covariate", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (eta-squared)" },
    ],
  },
  kruskal_wallis: {
    display_name: "Kruskal-Wallis H Test",
    category: "ANOVA",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Epsilon-squared" },
    ],
  },

  // ── Regression ──────────────────────────────────────────────────
  linear_regression: {
    display_name: "Linear Regression",
    category: "Regression",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "predictors", label: "Predictor(s)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level" },
    ],
  },
  logistic_regression: {
    display_name: "Logistic Regression",
    category: "Regression",
    variables: [
      { slot: "dependent", label: "Outcome (binary)", accept: ["categorical"], required: true },
      { slot: "predictors", label: "Predictor(s)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "odds_ratios", type: "boolean", default: true, label: "Odds ratios" },
    ],
  },

  // ── Correlation ─────────────────────────────────────────────────
  pearson_correlation: {
    display_name: "Pearson Correlation",
    category: "Correlation",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "ci", type: "boolean", default: true, label: "Confidence interval" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level", depends_on: "ci" },
    ],
  },
  spearman_correlation: {
    display_name: "Spearman Rank Correlation",
    category: "Correlation",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [],
  },

  // ── Non-parametric / Frequencies ────────────────────────────────
  chi_square: {
    display_name: "Chi-Square Test",
    category: "Frequencies",
    variables: [
      { slot: "variable1", label: "Row Variable", accept: ["categorical"], required: true },
      { slot: "variable2", label: "Column Variable", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Cramer's V" },
    ],
  },
  fisher_exact: {
    display_name: "Fisher's Exact Test",
    category: "Frequencies",
    variables: [
      { slot: "variable1", label: "Row Variable (2 levels)", accept: ["categorical"], required: true },
      { slot: "variable2", label: "Column Variable (2 levels)", accept: ["categorical"], required: true },
    ],
    options: [],
  },
  binomial_test: {
    display_name: "Binomial Test",
    category: "Frequencies",
    variables: [
      { slot: "variable", label: "Binary Variable", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "test_proportion", type: "number", default: 0.5, label: "Test proportion" },
    ],
  },
  multinomial_test: {
    display_name: "Multinomial Goodness-of-Fit",
    category: "Frequencies",
    variables: [
      { slot: "variable", label: "Categorical Variable", accept: ["categorical"], required: true },
    ],
    options: [],
  },

  // ── Factor Analysis ─────────────────────────────────────────────
  pca: {
    display_name: "Principal Component Analysis",
    category: "Factor Analysis",
    variables: [
      { slot: "variables", label: "Variables (3+)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "n_components", type: "number", default: 0, label: "Components (0 = Kaiser)" },
    ],
  },
};

export const ANALYSIS_CATEGORIES = [
  { name: "Descriptives", analyses: ["descriptives"] },
  { name: "T-Tests", analyses: ["one_sample_ttest", "independent_ttest", "welch_ttest", "paired_ttest", "mann_whitney", "wilcoxon"] },
  { name: "ANOVA", analyses: ["one_way_anova", "repeated_measures_anova", "ancova", "kruskal_wallis"] },
  { name: "Regression", analyses: ["linear_regression", "logistic_regression"] },
  { name: "Correlation", analyses: ["pearson_correlation", "spearman_correlation"] },
  { name: "Frequencies", analyses: ["chi_square", "fisher_exact", "binomial_test", "multinomial_test"] },
  { name: "Factor Analysis", analyses: ["pca"] },
];
