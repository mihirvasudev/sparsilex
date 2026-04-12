from fastapi import APIRouter, UploadFile, File
from services.data_service import parse_csv, get_column_stats, get_preview, get_dataset

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
