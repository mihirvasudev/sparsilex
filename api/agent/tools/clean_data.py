import pandas as pd
from services.data_service import get_dataset, _datasets


def clean_data(
    dataset_id: str,
    action: str,
    column: str | None = None,
    target_type: str | None = None,
) -> dict:
    df = get_dataset(dataset_id)
    rows_before = len(df)

    if action == "drop_missing":
        if column:
            df = df.dropna(subset=[column])
        else:
            df = df.dropna()
        rows_after = len(df)
        _datasets[dataset_id] = df
        return {
            "action": "drop_missing",
            "column": column or "all",
            "rows_before": rows_before,
            "rows_after": rows_after,
            "rows_removed": rows_before - rows_after,
        }

    elif action == "impute_mean":
        if not column:
            return {"error": "Column required for imputation"}
        missing_before = int(df[column].isna().sum())
        df[column] = df[column].fillna(df[column].mean())
        _datasets[dataset_id] = df
        return {
            "action": "impute_mean",
            "column": column,
            "values_imputed": missing_before,
            "imputed_value": round(float(df[column].mean()), 3),
        }

    elif action == "impute_median":
        if not column:
            return {"error": "Column required for imputation"}
        missing_before = int(df[column].isna().sum())
        df[column] = df[column].fillna(df[column].median())
        _datasets[dataset_id] = df
        return {
            "action": "impute_median",
            "column": column,
            "values_imputed": missing_before,
            "imputed_value": round(float(df[column].median()), 3),
        }

    elif action == "drop_duplicates":
        df = df.drop_duplicates()
        rows_after = len(df)
        _datasets[dataset_id] = df
        return {
            "action": "drop_duplicates",
            "rows_before": rows_before,
            "rows_after": rows_after,
            "rows_removed": rows_before - rows_after,
        }

    elif action == "convert_type":
        if not column or not target_type:
            return {"error": "Column and target_type required for type conversion"}
        if target_type == "numeric":
            df[column] = pd.to_numeric(df[column], errors="coerce")
        elif target_type == "categorical":
            df[column] = df[column].astype(str)
        _datasets[dataset_id] = df
        return {
            "action": "convert_type",
            "column": column,
            "new_type": target_type,
        }

    return {"error": f"Unknown action: {action}"}
