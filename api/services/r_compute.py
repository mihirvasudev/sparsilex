"""R compute bridge — execute R code via subprocess Rscript.

Uses CSV for data transfer and JSON for result transfer.
No rpy2 required — works with any R version.
"""
import json
import subprocess
import tempfile
import os
import shutil
import pandas as pd
from pathlib import Path

# Check if Rscript is available
_R_PATH = shutil.which("Rscript") or "/usr/local/bin/Rscript"
_R_AVAILABLE = os.path.exists(_R_PATH)


def is_r_available() -> bool:
    return _R_AVAILABLE


def ensure_r_packages(packages: list[str]) -> dict[str, bool]:
    """Check which R packages are installed."""
    if not _R_AVAILABLE:
        return {p: False for p in packages}
    code = f"""
pkgs <- c({", ".join(f'"{p}"' for p in packages)})
status <- sapply(pkgs, function(p) p %in% rownames(installed.packages()))
cat(jsonlite::toJSON(as.list(status)))
"""
    try:
        result = subprocess.run(
            [_R_PATH, "--vanilla", "-e", code],
            capture_output=True, text=True, timeout=30
        )
        data = json.loads(result.stdout.strip())
        return {p: bool(data.get(p, [False])[0] if isinstance(data.get(p), list) else data.get(p, False))
                for p in packages}
    except Exception:
        return {p: False for p in packages}


def run_r_analysis(r_code: str, df: pd.DataFrame, result_code: str | None = None, libraries: list[str] | None = None) -> dict:
    """Run R analysis on a DataFrame.

    Args:
        r_code: R expression to evaluate (result stored in `result`)
        df: Input data as pandas DataFrame
        result_code: R code to extract/transform `result` into a named list
                     (should produce output readable by jsonlite::toJSON)
    Returns:
        dict with analysis results or {"error": "..."}
    """
    if not _R_AVAILABLE:
        return {"error": f"R not found at {_R_PATH}. Install R from https://cran.r-project.org"}

    with tempfile.TemporaryDirectory() as tmpdir:
        data_path = os.path.join(tmpdir, "data.csv")
        out_path = os.path.join(tmpdir, "result.json")

        # Write DataFrame to CSV
        df.to_csv(data_path, index=False)

        # Build R script
        extract = result_code or "result"
        lib_lines = "\n".join(f'library({lib})' for lib in (libraries or []))
        script = f"""
library(jsonlite)
{lib_lines}
df <- read.csv("{data_path}", stringsAsFactors = TRUE)
tryCatch({{
  result <- {r_code}
  output <- {extract}
  write(toJSON(output, auto_unbox = TRUE, digits = 6, na = "null"), "{out_path}")
}}, error = function(e) {{
  write(toJSON(list(error = conditionMessage(e)), auto_unbox = TRUE), "{out_path}")
}})
"""
        script_path = os.path.join(tmpdir, "analysis.R")
        Path(script_path).write_text(script)

        try:
            proc = subprocess.run(
                [_R_PATH, "--vanilla", script_path],
                capture_output=True, text=True, timeout=120
            )
            if not os.path.exists(out_path):
                stderr = proc.stderr.strip()
                return {"error": f"R produced no output. stderr: {stderr[:500]}"}

            with open(out_path) as f:
                data = json.load(f)

            # Unwrap single-element arrays (jsonlite wraps scalars)
            return _unwrap(data)

        except subprocess.TimeoutExpired:
            return {"error": "R analysis timed out (>120s)"}
        except json.JSONDecodeError as e:
            return {"error": f"R output was not valid JSON: {e}"}
        except Exception as e:
            return {"error": f"R bridge error: {str(e)}"}


def run_r(code: str, df: pd.DataFrame | None = None) -> dict:
    """Simple R execution — wraps run_r_analysis."""
    if df is None:
        df = pd.DataFrame()
    return {"result": run_r_analysis(code, df)}


def _unwrap(obj):
    """Recursively unwrap single-element lists from jsonlite auto_unbox output."""
    if isinstance(obj, dict):
        return {k: _unwrap(v) for k, v in obj.items()}
    if isinstance(obj, list):
        if len(obj) == 1:
            return _unwrap(obj[0])
        return [_unwrap(v) for v in obj]
    return obj
