import math
import numpy as np
import pandas as pd
from scipy import stats


def run_analysis(test_name: str, df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dispatch = {
        "descriptives": _run_descriptives,
        "independent_ttest": _run_independent_ttest,
        "paired_ttest": _run_paired_ttest,
        "one_sample_ttest": _run_one_sample_ttest,
        "welch_ttest": _run_welch_ttest,
        "mann_whitney": _run_mann_whitney,
        "wilcoxon": _run_wilcoxon,
        "one_way_anova": _run_one_way_anova,
        "repeated_measures_anova": _run_repeated_measures_anova,
        "ancova": _run_ancova,
        "kruskal_wallis": _run_kruskal_wallis,
        "linear_regression": _run_linear_regression,
        "logistic_regression": _run_logistic_regression,
        "pearson_correlation": _run_pearson_correlation,
        "spearman_correlation": _run_spearman_correlation,
        "chi_square": _run_chi_square,
        "binomial_test": _run_binomial_test,
        "multinomial_test": _run_multinomial_test,
        "fisher_exact": _run_fisher_exact,
        "pca": _run_pca,
    }
    if test_name not in dispatch:
        raise ValueError(f"Unknown test: {test_name}")
    return dispatch[test_name](df, variables, options)


def _run_independent_ttest(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep = variables["dependent"]
    group_var = variables["grouping"]

    groups = df[group_var].dropna().unique()
    if len(groups) != 2:
        raise ValueError(f"Grouping variable must have exactly 2 groups, found {len(groups)}: {list(groups)}")

    group1_label, group2_label = str(groups[0]), str(groups[1])
    g1 = df[df[group_var] == groups[0]][dep].dropna()
    g2 = df[df[group_var] == groups[1]][dep].dropna()

    n1, n2 = len(g1), len(g2)
    m1, m2 = float(g1.mean()), float(g2.mean())
    s1, s2 = float(g1.std(ddof=1)), float(g2.std(ddof=1))

    # T-test
    t_stat, p_value = stats.ttest_ind(g1, g2)
    dof = n1 + n2 - 2

    # Effect size: Cohen's d (pooled SD)
    pooled_sd = math.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
    cohens_d = (m1 - m2) / pooled_sd if pooled_sd > 0 else 0.0

    # Confidence interval for mean difference
    mean_diff = m1 - m2
    se_diff = math.sqrt(s1**2 / n1 + s2**2 / n2)
    ci_level = options.get("ci_level", 0.95)
    t_crit = stats.t.ppf((1 + ci_level) / 2, dof)
    ci_lower = mean_diff - t_crit * se_diff
    ci_upper = mean_diff + t_crit * se_diff

    result = {
        "result_id": f"res-{np.random.randint(1000, 9999)}",
        "test_name": "independent_ttest",
        "test_display_name": "Independent Samples T-Test",
        "statistics": {
            "t_statistic": round(float(t_stat), 4),
            "degrees_of_freedom": dof,
            "p_value": round(float(p_value), 6),
            "mean_group1": round(m1, 3),
            "mean_group2": round(m2, 3),
            "mean_difference": round(mean_diff, 3),
            "std_group1": round(s1, 3),
            "std_group2": round(s2, 3),
            "cohens_d": round(float(cohens_d), 4),
            "ci_lower": round(ci_lower, 3),
            "ci_upper": round(ci_upper, 3),
            "ci_level": ci_level,
            "n_group1": n1,
            "n_group2": n2,
            "group1_label": group1_label,
            "group2_label": group2_label,
        },
        "assumption_checks": {},
    }

    # Assumption checks
    if options.get("assumption_checks", True):
        # Normality (Shapiro-Wilk)
        if n1 >= 3:
            w1, p1 = stats.shapiro(g1)
            result["assumption_checks"]["normality_group1"] = {
                "test": "Shapiro-Wilk",
                "group": group1_label,
                "statistic": round(float(w1), 4),
                "p_value": round(float(p1), 4),
                "passed": float(p1) > 0.05,
            }
        if n2 >= 3:
            w2, p2 = stats.shapiro(g2)
            result["assumption_checks"]["normality_group2"] = {
                "test": "Shapiro-Wilk",
                "group": group2_label,
                "statistic": round(float(w2), 4),
                "p_value": round(float(p2), 4),
                "passed": float(p2) > 0.05,
            }

        # Equal variance (Levene's test)
        lev_stat, lev_p = stats.levene(g1, g2)
        result["assumption_checks"]["equal_variance"] = {
            "test": "Levene's",
            "statistic": round(float(lev_stat), 4),
            "p_value": round(float(lev_p), 4),
            "passed": float(lev_p) > 0.05,
        }

    return result


def _run_descriptives(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    cols = variables.get("columns", [])
    if isinstance(cols, str):
        cols = [cols]
    if not cols:
        cols = [c for c in df.columns if df[c].dtype.kind in "iufb"]

    col_stats = []
    for col in cols:
        s = df[col].dropna()
        col_stats.append({
            "variable": col,
            "n": len(s),
            "mean": round(float(s.mean()), 3),
            "median": round(float(s.median()), 3),
            "std": round(float(s.std(ddof=1)), 3),
            "variance": round(float(s.var(ddof=1)), 3),
            "min": round(float(s.min()), 3),
            "max": round(float(s.max()), 3),
            "range": round(float(s.max() - s.min()), 3),
            "skewness": round(float(s.skew()), 3),
            "kurtosis": round(float(s.kurtosis()), 3),
            "missing": int(df[col].isna().sum()),
        })

    return {
        "result_id": f"res-{np.random.randint(1000, 9999)}",
        "test_name": "descriptives",
        "test_display_name": "Descriptive Statistics",
        "statistics": {"columns": col_stats},
        "assumption_checks": {},
    }


def _run_paired_ttest(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    var1 = variables["variable1"]
    var2 = variables["variable2"]

    s1 = df[var1].dropna()
    s2 = df[var2].dropna()
    # Align on common indices
    common = s1.index.intersection(s2.index)
    s1, s2 = s1.loc[common], s2.loc[common]

    n = len(s1)
    m1, m2 = float(s1.mean()), float(s2.mean())
    sd1, sd2 = float(s1.std(ddof=1)), float(s2.std(ddof=1))
    diff = s1 - s2
    mean_diff = float(diff.mean())
    sd_diff = float(diff.std(ddof=1))

    t_stat, p_value = stats.ttest_rel(s1, s2)
    dof = n - 1
    cohens_d = mean_diff / sd_diff if sd_diff > 0 else 0.0

    ci_level = options.get("ci_level", 0.95)
    t_crit = stats.t.ppf((1 + ci_level) / 2, dof)
    se = sd_diff / math.sqrt(n)
    ci_lower = mean_diff - t_crit * se
    ci_upper = mean_diff + t_crit * se

    result = {
        "result_id": f"res-{np.random.randint(1000, 9999)}",
        "test_name": "paired_ttest",
        "test_display_name": "Paired Samples T-Test",
        "statistics": {
            "t_statistic": round(float(t_stat), 4),
            "degrees_of_freedom": dof,
            "p_value": round(float(p_value), 6),
            "mean_var1": round(m1, 3),
            "mean_var2": round(m2, 3),
            "mean_difference": round(mean_diff, 3),
            "std_difference": round(sd_diff, 3),
            "cohens_d": round(float(cohens_d), 4),
            "ci_lower": round(ci_lower, 3),
            "ci_upper": round(ci_upper, 3),
            "ci_level": ci_level,
            "n": n,
            "var1_label": var1,
            "var2_label": var2,
        },
        "assumption_checks": {},
    }

    if options.get("assumption_checks", True) and n >= 3:
        w, p = stats.shapiro(diff)
        result["assumption_checks"]["normality_differences"] = {
            "test": "Shapiro-Wilk (differences)",
            "statistic": round(float(w), 4),
            "p_value": round(float(p), 4),
            "passed": float(p) > 0.05,
        }

    return result


def _run_one_way_anova(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep = variables["dependent"]
    factor = variables["factor"]

    groups_labels = df[factor].dropna().unique()
    group_data = [df[df[factor] == g][dep].dropna() for g in groups_labels]

    f_stat, p_value = stats.f_oneway(*group_data)

    # Grand mean and effect size (eta-squared)
    grand_mean = df[dep].dropna().mean()
    ss_between = sum(len(g) * (g.mean() - grand_mean) ** 2 for g in group_data)
    ss_total = sum((df[dep].dropna() - grand_mean) ** 2)
    eta_squared = float(ss_between / ss_total) if ss_total > 0 else 0.0

    df_between = len(groups_labels) - 1
    df_within = sum(len(g) for g in group_data) - len(groups_labels)

    group_stats = []
    for label, data in zip(groups_labels, group_data):
        group_stats.append({
            "group": str(label),
            "n": len(data),
            "mean": round(float(data.mean()), 3),
            "std": round(float(data.std(ddof=1)), 3),
        })

    result = {
        "result_id": f"res-{np.random.randint(1000, 9999)}",
        "test_name": "one_way_anova",
        "test_display_name": "One-Way ANOVA",
        "statistics": {
            "f_statistic": round(float(f_stat), 4),
            "p_value": round(float(p_value), 6),
            "df_between": df_between,
            "df_within": df_within,
            "eta_squared": round(eta_squared, 4),
            "groups": group_stats,
        },
        "assumption_checks": {},
    }

    if options.get("assumption_checks", True):
        # Normality per group
        for label, data in zip(groups_labels, group_data):
            if len(data) >= 3:
                w, p = stats.shapiro(data)
                result["assumption_checks"][f"normality_{label}"] = {
                    "test": "Shapiro-Wilk",
                    "group": str(label),
                    "statistic": round(float(w), 4),
                    "p_value": round(float(p), 4),
                    "passed": float(p) > 0.05,
                }
        # Levene's
        lev_stat, lev_p = stats.levene(*group_data)
        result["assumption_checks"]["equal_variance"] = {
            "test": "Levene's",
            "statistic": round(float(lev_stat), 4),
            "p_value": round(float(lev_p), 4),
            "passed": float(lev_p) > 0.05,
        }

    # Post-hoc tests (Tukey HSD via pairwise comparisons)
    if options.get("post_hoc", True) and len(groups_labels) > 2:
        all_data = np.concatenate([g.values for g in group_data])
        all_labels = np.concatenate([[str(l)] * len(g) for l, g in zip(groups_labels, group_data)])
        n_total = len(all_data)
        ms_within = (ss_total - ss_between) / df_within if df_within > 0 else 0
        post_hoc = []
        for i in range(len(groups_labels)):
            for j in range(i + 1, len(groups_labels)):
                gi, gj = group_data[i], group_data[j]
                diff = float(gi.mean() - gj.mean())
                se = math.sqrt(ms_within * (1/len(gi) + 1/len(gj)) / 2) if ms_within > 0 else 0
                q = abs(diff) / se if se > 0 else 0
                # Bonferroni correction
                t_val = abs(diff) / (math.sqrt(ms_within * (1/len(gi) + 1/len(gj)))) if ms_within > 0 else 0
                p_bonf = min(1.0, float(2 * (1 - stats.t.cdf(t_val, df_within))) * (len(groups_labels) * (len(groups_labels) - 1) / 2))
                post_hoc.append({
                    "group1": str(groups_labels[i]), "group2": str(groups_labels[j]),
                    "mean_diff": round(diff, 3), "p_bonferroni": round(p_bonf, 6),
                    "significant": p_bonf < 0.05,
                })
        result["statistics"]["post_hoc"] = post_hoc

    return result


def _run_pearson_correlation(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    var1 = variables["variable1"]
    var2 = variables["variable2"]

    clean = df[[var1, var2]].dropna()
    x, y = clean[var1], clean[var2]
    n = len(clean)

    r, p_value = stats.pearsonr(x, y)

    # Confidence interval for r (Fisher's z transformation)
    ci_level = options.get("ci_level", 0.95)
    z_r = np.arctanh(r)
    se_z = 1 / math.sqrt(n - 3) if n > 3 else float("inf")
    z_crit = stats.norm.ppf((1 + ci_level) / 2)
    ci_lower = float(np.tanh(z_r - z_crit * se_z))
    ci_upper = float(np.tanh(z_r + z_crit * se_z))

    return {
        "result_id": f"res-{np.random.randint(1000, 9999)}",
        "test_name": "pearson_correlation",
        "test_display_name": "Pearson Correlation",
        "statistics": {
            "r": round(float(r), 4),
            "r_squared": round(float(r ** 2), 4),
            "p_value": round(float(p_value), 6),
            "ci_lower": round(ci_lower, 4),
            "ci_upper": round(ci_upper, 4),
            "ci_level": ci_level,
            "n": n,
            "var1_label": var1,
            "var2_label": var2,
        },
        "assumption_checks": {},
    }


def _run_chi_square(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    var1 = variables["variable1"]
    var2 = variables["variable2"]

    ct = pd.crosstab(df[var1], df[var2])
    chi2, p_value, dof, expected = stats.chi2_contingency(ct)

    n = ct.values.sum()
    k = min(ct.shape)
    cramers_v = math.sqrt(chi2 / (n * (k - 1))) if n > 0 and k > 1 else 0.0

    return {
        "result_id": f"res-{np.random.randint(1000, 9999)}",
        "test_name": "chi_square",
        "test_display_name": "Chi-Square Test of Independence",
        "statistics": {
            "chi_square": round(float(chi2), 4),
            "p_value": round(float(p_value), 6),
            "degrees_of_freedom": int(dof),
            "cramers_v": round(float(cramers_v), 4),
            "n": int(n),
            "contingency_table": ct.to_dict(),
            "var1_label": var1,
            "var2_label": var2,
        },
        "assumption_checks": {},
    }


# ═══════════════════════════════════════════════════════════════════════════════
# NEW ANALYSES — Phase 1
# ═══════════════════════════════════════════════════════════════════════════════

def _run_one_sample_ttest(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    col = variables["variable"]
    test_value = float(variables.get("test_value", options.get("test_value", 0)))
    series = df[col].dropna()
    n, m, sd = len(series), float(series.mean()), float(series.std(ddof=1))
    t_stat, p_value = stats.ttest_1samp(series, test_value)
    dof = n - 1
    cohens_d = (m - test_value) / sd if sd > 0 else 0.0
    ci_level = options.get("ci_level", 0.95)
    se = sd / math.sqrt(n)
    t_crit = stats.t.ppf((1 + ci_level) / 2, dof)
    result = {
        "result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "one_sample_ttest", "test_display_name": "One-Sample T-Test",
        "statistics": {
            "t_statistic": round(float(t_stat), 4), "degrees_of_freedom": dof, "p_value": round(float(p_value), 6),
            "mean": round(m, 3), "test_value": test_value, "mean_difference": round(m - test_value, 3),
            "std": round(sd, 3), "cohens_d": round(float(cohens_d), 4),
            "ci_lower": round(m - t_crit * se, 3), "ci_upper": round(m + t_crit * se, 3), "ci_level": ci_level, "n": n,
        }, "assumption_checks": {},
    }
    if options.get("assumption_checks", True) and n >= 3:
        w, p = stats.shapiro(series)
        result["assumption_checks"]["normality"] = {"test": "Shapiro-Wilk", "statistic": round(float(w), 4), "p_value": round(float(p), 4), "passed": float(p) > 0.05}
    return result


def _run_welch_ttest(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep, gv = variables["dependent"], variables["grouping"]
    groups = df[gv].dropna().unique()
    g1, g2 = df[df[gv] == groups[0]][dep].dropna(), df[df[gv] == groups[1]][dep].dropna()
    n1, n2 = len(g1), len(g2)
    m1, m2, s1, s2 = float(g1.mean()), float(g2.mean()), float(g1.std(ddof=1)), float(g2.std(ddof=1))
    t_stat, p_value = stats.ttest_ind(g1, g2, equal_var=False)
    num = (s1**2/n1 + s2**2/n2)**2
    den = (s1**2/n1)**2/(n1-1) + (s2**2/n2)**2/(n2-1)
    dof = num / den if den > 0 else n1+n2-2
    pooled_sd = math.sqrt(((n1-1)*s1**2 + (n2-1)*s2**2) / (n1+n2-2))
    d = (m1-m2) / pooled_sd if pooled_sd > 0 else 0.0
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "welch_ttest", "test_display_name": "Welch's T-Test",
        "statistics": {"t_statistic": round(float(t_stat), 4), "degrees_of_freedom": round(dof, 2), "p_value": round(float(p_value), 6),
            "mean_group1": round(m1, 3), "mean_group2": round(m2, 3), "mean_difference": round(m1-m2, 3),
            "std_group1": round(s1, 3), "std_group2": round(s2, 3), "cohens_d": round(float(d), 4),
            "n_group1": n1, "n_group2": n2, "group1_label": str(groups[0]), "group2_label": str(groups[1])},
        "assumption_checks": {}}


def _run_mann_whitney(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep, gv = variables["dependent"], variables["grouping"]
    groups = df[gv].dropna().unique()
    g1, g2 = df[df[gv]==groups[0]][dep].dropna(), df[df[gv]==groups[1]][dep].dropna()
    u_stat, p_value = stats.mannwhitneyu(g1, g2, alternative="two-sided")
    n1, n2 = len(g1), len(g2)
    r_rb = 1 - (2 * u_stat) / (n1 * n2)
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "mann_whitney", "test_display_name": "Mann-Whitney U Test",
        "statistics": {"u_statistic": round(float(u_stat), 4), "p_value": round(float(p_value), 6), "rank_biserial_r": round(float(r_rb), 4),
            "median_group1": round(float(g1.median()), 3), "median_group2": round(float(g2.median()), 3),
            "n_group1": n1, "n_group2": n2, "group1_label": str(groups[0]), "group2_label": str(groups[1])},
        "assumption_checks": {}}


def _run_wilcoxon(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    v1, v2 = variables["variable1"], variables["variable2"]
    common = df[[v1, v2]].dropna().index
    s1, s2 = df.loc[common, v1], df.loc[common, v2]
    w_stat, p_value = stats.wilcoxon(s1, s2)
    n = len(s1)
    z = stats.norm.ppf(p_value / 2)
    r_eff = abs(z) / math.sqrt(n) if n > 0 else 0.0
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "wilcoxon", "test_display_name": "Wilcoxon Signed-Rank Test",
        "statistics": {"w_statistic": round(float(w_stat), 4), "p_value": round(float(p_value), 6), "effect_size_r": round(float(r_eff), 4),
            "median_var1": round(float(s1.median()), 3), "median_var2": round(float(s2.median()), 3), "n": n, "var1_label": v1, "var2_label": v2},
        "assumption_checks": {}}


def _run_repeated_measures_anova(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    measures = variables.get("measures", [])
    if len(measures) < 2: raise ValueError("Need at least 2 repeated measures")
    clean = df[measures].dropna()
    n, k = len(clean), len(measures)
    gm = clean.values.mean()
    ss_bt = n * sum((float(clean[m].mean()) - gm)**2 for m in measures)
    ss_subj = k * sum((float(clean.iloc[i].mean()) - gm)**2 for i in range(n))
    ss_tot = float(np.sum((clean.values - gm)**2))
    ss_err = ss_tot - ss_bt - ss_subj
    df_bt, df_err = k-1, (n-1)*(k-1)
    f_stat = (ss_bt/df_bt) / (ss_err/df_err) if df_err > 0 and ss_err > 0 else 0
    p_value = 1 - stats.f.cdf(f_stat, df_bt, df_err)
    eta_sq = ss_bt / (ss_bt + ss_err) if (ss_bt + ss_err) > 0 else 0
    grps = [{"measure": m, "n": n, "mean": round(float(clean[m].mean()), 3), "std": round(float(clean[m].std(ddof=1)), 3)} for m in measures]
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "repeated_measures_anova", "test_display_name": "Repeated Measures ANOVA",
        "statistics": {"f_statistic": round(float(f_stat), 4), "p_value": round(float(p_value), 6), "df_between": df_bt, "df_error": df_err, "eta_squared": round(float(eta_sq), 4), "groups": grps},
        "assumption_checks": {}}


def _run_ancova(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep, factor, cov = variables["dependent"], variables["factor"], variables["covariate"]
    clean = df[[dep, factor, cov]].dropna()
    clean[dep] = pd.to_numeric(clean[dep], errors="coerce")
    clean[cov] = pd.to_numeric(clean[cov], errors="coerce")
    clean = clean.dropna()
    groups = clean[factor].unique()
    n_t = len(clean)
    from numpy.linalg import lstsq as nls
    dummies = pd.get_dummies(clean[factor], drop_first=False, dtype=float)
    X_f = np.column_stack([np.ones(n_t), dummies.values, clean[[cov]].values])
    X_r = np.column_stack([np.ones(n_t), clean[[cov]].values])
    y = clean[dep].values
    b_f, _, _, _ = nls(X_f, y, rcond=None)
    b_r, _, _, _ = nls(X_r, y, rcond=None)
    ss_f = float(np.sum((y - X_f @ b_f)**2))
    ss_r = float(np.sum((y - X_r @ b_r)**2))
    ss_fac = ss_r - ss_f
    df_fac, df_err = len(groups)-1, n_t-len(groups)-1
    f_stat = (ss_fac/df_fac) / (ss_f/df_err) if df_err > 0 and ss_f > 0 else 0
    p_val = 1 - stats.f.cdf(f_stat, df_fac, df_err)
    eta = ss_fac / (ss_fac + ss_f) if (ss_fac + ss_f) > 0 else 0
    grps = [{"group": str(g), "n": len(clean[clean[factor]==g]), "mean": round(float(clean[clean[factor]==g][dep].mean()), 3)} for g in groups]
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "ancova", "test_display_name": "ANCOVA",
        "statistics": {"f_statistic": round(float(f_stat), 4), "p_value": round(float(p_val), 6), "df_factor": df_fac, "df_error": df_err, "eta_squared": round(float(eta), 4), "covariate": cov, "groups": grps},
        "assumption_checks": {}}


def _run_kruskal_wallis(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep, factor = variables["dependent"], variables["factor"]
    groups = df[factor].dropna().unique()
    gd = [df[df[factor]==g][dep].dropna() for g in groups]
    h, p = stats.kruskal(*gd)
    nt = sum(len(g) for g in gd)
    eps = (h - len(groups) + 1) / (nt - len(groups)) if nt > len(groups) else 0
    grps = [{"group": str(g), "n": len(d), "median": round(float(d.median()), 3)} for g, d in zip(groups, gd)]
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "kruskal_wallis", "test_display_name": "Kruskal-Wallis H Test",
        "statistics": {"h_statistic": round(float(h), 4), "p_value": round(float(p), 6), "degrees_of_freedom": len(groups)-1, "epsilon_squared": round(float(eps), 4), "groups": grps},
        "assumption_checks": {}}


def _run_linear_regression(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep = variables["dependent"]
    preds = variables.get("predictors", [])
    if isinstance(preds, str): preds = [preds]
    clean = df[[dep]+preds].dropna()
    y = clean[dep].values.astype(float)
    X = clean[preds].values.astype(float)
    n, p = X.shape
    X_i = np.column_stack([np.ones(n), X])
    from numpy.linalg import lstsq as nls, inv as ninv
    b, _, _, _ = nls(X_i, y, rcond=None)
    resid = y - X_i @ b
    ss_res, ss_tot = float(np.sum(resid**2)), float(np.sum((y - y.mean())**2))
    r2 = 1 - ss_res/ss_tot if ss_tot > 0 else 0
    adj_r2 = 1 - (1-r2)*(n-1)/(n-p-1) if n > p+1 else r2
    ms_reg = (ss_tot-ss_res)/p if p > 0 else 0
    ms_res = ss_res/(n-p-1) if n > p+1 else 0
    f_s = ms_reg/ms_res if ms_res > 0 else 0
    f_p = 1 - stats.f.cdf(f_s, p, n-p-1) if n > p+1 else 1.0
    try: se_b = np.sqrt(np.diag(ms_res * ninv(X_i.T @ X_i)))
    except: se_b = np.zeros(p+1)
    coefs = []
    for i, nm in enumerate(["(Intercept)"]+preds):
        tv = b[i]/se_b[i] if se_b[i] > 0 else 0
        pv = 2*(1-stats.t.cdf(abs(tv), n-p-1)) if n > p+1 else 1.0
        coefs.append({"predictor": nm, "b": round(float(b[i]), 4), "se": round(float(se_b[i]), 4), "t": round(float(tv), 4), "p": round(float(pv), 6)})
    result = {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "linear_regression", "test_display_name": "Linear Regression",
        "statistics": {"r_squared": round(r2, 4), "adj_r_squared": round(adj_r2, 4), "f_statistic": round(float(f_s), 4), "p_value": round(float(f_p), 6), "df_model": p, "df_residual": n-p-1, "n": n, "coefficients": coefs},
        "assumption_checks": {}}
    if options.get("assumption_checks", True) and n >= 3:
        w, sp = stats.shapiro(resid[:min(n, 5000)])
        result["assumption_checks"]["normality_residuals"] = {"test": "Shapiro-Wilk (residuals)", "statistic": round(float(w), 4), "p_value": round(float(sp), 4), "passed": float(sp) > 0.05}
        dw = float(np.sum(np.diff(resid)**2) / ss_res) if ss_res > 0 else 2.0
        result["assumption_checks"]["independence"] = {"test": "Durbin-Watson", "statistic": round(dw, 4), "p_value": 0.0, "passed": 1.5 < dw < 2.5}
    return result


def _run_logistic_regression(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dep = variables["dependent"]
    preds = variables.get("predictors", [])
    if isinstance(preds, str): preds = [preds]
    clean = df[[dep]+preds].dropna()
    y = clean[dep].values
    classes = np.unique(y)
    if len(classes) != 2: raise ValueError(f"Binary outcome required, found {len(classes)} classes")
    yb = (y == classes[1]).astype(float)
    X = clean[preds].values.astype(float)
    n, p = X.shape
    X_i = np.column_stack([np.ones(n), X])
    b = np.zeros(p+1)
    for _ in range(50):
        z = X_i @ b
        pr = 1/(1+np.exp(-np.clip(z, -500, 500)))
        W = np.clip(pr*(1-pr), 1e-10, None)
        try: bn = b + np.linalg.solve(X_i.T @ np.diag(W) @ X_i, X_i.T @ (yb - pr))
        except: break
        if np.max(np.abs(bn-b)) < 1e-8: b = bn; break
        b = bn
    pf = 1/(1+np.exp(-np.clip(X_i @ b, -500, 500)))
    acc = float(np.mean((pf >= 0.5).astype(int) == yb))
    ll = float(np.sum(yb*np.log(pf+1e-10) + (1-yb)*np.log(1-pf+1e-10)))
    ll0 = float(n*(np.mean(yb)*np.log(np.mean(yb)+1e-10) + (1-np.mean(yb))*np.log(1-np.mean(yb)+1e-10)))
    pr2 = 1 - ll/ll0 if ll0 != 0 else 0
    W = np.clip(pf*(1-pf), 1e-10, None)
    try: se = np.sqrt(np.diag(np.linalg.inv(X_i.T @ np.diag(W) @ X_i)))
    except: se = np.zeros(p+1)
    coefs = []
    for i, nm in enumerate(["(Intercept)"]+preds):
        zv = b[i]/se[i] if se[i] > 0 else 0
        pv = 2*(1-stats.norm.cdf(abs(zv)))
        coefs.append({"predictor": nm, "b": round(float(b[i]), 4), "se": round(float(se[i]), 4), "z": round(float(zv), 4), "p": round(float(pv), 6), "odds_ratio": round(float(np.exp(b[i])), 4)})
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "logistic_regression", "test_display_name": "Logistic Regression",
        "statistics": {"pseudo_r_squared": round(float(pr2), 4), "log_likelihood": round(ll, 3), "accuracy": round(acc, 4), "n": n, "outcome_classes": [str(c) for c in classes], "coefficients": coefs},
        "assumption_checks": {}}


def _run_spearman_correlation(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    v1, v2 = variables["variable1"], variables["variable2"]
    clean = df[[v1, v2]].dropna()
    rho, p = stats.spearmanr(clean[v1], clean[v2])
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "spearman_correlation", "test_display_name": "Spearman Rank Correlation",
        "statistics": {"rho": round(float(rho), 4), "p_value": round(float(p), 6), "n": len(clean), "var1_label": v1, "var2_label": v2},
        "assumption_checks": {}}


def _run_binomial_test(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    col = variables["variable"]
    tp = float(options.get("test_proportion", 0.5))
    s = df[col].dropna()
    vals = s.unique()
    if len(vals) != 2: raise ValueError(f"Need 2 categories, found {len(vals)}")
    k, n = int((s == vals[0]).sum()), len(s)
    r = stats.binomtest(k, n, tp)
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "binomial_test", "test_display_name": "Binomial Test",
        "statistics": {"successes": k, "n": n, "observed_proportion": round(k/n, 4), "test_proportion": tp, "p_value": round(float(r.pvalue), 6),
            "ci_lower": round(float(r.proportion_ci().low), 4), "ci_upper": round(float(r.proportion_ci().high), 4), "success_label": str(vals[0])},
        "assumption_checks": {}}


def _run_multinomial_test(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    col = variables["variable"]
    counts = df[col].dropna().value_counts()
    obs, n, k = counts.values, counts.values.sum(), len(counts)
    exp = np.full(k, n/k)
    chi2, p = stats.chisquare(obs, f_exp=exp)
    cats = [{"category": str(c), "observed": int(o), "expected": round(float(e), 1)} for c, o, e in zip(counts.index, obs, exp)]
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "multinomial_test", "test_display_name": "Multinomial Goodness-of-Fit",
        "statistics": {"chi_square": round(float(chi2), 4), "p_value": round(float(p), 6), "degrees_of_freedom": k-1, "n": int(n), "categories": cats},
        "assumption_checks": {}}


def _run_fisher_exact(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    v1, v2 = variables["variable1"], variables["variable2"]
    ct = pd.crosstab(df[v1], df[v2])
    if ct.shape != (2, 2): raise ValueError(f"Need 2x2 table, got {ct.shape}")
    odr, p = stats.fisher_exact(ct)
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "fisher_exact", "test_display_name": "Fisher's Exact Test",
        "statistics": {"odds_ratio": round(float(odr), 4), "p_value": round(float(p), 6), "n": int(ct.values.sum()), "var1_label": v1, "var2_label": v2},
        "assumption_checks": {}}


def _run_pca(df: pd.DataFrame, variables: dict, options: dict) -> dict:
    cols = variables.get("variables", [])
    if isinstance(cols, str): cols = [cols]
    nc = int(options.get("n_components", 0))
    data = df[cols].dropna()
    n, p = data.shape
    from numpy.linalg import eigh
    X = (data - data.mean()) / data.std(ddof=1)
    corr = X.T @ X / (n-1)
    eigvals, eigvecs = eigh(corr.values)
    idx = np.argsort(eigvals)[::-1]
    eigvals, eigvecs = eigvals[idx], eigvecs[:, idx]
    if nc <= 0: nc = max(1, int(np.sum(eigvals > 1)))
    tv = eigvals.sum()
    comps = []
    for i in range(min(nc, p)):
        ld = {c: round(float(eigvecs[j, i]), 4) for j, c in enumerate(cols)}
        comps.append({"component": i+1, "eigenvalue": round(float(eigvals[i]), 4), "variance_pct": round(float(eigvals[i]/tv*100), 2), "cumulative_pct": round(float(np.sum(eigvals[:i+1])/tv*100), 2), "loadings": ld})
    return {"result_id": f"res-{np.random.randint(1000, 9999)}", "test_name": "pca", "test_display_name": "Principal Component Analysis",
        "statistics": {"n_components_extracted": nc, "total_variance_explained": round(float(np.sum(eigvals[:nc])/tv*100), 2), "n": n, "components": comps},
        "assumption_checks": {}}
