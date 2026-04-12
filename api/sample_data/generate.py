"""Generate sample experiment dataset for testing."""
import numpy as np
import pandas as pd

np.random.seed(42)

n_per_group = 75
treatment_scores = np.random.normal(loc=78, scale=12, size=n_per_group)
control_scores = np.random.normal(loc=72, scale=12, size=n_per_group)

# Inject 2 missing values
treatment_scores[10] = np.nan
control_scores[30] = np.nan

ages = np.random.randint(18, 45, size=n_per_group * 2)

df = pd.DataFrame({
    "subject_id": range(1, n_per_group * 2 + 1),
    "group": ["treatment"] * n_per_group + ["control"] * n_per_group,
    "score": np.concatenate([treatment_scores, control_scores]).round(1),
    "age": ages,
})

df.to_csv("sample_data/experiment.csv", index=False)
print(f"Generated {len(df)} rows → sample_data/experiment.csv")
print(f"Treatment: M={treatment_scores[~np.isnan(treatment_scores)].mean():.1f}, SD={treatment_scores[~np.isnan(treatment_scores)].std():.1f}")
print(f"Control:   M={control_scores[~np.isnan(control_scores)].mean():.1f}, SD={control_scores[~np.isnan(control_scores)].std():.1f}")
