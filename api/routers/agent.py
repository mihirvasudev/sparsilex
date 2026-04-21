from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from agent.agent import run_agent

router = APIRouter()


class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: str | None = None
    mode: Literal["menu", "code"] | None = None


@router.post("/chat")
async def agent_chat(req: ChatRequest):
    return EventSourceResponse(
        run_agent(req.dataset_id, req.message, req.conversation_id, req.mode)
    )
