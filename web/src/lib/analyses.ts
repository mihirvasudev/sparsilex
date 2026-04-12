import type { AnalysisDef } from "./types";

export const ANALYSIS_REGISTRY: Record<string, AnalysisDef> = {
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
      {
        name: "assumption_checks",
        type: "boolean",
        default: true,
        label: "Assumption checks",
      },
      { name: "descriptives", type: "boolean", default: true, label: "Descriptive statistics" },
    ],
  },
};

export const ANALYSIS_CATEGORIES = [
  {
    name: "Descriptives",
    analyses: [],
  },
  {
    name: "T-Tests",
    analyses: ["independent_ttest"],
  },
  {
    name: "ANOVA",
    analyses: [],
  },
  {
    name: "Regression",
    analyses: [],
  },
  {
    name: "Correlation",
    analyses: [],
  },
  {
    name: "Non-parametric",
    analyses: [],
  },
];
