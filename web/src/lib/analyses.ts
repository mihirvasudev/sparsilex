import type { AnalysisDef } from "./types";

export const ANALYSIS_REGISTRY: Record<string, AnalysisDef> = {
  // ── Descriptives ────────────────────────────────────────────────
  descriptives: {
    display_name: "Descriptive Statistics",
    category: "Descriptives",
    description: "Central tendency, dispersion, distribution shape, and frequency tables",
    variables: [{ slot: "columns", label: "Variables", accept: ["numeric"], required: true }],
    options: [
      { name: "mean", type: "boolean", default: true, label: "Mean", group: "Central Tendency" },
      { name: "median", type: "boolean", default: true, label: "Median", group: "Central Tendency" },
      { name: "mode", type: "boolean", default: false, label: "Mode", group: "Central Tendency" },
      { name: "std", type: "boolean", default: true, label: "Std. deviation", group: "Dispersion" },
      { name: "variance", type: "boolean", default: false, label: "Variance", group: "Dispersion" },
      { name: "range", type: "boolean", default: true, label: "Range", group: "Dispersion" },
      { name: "iqr", type: "boolean", default: false, label: "IQR", group: "Dispersion" },
      { name: "skewness", type: "boolean", default: true, label: "Skewness", group: "Distribution" },
      { name: "kurtosis", type: "boolean", default: true, label: "Kurtosis", group: "Distribution" },
      { name: "shapiro_wilk", type: "boolean", default: false, label: "Shapiro-Wilk normality test", group: "Distribution" },
      { name: "histogram", type: "boolean", default: false, label: "Histogram", group: "Plots" },
      { name: "boxplot", type: "boolean", default: false, label: "Boxplot", group: "Plots" },
      { name: "qq_plot", type: "boolean", default: false, label: "Q-Q plot", group: "Plots" },
    ],
  },

  // ── T-Tests ─────────────────────────────────────────────────────
  one_sample_ttest: {
    display_name: "One-Sample T-Test",
    category: "T-Tests",
    description: "Test whether a sample mean differs from a specified value",
    variables: [{ slot: "variable", label: "Variable", accept: ["numeric"], required: true }],
    options: [
      { name: "test_value", type: "number", default: 0, label: "Test value" },
      { name: "alternative", type: "select", default: "two_sided", label: "Alternative hypothesis", choices: [
        { value: "two_sided", label: "Mean ≠ test value" },
        { value: "greater", label: "Mean > test value" },
        { value: "less", label: "Mean < test value" },
      ]},
      { name: "ci_level", type: "number", default: 0.95, label: "Confidence level", min: 0.5, max: 0.999, step: 0.01 },
      { name: "effect_size", type: "boolean", default: true, label: "Cohen's d", group: "Additional Statistics" },
      { name: "descriptives", type: "boolean", default: true, label: "Descriptives", group: "Additional Statistics" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Normality test (Shapiro-Wilk)", group: "Assumption Checks" },
      { name: "qq_plot", type: "boolean", default: false, label: "Q-Q plot", group: "Assumption Checks" },
      { name: "distribution_plot", type: "boolean", default: false, label: "Distribution plot", group: "Plots" },
    ],
  },
  independent_ttest: {
    display_name: "Independent Samples T-Test",
    category: "T-Tests",
    description: "Compare means of a continuous variable between two independent groups",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "grouping", label: "Grouping Variable", accept: ["categorical"], required: true, max_groups: 2 },
    ],
    options: [
      { name: "test_type", type: "select", default: "student", label: "Test", choices: [
        { value: "student", label: "Student" },
        { value: "welch", label: "Welch" },
        { value: "both", label: "Both" },
      ]},
      { name: "alternative", type: "select", default: "two_sided", label: "Alternative hypothesis", choices: [
        { value: "two_sided", label: "Group 1 ≠ Group 2" },
        { value: "greater", label: "Group 1 > Group 2" },
        { value: "less", label: "Group 1 < Group 2" },
      ]},
      { name: "ci_level", type: "number", default: 0.95, label: "Confidence level", min: 0.5, max: 0.999, step: 0.01 },
      { name: "effect_size_d", type: "boolean", default: true, label: "Cohen's d", group: "Effect Size" },
      { name: "effect_size_g", type: "boolean", default: false, label: "Hedges' g", group: "Effect Size" },
      { name: "effect_size_ci", type: "boolean", default: false, label: "CI for effect size", group: "Effect Size" },
      { name: "descriptives", type: "boolean", default: true, label: "Group descriptives", group: "Additional Statistics" },
      { name: "descriptives_plot", type: "boolean", default: false, label: "Descriptives plot", group: "Additional Statistics" },
      { name: "mann_whitney", type: "boolean", default: false, label: "Mann-Whitney U (non-parametric)", group: "Additional Statistics" },
      { name: "normality", type: "boolean", default: true, label: "Shapiro-Wilk per group", group: "Assumption Checks" },
      { name: "equality_of_variances", type: "boolean", default: true, label: "Levene's test", group: "Assumption Checks" },
      { name: "qq_plot", type: "boolean", default: false, label: "Q-Q plot per group", group: "Assumption Checks" },
      { name: "raincloud_plot", type: "boolean", default: false, label: "Raincloud plot", group: "Plots" },
      { name: "boxplot", type: "boolean", default: false, label: "Boxplot", group: "Plots" },
    ],
  },
  welch_ttest: {
    display_name: "Welch's T-Test",
    category: "T-Tests",
    description: "Independent samples comparison not assuming equal variances",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "grouping", label: "Grouping Variable", accept: ["categorical"], required: true, max_groups: 2 },
    ],
    options: [
      { name: "ci_level", type: "number", default: 0.95, label: "Confidence level" },
      { name: "effect_size", type: "boolean", default: true, label: "Cohen's d" },
      { name: "descriptives", type: "boolean", default: true, label: "Descriptives" },
    ],
  },
  paired_ttest: {
    display_name: "Paired Samples T-Test",
    category: "T-Tests",
    description: "Compare means of two related measurements (e.g., pre/post)",
    variables: [
      { slot: "variable1", label: "Variable 1 (e.g., Pre-test)", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2 (e.g., Post-test)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "alternative", type: "select", default: "two_sided", label: "Alternative hypothesis", choices: [
        { value: "two_sided", label: "Measure 1 ≠ Measure 2" },
        { value: "greater", label: "Measure 1 > Measure 2" },
        { value: "less", label: "Measure 1 < Measure 2" },
      ]},
      { name: "ci_level", type: "number", default: 0.95, label: "Confidence level" },
      { name: "effect_size", type: "boolean", default: true, label: "Cohen's d", group: "Additional Statistics" },
      { name: "descriptives", type: "boolean", default: true, label: "Descriptives", group: "Additional Statistics" },
      { name: "wilcoxon", type: "boolean", default: false, label: "Wilcoxon signed-rank (non-parametric)", group: "Additional Statistics" },
      { name: "assumption_checks", type: "boolean", default: true, label: "Normality of differences", group: "Assumption Checks" },
      { name: "paired_plot", type: "boolean", default: false, label: "Paired lines plot", group: "Plots" },
    ],
  },
  mann_whitney: {
    display_name: "Mann-Whitney U Test",
    category: "T-Tests",
    description: "Non-parametric test for comparing two independent groups",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "grouping", label: "Grouping Variable", accept: ["categorical"], required: true, max_groups: 2 },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Rank-biserial correlation" },
      { name: "descriptives", type: "boolean", default: true, label: "Group medians" },
    ],
  },
  wilcoxon: {
    display_name: "Wilcoxon Signed-Rank Test",
    category: "T-Tests",
    description: "Non-parametric paired samples comparison",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "Effect size r" },
    ],
  },

  // ── ANOVA ───────────────────────────────────────────────────────
  one_way_anova: {
    display_name: "One-Way ANOVA",
    category: "ANOVA",
    description: "Compare means across three or more independent groups",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "effect_size", type: "select", default: "eta_squared", label: "Effect size", choices: [
        { value: "eta_squared", label: "η² (Eta-squared)" },
        { value: "omega_squared", label: "ω² (Omega-squared)" },
        { value: "both", label: "Both" },
      ]},
      { name: "descriptives", type: "boolean", default: true, label: "Group descriptives", group: "Additional Statistics" },
      { name: "means_plot", type: "boolean", default: false, label: "Means plot with CI", group: "Additional Statistics" },
      { name: "post_hoc", type: "select", default: "tukey", label: "Post-hoc test", group: "Post-Hoc Tests", choices: [
        { value: "none", label: "None" },
        { value: "tukey", label: "Tukey HSD" },
        { value: "bonferroni", label: "Bonferroni" },
        { value: "holm", label: "Holm" },
        { value: "scheffe", label: "Scheffé" },
      ]},
      { name: "normality", type: "boolean", default: true, label: "Shapiro-Wilk per group", group: "Assumption Checks" },
      { name: "homogeneity", type: "boolean", default: true, label: "Levene's test", group: "Assumption Checks" },
      { name: "welch_anova", type: "boolean", default: false, label: "Welch's ANOVA (unequal variances)", group: "Assumption Checks" },
      { name: "boxplot", type: "boolean", default: false, label: "Boxplot", group: "Plots" },
      { name: "violin_plot", type: "boolean", default: false, label: "Violin plot", group: "Plots" },
    ],
  },
  repeated_measures_anova: {
    display_name: "Repeated Measures ANOVA",
    category: "ANOVA",
    description: "Compare means across related measurements within subjects",
    variables: [
      { slot: "measures", label: "Repeated Measures (select multiple)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "η² (Eta-squared)" },
      { name: "sphericity_correction", type: "select", default: "none", label: "Sphericity correction", choices: [
        { value: "none", label: "None (assume sphericity)" },
        { value: "greenhouse_geisser", label: "Greenhouse-Geisser" },
        { value: "huynh_feldt", label: "Huynh-Feldt" },
      ]},
      { name: "assumption_checks", type: "boolean", default: true, label: "Sphericity test", group: "Assumption Checks" },
      { name: "post_hoc", type: "boolean", default: false, label: "Pairwise comparisons (Bonferroni)", group: "Post-Hoc Tests" },
    ],
  },
  ancova: {
    display_name: "ANCOVA",
    category: "ANOVA",
    description: "ANOVA controlling for a continuous covariate",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor", accept: ["categorical"], required: true },
      { slot: "covariate", label: "Covariate", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "η² (Eta-squared)" },
      { name: "ss_type", type: "select", default: "III", label: "Sum of Squares type", choices: [
        { value: "II", label: "Type II" },
        { value: "III", label: "Type III" },
      ]},
      { name: "adjusted_means", type: "boolean", default: false, label: "Adjusted group means", group: "Additional Statistics" },
      { name: "homogeneity_regression", type: "boolean", default: false, label: "Homogeneity of regression slopes", group: "Assumption Checks" },
    ],
  },
  kruskal_wallis: {
    display_name: "Kruskal-Wallis H Test",
    category: "ANOVA",
    description: "Non-parametric one-way ANOVA",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "effect_size", type: "boolean", default: true, label: "ε² (Epsilon-squared)" },
      { name: "dunn_test", type: "boolean", default: false, label: "Dunn's post-hoc test", group: "Post-Hoc Tests" },
    ],
  },

  // ── Regression ──────────────────────────────────────────────────
  linear_regression: {
    display_name: "Linear Regression",
    category: "Regression",
    description: "Predict a continuous outcome from one or more predictors",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "predictors", label: "Predictor(s)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "ci_level", type: "number", default: 0.95, label: "Confidence level", min: 0.5, max: 0.999, step: 0.01 },
      { name: "standardized", type: "boolean", default: false, label: "Standardized coefficients (β)", group: "Coefficients" },
      { name: "ci_coefficients", type: "boolean", default: false, label: "CI for coefficients", group: "Coefficients" },
      { name: "collinearity", type: "boolean", default: true, label: "VIF / Tolerance", group: "Diagnostics" },
      { name: "durbin_watson", type: "boolean", default: true, label: "Durbin-Watson", group: "Diagnostics" },
      { name: "normality_residuals", type: "boolean", default: true, label: "Normality of residuals", group: "Assumption Checks" },
      { name: "residual_plot", type: "boolean", default: false, label: "Residual vs. fitted plot", group: "Plots" },
      { name: "qq_plot", type: "boolean", default: false, label: "Q-Q plot of residuals", group: "Plots" },
      { name: "scatter_plot", type: "boolean", default: false, label: "Scatter with regression line", group: "Plots" },
    ],
  },
  logistic_regression: {
    display_name: "Logistic Regression",
    category: "Regression",
    description: "Predict a binary outcome from one or more predictors",
    variables: [
      { slot: "dependent", label: "Outcome (binary)", accept: ["categorical"], required: true },
      { slot: "predictors", label: "Predictor(s)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "odds_ratios", type: "boolean", default: true, label: "Odds ratios" },
      { name: "ci_odds", type: "boolean", default: false, label: "CI for odds ratios" },
      { name: "classification_table", type: "boolean", default: false, label: "Classification table", group: "Model Performance" },
      { name: "accuracy", type: "boolean", default: true, label: "Overall accuracy", group: "Model Performance" },
      { name: "pseudo_r2", type: "boolean", default: true, label: "Pseudo R² (McFadden)", group: "Model Fit" },
    ],
  },

  // ── Correlation ─────────────────────────────────────────────────
  pearson_correlation: {
    display_name: "Pearson Correlation",
    category: "Correlation",
    description: "Linear association between two continuous variables",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "alternative", type: "select", default: "two_sided", label: "Alternative hypothesis", choices: [
        { value: "two_sided", label: "r ≠ 0" },
        { value: "greater", label: "r > 0" },
        { value: "less", label: "r < 0" },
      ]},
      { name: "ci", type: "boolean", default: true, label: "Confidence interval" },
      { name: "ci_level", type: "number", default: 0.95, label: "CI Level", depends_on: "ci" },
      { name: "scatter_plot", type: "boolean", default: false, label: "Scatter plot", group: "Plots" },
    ],
  },
  spearman_correlation: {
    display_name: "Spearman Rank Correlation",
    category: "Correlation",
    description: "Monotonic association between two variables (non-parametric)",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "scatter_plot", type: "boolean", default: false, label: "Scatter plot", group: "Plots" },
    ],
  },

  // ── Frequencies ─────────────────────────────────────────────────
  chi_square: {
    display_name: "Chi-Square Test",
    category: "Frequencies",
    description: "Test of independence for two categorical variables",
    variables: [
      { slot: "variable1", label: "Row Variable", accept: ["categorical"], required: true },
      { slot: "variable2", label: "Column Variable", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "cramers_v", type: "boolean", default: true, label: "Cramér's V" },
      { name: "phi", type: "boolean", default: false, label: "Phi coefficient (2×2 only)" },
      { name: "contingency_coefficient", type: "boolean", default: false, label: "Contingency coefficient" },
      { name: "expected_counts", type: "boolean", default: false, label: "Expected counts", group: "Cells" },
      { name: "row_pct", type: "boolean", default: false, label: "Row percentages", group: "Cells" },
      { name: "col_pct", type: "boolean", default: false, label: "Column percentages", group: "Cells" },
      { name: "bar_plot", type: "boolean", default: false, label: "Bar plot", group: "Plots" },
    ],
  },
  fisher_exact: {
    display_name: "Fisher's Exact Test",
    category: "Frequencies",
    description: "Exact test for 2×2 contingency tables (small samples)",
    variables: [
      { slot: "variable1", label: "Row Variable (2 levels)", accept: ["categorical"], required: true },
      { slot: "variable2", label: "Column Variable (2 levels)", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "odds_ratio", type: "boolean", default: true, label: "Odds ratio" },
    ],
  },
  binomial_test: {
    display_name: "Binomial Test",
    category: "Frequencies",
    description: "Test whether a proportion differs from a specified value",
    variables: [
      { slot: "variable", label: "Binary Variable", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "test_proportion", type: "number", default: 0.5, label: "Test proportion", min: 0.001, max: 0.999, step: 0.01 },
      { name: "ci", type: "boolean", default: true, label: "Confidence interval" },
    ],
  },
  multinomial_test: {
    display_name: "Multinomial Goodness-of-Fit",
    category: "Frequencies",
    description: "Test whether observed frequencies match expected proportions",
    variables: [
      { slot: "variable", label: "Categorical Variable", accept: ["categorical"], required: true },
    ],
    options: [
      { name: "expected_counts", type: "boolean", default: true, label: "Expected counts" },
    ],
  },

  // ── Factor Analysis ─────────────────────────────────────────────
  pca: {
    display_name: "Principal Component Analysis",
    category: "Factor Analysis",
    description: "Reduce dimensionality by extracting principal components",
    variables: [
      { slot: "variables", label: "Variables (3+)", accept: ["numeric"], required: true },
    ],
    options: [
      { name: "n_components", type: "number", default: 0, label: "Components (0 = Kaiser criterion)" },
      { name: "rotation", type: "select", default: "none", label: "Rotation", choices: [
        { value: "none", label: "None" },
        { value: "varimax", label: "Varimax" },
        { value: "promax", label: "Promax" },
      ]},
      { name: "scree_plot", type: "boolean", default: false, label: "Scree plot", group: "Plots" },
      { name: "loading_threshold", type: "number", default: 0.4, label: "Highlight loadings ≥", min: 0.1, max: 0.9, step: 0.1 },
      { name: "kmo", type: "boolean", default: false, label: "KMO measure", group: "Diagnostics" },
      { name: "bartlett", type: "boolean", default: false, label: "Bartlett's test of sphericity", group: "Diagnostics" },
    ],
  },

  // ── Bayesian (R-based) ──────────────────────────────────────────
  bayesian_ttest_ind: {
    display_name: "Bayesian Independent T-Test",
    category: "Bayesian",
    description: "Bayes factor for comparing two independent group means (requires R)",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "grouping", label: "Grouping Variable", accept: ["categorical"], required: true, max_groups: 2 },
    ],
    options: [
      { name: "prior_scale", type: "number", default: 0.707, label: "Cauchy prior scale (r)" },
    ],
  },
  bayesian_ttest_paired: {
    display_name: "Bayesian Paired T-Test",
    category: "Bayesian",
    description: "Bayes factor for comparing two paired measurements (requires R)",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [],
  },
  bayesian_anova: {
    display_name: "Bayesian ANOVA",
    category: "Bayesian",
    description: "Bayes factor for comparing means across groups (requires R)",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "factor", label: "Factor", accept: ["categorical"], required: true },
    ],
    options: [],
  },
  bayesian_correlation: {
    display_name: "Bayesian Correlation",
    category: "Bayesian",
    description: "Bayes factor for linear association (requires R)",
    variables: [
      { slot: "variable1", label: "Variable 1", accept: ["numeric"], required: true },
      { slot: "variable2", label: "Variable 2", accept: ["numeric"], required: true },
    ],
    options: [],
  },

  // ── Mixed Models (R-based) ─────────────────────────────────────
  linear_mixed_model: {
    display_name: "Linear Mixed Model",
    category: "Mixed Models",
    description: "Random and fixed effects regression for nested/repeated data (requires R + lme4)",
    variables: [
      { slot: "dependent", label: "Dependent Variable", accept: ["numeric"], required: true },
      { slot: "fixed", label: "Fixed Effect", accept: ["categorical"], required: true },
      { slot: "random", label: "Random Effect (e.g., subject_id)", accept: ["categorical"], required: true },
    ],
    options: [],
  },

  // ── Reliability (R-based) ──────────────────────────────────────
  cronbach_alpha: {
    display_name: "Cronbach's Alpha",
    category: "Reliability",
    description: "Internal consistency reliability for scale items (requires R + psych)",
    variables: [
      { slot: "variables", label: "Scale Items (3+)", accept: ["numeric"], required: true },
    ],
    options: [],
  },

  // ── CFA (R-based) ─────────────────────────────────────────────
  cfa: {
    display_name: "Confirmatory Factor Analysis",
    category: "SEM",
    description: "Test a hypothesized factor structure (requires R + lavaan). Enter model in lavaan syntax.",
    variables: [
      { slot: "model", label: "Model (lavaan syntax, e.g., f1 =~ x1 + x2 + x3)", accept: ["numeric"], required: true },
    ],
    options: [],
  },

  // ── Power Analysis (R-based) ───────────────────────────────────
  power_ttest: {
    display_name: "Power Analysis (T-Test)",
    category: "Power",
    description: "Calculate required sample size for a t-test (requires R + pwr)",
    variables: [],
    options: [
      { name: "effect_size", type: "number", default: 0.5, label: "Effect size (d)", min: 0.01, max: 3, step: 0.01 },
      { name: "alpha", type: "number", default: 0.05, label: "Alpha", min: 0.001, max: 0.2, step: 0.01 },
      { name: "power", type: "number", default: 0.8, label: "Power", min: 0.5, max: 0.999, step: 0.01 },
    ],
  },
  power_anova: {
    display_name: "Power Analysis (ANOVA)",
    category: "Power",
    description: "Calculate required sample size for ANOVA (requires R + pwr)",
    variables: [],
    options: [
      { name: "effect_size", type: "number", default: 0.25, label: "Effect size (f)", min: 0.01, max: 2, step: 0.01 },
      { name: "k", type: "number", default: 3, label: "Number of groups", min: 2, max: 20, step: 1 },
      { name: "alpha", type: "number", default: 0.05, label: "Alpha", min: 0.001, max: 0.2, step: 0.01 },
      { name: "power", type: "number", default: 0.8, label: "Power", min: 0.5, max: 0.999, step: 0.01 },
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
  { name: "Factor Analysis", analyses: ["pca", "cronbach_alpha"] },
  { name: "Bayesian", analyses: ["bayesian_ttest_ind", "bayesian_ttest_paired", "bayesian_anova", "bayesian_correlation"] },
  { name: "Mixed Models", analyses: ["linear_mixed_model"] },
  { name: "SEM", analyses: ["cfa"] },
  { name: "Power", analyses: ["power_ttest", "power_anova"] },
];
