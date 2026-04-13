/** Per-analysis help text — when to use, assumptions, interpretation guidance. */
export const ANALYSIS_HELP: Record<string, { when: string; assumptions: string[]; interpret: string }> = {
  one_sample_ttest: {
    when: "Use when you want to test if a sample mean differs from a known or hypothesized value.",
    assumptions: ["Continuous dependent variable", "Observations are independent", "Approximately normal distribution (robust with n > 30)"],
    interpret: "A significant result (p < .05) indicates the sample mean differs from the test value. Report t(df) = X.XX, p = .XXX, d = X.XX.",
  },
  independent_ttest: {
    when: "Use when comparing means of a continuous variable between two independent groups (e.g., treatment vs. control).",
    assumptions: ["Continuous dependent variable", "Two independent groups", "Normal distribution per group", "Equal variances (use Welch's if violated)"],
    interpret: "A significant result means the groups differ. Report t(df) = X.XX, p = .XXX, d = X.XX with group means and SDs.",
  },
  welch_ttest: {
    when: "Use instead of Student's t-test when equal variance assumption is violated (Levene's test significant).",
    assumptions: ["Continuous dependent variable", "Two independent groups", "Normal distribution per group", "Does NOT require equal variances"],
    interpret: "Same interpretation as independent t-test. Welch's adjusts degrees of freedom for unequal variances.",
  },
  paired_ttest: {
    when: "Use when comparing two related measurements on the same subjects (e.g., pre-test vs. post-test).",
    assumptions: ["Continuous dependent variable", "Paired/matched observations", "Normal distribution of differences"],
    interpret: "A significant result means the two measurements differ. Report the mean difference and its confidence interval.",
  },
  mann_whitney: {
    when: "Use as a non-parametric alternative to the independent t-test when normality is violated.",
    assumptions: ["Ordinal or continuous dependent variable", "Two independent groups", "Similar distribution shapes"],
    interpret: "A significant result means the distributions differ. Report U statistic and rank-biserial correlation r as effect size.",
  },
  wilcoxon: {
    when: "Use as a non-parametric alternative to the paired t-test when normality of differences is violated.",
    assumptions: ["Ordinal or continuous measurements", "Paired observations", "Symmetric distribution of differences"],
    interpret: "A significant result means the paired measurements differ. Report W statistic and effect size r.",
  },
  one_way_anova: {
    when: "Use when comparing means of a continuous variable across three or more independent groups.",
    assumptions: ["Continuous dependent variable", "Three or more independent groups", "Normal distribution per group", "Equal variances (homogeneity)"],
    interpret: "A significant F-test means at least one group differs. Follow up with post-hoc tests to identify which groups.",
  },
  repeated_measures_anova: {
    when: "Use when comparing means across three or more related measurements within the same subjects.",
    assumptions: ["Continuous dependent variable", "Three or more related measurements", "Sphericity (equal variances of differences)"],
    interpret: "A significant result means at least one condition differs. Check sphericity — if violated, use Greenhouse-Geisser correction.",
  },
  ancova: {
    when: "Use when comparing group means while controlling for a continuous covariate (e.g., comparing treatment groups controlling for age).",
    assumptions: ["All ANOVA assumptions", "Linear relationship between covariate and DV", "Homogeneity of regression slopes"],
    interpret: "A significant factor effect means groups differ after controlling for the covariate.",
  },
  kruskal_wallis: {
    when: "Use as a non-parametric alternative to one-way ANOVA when normality is violated.",
    assumptions: ["Ordinal or continuous dependent variable", "Three or more independent groups"],
    interpret: "A significant H means at least one group's distribution differs. Follow up with Dunn's test.",
  },
  linear_regression: {
    when: "Use to predict a continuous outcome from one or more continuous predictors and to examine their relationships.",
    assumptions: ["Linear relationship", "Independent observations", "Normal residuals", "Homoscedasticity", "No multicollinearity (multiple regression)"],
    interpret: "Report R-squared (variance explained), F-test (overall model), and individual coefficients with t-tests. Check VIF for multicollinearity.",
  },
  logistic_regression: {
    when: "Use to predict a binary outcome (yes/no, pass/fail) from one or more predictors.",
    assumptions: ["Binary dependent variable", "Independent observations", "No multicollinearity", "Linear relationship between predictors and log-odds"],
    interpret: "Report odds ratios — OR > 1 means higher odds of the outcome. Report pseudo R-squared and classification accuracy.",
  },
  pearson_correlation: {
    when: "Use to measure the linear association between two continuous variables.",
    assumptions: ["Both variables continuous", "Linear relationship", "Bivariate normality", "No outliers"],
    interpret: "r ranges from -1 to +1. Report r, p-value, and confidence interval. r-squared gives proportion of shared variance.",
  },
  spearman_correlation: {
    when: "Use when the relationship is monotonic but not necessarily linear, or when variables are ordinal.",
    assumptions: ["Ordinal or continuous variables", "Monotonic relationship"],
    interpret: "Spearman's rho (rs) measures monotonic association. Interpretation similar to Pearson's r.",
  },
  chi_square: {
    when: "Use to test whether two categorical variables are independent (no association).",
    assumptions: ["Both variables categorical", "Independent observations", "Expected cell frequencies ≥ 5 (use Fisher's exact if not)"],
    interpret: "A significant result means the variables are associated. Report Cramér's V as the effect size.",
  },
  fisher_exact: {
    when: "Use instead of chi-square when expected cell frequencies are < 5, or for small 2×2 tables.",
    assumptions: ["2×2 contingency table", "Independent observations"],
    interpret: "Report exact p-value and odds ratio.",
  },
  binomial_test: {
    when: "Use to test whether an observed proportion differs from a hypothesized proportion.",
    assumptions: ["Binary outcome", "Independent observations", "Fixed number of trials"],
    interpret: "A significant result means the observed proportion differs from the test value.",
  },
  multinomial_test: {
    when: "Use to test whether observed category frequencies match expected proportions (e.g., equal distribution).",
    assumptions: ["Categorical variable", "Independent observations", "Expected frequencies ≥ 5"],
    interpret: "A significant chi-square means the observed distribution differs from expected.",
  },
  pca: {
    when: "Use to reduce a large number of correlated variables into fewer uncorrelated components.",
    assumptions: ["Continuous variables", "Linear relationships among variables", "Adequate sample size (n > 5 per variable)", "Some correlation among variables (KMO > 0.6)"],
    interpret: "Examine eigenvalues (> 1 rule), scree plot, and factor loadings (> 0.4). Report total variance explained.",
  },
  descriptives: {
    when: "Use to summarize and describe the main features of a dataset before running inferential tests.",
    assumptions: [],
    interpret: "Report means, standard deviations, and ranges. Check skewness and kurtosis for normality.",
  },
};
