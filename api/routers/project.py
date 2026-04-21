"""Project save/load — .sparx file format.

A .sparx file is a ZIP archive containing:
  data.csv         — the loaded dataset
  project.json     — metadata + analyses results
  files/<path>     — every code-mode R / py / sql / md script (v2.0+)

Backward-compatible: older .sparx files (no files/) load fine and result
in an empty Code-mode project.
"""
import io
import json
import uuid
import zipfile

import pandas as pd
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse

from services import code_files
from services.data_service import (
    _datasets, _filenames, get_column_stats, get_dataset, get_preview,
)

router = APIRouter()


@router.post("/save")
async def save_project(dataset_id: str, analyses: str = "[]"):
    """Save project as .sparx file.

    Bundle:
      data.csv
      project.json (version, filename, rows, columns, analyses)
      files/<path>  — every code-mode file in the session
    """
    df = get_dataset(dataset_id)
    analyses_list = json.loads(analyses)
    code_file_map = code_files.export_as_dict(dataset_id)  # {path: content}

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Data
        csv_buf = io.StringIO()
        df.to_csv(csv_buf, index=False)
        zf.writestr("data.csv", csv_buf.getvalue())

        # Project metadata (version bumped — we now include files/)
        project = {
            "version": "0.2.0",
            "filename": _filenames.get(dataset_id, "data.csv"),
            "rows": len(df),
            "columns": get_column_stats(df),
            "analyses": analyses_list,
            "code_files": sorted(code_file_map.keys()),  # manifest
        }
        zf.writestr("project.json", json.dumps(project, indent=2))

        # Code-mode scripts
        for path, content in code_file_map.items():
            # ZIP paths use forward slashes; prefix under files/
            arcname = f"files/{path}"
            zf.writestr(arcname, content)

    buf.seek(0)
    filename = _filenames.get(dataset_id, "project").replace(".csv", "") + ".sparx"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/load")
async def load_project(file: UploadFile = File(...)):
    """Load a .sparx project file.

    Restores data + analyses + code-mode scripts. For older .sparx files
    without a files/ section, code-mode starts empty (the CodeWorkspace
    will seed a starter file on first open).
    """
    content = await file.read()
    buf = io.BytesIO(content)

    code_files_restored: dict[str, str] = {}

    with zipfile.ZipFile(buf, "r") as zf:
        csv_data = zf.read("data.csv")
        project_data = json.loads(zf.read("project.json"))

        # Pull any files/<path> entries
        for info in zf.infolist():
            if info.is_dir():
                continue
            if info.filename.startswith("files/"):
                rel = info.filename[len("files/"):]
                if rel:
                    try:
                        code_files_restored[rel] = zf.read(info).decode("utf-8")
                    except Exception:
                        continue

    # Parse the data
    dataset_id = str(uuid.uuid4())[:8]
    df = pd.read_csv(io.BytesIO(csv_data))
    _datasets[dataset_id] = df
    _filenames[dataset_id] = project_data.get("filename", "data.csv")

    # Restore code files into the new session
    imported = 0
    if code_files_restored:
        imported = code_files.import_from_dict(dataset_id, code_files_restored)

    return {
        "dataset_id": dataset_id,
        "filename": _filenames[dataset_id],
        "rows": len(df),
        "columns": get_column_stats(df),
        "preview": get_preview(dataset_id, 0, 100),
        "analyses": project_data.get("analyses", []),
        "code_files_imported": imported,
    }
