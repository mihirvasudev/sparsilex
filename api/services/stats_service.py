import math
import numpy as np
import pandas as pd
from scipy import stats


def run_analysis(test_name: str, df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dispatch = {
        "independent_ttest": _run_independent_ttest,
        "paired_ttest": _run_paired_ttest,
        "one_way_anova": _run_one_way_anova,
        "pearson_correlation": _run_pearson_correlation,
        "chi_square": _run_chi_square,
        "descriptives": _run_descriptives,
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
