from scipy import stats as sp_stats
from services.data_service import get_dataset


def check_normality(
    dataset_id: str, column: str, group_by: str | None = None
) -> dict:
    df = get_dataset(dataset_id)

    if group_by:
        results = {}
        for group_val in df[group_by].dropna().unique():
            series = df[df[group_by] == group_val][column].dropna()
            if len(series) < 3:
                results[str(group_val)] = {"error": f"Too few observations ({len(series)})"}
                continue
            w, p = sp_stats.shapiro(series)
            results[str(group_val)] = {
                "n": len(series),
                "statistic": round(float(w), 4),
                "p_value": round(float(p), 4),
                "passed": float(p) > 0.05,
            }
        return {"test": "Shapiro-Wilk", "column": column, "group_by": group_by, "groups": results}

    series = df[column].dropna()
    if len(series) < 3:
        return {"error": f"Too few observations ({len(series)})"}

    w, p = sp_stats.shapiro(series)
    return {
        "test": "Shapiro-Wilk",
        "column": column,
        "n": len(series),
        "statistic": round(float(w), 4),
        "p_value": round(float(p), 4),
        "passed": float(p) > 0.05,
    }
