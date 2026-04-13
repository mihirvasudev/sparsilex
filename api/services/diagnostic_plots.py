"""Auto-generate diagnostic plots for analysis results."""
import base64
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import stats

plt.rcParams.update({
    "figure.facecolor": "#0a0a0a",
    "axes.facecolor": "#111111",
    "axes.edgecolor": "#333",
    "axes.labelcolor": "#aaa",
    "text.color": "#aaa",
    "xtick.color": "#888",
    "ytick.color": "#888",
    "grid.color": "#222",
    "font.size": 10,
})

COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"]


def _to_b64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def generate_plots(test_name: str, df: pd.DataFrame, variables: dict, result_stats: dict) -> list[dict]:
    """Return list of {"title": ..., "image_base64": ...} plots."""
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


def _ttest_plots(df, variables, stats_dict):
    dep = variables.get("dependent", "score")
    grp = variables.get("grouping", "group")
    plots = []

    # Boxplot
    fig, ax = plt.subplots(figsize=(5, 3.5))
    groups = df[grp].dropna().unique()
    data = [df[df[grp] == g][dep].dropna().values for g in groups]
    bp = ax.boxplot(data, labels=[str(g) for g in groups], patch_artist=True, widths=0.5)
    for patch, color in zip(bp["boxes"], COLORS):
        patch.set_facecolor(color)
        patch.set_alpha(0.6)
    for element in ["whiskers", "caps", "medians"]:
        for line in bp[element]:
            line.set_color("#888")
    ax.set_ylabel(dep)
    ax.set_title(f"{dep} by {grp}", fontsize=11)
    plots.append({"title": "Group Comparison", "image_base64": _to_b64(fig)})

    return plots


def _one_sample_plots(df, variables, stats_dict):
    col = variables.get("variable", "score")
    series = df[col].dropna()
    plots = []

    fig, ax = plt.subplots(figsize=(5, 3.5))
    ax.hist(series, bins=20, color=COLORS[0], alpha=0.7, edgecolor="#0a0a0a")
    tv = stats_dict.get("test_value", 0)
    ax.axvline(tv, color="#ef4444", linestyle="--", linewidth=1.5, label=f"Test value = {tv}")
    ax.axvline(series.mean(), color="#14b8a6", linestyle="-", linewidth=1.5, label=f"Mean = {series.mean():.2f}")
    ax.legend(fontsize=8)
    ax.set_xlabel(col)
    ax.set_title(f"Distribution of {col}", fontsize=11)
    plots.append({"title": "Distribution", "image_base64": _to_b64(fig)})

    return plots


def _paired_plots(df, variables, stats_dict):
    v1, v2 = variables.get("variable1", "pre"), variables.get("variable2", "post")
    common = df[[v1, v2]].dropna()
    plots = []

    fig, ax = plt.subplots(figsize=(5, 3.5))
    for i in range(len(common)):
        ax.plot([0, 1], [common.iloc[i][v1], common.iloc[i][v2]], color="#6366f1", alpha=0.15, linewidth=0.8)
    ax.plot([0, 1], [common[v1].mean(), common[v2].mean()], color="#ef4444", linewidth=2.5, marker="o", markersize=6, zorder=5)
    ax.set_xticks([0, 1])
    ax.set_xticklabels([v1, v2])
    ax.set_ylabel("Score")
    ax.set_title("Paired Comparison", fontsize=11)
    plots.append({"title": "Paired Lines", "image_base64": _to_b64(fig)})

    return plots


def _anova_plots(df, variables, stats_dict):
    dep = variables.get("dependent", "score")
    fac = variables.get("factor", "group")
    plots = []

    fig, ax = plt.subplots(figsize=(5, 3.5))
    groups = df[fac].dropna().unique()
    data = [df[df[fac] == g][dep].dropna().values for g in groups]
    parts = ax.violinplot(data, showmeans=True, showmedians=True)
    for i, pc in enumerate(parts["bodies"]):
        pc.set_facecolor(COLORS[i % len(COLORS)])
        pc.set_alpha(0.6)
    for key in ["cmeans", "cmedians", "cbars", "cmins", "cmaxes"]:
        if key in parts:
            parts[key].set_color("#888")
    ax.set_xticks(range(1, len(groups) + 1))
    ax.set_xticklabels([str(g) for g in groups], fontsize=9)
    ax.set_ylabel(dep)
    ax.set_title(f"{dep} by {fac}", fontsize=11)
    plots.append({"title": "Violin Plot", "image_base64": _to_b64(fig)})

    return plots


def _regression_plots(df, variables, stats_dict):
    dep = variables.get("dependent", "y")
    preds = variables.get("predictors", [])
    if isinstance(preds, str):
        preds = [preds]
    plots = []

    # Scatter + regression line for first predictor
    if preds:
        pred = preds[0]
        clean = df[[dep, pred]].dropna()
        x, y = clean[pred].values.astype(float), clean[dep].values.astype(float)

        fig, ax = plt.subplots(figsize=(5, 3.5))
        ax.scatter(x, y, alpha=0.5, color=COLORS[0], s=20)
        if len(x) > 1:
            m, b = np.polyfit(x, y, 1)
            x_line = np.linspace(x.min(), x.max(), 100)
            ax.plot(x_line, m * x_line + b, color="#ef4444", linewidth=1.5)
        ax.set_xlabel(pred)
        ax.set_ylabel(dep)
        ax.set_title(f"{dep} vs {pred}", fontsize=11)
        plots.append({"title": "Scatter + Regression Line", "image_base64": _to_b64(fig)})

    # Residual plot
    coefs = stats_dict.get("coefficients", [])
    if coefs and preds:
        clean = df[[dep] + preds].dropna()
        y = clean[dep].values.astype(float)
        X = clean[preds].values.astype(float)
        X_int = np.column_stack([np.ones(len(X)), X])
        b_vals = [c.get("b", 0) for c in coefs]
        if len(b_vals) == X_int.shape[1]:
            fitted = X_int @ np.array(b_vals)
            residuals = y - fitted

            fig, ax = plt.subplots(figsize=(5, 3.5))
            ax.scatter(fitted, residuals, alpha=0.5, color=COLORS[0], s=20)
            ax.axhline(0, color="#ef4444", linestyle="--", linewidth=1)
            ax.set_xlabel("Fitted values")
            ax.set_ylabel("Residuals")
            ax.set_title("Residual Plot", fontsize=11)
            plots.append({"title": "Residuals vs Fitted", "image_base64": _to_b64(fig)})

    return plots


def _correlation_plots(df, variables, stats_dict):
    v1, v2 = variables.get("variable1", "x"), variables.get("variable2", "y")
    clean = df[[v1, v2]].dropna()
    plots = []

    fig, ax = plt.subplots(figsize=(5, 3.5))
    ax.scatter(clean[v1], clean[v2], alpha=0.5, color=COLORS[0], s=20)
    if len(clean) > 1:
        m, b = np.polyfit(clean[v1].values, clean[v2].values, 1)
        x_line = np.linspace(clean[v1].min(), clean[v1].max(), 100)
        ax.plot(x_line, m * x_line + b, color="#ef4444", linewidth=1.5)
    ax.set_xlabel(v1)
    ax.set_ylabel(v2)
    r_val = stats_dict.get("r", stats_dict.get("rho", 0))
    ax.set_title(f"r = {r_val:.3f}", fontsize=11)
    plots.append({"title": "Scatter Plot", "image_base64": _to_b64(fig)})

    return plots
