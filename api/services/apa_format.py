"""Generate APA-formatted text for statistical results."""


def format_apa(test_name: str, statistics: dict) -> str:
    """Return APA-formatted results text."""
    formatters = {
        "independent_ttest": _ttest,
        "welch_ttest": _ttest,
        "one_sample_ttest": _one_sample_ttest,
        "paired_ttest": _paired_ttest,
        "mann_whitney": _mann_whitney,
        "wilcoxon": _wilcoxon,
        "one_way_anova": _anova,
        "repeated_measures_anova": _rm_anova,
        "ancova": _ancova,
        "kruskal_wallis": _kruskal_wallis,
        "linear_regression": _linear_regression,
        "logistic_regression": _logistic_regression,
        "pearson_correlation": _pearson,
        "spearman_correlation": _spearman,
        "chi_square": _chi_square,
        "fisher_exact": _fisher,
        "binomial_test": _binomial,
    }
    fn = formatters.get(test_name)
    if not fn:
        return ""
    try:
        return fn(statistics)
    except Exception:
        return ""


def _p(v):
    if v < 0.001:
        return "p < .001"
    return f"p = {v:.3f}".replace("0.", ".")


def _ttest(s):
    g1, g2 = s.get("group1_label", "Group 1"), s.get("group2_label", "Group 2")
    return (
        f"An independent samples t-test revealed that {g1} (M = {s['mean_group1']:.2f}, SD = {s['std_group1']:.2f}) "
        f"and {g2} (M = {s['mean_group2']:.2f}, SD = {s['std_group2']:.2f}) "
        f"{'differed significantly' if s['p_value'] < 0.05 else 'did not differ significantly'}, "
        f"t({s['degrees_of_freedom']}) = {s['t_statistic']:.2f}, {_p(s['p_value'])}, d = {s['cohens_d']:.2f}."
    )


def _one_sample_ttest(s):
    return (
        f"A one-sample t-test indicated that the mean (M = {s['mean']:.2f}, SD = {s['std']:.2f}) "
        f"was {'significantly' if s['p_value'] < 0.05 else 'not significantly'} different from {s['test_value']}, "
        f"t({s['degrees_of_freedom']}) = {s['t_statistic']:.2f}, {_p(s['p_value'])}, d = {s['cohens_d']:.2f}."
    )


def _paired_ttest(s):
    return (
        f"A paired samples t-test showed a {'significant' if s['p_value'] < 0.05 else 'non-significant'} difference "
        f"between {s.get('var1_label', 'Time 1')} (M = {s['mean_var1']:.2f}) and {s.get('var2_label', 'Time 2')} (M = {s['mean_var2']:.2f}), "
        f"t({s['degrees_of_freedom']}) = {s['t_statistic']:.2f}, {_p(s['p_value'])}, d = {s['cohens_d']:.2f}."
    )


def _mann_whitney(s):
    return (
        f"A Mann-Whitney U test indicated that scores for {s.get('group1_label', 'Group 1')} "
        f"(Mdn = {s['median_group1']:.2f}) and {s.get('group2_label', 'Group 2')} "
        f"(Mdn = {s['median_group2']:.2f}) {'differed significantly' if s['p_value'] < 0.05 else 'did not differ significantly'}, "
        f"U = {s['u_statistic']:.1f}, {_p(s['p_value'])}, r = {s['rank_biserial_r']:.2f}."
    )


def _wilcoxon(s):
    return (
        f"A Wilcoxon signed-rank test showed a {'significant' if s['p_value'] < 0.05 else 'non-significant'} difference, "
        f"W = {s['w_statistic']:.1f}, {_p(s['p_value'])}, r = {s['effect_size_r']:.2f}."
    )


def _anova(s):
    return (
        f"A one-way ANOVA revealed a {'statistically significant' if s['p_value'] < 0.05 else 'non-significant'} effect, "
        f"F({s['df_between']}, {s['df_within']}) = {s['f_statistic']:.2f}, {_p(s['p_value'])}, "
        f"\u03B7\u00B2 = {s['eta_squared']:.3f}."
    )


def _rm_anova(s):
    return (
        f"A repeated measures ANOVA showed a {'significant' if s['p_value'] < 0.05 else 'non-significant'} effect, "
        f"F({s['df_between']}, {s['df_error']}) = {s['f_statistic']:.2f}, {_p(s['p_value'])}, "
        f"\u03B7\u00B2 = {s['eta_squared']:.3f}."
    )


def _ancova(s):
    return (
        f"An ANCOVA controlling for {s.get('covariate', 'the covariate')} revealed a "
        f"{'significant' if s['p_value'] < 0.05 else 'non-significant'} effect of the factor, "
        f"F({s['df_factor']}, {s['df_error']}) = {s['f_statistic']:.2f}, {_p(s['p_value'])}, "
        f"\u03B7\u00B2 = {s['eta_squared']:.3f}."
    )


def _kruskal_wallis(s):
    return (
        f"A Kruskal-Wallis test indicated a {'significant' if s['p_value'] < 0.05 else 'non-significant'} difference, "
        f"H({s['degrees_of_freedom']}) = {s['h_statistic']:.2f}, {_p(s['p_value'])}."
    )


def _linear_regression(s):
    r2 = s.get("r_squared", 0)
    return (
        f"A linear regression model was {'statistically significant' if s['p_value'] < 0.05 else 'not significant'}, "
        f"F({s['df_model']}, {s['df_residual']}) = {s['f_statistic']:.2f}, {_p(s['p_value'])}, "
        f"R\u00B2 = {r2:.3f}."
    )


def _logistic_regression(s):
    return (
        f"A logistic regression model was fit (pseudo R\u00B2 = {s['pseudo_r_squared']:.3f}, "
        f"accuracy = {s['accuracy']*100:.1f}%)."
    )


def _pearson(s):
    return (
        f"There was a {'significant' if s['p_value'] < 0.05 else 'non-significant'} "
        f"{'positive' if s['r'] > 0 else 'negative'} correlation between "
        f"{s.get('var1_label', 'X')} and {s.get('var2_label', 'Y')}, "
        f"r({s['n'] - 2}) = {s['r']:.3f}, {_p(s['p_value'])}."
    )


def _spearman(s):
    return (
        f"Spearman's rank correlation indicated a {'significant' if s['p_value'] < 0.05 else 'non-significant'} "
        f"association, r\u209B = {s['rho']:.3f}, {_p(s['p_value'])}."
    )


def _chi_square(s):
    return (
        f"A chi-square test of independence showed a {'significant' if s['p_value'] < 0.05 else 'non-significant'} "
        f"association, \u03C7\u00B2({s['degrees_of_freedom']}, N = {s['n']}) = {s['chi_square']:.2f}, "
        f"{_p(s['p_value'])}, V = {s['cramers_v']:.3f}."
    )


def _fisher(s):
    return (
        f"Fisher's exact test revealed a {'significant' if s['p_value'] < 0.05 else 'non-significant'} "
        f"association, {_p(s['p_value'])}, OR = {s['odds_ratio']:.2f}."
    )


def _binomial(s):
    return (
        f"A binomial test indicated that the observed proportion ({s['observed_proportion']:.3f}) "
        f"was {'significantly' if s['p_value'] < 0.05 else 'not significantly'} different from "
        f"{s['test_proportion']:.2f}, {_p(s['p_value'])}."
    )
