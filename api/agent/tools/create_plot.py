import base64
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from services.data_service import get_dataset


# Dark theme for SparsileX
plt.rcParams.update({
    "figure.facecolor": "#0a0a0a",
    "axes.facecolor": "#141414",
    "axes.edgecolor": "#333",
    "axes.labelcolor": "#ccc",
    "text.color": "#ccc",
    "xtick.color": "#999",
    "ytick.color": "#999",
    "grid.color": "#222",
    "font.size": 11,
})


def create_plot(dataset_id: str, plot_type: str, variables: dict) -> dict:
    df = get_dataset(dataset_id)
    fig, ax = plt.subplots(figsize=(7, 4.5))

    x_col = variables.get("x")
    y_col = variables.get("y")
    group_col = variables.get("group_by")

    if plot_type == "histogram":
        if group_col:
            for group_val in df[group_col].dropna().unique():
                subset = df[df[group_col] == group_val][x_col].dropna()
                ax.hist(subset, alpha=0.6, label=str(group_val), bins=20, edgecolor="#0a0a0a")
            ax.legend()
        else:
            ax.hist(df[x_col].dropna(), bins=20, color="#6366f1", edgecolor="#0a0a0a")
        ax.set_xlabel(x_col)
        ax.set_ylabel("Frequency")
        ax.set_title(f"Histogram of {x_col}")

    elif plot_type == "boxplot":
        if group_col:
            groups = df[group_col].dropna().unique()
            data = [df[df[group_col] == g][x_col].dropna().values for g in groups]
            bp = ax.boxplot(data, labels=[str(g) for g in groups], patch_artist=True)
            colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b"]
            for patch, color in zip(bp["boxes"], colors):
                patch.set_facecolor(color)
                patch.set_alpha(0.7)
            ax.set_xlabel(group_col)
        else:
            bp = ax.boxplot(df[x_col].dropna().values, patch_artist=True)
            bp["boxes"][0].set_facecolor("#6366f1")
            bp["boxes"][0].set_alpha(0.7)
        ax.set_ylabel(x_col)
        ax.set_title(f"Boxplot of {x_col}")

    elif plot_type == "scatter":
        if not y_col:
            return {"error": "Scatter plot requires both x and y variables"}
        ax.scatter(df[x_col], df[y_col], alpha=0.6, color="#6366f1", s=30)
        ax.set_xlabel(x_col)
        ax.set_ylabel(y_col)
        ax.set_title(f"{x_col} vs {y_col}")

    elif plot_type == "bar":
        if group_col:
            grouped = df.groupby(group_col)[x_col].mean()
            colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b"]
            bars = ax.bar(grouped.index.astype(str), grouped.values, color=colors[:len(grouped)])
            ax.set_xlabel(group_col)
        else:
            counts = df[x_col].value_counts()
            ax.bar(counts.index.astype(str), counts.values, color="#6366f1")
            ax.set_xlabel(x_col)
        ax.set_ylabel("Mean" if group_col else "Count")
        ax.set_title(f"{'Mean ' + x_col + ' by ' + group_col if group_col else x_col}")

    elif plot_type == "qq_plot":
        from scipy import stats as sp_stats
        series = df[x_col].dropna()
        sp_stats.probplot(series, dist="norm", plot=ax)
        ax.set_title(f"Q-Q Plot of {x_col}")
        ax.get_lines()[0].set_color("#6366f1")
        ax.get_lines()[1].set_color("#ec4899")

    else:
        return {"error": f"Unknown plot type: {plot_type}"}

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("utf-8")

    return {
        "plot_type": plot_type,
        "image_base64": b64,
        "format": "png",
    }
