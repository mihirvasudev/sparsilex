import math
import numpy as np
import pandas as pd
from scipy import stats


def run_analysis(test_name: str, df: pd.DataFrame, variables: dict, options: dict) -> dict:
    dispatch = {
        "independent_ttest": _run_independent_ttest,
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
