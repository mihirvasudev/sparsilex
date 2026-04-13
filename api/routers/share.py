"""Shareable project links — generate a share ID, retrieve shared projects."""
import uuid
import json
from fastapi import APIRouter
from pydantic import BaseModel
from services.data_service import get_dataset, get_column_stats, get_preview, _datasets, _filenames

router = APIRouter()

# In-memory share store (would be DB in production)
_shares: dict[str, dict] = {}


class ShareRequest(BaseModel):
    dataset_id: str
    analyses: list[dict] = []
    title: str = "Shared Analysis"


@router.post("/create")
async def create_share(req: ShareRequest):
    """Create a shareable link for a project."""
    df = get_dataset(req.dataset_id)
    share_id = str(uuid.uuid4())[:12]

    _shares[share_id] = {
        "share_id": share_id,
        "title": req.title,
        "dataset_id": req.dataset_id,
        "filename": _filenames.get(req.dataset_id, "data.csv"),
        "rows": len(df),
        "columns": get_column_stats(df),
        "preview": get_preview(req.dataset_id, 0, 100),
        "analyses": req.analyses,
    }

    return {
        "share_id": share_id,
        "share_url": f"/shared/{share_id}",
    }


@router.get("/{share_id}")
async def get_shared_project(share_id: str):
    """Retrieve a shared project by ID."""
    if share_id not in _shares:
        return {"error": "Share not found or expired"}
    return _shares[share_id]
