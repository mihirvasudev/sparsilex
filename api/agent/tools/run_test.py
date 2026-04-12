from services.data_service import get_dataset
from services.stats_service import run_analysis


def run_test_tool(
    dataset_id: str, test_name: str, variables: dict, options: dict | None = None
) -> dict:
    df = get_dataset(dataset_id)
    return run_analysis(test_name, df, variables, options or {})
