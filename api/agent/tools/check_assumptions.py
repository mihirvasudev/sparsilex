from scipy import stats as sp_stats
from services.data_service import get_dataset


def check_assumptions(dataset_id: str, test_name: str, variables: dict) -> dict:
    df = get_dataset(dataset_id)

    if test_name == "independent_ttest":
        dep = variables.get("dependent")
        group_var = variables.get("grouping")
        groups = df[group_var].dropna().unique()

        checks = {}

        # Normality per group
        for gv in groups:
            series = df[df[group_var] == gv][dep].dropna()
            if len(series) >= 3:
                w, p = sp_stats.shapiro(series)
                checks[f"normality_{gv}"] = {
                    "test": "Shapiro-Wilk",
                    "group": str(gv),
                    "statistic": round(float(w), 4),
                    "p_value": round(float(p), 4),
                    "passed": float(p) > 0.05,
                }

        # Equal variance
        group_data = [df[df[group_var] == g][dep].dropna() for g in groups]
        if len(group_data) == 2:
            f_stat, f_p = sp_stats.levene(*group_data)
            checks["equal_variance"] = {
                "test": "Levene's",
                "statistic": round(float(f_stat), 4),
                "p_value": round(float(f_p), 4),
                "passed": float(f_p) > 0.05,
            }

        all_passed = all(c.get("passed", False) for c in checks.values())
        return {
            "test_name": test_name,
            "checks": checks,
            "all_passed": all_passed,
            "recommendation": (
                "All assumptions met. Proceed with the independent t-test."
                if all_passed
                else "Some assumptions violated. Consider Welch's t-test (unequal variance) or Mann-Whitney U (non-normality)."
            ),
        }

    return {"error": f"Assumption checks not implemented for {test_name}"}
