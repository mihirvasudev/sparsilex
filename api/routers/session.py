"""
Session routes — persistent R sessions for code-mode in SparsileX 2.0.

POST /api/session/{session_id}/execute        — run R code, stream output (SSE)
GET  /api/session/{session_id}/environment    — list .GlobalEnv objects
POST /api/session/{session_id}/close          — shut down a session
GET  /api/session                              — list active sessions
"""

import json
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import r_session

router = APIRouter(prefix="/api/session", tags=["session"])


class ExecuteRequest(BaseModel):
    code: str


@router.post("/{session_id}/execute")
async def execute_code(session_id: str, body: ExecuteRequest) -> StreamingResponse:
    """Stream R output as Server-Sent Events.

    Each event is a JSON line prefixed by `data: `:
        data: {"type": "output", "data": "..."}
        data: {"type": "error",  "data": "..."}
        data: {"type": "done",   "duration_ms": 123}
    """
    if not r_session.R_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="R is not available on the server. Install R to enable code mode.",
        )

    async def stream() -> Any:
        try:
            async for event in r_session.execute_stream(session_id, body.code):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f'data: {json.dumps({"type": "error", "data": f"{type(e).__name__}: {e}"})}\n\n'
            yield f'data: {json.dumps({"type": "done", "duration_ms": 0})}\n\n'

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.get("/{session_id}/environment")
async def get_environment(session_id: str) -> dict:
    """Return current .GlobalEnv state as a list of variable summaries."""
    try:
        objs = await r_session.read_environment(session_id)
        return {"session_id": session_id, "objects": objs}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/{session_id}/close")
async def close_session(session_id: str) -> dict:
    closed = r_session.close_session(session_id)
    return {"session_id": session_id, "closed": closed}


@router.get("")
async def list_sessions() -> dict:
    return {"sessions": r_session.list_sessions()}
