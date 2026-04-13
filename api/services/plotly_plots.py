"""Generate Plotly.js JSON specs for interactive diagnostic plots."""
import numpy as np
import pandas as pd
from scipy import stats

# SparsileX dark theme for Plotly
LAYOUT_DEFAULTS = {
    "paper_bgcolor": "#0a0a0a",
    "plot_bgcolor": "#111111",
    "font": {"color": "#aaa", "size": 11},
    "margin": {"l": 50, "r": 20, "t": 40, "b": 40},
    "xaxis": {"gridcolor": "#222", "zerolinecolor": "#333"},
    "yaxis": {"gridcolor": "#222", "zerolinecolor": "#333"},
}

COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]


def generate_plotly(test_name: str, df: pd.DataFrame, variables: dict, result_stats: dict) -> list[dict]:
    """Return list of {"title": ..., "plotly": {data, layout}} specs."""
    generators = {
        "independent_ttest": _ttest_plots,
        "welch_ttest": _ttest_plots,
        "one_sample_ttest": _one_sample_plots,
        "paired_ttest": _paired_plots,
        "mann_whitney": _ttest_plots,
        "one_way_anova": _anova_plots,
        "kruskal_wallis": _anova_plots,
        "linear_regression": _regression_plots,
        "pearson_correlation": _correlation_plots,
        "spearman_correlation": _correlation_plots,
    }
    gen = generators.get(test_name)
    if not gen:
        return []
    try:
        return gen(df, variables, result_stats)
    except Exception:
        return []


def _make_layout(title="", xaxis_title="", yaxis_title="", **kwargs):
    layout = {**LAYOUT_DEFAULTS, "title": {"text": title, "font": {"size": 13, "color": "#ccc"}}}
    if xaxis_title:
        layout["xaxis"] = {**LAYOUT_DEFAULTS["xaxis"], "title": xaxis_title}
    if yaxis_title:
        layout["yaxis"] = {**LAYOUT_DEFAULTS["yaxis"], "title": yaxis_title}
    layout.update(kwargs)
    return layout


def _ttest_plots(df, variables, stats_dict):
    dep = variables.get("dependent", "score")
    grp = variables.get("grouping", "group")
    groups = df[grp].dropna().unique()
    plots = []

    # Box plot
    traces = []
    for i, g in enumerate(groups):
        vals = df[df[grp] == g][dep].dropna().tolist()
        traces.append({
            "type": "box",
            "y": vals,
            "name": str(g),
            "marker": {"color": COLORS[i % len(COLORS)]},
            "boxpoints": "outliers",
        })
    plots.append({
        "title": "Group Comparison",
        "plotly": {"data": traces, "layout": _make_layout(f"{dep} by {grp}", yaxis_title=dep)},
    })

    # Overlapping histograms
    traces = []
    for i, g in enumerate(groups):
        vals = df[df[grp] == g][dep].dropna().tolist()
        traces.append({
            "type": "histogram",
            "x": vals,
            "name": str(g),
            "opacity": 0.6,
            "marker": {"color": COLORS[i % len(COLORS)]},
        })
    plots.append({
        "title": "Distribution Comparison",
        "plotly": {"data": traces, "layout": _make_layout(f"Distribution of {dep}", xaxis_title=dep, yaxis_title="Frequency", barmode="overlay")},
    })

    return plots


def _one_sample_plots(df, variables, stats_dict):
    col = variables.get("variable", "score")
    series = df[col].dropna()
    tv = stats_dict.get("test_value", 0)
    m = float(series.mean())

    traces = [
        {"type": "histogram", "x": series.tolist(), "marker": {"color": COLORS[0]}, "opacity": 0.7, "name": col},
    ]
    shapes = [
        {"type": "line", "x0": tv, "x1": tv, "y0": 0, "y1": 1, "yref": "paper", "line": {"color": "#ef4444", "dash": "dash", "width": 2}},
        {"type": "line", "x0": m, "x1": m, "y0": 0, "y1": 1, "yref": "paper", "line": {"color": "#14b8a6", "width": 2}},
    ]
    annotations = [
        {"x": tv, "y": 1, "yref": "paper", "text": f"Test={tv}", "showarrow": False, "font": {"color": "#ef4444", "size": 10}, "yshift": 10},
        {"x": m, "y": 1, "yref": "paper", "text": f"Mean={m:.2f}", "showarrow": False, "font": {"color": "#14b8a6", "size": 10}, "yshift": -10},
    ]
    return [{"title": "Distribution", "plotly": {"data": traces, "layout": {**_make_layout(f"Distribution of {col}", xaxis_title=col, yaxis_title="Frequency"), "shapes": shapes, "annotations": annotations}}}]


def _paired_plots(df, variables, stats_dict):
    v1, v2 = variables.get("variable1", "pre"), variables.get("variable2", "post")
    common = df[[v1, v2]].dropna()

    # Paired lines
    traces = []
    for i in range(min(len(common), 100)):
        traces.append({
            "type": "scatter", "mode": "lines",
            "x": [v1, v2], "y": [float(common.iloc[i][v1]), float(common.iloc[i][v2])],
            "line": {"color": COLORS[0], "width": 0.8}, "opacity": 0.2,
            "showlegend": False,
        })
    # Mean line
    traces.append({
        "type": "scatter", "mode": "lines+markers",
        "x": [v1, v2], "y": [float(common[v1].mean()), float(common[v2].mean())],
        "line": {"color": "#ef4444", "width": 3}, "marker": {"size": 8},
        "name": "Mean",
    })
    return [{"title": "Paired Comparison", "plotly": {"data": traces, "layout": _make_layout("Paired Comparison", yaxis_title="Score")}}]


def _anova_plots(df, variables, stats_dict):
    dep = variables.get("dependent", "score")
    fac = variables.get("factor", "group")
    groups = df[fac].dropna().unique()

    # Violin plot
    traces = []
    for i, g in enumerate(groups):
        vals = df[df[fac] == g][dep].dropna().tolist()
        traces.append({
            "type": "violin",
            "y": vals,
            "name": str(g),
            "box": {"visible": True},
            "meanline": {"visible": True},
            "marker": {"color": COLORS[i % len(COLORS)]},
        })
    return [{"title": "Group Distributions", "plotly": {"data": traces, "layout": _make_layout(f"{dep} by {fac}", yaxis_title=dep)}}]


def _regression_plots(df, variables, stats_dict):
    dep = variables.get("dependent", "y")
    preds = variables.get("predictors", [])
    if isinstance(preds, str):
        preds = [preds]
    plots = []

    if preds:
        pred = preds[0]
        clean = df[[dep, pred]].dropna()
        x, y = clean[pred].values.astype(float), clean[dep].values.astype(float)

        traces = [
            {"type": "scatter", "mode": "markers", "x": x.tolist(), "y": y.tolist(),
             "marker": {"color": COLORS[0], "size": 5, "opacity": 0.6}, "name": "Data"},
        ]
        if len(x) > 1:
            m, b = np.polyfit(x, y, 1)
            x_line = np.linspace(x.min(), x.max(), 100)
            traces.append({
                "type": "scatter", "mode": "lines",
                "x": x_line.tolist(), "y": (m * x_line + b).tolist(),
                "line": {"color": "#ef4444", "width": 2}, "name": "Regression line",
            })
        plots.append({"title": "Scatter + Regression", "plotly": {"data": traces, "layout": _make_layout(f"{dep} vs {pred}", xaxis_title=pred, yaxis_title=dep)}})

    # Residual plot
    coefs = stats_dict.get("coefficients", [])
    if coefs and preds:
        clean = df[[dep] + preds].dropna()
        y = clean[dep].values.astype(float)
        X = clean[preds].values.astype(float)
        X_int = np.column_stack([np.ones(len(X)), X])
        b_vals = [c.get("b", 0) for c in coefs]
        if len(b_vals) == X_int.shape[1]:
            fitted = (X_int @ np.array(b_vals)).tolist()
            residuals = (y - np.array(fitted)).tolist()
            traces = [
                {"type": "scatter", "mode": "markers", "x": fitted, "y": residuals,
                 "marker": {"color": COLORS[0], "size": 5, "opacity": 0.6}, "name": "Residuals"},
            ]
            shapes = [{"type": "line", "x0": min(fitted), "x1": max(fitted), "y0": 0, "y1": 0, "line": {"color": "#ef4444", "dash": "dash"}}]
            plots.append({"title": "Residuals vs Fitted", "plotly": {"data": traces, "layout": {**_make_layout("Residual Plot", xaxis_title="Fitted", yaxis_title="Residuals"), "shapes": shapes}}})

    return plots


def _correlation_plots(df, variables, stats_dict):
    v1, v2 = variables.get("variable1", "x"), variables.get("variable2", "y")
    clean = df[[v1, v2]].dropna()
    x, y = clean[v1].values.astype(float), clean[v2].values.astype(float)

    traces = [
        {"type": "scatter", "mode": "markers", "x": x.tolist(), "y": y.tolist(),
         "marker": {"color": COLORS[0], "size": 5, "opacity": 0.6}, "name": "Data"},
    ]
    if len(x) > 1:
        m, b = np.polyfit(x, y, 1)
        x_line = np.linspace(x.min(), x.max(), 100)
        traces.append({
            "type": "scatter", "mode": "lines",
            "x": x_line.tolist(), "y": (m * x_line + b).tolist(),
            "line": {"color": "#ef4444", "width": 2}, "name": "Trend",
        })
    r_val = stats_dict.get("r", stats_dict.get("rho", 0))
    return [{"title": f"r = {r_val:.3f}", "plotly": {"data": traces, "layout": _make_layout(f"{v1} vs {v2}", xaxis_title=v1, yaxis_title=v2)}}]
