"""Project save/load — .sparx file format (JSON + data)."""
import json
import io
import zipfile
import uuid
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from services.data_service import get_dataset, _datasets, _filenames, get_column_stats, get_preview
import pandas as pd

router = APIRouter()


@router.post("/save")
async def save_project(dataset_id: str, analyses: str = "[]"):
    """Save project as .sparx file (ZIP containing data.csv + project.json)."""
    df = get_dataset(dataset_id)
    analyses_list = json.loads(analyses)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Data
        csv_buf = io.StringIO()
        df.to_csv(csv_buf, index=False)
        zf.writestr("data.csv", csv_buf.getvalue())

        # Project metadata
        project = {
            "version": "0.1.0",
            "filename": _filenames.get(dataset_id, "data.csv"),
            "rows": len(df),
            "columns": get_column_stats(df),
            "analyses": analyses_list,
        }
        zf.writestr("project.json", json.dumps(project, indent=2))

    buf.seek(0)
    filename = _filenames.get(dataset_id, "project").replace(".csv", "") + ".sparx"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/load")
async def load_project(file: UploadFile = File(...)):
    """Load a .sparx project file."""
    content = await file.read()
    buf = io.BytesIO(content)

    with zipfile.ZipFile(buf, "r") as zf:
        csv_data = zf.read("data.csv")
        project_data = json.loads(zf.read("project.json"))

    # Parse the data
    dataset_id = str(uuid.uuid4())[:8]
    df = pd.read_csv(io.BytesIO(csv_data))
    _datasets[dataset_id] = df
    _filenames[dataset_id] = project_data.get("filename", "data.csv")

    return {
        "dataset_id": dataset_id,
        "filename": _filenames[dataset_id],
        "rows": len(df),
        "columns": get_column_stats(df),
        "preview": get_preview(dataset_id, 0, 100),
        "analyses": project_data.get("analyses", []),
    }
