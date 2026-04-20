"""
Persistent R session service — one long-lived R subprocess per project.

Each session is an R process started with `R --vanilla --interactive` and
kept alive across requests. We communicate via stdin/stdout with a simple
line-delimited protocol: we inject marker lines to know where a block of
output starts/ends.

Design notes:
- Sessions are keyed by session_id (typically the dataset_id).
- Sessions auto-expire after 1 hour of inactivity.
- Output is captured as stdout + stderr merged, streamed to the client.
- We use a sentinel string to detect "command complete" — `.SPARX_DONE.<uuid>`.
- The R session has access to its own .GlobalEnv; the user's workflow
  (library calls, data loads, variables) persists across execute calls.

Security:
- Not sandboxed at the OS level in this MVP. Users are running their own
  code against their own data — they have at-their-R-prompt-equivalent
  capability. A future version should use Docker or Firecracker for
  multi-user deployments.
"""

from __future__ import annotations

import asyncio
import os
import re
import shutil
import subprocess
import time
import uuid
from dataclasses import dataclass, field
from typing import AsyncIterator, Dict, Optional

R_BIN = shutil.which("R") or "/usr/local/bin/R"
R_AVAILABLE = os.path.exists(R_BIN)

SESSION_IDLE_TIMEOUT_S = 3600  # 1 hour
SESSION_MAX_LIFETIME_S = 8 * 3600  # 8 hours absolute cap

# Sentinel markers — we inject these into the R session so we can detect
# when a command block has finished. The UUID keeps them collision-safe.
_DONE_PREFIX = ".SPARX_DONE."
_ERR_PREFIX = ".SPARX_ERR."


@dataclass
class _Session:
    session_id: str
    process: subprocess.Popen
    created_at: float = field(default_factory=time.time)
    last_used_at: float = field(default_factory=time.time)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    @property
    def is_alive(self) -> bool:
        return self.process.poll() is None

    @property
    def is_expired(self) -> bool:
        now = time.time()
        if now - self.last_used_at > SESSION_IDLE_TIMEOUT_S:
            return True
        if now - self.created_at > SESSION_MAX_LIFETIME_S:
            return True
        return False


_sessions: Dict[str, _Session] = {}


def _start_r_subprocess() -> subprocess.Popen:
    """Start a fresh R subprocess in interactive mode."""
    if not R_AVAILABLE:
        raise RuntimeError(f"R not found at {R_BIN}. Install R from https://cran.r-project.org.")

    # Interactive but no banner, no saveworkspace prompt, line-buffered
    process = subprocess.Popen(
        [R_BIN, "--vanilla", "--interactive", "--no-readline",
         "--quiet", "--no-save"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,  # merge so one stream
        bufsize=0,  # unbuffered
        text=False,  # binary — we decode ourselves
        env={**os.environ, "R_INTERACTIVE": "TRUE", "TERM": "dumb"},
    )

    # Warm up with some safe defaults — turn off locale warnings, disable
    # options that interfere with subprocess streaming.
    warmup = b"""
options(warn = 1)
options(error = function() NULL)
options(cli.num_colors = 1L)
options(crayon.enabled = FALSE)
cat('.SPARX_SESSION_READY\\n')
"""
    if process.stdin is None:
        raise RuntimeError("Failed to open stdin to R subprocess")
    process.stdin.write(warmup)
    process.stdin.flush()

    return process


def _is_echoed_input_line(line: str) -> bool:
    """Drop lines that are R's own echo of stdin or our internal markers.

    Filters:
    - Empty prompts ('>', '+')
    - Echoed input lines ('> code', '+ continuation')
    - Our own .SPARX_* markers if they leak from a previous call
      (happens when a previous block's done-token isn't fully drained
      before the next block starts)
    """
    stripped = line.rstrip("\n")
    if stripped in {">", "+", ""}:
        return True
    if stripped.startswith("> ") or stripped.startswith("+ "):
        return True
    if stripped.startswith(".SPARX_"):
        return True
    return False


async def _wait_for_line(process: subprocess.Popen, marker: str,
                          timeout_s: float = 5.0) -> str:
    """Read from the R process until a line containing the marker appears.

    Returns everything read up to (but not including) the marker line.
    """
    loop = asyncio.get_running_loop()
    collected: list[bytes] = []
    deadline = time.time() + timeout_s

    while True:
        remaining = deadline - time.time()
        if remaining <= 0:
            break
        try:
            line = await asyncio.wait_for(
                loop.run_in_executor(None, process.stdout.readline),
                timeout=remaining
            )
        except asyncio.TimeoutError:
            break
        if not line:
            break
        text = line.decode("utf-8", errors="replace")
        if marker in text:
            break
        collected.append(line)
    return b"".join(collected).decode("utf-8", errors="replace")


async def get_or_create_session(session_id: str) -> _Session:
    """Return an existing alive session, or start a new one."""
    if session_id in _sessions:
        s = _sessions[session_id]
        if s.is_alive and not s.is_expired:
            s.last_used_at = time.time()
            return s
        # dead or expired — clean up and recreate
        _close_session(session_id)

    if not R_AVAILABLE:
        raise RuntimeError(f"R not available on the server. Set R_BIN or install R.")

    process = _start_r_subprocess()
    s = _Session(session_id=session_id, process=process)
    _sessions[session_id] = s

    # Wait for the session-ready signal
    await _wait_for_line(process, ".SPARX_SESSION_READY", timeout_s=10.0)

    return s


def _close_session(session_id: str) -> None:
    s = _sessions.pop(session_id, None)
    if s is None:
        return
    try:
        if s.is_alive:
            s.process.stdin.write(b"q()\n")
            s.process.stdin.flush()
            s.process.wait(timeout=2)
    except Exception:
        pass
    try:
        s.process.kill()
    except Exception:
        pass


def close_session(session_id: str) -> bool:
    """Public: shut down a session if it exists."""
    existed = session_id in _sessions
    _close_session(session_id)
    return existed


def list_sessions() -> list[dict]:
    """Return metadata about active sessions (for debugging / admin)."""
    out = []
    for sid, s in _sessions.items():
        out.append({
            "session_id": sid,
            "alive": s.is_alive,
            "created_at": s.created_at,
            "last_used_at": s.last_used_at,
            "age_s": time.time() - s.created_at,
            "idle_s": time.time() - s.last_used_at,
        })
    return out


async def cleanup_expired_sessions() -> int:
    """Remove expired sessions. Returns count closed."""
    expired = [sid for sid, s in _sessions.items() if s.is_expired]
    for sid in expired:
        _close_session(sid)
    return len(expired)


async def execute_stream(session_id: str, code: str) -> AsyncIterator[dict]:
    """Execute R code in the session and stream output events.

    Yields dicts:
      {"type": "output", "data": "stdout chunk"}
      {"type": "error",  "data": "error message"}
      {"type": "done",   "duration_ms": N}
    """
    session = await get_or_create_session(session_id)

    async with session.lock:
        session.last_used_at = time.time()
        done_token = f"{_DONE_PREFIX}{uuid.uuid4().hex}"

        # Wrap the user code with: try to eval, always print the done token.
        # We use `cat(...)` so the marker appears in stdout deterministically.
        # If the user's code errors, R prints the error to stderr (merged
        # with stdout) and continues to the cat() line.
        wrapped = (
            "tryCatch({\n"
            + code + "\n"
            + "}, error = function(e) {\n"
            + f'  cat(sprintf("{_ERR_PREFIX}%s\\n", conditionMessage(e)))\n'
            + "})\n"
            + f'cat("{done_token}\\n")\n'
        ).encode("utf-8")

        start_time = time.time()
        if session.process.stdin is None:
            yield {"type": "error", "data": "R process stdin is closed"}
            yield {"type": "done", "duration_ms": 0}
            return

        try:
            session.process.stdin.write(wrapped)
            session.process.stdin.flush()
        except BrokenPipeError:
            yield {"type": "error", "data": "R process has died — restart the session."}
            _close_session(session_id)
            yield {"type": "done", "duration_ms": 0}
            return

        loop = asyncio.get_running_loop()

        while True:
            try:
                line_bytes = await asyncio.wait_for(
                    loop.run_in_executor(None, session.process.stdout.readline),
                    timeout=120.0
                )
            except asyncio.TimeoutError:
                yield {"type": "error", "data": "Execution timed out (>120s)"}
                break

            if not line_bytes:
                yield {"type": "error", "data": "R process closed its output stream"}
                _close_session(session_id)
                break

            line = line_bytes.decode("utf-8", errors="replace")

            if done_token in line:
                break

            if line.startswith(_ERR_PREFIX):
                msg = line[len(_ERR_PREFIX):].rstrip("\n")
                yield {"type": "error", "data": msg}
                continue

            # R echoes what it reads from stdin. Filter those.
            if _is_echoed_input_line(line):
                continue

            yield {"type": "output", "data": line}

        duration_ms = int((time.time() - start_time) * 1000)
        yield {"type": "done", "duration_ms": duration_ms}


async def read_environment(session_id: str) -> list[dict]:
    """Return a summary of every object in the session's .GlobalEnv.

    Each entry: {name, class, shape} where shape is a short human string.
    """
    session = await get_or_create_session(session_id)

    async with session.lock:
        session.last_used_at = time.time()
        done_token = f"{_DONE_PREFIX}{uuid.uuid4().hex}"
        start_token = f".SPARX_ENV_START.{uuid.uuid4().hex}"
        end_token = f".SPARX_ENV_END.{uuid.uuid4().hex}"

        probe = (
            f'cat("{start_token}\\n")\n'
            'local({\n'
            '  objs <- ls(envir = .GlobalEnv)\n'
            '  for (n in objs) {\n'
            '    obj <- tryCatch(get(n, envir = .GlobalEnv), error = function(e) NULL)\n'
            '    if (is.null(obj)) next\n'
            '    cls <- paste(class(obj), collapse = "/")\n'
            '    shape <- tryCatch({\n'
            '      if (is.data.frame(obj)) sprintf("%dx%d df", nrow(obj), ncol(obj))\n'
            '      else if (is.matrix(obj)) sprintf("%dx%d mat", nrow(obj), ncol(obj))\n'
            '      else if (is.list(obj)) sprintf("list[%d]", length(obj))\n'
            '      else if (is.atomic(obj) && length(obj) == 1) sprintf("scalar: %s", format(obj, trim = TRUE))\n'
            '      else if (is.atomic(obj)) sprintf("len %d", length(obj))\n'
            '      else cls\n'
            '    }, error = function(e) "?")\n'
            '    cat(sprintf("%s|||%s|||%s\\n", n, cls, shape))\n'
            '  }\n'
            '})\n'
            f'cat("{end_token}\\n")\n'
            f'cat("{done_token}\\n")\n'
        ).encode("utf-8")

        if session.process.stdin is None:
            return []

        session.process.stdin.write(probe)
        session.process.stdin.flush()

        loop = asyncio.get_running_loop()
        rows: list[dict] = []
        in_block = False

        while True:
            try:
                line_bytes = await asyncio.wait_for(
                    loop.run_in_executor(None, session.process.stdout.readline),
                    timeout=10.0
                )
            except asyncio.TimeoutError:
                break
            if not line_bytes:
                break
            line = line_bytes.decode("utf-8", errors="replace").rstrip("\n")

            if done_token in line:
                break
            if start_token in line:
                in_block = True
                continue
            if end_token in line:
                in_block = False
                continue
            if not in_block:
                continue

            # Skip echoed input lines (R --interactive behavior)
            if _is_echoed_input_line(line + "\n"):
                continue

            # Parse "name|||class|||shape"
            parts = line.split("|||")
            if len(parts) == 3:
                rows.append({"name": parts[0], "class": parts[1], "shape": parts[2]})

        return rows
