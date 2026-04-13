"""R compute bridge — execute R code via rpy2 and convert results to Python."""
import json
import pandas as pd

_R_AVAILABLE = False

try:
    import rpy2.robjects as ro
    from rpy2.robjects import pandas2ri, conversion, default_converter
    from rpy2.robjects.packages import importr

    # Activate pandas conversion
    pandas2ri.activate()
    _R_AVAILABLE = True
except ImportError:
    pass


def is_r_available() -> bool:
    return _R_AVAILABLE


def _convert_r_to_python(obj) -> object:
    """Recursively convert R objects to Python dicts/lists/values."""
    if not _R_AVAILABLE:
        return None

    # NULL
    if obj == ro.NULL or obj is None:
        return None

    # Named list (most common R result type)
    if hasattr(obj, "names") and obj.names != ro.NULL:
        names = list(obj.names)
        if names and names[0] is not None:
            result = {}
            for i, name in enumerate(names):
                try:
                    val = obj[i]
                    result[str(name)] = _convert_r_to_python(val)
                except Exception:
                    result[str(name)] = None
            return result

    # Vector types
    if hasattr(obj, "__len__") and not isinstance(obj, str):
        try:
            vals = list(obj)
            if len(vals) == 1:
                v = vals[0]
                if isinstance(v, (int, float)):
                    return round(float(v), 6) if isinstance(v, float) else v
                return str(v) if v is not None else None
            return [round(float(v), 6) if isinstance(v, float) else v for v in vals]
        except Exception:
            pass

    # Scalar
    try:
        return float(obj)
    except (TypeError, ValueError):
        pass

    return str(obj)


def run_r(code: str, df: pd.DataFrame | None = None) -> dict:
    """Execute R code with an optional dataframe. Returns parsed result dict."""
    if not _R_AVAILABLE:
        return {"error": "R is not available. Install R and rpy2."}

    try:
        if df is not None:
            with conversion.localconverter(default_converter + pandas2ri.converter):
                ro.globalenv["df"] = pandas2ri.py2rpy(df)

        result = ro.r(code)
        return {"result": _convert_r_to_python(result)}
    except Exception as e:
        return {"error": f"R error: {str(e)}"}


def run_r_analysis(r_code: str, df: pd.DataFrame, parse_code: str | None = None) -> dict:
    """Run an R analysis and optionally parse the result with additional R code.

    Args:
        r_code: Main analysis R code (result stored in `result`)
        df: Data as pandas DataFrame
        parse_code: Optional R code to extract values from `result` into a named list
    """
    if not _R_AVAILABLE:
        return {"error": "R is not available. Install R and rpy2."}

    try:
        with conversion.localconverter(default_converter + pandas2ri.converter):
            ro.globalenv["df"] = pandas2ri.py2rpy(df)

        # Run the analysis
        ro.r(f"result <- {r_code}")

        # Parse results
        if parse_code:
            parsed = ro.r(parse_code)
            return _convert_r_to_python(parsed)
        else:
            result = ro.r("result")
            return _convert_r_to_python(result)

    except Exception as e:
        return {"error": f"R error: {str(e)}"}


def ensure_r_packages(packages: list[str]) -> dict[str, bool]:
    """Check which R packages are installed."""
    if not _R_AVAILABLE:
        return {p: False for p in packages}

    status = {}
    for pkg in packages:
        try:
            importr(pkg)
            status[pkg] = True
        except Exception:
            status[pkg] = False
    return status
