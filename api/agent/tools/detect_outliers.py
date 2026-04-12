import numpy as np
from services.data_service import get_dataset


def detect_outliers(
    dataset_id: str, column: str, method: str = "iqr"
) -> dict:
    df = get_dataset(dataset_id)
    series = df[column].dropna()

    if method == "iqr":
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers = series[(series < lower) | (series > upper)]
    elif method == "zscore":
        z = np.abs((series - series.mean()) / series.std())
        outliers = series[z > 3]
        lower = float(series.mean() - 3 * series.std())
        upper = float(series.mean() + 3 * series.std())
    else:
        return {"error": f"Unknown method: {method}"}

    return {
        "column": column,
        "method": method,
        "total_values": len(series),
        "outlier_count": len(outliers),
        "outlier_pct": round(len(outliers) / len(series) * 100, 1),
        "outlier_values": sorted(outliers.tolist())[:20],
        "bounds": {"lower": round(lower, 3), "upper": round(upper, 3)},
        "recommendation": (
            "No outliers detected."
            if len(outliers) == 0
            else f"{len(outliers)} outlier(s) found. Consider inspecting these values for data entry errors."
        ),
    }
