from services.data_service import get_dataset, get_column_stats


def inspect_data(dataset_id: str, columns: list[str] | None = None) -> dict:
    df = get_dataset(dataset_id)
    stats = get_column_stats(df)

    if columns:
        stats = [s for s in stats if s["name"] in columns]

    return {
        "rows": len(df),
        "total_columns": len(df.columns),
        "columns_inspected": len(stats),
        "duplicate_rows": int(df.duplicated().sum()),
        "columns": stats,
    }
