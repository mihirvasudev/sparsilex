TOOL_DEFINITIONS = [
    {
        "name": "inspect_data",
        "description": "Examine the dataset: column types, distributions, missing data patterns, and summary statistics. Use this first to understand the data before running any analysis.",
        "input_schema": {
            "type": "object",
            "properties": {
                "columns": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific columns to inspect. If omitted, inspects all columns.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "clean_data",
        "description": "Handle missing values, remove duplicates, or convert column types. Always explain what you're doing and why.",
        "input_schema": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["drop_missing", "impute_mean", "impute_median", "drop_duplicates", "convert_type"],
                },
                "column": {"type": "string"},
                "target_type": {"type": "string", "enum": ["numeric", "categorical"]},
            },
            "required": ["action"],
        },
    },
    {
        "name": "detect_outliers",
        "description": "Identify outliers in a numeric column using IQR or Z-score method.",
        "input_schema": {
            "type": "object",
            "properties": {
                "column": {"type": "string"},
                "method": {"type": "string", "enum": ["iqr", "zscore"]},
            },
            "required": ["column"],
        },
    },
    {
        "name": "check_normality",
        "description": "Run Shapiro-Wilk normality test on a column, optionally grouped by another column.",
        "input_schema": {
            "type": "object",
            "properties": {
                "column": {"type": "string"},
                "group_by": {"type": "string"},
            },
            "required": ["column"],
        },
    },
    {
        "name": "check_assumptions",
        "description": "Run all relevant assumption checks for a specific statistical test.",
        "input_schema": {
            "type": "object",
            "properties": {
                "test_name": {"type": "string", "enum": ["descriptives", "one_sample_ttest", "independent_ttest", "welch_ttest", "paired_ttest", "mann_whitney", "wilcoxon", "one_way_anova", "repeated_measures_anova", "ancova", "kruskal_wallis", "linear_regression", "logistic_regression", "pearson_correlation", "spearman_correlation", "chi_square", "fisher_exact", "binomial_test", "multinomial_test", "pca"]},
                "variables": {"type": "object"},
            },
            "required": ["test_name", "variables"],
        },
    },
    {
        "name": "run_test",
        "description": "Execute a statistical test. Returns test statistics, effect sizes, and confidence intervals.",
        "input_schema": {
            "type": "object",
            "properties": {
                "test_name": {"type": "string", "enum": ["descriptives", "one_sample_ttest", "independent_ttest", "welch_ttest", "paired_ttest", "mann_whitney", "wilcoxon", "one_way_anova", "repeated_measures_anova", "ancova", "kruskal_wallis", "linear_regression", "logistic_regression", "pearson_correlation", "spearman_correlation", "chi_square", "fisher_exact", "binomial_test", "multinomial_test", "pca"]},
                "variables": {"type": "object"},
                "options": {"type": "object"},
            },
            "required": ["test_name", "variables"],
        },
    },
    {
        "name": "create_plot",
        "description": "Generate a visualization. Returns a base64-encoded image.",
        "input_schema": {
            "type": "object",
            "properties": {
                "plot_type": {"type": "string", "enum": ["histogram", "boxplot", "scatter", "bar", "qq_plot"]},
                "variables": {"type": "object"},
            },
            "required": ["plot_type", "variables"],
        },
    },
    {
        "name": "open_analysis_panel",
        "description": "Open the manual analysis options panel in the UI, pre-filled with your recommended settings. Use this when you want the user to review options before running.",
        "input_schema": {
            "type": "object",
            "properties": {
                "test_name": {"type": "string"},
                "prefill": {"type": "object"},
            },
            "required": ["test_name"],
        },
    },
]
