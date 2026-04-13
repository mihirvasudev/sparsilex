from fastapi import APIRouter
from pydantic import BaseModel
from services.stats_service import run_analysis
from services.data_service import get_dataset
from services.code_export import generate_code
from services.apa_format import format_apa
from services.diagnostic_plots import generate_plots

router = APIRouter()


class RunRequest(BaseModel):
    dataset_id: str
    test_name: str
    variables: dict
    options: dict = {}


@router.post("/run")
async def run_analysis_endpoint(req: RunRequest):
    df = get_dataset(req.dataset_id)
    result = run_analysis(req.test_name, df, req.variables, req.options)
    result["code"] = generate_code(req.test_name, req.variables, req.options)
    result["apa_text"] = format_apa(req.test_name, result.get("statistics", {}))
    result["plots"] = generate_plots(req.test_name, df, req.variables, result.get("statistics", {}))
    return result
