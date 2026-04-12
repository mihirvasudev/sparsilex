from fastapi import APIRouter
from pydantic import BaseModel
from services.stats_service import run_analysis
from services.data_service import get_dataset

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
    return result
