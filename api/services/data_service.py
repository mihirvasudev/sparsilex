import uuid
import io
import pandas as pd
import numpy as np

_datasets: dict[str, pd.DataFrame] = {}
_filenames: dict[str, str] = {}


def parse_csv(content: bytes, filename: str) -> tuple[str, pd.DataFrame]:
    dataset_id = str(uuid.uuid4())[:8]
    df = pd.read_csv(io.BytesIO(content))
    _datasets[dataset_id] = df
    _filenames[dataset_id] = filename
    return dataset_id, df


def get_dataset(dataset_id: str) -> pd.DataFrame:
    if dataset_id not in _datasets:
        raise ValueError(f"Dataset {dataset_id} not found")
    return _datasets[dataset_id]


def get_column_stats(df: pd.DataFrame) -> list[dict]:
    columns = []
    for col in df.columns:
        series = df[col]
        info: dict = {
            "name": col,
            "dtype": str(series.dtype),
            "missing_count": int(series.isna().sum()),
            "missing_pct": round(float(series.isna().mean() * 100), 1),
        }

        if series.dtype.kind in "iufb":
            info["inferred_type"] = "numeric"
            clean = series.dropna()
            info["mean"] = round(float(clean.mean()), 3)
            info["median"] = round(float(clean.median()), 3)
            info["std"] = round(float(clean.std()), 3)
            info["min"] = round(float(clean.min()), 3)
            info["max"] = round(float(clean.max()), 3)
            info["unique_values"] = int(clean.nunique())
        else:
            unique = int(series.nunique())
            info["unique_values"] = unique
            info["sample_values"] = series.dropna().unique()[:10].tolist()
            if unique <= 20:
                info["inferred_type"] = "categorical"
            else:
                info["inferred_type"] = "text"

        columns.append(info)
    return columns


def get_preview(dataset_id: str, offset: int = 0, limit: int = 100) -> list[dict]:
    df = get_dataset(dataset_id)
    chunk = df.iloc[offset : offset + limit]
    return chunk.replace({np.nan: None}).to_dict(orient="records")


def get_dataset_schema(dataset_id: str) -> dict:
    """Get a compact schema for the AI agent."""
    df = get_dataset(dataset_id)
    return {
        "dataset_id": dataset_id,
        "filename": _filenames.get(dataset_id, "unknown"),
        "rows": len(df),
        "columns": get_column_stats(df),
    }
