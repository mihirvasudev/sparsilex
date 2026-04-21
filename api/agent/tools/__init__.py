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
                "test_name": {"type": "string", "enum": ["descriptives", "one_sample_ttest", "independent_ttest", "welch_ttest", "paired_ttest", "mann_whitney", "wilcoxon", "one_way_anova", "repeated_measures_anova", "ancova", "kruskal_wallis", "linear_regression", "logistic_regression", "pearson_correlation", "spearman_correlation", "chi_square", "fisher_exact", "binomial_test", "multinomial_test", "pca", "bayesian_ttest_ind", "bayesian_ttest_paired", "bayesian_anova", "bayesian_correlation", "linear_mixed_model", "cronbach_alpha", "cfa", "power_ttest", "power_anova"]},
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
                "test_name": {"type": "string", "enum": ["descriptives", "one_sample_ttest", "independent_ttest", "welch_ttest", "paired_ttest", "mann_whitney", "wilcoxon", "one_way_anova", "repeated_measures_anova", "ancova", "kruskal_wallis", "linear_regression", "logistic_regression", "pearson_correlation", "spearman_correlation", "chi_square", "fisher_exact", "binomial_test", "multinomial_test", "pca", "bayesian_ttest_ind", "bayesian_ttest_paired", "bayesian_anova", "bayesian_correlation", "linear_mixed_model", "cronbach_alpha", "cfa", "power_ttest", "power_anova"]},
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
    # ── Code-mode tools (Path B) ──────────────────────────────────
    {
        "name": "write_file",
        "description": (
            "Create or overwrite a file in the user's Code-mode project. "
            "Use for new scripts. For existing files, prefer `edit_file` "
            "so you only replace the relevant part."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path, e.g. analysis.R"},
                "content": {"type": "string", "description": "Full file contents"},
                "language": {"type": "string", "enum": ["r", "python", "sql", "markdown"]},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "read_file",
        "description": (
            "Read a file from the Code-mode project. Returns line-numbered "
            "content so you can refer to specific lines when proposing edits."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "line_start": {"type": "integer"},
                "line_end": {"type": "integer"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "edit_file",
        "description": (
            "Make a targeted find-and-replace edit to an existing project file. "
            "`old_string` must match the file exactly (whitespace + newlines). "
            "If multiple matches exist, include more context to make it unique "
            "or pass replace_all=true. PREFER this over write_file for any file "
            "that already exists."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "old_string": {"type": "string"},
                "new_string": {"type": "string"},
                "replace_all": {"type": "boolean"},
            },
            "required": ["path", "old_string", "new_string"],
        },
    },
    {
        "name": "list_files",
        "description": (
            "List every file in the Code-mode project (names + sizes + languages). "
            "Use this to orient yourself before reading or editing."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "run_in_session",
        "description": (
            "Execute R code in the user's live R session (persists across calls). "
            "Returns captured stdout, any error message, and any plot that was "
            "drawn (as base64 PNG). Use this to actually run analyses the user "
            "wants to commit to their session."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "R code to execute"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "read_session_state",
        "description": (
            "Get a snapshot of every object in the user's live R .GlobalEnv "
            "(name, class, shape). Use after run_in_session to confirm what "
            "variables are defined, or to diagnose 'object not found' errors."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
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
