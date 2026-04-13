"""Generate reproducible R and Python code for each analysis."""


def generate_code(test_name: str, variables: dict, options: dict) -> dict:
    """Return {"r": "...", "python": "..."} code strings for the analysis."""
    generators = {
        "descriptives": _descriptives,
        "one_sample_ttest": _one_sample_ttest,
        "independent_ttest": _independent_ttest,
        "welch_ttest": _welch_ttest,
        "paired_ttest": _paired_ttest,
        "mann_whitney": _mann_whitney,
        "wilcoxon": _wilcoxon,
        "one_way_anova": _one_way_anova,
        "repeated_measures_anova": _repeated_measures_anova,
        "ancova": _ancova,
        "kruskal_wallis": _kruskal_wallis,
        "linear_regression": _linear_regression,
        "logistic_regression": _logistic_regression,
        "pearson_correlation": _pearson_correlation,
        "spearman_correlation": _spearman_correlation,
        "chi_square": _chi_square,
        "fisher_exact": _fisher_exact,
        "binomial_test": _binomial_test,
        "multinomial_test": _multinomial_test,
        "pca": _pca,
    }
    gen = generators.get(test_name)
    if not gen:
        return {"r": f"# Code generation not available for {test_name}", "python": f"# Code generation not available for {test_name}"}
    return gen(variables, options)


def _descriptives(v, o):
    cols = v.get("columns", "score")
    if isinstance(cols, list):
        cols = cols[0]
    return {
        "r": f'library(psych)\ndescribe(df${cols})',
        "python": f'import pandas as pd\n\ndf["{cols}"].describe()',
    }


def _one_sample_ttest(v, o):
    var = v.get("variable", "score")
    tv = o.get("test_value", v.get("test_value", 0))
    return {
        "r": f't.test(df${var}, mu = {tv})',
        "python": f'from scipy import stats\n\nstats.ttest_1samp(df["{var}"].dropna(), {tv})',
    }


def _independent_ttest(v, o):
    dep, grp = v.get("dependent", "score"), v.get("grouping", "group")
    return {
        "r": f't.test({dep} ~ {grp}, data = df, var.equal = TRUE)',
        "python": f'from scipy import stats\n\ng1 = df[df["{grp}"] == df["{grp}"].unique()[0]]["{dep}"].dropna()\ng2 = df[df["{grp}"] == df["{grp}"].unique()[1]]["{dep}"].dropna()\nstats.ttest_ind(g1, g2)',
    }


def _welch_ttest(v, o):
    dep, grp = v.get("dependent", "score"), v.get("grouping", "group")
    return {
        "r": f't.test({dep} ~ {grp}, data = df)',
        "python": f'from scipy import stats\n\ng1 = df[df["{grp}"] == df["{grp}"].unique()[0]]["{dep}"].dropna()\ng2 = df[df["{grp}"] == df["{grp}"].unique()[1]]["{dep}"].dropna()\nstats.ttest_ind(g1, g2, equal_var=False)',
    }


def _paired_ttest(v, o):
    v1, v2 = v.get("variable1", "pre"), v.get("variable2", "post")
    return {
        "r": f't.test(df${v1}, df${v2}, paired = TRUE)',
        "python": f'from scipy import stats\n\nstats.ttest_rel(df["{v1}"].dropna(), df["{v2}"].dropna())',
    }


def _mann_whitney(v, o):
    dep, grp = v.get("dependent", "score"), v.get("grouping", "group")
    return {
        "r": f'wilcox.test({dep} ~ {grp}, data = df)',
        "python": f'from scipy import stats\n\ng1 = df[df["{grp}"] == df["{grp}"].unique()[0]]["{dep}"].dropna()\ng2 = df[df["{grp}"] == df["{grp}"].unique()[1]]["{dep}"].dropna()\nstats.mannwhitneyu(g1, g2, alternative="two-sided")',
    }


def _wilcoxon(v, o):
    v1, v2 = v.get("variable1", "pre"), v.get("variable2", "post")
    return {
        "r": f'wilcox.test(df${v1}, df${v2}, paired = TRUE)',
        "python": f'from scipy import stats\n\nstats.wilcoxon(df["{v1}"].dropna(), df["{v2}"].dropna())',
    }


def _one_way_anova(v, o):
    dep, fac = v.get("dependent", "score"), v.get("factor", "group")
    return {
        "r": f'model <- aov({dep} ~ {fac}, data = df)\nsummary(model)\nTukeyHSD(model)',
        "python": f'from scipy import stats\nimport pandas as pd\n\ngroups = [g["{dep}"].dropna() for _, g in df.groupby("{fac}")]\nstats.f_oneway(*groups)',
    }


def _repeated_measures_anova(v, o):
    measures = v.get("measures", ["pre", "post"])
    cols_r = ", ".join([f'"{m}"' for m in measures])
    cols_py = ", ".join([f'"{m}"' for m in measures])
    return {
        "r": f'library(ez)\n# Reshape to long format first\n# ezANOVA(data = df_long, dv = value, wid = subject, within = condition)',
        "python": f'from scipy import stats\n\n# Repeated measures via Friedman or manual F-test\ncols = [{cols_py}]\ndata = df[cols].dropna()\nstats.friedmanchisquare(*[data[c] for c in cols])',
    }


def _ancova(v, o):
    dep, fac, cov = v.get("dependent", "score"), v.get("factor", "group"), v.get("covariate", "age")
    return {
        "r": f'library(car)\nmodel <- lm({dep} ~ {fac} + {cov}, data = df)\nAnova(model, type = "III")',
        "python": f'import statsmodels.api as sm\nfrom statsmodels.formula.api import ols\n\nmodel = ols("{dep} ~ C({fac}) + {cov}", data=df).fit()\nsm.stats.anova_lm(model, typ=2)',
    }


def _kruskal_wallis(v, o):
    dep, fac = v.get("dependent", "score"), v.get("factor", "group")
    return {
        "r": f'kruskal.test({dep} ~ {fac}, data = df)',
        "python": f'from scipy import stats\n\ngroups = [g["{dep}"].dropna() for _, g in df.groupby("{fac}")]\nstats.kruskal(*groups)',
    }


def _linear_regression(v, o):
    dep = v.get("dependent", "score")
    preds = v.get("predictors", ["age"])
    if isinstance(preds, str):
        preds = [preds]
    formula = f'{dep} ~ {" + ".join(preds)}'
    py_preds = ", ".join([f'"{p}"' for p in preds])
    return {
        "r": f'model <- lm({formula}, data = df)\nsummary(model)\nconfint(model)',
        "python": f'import statsmodels.api as sm\n\nX = df[[{py_preds}]].dropna()\ny = df.loc[X.index, "{dep}"]\nX = sm.add_constant(X)\nmodel = sm.OLS(y, X).fit()\nprint(model.summary())',
    }


def _logistic_regression(v, o):
    dep = v.get("dependent", "outcome")
    preds = v.get("predictors", ["age"])
    if isinstance(preds, str):
        preds = [preds]
    formula = f'{dep} ~ {" + ".join(preds)}'
    py_preds = ", ".join([f'"{p}"' for p in preds])
    return {
        "r": f'model <- glm({formula}, data = df, family = binomial)\nsummary(model)\nexp(coef(model))  # Odds ratios',
        "python": f'import statsmodels.api as sm\n\nX = df[[{py_preds}]].dropna()\ny = df.loc[X.index, "{dep}"]\nX = sm.add_constant(X)\nmodel = sm.Logit(y, X).fit()\nprint(model.summary())',
    }


def _pearson_correlation(v, o):
    v1, v2 = v.get("variable1", "x"), v.get("variable2", "y")
    return {
        "r": f'cor.test(df${v1}, df${v2}, method = "pearson")',
        "python": f'from scipy import stats\n\nstats.pearsonr(df["{v1}"].dropna(), df["{v2}"].dropna())',
    }


def _spearman_correlation(v, o):
    v1, v2 = v.get("variable1", "x"), v.get("variable2", "y")
    return {
        "r": f'cor.test(df${v1}, df${v2}, method = "spearman")',
        "python": f'from scipy import stats\n\nstats.spearmanr(df["{v1}"].dropna(), df["{v2}"].dropna())',
    }


def _chi_square(v, o):
    v1, v2 = v.get("variable1", "x"), v.get("variable2", "y")
    return {
        "r": f'tbl <- table(df${v1}, df${v2})\nchisq.test(tbl)',
        "python": f'from scipy import stats\nimport pandas as pd\n\nct = pd.crosstab(df["{v1}"], df["{v2}"])\nstats.chi2_contingency(ct)',
    }


def _fisher_exact(v, o):
    v1, v2 = v.get("variable1", "x"), v.get("variable2", "y")
    return {
        "r": f'tbl <- table(df${v1}, df${v2})\nfisher.test(tbl)',
        "python": f'from scipy import stats\nimport pandas as pd\n\nct = pd.crosstab(df["{v1}"], df["{v2}"])\nstats.fisher_exact(ct)',
    }


def _binomial_test(v, o):
    var = v.get("variable", "outcome")
    tp = o.get("test_proportion", 0.5)
    return {
        "r": f'binom.test(sum(df${var} == levels(factor(df${var}))[1]), nrow(df), p = {tp})',
        "python": f'from scipy import stats\n\ns = df["{var}"].dropna()\nk = (s == s.unique()[0]).sum()\nstats.binomtest(k, len(s), {tp})',
    }


def _multinomial_test(v, o):
    var = v.get("variable", "category")
    return {
        "r": f'library(stats)\nchisq.test(table(df${var}))',
        "python": f'from scipy import stats\nimport numpy as np\n\ncounts = df["{var}"].value_counts().values\nstats.chisquare(counts)',
    }


def _pca(v, o):
    cols = v.get("variables", [])
    nc = o.get("n_components", 0)
    cols_r = ", ".join([f'"{c}"' for c in cols])
    cols_py = ", ".join([f'"{c}"' for c in cols])
    return {
        "r": f'library(psych)\npca_result <- principal(df[, c({cols_r})], nfactors = {nc or "NULL"}, rotate = "varimax")\nprint(pca_result)',
        "python": f'from sklearn.decomposition import PCA\nimport pandas as pd\n\ndata = df[[{cols_py}]].dropna()\npca = PCA(n_components={nc or "None"})\npca.fit(data)\nprint(pca.explained_variance_ratio_)',
    }
