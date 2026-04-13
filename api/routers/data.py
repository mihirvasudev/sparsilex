from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from services.data_service import parse_csv, get_column_stats, get_preview, get_dataset, _datasets, _labels, _type_overrides
import pandas as pd
import numpy as np

router = APIRouter()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    content = await file.read()
    dataset_id, df = parse_csv(content, file.filename or "data.csv")
    columns = get_column_stats(df)
    preview = get_preview(dataset_id, offset=0, limit=100)
    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": columns,
        "preview": preview,
    }


@router.get("/{dataset_id}/preview")
async def preview_dataset(dataset_id: str, offset: int = 0, limit: int = 100):
    df = get_dataset(dataset_id)
    preview = get_preview(dataset_id, offset=offset, limit=limit)
    return {
        "dataset_id": dataset_id,
        "rows": preview,
        "total_rows": len(df),
        "offset": offset,
        "limit": limit,
    }


# ── Data Cleaning Endpoints ──────────────────────────────────────────────────

class FilterRequest(BaseModel):
    dataset_id: str
    column: str
    operator: str  # "equals", "not_equals", "greater_than", "less_than", "contains", "is_missing", "not_missing"
    value: str | float | None = None


class RecodeRequest(BaseModel):
    dataset_id: str
    column: str
    mapping: dict  # {"old_value": "new_value", ...}
    new_column: str | None = None  # if None, recode in place


class ComputeRequest(BaseModel):
    dataset_id: str
    new_column: str
    expression: str  # e.g., "post_score - pre_score"


class DropMissingRequest(BaseModel):
    dataset_id: str
    columns: list[str] | None = None  # None = all columns


class ImputeRequest(BaseModel):
    dataset_id: str
    column: str
    strategy: str  # "mean", "median", "mode"


def _refresh_response(dataset_id: str, action: str, detail: str) -> dict:
    df = get_dataset(dataset_id)
    return {
        "dataset_id": dataset_id,
        "action": action,
        "detail": detail,
        "rows": len(df),
        "columns": get_column_stats(df),
        "preview": get_preview(dataset_id, 0, 100),
    }


@router.post("/filter")
async def filter_data(req: FilterRequest):
    df = get_dataset(req.dataset_id)
    col = df[req.column]
    before = len(df)

    if req.operator == "equals":
        mask = col == req.value
    elif req.operator == "not_equals":
        mask = col != req.value
    elif req.operator == "greater_than":
        mask = pd.to_numeric(col, errors="coerce") > float(req.value)
    elif req.operator == "less_than":
        mask = pd.to_numeric(col, errors="coerce") < float(req.value)
    elif req.operator == "contains":
        mask = col.astype(str).str.contains(str(req.value), case=False, na=False)
    elif req.operator == "is_missing":
        mask = col.isna()
    elif req.operator == "not_missing":
        mask = col.notna()
    else:
        mask = pd.Series(True, index=df.index)

    _datasets[req.dataset_id] = df[mask].reset_index(drop=True)
    after = len(_datasets[req.dataset_id])
    return _refresh_response(req.dataset_id, "filter", f"Filtered {req.column}: {before} → {after} rows")


@router.post("/recode")
async def recode_data(req: RecodeRequest):
    df = get_dataset(req.dataset_id)
    target = req.new_column or req.column
    df[target] = df[req.column].replace(req.mapping)
    _datasets[req.dataset_id] = df
    return _refresh_response(req.dataset_id, "recode", f"Recoded {req.column} → {target}")


@router.post("/compute")
async def compute_column(req: ComputeRequest):
    df = get_dataset(req.dataset_id)
    # Safe eval: only allow column references and basic math
    try:
        result = df.eval(req.expression)
        df[req.new_column] = result
        _datasets[req.dataset_id] = df
        return _refresh_response(req.dataset_id, "compute", f"Created {req.new_column} = {req.expression}")
    except Exception as e:
        return {"error": str(e)}


@router.post("/drop-missing")
async def drop_missing(req: DropMissingRequest):
    df = get_dataset(req.dataset_id)
    before = len(df)
    if req.columns:
        df = df.dropna(subset=req.columns)
    else:
        df = df.dropna()
    _datasets[req.dataset_id] = df.reset_index(drop=True)
    after = len(_datasets[req.dataset_id])
    return _refresh_response(req.dataset_id, "drop_missing", f"Dropped missing: {before} → {after} rows")


@router.post("/impute")
async def impute_data(req: ImputeRequest):
    df = get_dataset(req.dataset_id)
    col = df[req.column]
    missing = int(col.isna().sum())

    if req.strategy == "mean":
        df[req.column] = col.fillna(col.mean())
    elif req.strategy == "median":
        df[req.column] = col.fillna(col.median())
    elif req.strategy == "mode":
        df[req.column] = col.fillna(col.mode().iloc[0] if not col.mode().empty else col)
    else:
        return {"error": f"Unknown strategy: {req.strategy}"}

    _datasets[req.dataset_id] = df
    return _refresh_response(req.dataset_id, "impute", f"Imputed {missing} missing values in {req.column} ({req.strategy})")


# ── Variable Labels & Type Overrides ─────────────────────────────────────────

class SetLabelRequest(BaseModel):
    dataset_id: str
    column: str
    label: str


class SetTypeRequest(BaseModel):
    dataset_id: str
    column: str
    column_type: str  # "numeric", "categorical", "ordinal"


@router.post("/set-label")
async def set_label(req: SetLabelRequest):
    get_dataset(req.dataset_id)  # validate exists
    if req.dataset_id not in _labels:
        _labels[req.dataset_id] = {}
    _labels[req.dataset_id][req.column] = req.label
    return {"column": req.column, "label": req.label}


@router.post("/set-type")
async def set_type(req: SetTypeRequest):
    df = get_dataset(req.dataset_id)
    if req.column not in df.columns:
        return {"error": f"Column {req.column} not found"}

    if req.dataset_id not in _type_overrides:
        _type_overrides[req.dataset_id] = {}
    _type_overrides[req.dataset_id][req.column] = req.column_type

    # Actually convert the column
    if req.column_type == "numeric":
        df[req.column] = pd.to_numeric(df[req.column], errors="coerce")
    elif req.column_type in ("categorical", "ordinal"):
        df[req.column] = df[req.column].astype(str)
    _datasets[req.dataset_id] = df

    return _refresh_response(req.dataset_id, "set_type", f"Set {req.column} to {req.column_type}")


@router.get("/{dataset_id}/labels")
async def get_labels(dataset_id: str):
    get_dataset(dataset_id)  # validate
    return _labels.get(dataset_id, {})
