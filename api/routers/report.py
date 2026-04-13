from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from services.report_export import generate_html_report

router = APIRouter()


class ReportRequest(BaseModel):
    results: list[dict]
    title: str = "SparsileX Report"


@router.post("/html")
async def export_html_report(req: ReportRequest):
    html = generate_html_report(req.results, req.title)
    return HTMLResponse(content=html)
