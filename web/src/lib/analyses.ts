import type { AnalysisDef } from "./types";

export const ANALYSIS_REGISTRY: Record<string, AnalysisDef> = {
  descriptives: {
    display_name: "Descriptive Statistics",
    category: "Descriptives",
    variables: [
      {
        slot: "columns",
        label: "Variables",
        accept: ["numeric"],
        required: true,
      },
    ],
    options: [
      { name: "central_tendency", type: "boolean", default: true, label: "Central tendency (mean, median)" },
      { name: "dispersion", type: "boolean", default: true, label: "Dispersion (SD, variance, range)" },
      { name: "distribution", type: "boolean", default: true, label: "Distribution (skewness, kurtosis)" },
    ],
  },
  independent_ttest: {
    display_name: "Independent Samples T-Test",
    category: "T-Tests",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      {
        slot: "grouping",
        label: "Grouping Variable",
        accept: ["categorical"],
        required: true,
        max_groups: 2,
      },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (Cohen's d)" },
      { name: "ci", type: "boolean", default: true, label: "Confidence interval" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level", depends_on: "ci" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
      { name: "descriptives", type: "boolean", default: true, label: "Descriptive statistics" },
    ],
  },
  paired_ttest: {
    display_name: "Paired Samples T-Test",
    category: "T-Tests",
    variables: [
      { slot: "variable1", label: "Variable 1 (e.g., Pre-test)", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2 (e.g., Post-test)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (Cohen's d)" },
      { name: "ci", type: "boolean", default: true, label: "Confidence interval" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level", depends_on: "ci" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
    ],
  },
  one_way_anova: {
    display_name: "One-Way ANOVA",
    category: "ANOVA",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor (Grouping Variable)", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (eta-squared)" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Assumption checks" },
      { name: "descriptives", type: "boolean", default: true, label: "Group descriptives" },
    ],
  },
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
  chi_square: {
    display_name: "Chi-Square Test",
    category: "Non-parametric",
    variables: [
      { slot: "variable1", label: "Row Variable", accept: ["categorical"], required: true },
      { slot: "variable2", label: "Column Variable", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size (Cramer's V)" },
    ],
  },
};

export const ANALYSIS_CATEGORIES = [
  { name: "Descriptives", analyses: ["descriptives"] },
  { name: "T-Tests", analyses: ["independent_ttest", "paired_ttest"] },
  { name: "ANOVA", analyses: ["one_way_anova"] },
  { name: "Regression", analyses: [] },
  { name: "Correlation", analyses: ["pearson_correlation"] },
  { name: "Non-parametric", analyses: ["chi_square"] },
];
