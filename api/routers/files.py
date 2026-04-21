"""
Code-mode file routes (v2.0-alpha — in-memory storage).

Everything is keyed on session_id (typically the dataset_id). Files are
the R / Python / SQL / Markdown scripts the user writes in Code mode.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import code_files

router = APIRouter(prefix="/api/session", tags=["files"])


class SaveFileRequest(BaseModel):
    content: str
    language: Optional[str] = None


class EditFileRequest(BaseModel):
    old_string: str
    new_string: str
    replace_all: bool = False


@router.get("/{session_id}/files")
async def list_files(session_id: str) -> dict:
    return {"session_id": session_id, "files": code_files.list_files(session_id)}


@router.get("/{session_id}/files/{path:path}")
async def get_file(session_id: str, path: str) -> dict:
    try:
        data = code_files.get_file(session_id, path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if data is None:
        raise HTTPException(status_code=404, detail="File not found")
    return data


@router.put("/{session_id}/files/{path:path}")
async def save_file(session_id: str, path: str, body: SaveFileRequest) -> dict:
    try:
        return code_files.save_file(session_id, path, body.content, body.language)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{session_id}/files/{path:path}")
async def edit_file(session_id: str, path: str, body: EditFileRequest) -> dict:
    try:
        return code_files.edit_file(
            session_id, path, body.old_string, body.new_string, body.replace_all
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{session_id}/files/{path:path}")
async def delete_file(session_id: str, path: str) -> dict:
    try:
        deleted = code_files.delete_file(session_id, path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"path": path, "deleted": deleted}
