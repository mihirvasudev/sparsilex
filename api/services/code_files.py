"""
In-memory file storage for code-mode scripts, keyed by session_id.

Design: one bucket of text files per session. Files are addressed by path
(a simple string like "analysis.R" — we don't support nested dirs yet, but
future-proof by allowing "/"-separated paths).

Persistence: in-memory only for v2.0-alpha. To persist across server
restarts, users should save to the `.sparx` project ZIP (the project
router now includes these files in its bundle).
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional


MAX_FILE_BYTES = 200_000          # 200 KB per file
MAX_FILES_PER_SESSION = 200       # generous
VALID_PATH = re.compile(r"^[A-Za-z0-9_.\-/ ]+$")


@dataclass
class _CodeFile:
    path: str
    content: str
    language: str
    updated_at: float = field(default_factory=time.time)


@dataclass
class _FileBucket:
    files: Dict[str, _CodeFile] = field(default_factory=dict)
    lock: threading.Lock = field(default_factory=threading.Lock)


# { session_id -> bucket }
_buckets: Dict[str, _FileBucket] = {}
_buckets_lock = threading.Lock()


def _bucket(session_id: str) -> _FileBucket:
    with _buckets_lock:
        if session_id not in _buckets:
            _buckets[session_id] = _FileBucket()
        return _buckets[session_id]


def _infer_language(path: str) -> str:
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return {
        "r":        "r",
        "py":       "python",
        "sql":      "sql",
        "md":       "markdown",
        "rmd":      "markdown",
        "qmd":      "markdown",
    }.get(ext, "r")


def _validate_path(path: str) -> None:
    if not path or len(path) > 255:
        raise ValueError("File path is empty or too long.")
    if ".." in path or path.startswith("/"):
        raise ValueError("Path must be relative; '..' is not allowed.")
    if not VALID_PATH.match(path):
        raise ValueError("Path contains invalid characters.")


def list_files(session_id: str) -> List[dict]:
    """Return metadata for every file in the session (not the content)."""
    bucket = _bucket(session_id)
    with bucket.lock:
        return [
            {
                "path": f.path,
                "language": f.language,
                "bytes": len(f.content.encode("utf-8")),
                "updated_at": f.updated_at,
            }
            for f in bucket.files.values()
        ]


def get_file(session_id: str, path: str) -> Optional[dict]:
    _validate_path(path)
    bucket = _bucket(session_id)
    with bucket.lock:
        f = bucket.files.get(path)
        if f is None:
            return None
        return {
            "path": f.path,
            "language": f.language,
            "content": f.content,
            "updated_at": f.updated_at,
        }


def save_file(session_id: str, path: str, content: str,
              language: Optional[str] = None) -> dict:
    _validate_path(path)
    if content is None:
        content = ""
    content_bytes = len(content.encode("utf-8"))
    if content_bytes > MAX_FILE_BYTES:
        raise ValueError(f"File too large ({content_bytes} bytes, max {MAX_FILE_BYTES}).")

    bucket = _bucket(session_id)
    with bucket.lock:
        if path not in bucket.files and len(bucket.files) >= MAX_FILES_PER_SESSION:
            raise ValueError(f"Too many files in session (max {MAX_FILES_PER_SESSION}).")
        f = _CodeFile(
            path=path,
            content=content,
            language=language or _infer_language(path),
        )
        bucket.files[path] = f
        return {
            "path": f.path,
            "language": f.language,
            "bytes": content_bytes,
            "updated_at": f.updated_at,
        }


def delete_file(session_id: str, path: str) -> bool:
    _validate_path(path)
    bucket = _bucket(session_id)
    with bucket.lock:
        if path in bucket.files:
            del bucket.files[path]
            return True
        return False


def edit_file(session_id: str, path: str, old_string: str,
              new_string: str, replace_all: bool = False) -> dict:
    """Find-and-replace within a file. Raises ValueError on ambiguity / miss."""
    _validate_path(path)
    bucket = _bucket(session_id)
    with bucket.lock:
        if path not in bucket.files:
            raise FileNotFoundError(f"File not found: {path}")
        f = bucket.files[path]

        count = f.content.count(old_string)
        if count == 0:
            raise ValueError(
                "old_string not found in the file. Match must be exact (whitespace + newlines)."
            )
        if count > 1 and not replace_all:
            raise ValueError(
                f"old_string matches {count} times. Include more context to make it unique, "
                "or set replace_all=True."
            )

        if replace_all:
            new_content = f.content.replace(old_string, new_string)
            replaced = count
        else:
            new_content = f.content.replace(old_string, new_string, 1)
            replaced = 1

        f.content = new_content
        f.updated_at = time.time()

        return {
            "path": f.path,
            "replaced": replaced,
            "bytes": len(new_content.encode("utf-8")),
        }


def clear_session(session_id: str) -> int:
    """Drop all files for a session; returns count."""
    bucket = _bucket(session_id)
    with bucket.lock:
        count = len(bucket.files)
        bucket.files.clear()
        return count


def export_as_dict(session_id: str) -> Dict[str, str]:
    """Return {path: content} — used by the project-save bundler."""
    bucket = _bucket(session_id)
    with bucket.lock:
        return {f.path: f.content for f in bucket.files.values()}


def import_from_dict(session_id: str, files: Dict[str, str]) -> int:
    """Bulk-import files (e.g. when loading a .sparx project)."""
    n = 0
    for path, content in files.items():
        try:
            save_file(session_id, path, content)
            n += 1
        except (ValueError, FileNotFoundError):
            continue
    return n
