"""
Agent tools for code mode.

These all key on the session's dataset_id (= session_id). They let the
agent read/write project files and execute R code in the user's live
session.
"""

from __future__ import annotations

import asyncio
from typing import Any

from services import code_files, r_session


def write_file_tool(dataset_id: str, path: str, content: str,
                    language: str | None = None) -> dict:
    """Create or overwrite a file in the session's project."""
    try:
        result = code_files.save_file(dataset_id, path, content, language)
        n_lines = len(content.splitlines())
        return {
            "path": result["path"],
            "language": result["language"],
            "bytes": result["bytes"],
            "lines": n_lines,
            "message": f"Wrote {n_lines} line{'s' if n_lines != 1 else ''} to {result['path']}.",
        }
    except ValueError as e:
        return {"error": str(e)}


def read_file_tool(dataset_id: str, path: str,
                   line_start: int | None = None,
                   line_end: int | None = None) -> dict:
    """Return the content of a file in the project (with line numbers)."""
    try:
        data = code_files.get_file(dataset_id, path)
    except ValueError as e:
        return {"error": str(e)}
    if data is None:
        return {"error": f"File not found: {path}"}

    lines = data["content"].splitlines()
    total = len(lines)
    s = max(1, line_start or 1)
    e = min(total, line_end or total)
    if s > total:
        return {"error": f"line_start ({s}) exceeds file length ({total})."}

    selected = lines[s - 1:e]
    numbered = "\n".join(f"{i + s:5d}\u2192{line}" for i, line in enumerate(selected))
    return {
        "path": data["path"],
        "language": data["language"],
        "total_lines": total,
        "lines_shown": f"{s}-{e}",
        "content": numbered,
    }


def edit_file_tool(dataset_id: str, path: str, old_string: str,
                   new_string: str, replace_all: bool = False) -> dict:
    """Targeted find-and-replace in a project file."""
    try:
        result = code_files.edit_file(dataset_id, path, old_string, new_string, replace_all)
        # Build a unified-ish diff for the UI
        lines = []
        for l in old_string.split("\n"):
            lines.append(f"- {l}")
        for l in new_string.split("\n"):
            lines.append(f"+ {l}")
        diff = "\n".join(lines)
        return {
            "path": result["path"],
            "replaced": result["replaced"],
            "bytes": result["bytes"],
            "diff": diff,
            "message": f"Edited {result['path']} ({result['replaced']} replacement{'s' if result['replaced'] != 1 else ''}).",
        }
    except FileNotFoundError as e:
        return {"error": str(e)}
    except ValueError as e:
        return {"error": str(e)}


def list_files_tool(dataset_id: str) -> dict:
    """List all files in the session's project."""
    files = code_files.list_files(dataset_id)
    if not files:
        return {"count": 0, "files": [], "message": "No files in the project yet."}
    return {
        "count": len(files),
        "files": files,
        "message": f"{len(files)} file{'s' if len(files) != 1 else ''} in project: " +
                   ", ".join(f["path"] for f in files[:10]),
    }


def run_in_session_tool(dataset_id: str, code: str) -> dict:
    """Execute R code in the live session. Blocks until done. Returns
    aggregated stdout, any error message, and a plot if one was captured."""
    try:
        asyncio.get_running_loop()
        # Already in an event loop (agent is async) — use a task
        async def _run():
            return await _collect_session_run(dataset_id, code)
        # We can't block in an already-running loop, so run synchronously instead
        # by using a fresh loop in a thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(asyncio.run, _collect_session_run(dataset_id, code))
            return future.result(timeout=150)
    except RuntimeError:
        # No event loop — safe to run directly
        return asyncio.run(_collect_session_run(dataset_id, code))
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}


async def _collect_session_run(dataset_id: str, code: str) -> dict:
    """Collect events from execute_stream into a single tool result."""
    output_chunks: list[str] = []
    errors: list[str] = []
    plot_data: str | None = None
    duration_ms = 0

    try:
        async for event in r_session.execute_stream(dataset_id, code):
            etype = event.get("type")
            if etype == "output":
                output_chunks.append(event.get("data", ""))
            elif etype == "error":
                errors.append(event.get("data", ""))
            elif etype == "plot" and plot_data is None:
                plot_data = event.get("data")
            elif etype == "done":
                duration_ms = event.get("duration_ms", 0)
    except Exception as e:
        errors.append(f"{type(e).__name__}: {e}")

    result: dict[str, Any] = {
        "duration_ms": duration_ms,
        "output": "".join(output_chunks).rstrip("\n") or "(no output)",
    }
    if errors:
        result["error"] = "\n".join(errors)
    if plot_data:
        result["plot"] = {"format": "png", "data": plot_data}
    return result


def read_session_state_tool(dataset_id: str) -> dict:
    """Return a snapshot of the user's live R .GlobalEnv."""
    try:
        try:
            asyncio.get_running_loop()
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                future = ex.submit(asyncio.run, r_session.read_environment(dataset_id))
                objects = future.result(timeout=30)
        except RuntimeError:
            objects = asyncio.run(r_session.read_environment(dataset_id))

        if not objects:
            return {"count": 0, "objects": [], "message": "The session .GlobalEnv is empty."}
        return {
            "count": len(objects),
            "objects": objects,
            "message": f"{len(objects)} object{'s' if len(objects) != 1 else ''}: " +
                       ", ".join(o["name"] for o in objects[:10]),
        }
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}
