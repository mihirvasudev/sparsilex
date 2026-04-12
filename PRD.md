# SparsileX — Product Requirements Document

## 1. Product Overview

SparsileX is a full-featured statistical analysis platform with an AI agent layer. It works in two modes:

1. **Manual mode** — a complete stats tool like JASP/SPSS. Browse an analysis menu, select a test, drag variables, configure options, click run. No AI required.
2. **Agent mode** — describe your research question in natural language. AI handles data cleaning, analysis selection, execution, and interpretation.

Users can mix both freely — let AI suggest, then manually tweak options before running. Like how Cursor is a full code editor AND an AI coding agent in one tool.

**Target launch:** Web app (MVP), followed by desktop (Electron/Tauri) and mobile (responsive + PWA).

---

## 2. User Personas

### Persona 1: Maya — Psychology PhD Student
- Has 500 rows of survey data in CSV
- Knows her hypothesis but not which test to use
- Has taken one stats course, uses SPSS because her advisor does
- Needs APA-formatted tables for her dissertation
- **Job to be done:** Get from data to defensible results without spending 3 days on Stack Overflow

### Persona 2: Dr. Raj — Biomedical Researcher
- Runs clinical trials, has complex longitudinal data
- Comfortable with Stata, uses R occasionally
- Needs mixed-effects models, survival analysis, multiple comparison corrections
- Cares deeply about reproducibility and assumption checking
- **Job to be done:** Move faster without sacrificing rigor

### Persona 3: Sam — Business Analyst
- Works in Excel, knows pivot tables and VLOOKUP
- Boss asks "is this difference statistically significant?"
- Has no formal stats training
- **Job to be done:** Get a rigorous answer to a business question without learning R

### Persona 4: Prof. Chen — Statistics Professor
- Teaches intro stats to 200 undergrads
- Wants students to focus on concepts, not software syntax
- Needs a tool students can use on any device
- **Job to be done:** A teaching tool that removes software friction from learning statistics

---

## 3. Core Features

### 3.1 Data Import & Management

**Data Sources:**
- File upload: CSV, TSV, Excel (.xlsx), SPSS (.sav), Stata (.dta), SAS (.sas7bdat), R (.rds, .rdata), JSON, Parquet
- Database connections: PostgreSQL, MySQL, SQLite, BigQuery, Snowflake
- API integrations: Google Sheets, Qualtrics, REDCap, OSF
- Paste from clipboard
- Sample datasets for learning

**Data Viewer:**
- Spreadsheet-style grid with inline editing
- Column type detection and manual override (numeric, categorical, ordinal, datetime, text)
- Sort, filter, search across columns
- Column statistics panel (distribution, missing %, unique values, outliers)
- Data preview for large datasets (lazy loading, virtual scrolling)

**Data Profiling (AI-powered):**
- Auto-detect column types and semantics (e.g., "this looks like a Likert scale")
- Missing data pattern analysis with visualization
- Outlier detection with explanations
- Distribution identification per column
- Relationship overview (correlation heatmap, association metrics)
- Data quality score with actionable recommendations

### 3.2 AI-Powered Data Cleaning

**The cleaning agent handles:**
- Missing data: detection, pattern analysis, imputation (mean/median/mode/MICE/KNN) with reasoning
- Outlier treatment: identification, explanation, options (keep/remove/winsorize/transform)
- Type conversion: string-to-numeric, date parsing, factor encoding
- Deduplication: fuzzy matching, merge strategies
- Recoding: reverse-coding scales, binning continuous variables, creating computed columns
- Reshaping: wide-to-long, long-to-wide, merge/join datasets
- String cleaning: trim whitespace, standardize categories, fix encoding

**Transparency requirements:**
- Every cleaning step is logged with before/after preview
- User can accept, modify, or reject each suggestion
- Undo/redo for all operations
- Full audit trail exportable as R/Python code

### 3.3 Analysis Engine — Dual Mode

#### Manual Mode (JASP/SPSS-style)

**Analysis Menu:**
- Top navigation ribbon organized by category (Descriptives, T-Tests, ANOVA, Regression, etc.)
- Click a test → opens an analysis options panel
- Drag-and-drop variable assignment (dependent, independent, covariates, factors)
- Full option configuration (confidence level, effect sizes, post-hoc tests, assumption checks)
- Click "Run" → results appear in the results panel
- Multiple analyses can run and accumulate in the results panel

**Analysis Options Panel (per test):**
- Variable slots: drag columns from data grid into slots (e.g., "Dependent Variable", "Grouping Variable")
- Options: checkboxes, dropdowns, numeric inputs for test-specific settings
- Smart defaults: sensible options pre-selected, power users expand for more control
- Live validation: warn if wrong variable types assigned (e.g., categorical in a numeric slot)

#### Agent Mode (AI-powered)

**Natural Language Interface:**
```
User: "Is there a significant difference in test scores between the treatment and control groups, controlling for age?"
SparsileX: Suggests ANCOVA, checks assumptions (normality, homogeneity of regression slopes, linearity), runs the analysis, reports results with effect sizes and confidence intervals.
```

**AI Analysis Agent Workflow:**
1. Parse the research question → identify variables, relationships, design
2. Assess data → check types, distributions, sample sizes, missing data
3. Recommend analysis → primary recommendation with alternatives and reasoning
4. User confirms or the AI opens the manual analysis panel pre-filled → user can tweak options
5. Check assumptions → run diagnostics, flag violations, suggest corrections
6. Execute analysis → run via R/Python backend
7. Interpret results → plain-language explanation with statistical details
8. Generate output → tables, figures, code, report text

#### Hybrid Mode (the magic)

- AI suggests → opens the manual options panel pre-filled with its recommendation
- User adjusts any option they disagree with
- Runs with the user's final configuration
- Like Cursor's "AI writes code → you review/edit → accept"

**Statistical Methods (Phase 1 — MVP):**

| Category | Methods |
|----------|---------|
| Descriptives | Mean, median, mode, SD, variance, range, IQR, skewness, kurtosis, frequencies, cross-tabs |
| T-tests | One-sample, independent, paired, Welch's, Bayesian t-tests |
| ANOVA | One-way, factorial, repeated measures, mixed, ANCOVA, MANOVA, Welch's ANOVA, Kruskal-Wallis |
| Regression | Linear, multiple, logistic, ordinal, multinomial, Poisson, negative binomial |
| Correlation | Pearson, Spearman, Kendall, partial, point-biserial, phi, Cramers V |
| Non-parametric | Mann-Whitney, Wilcoxon, Friedman, chi-square, Fisher's exact, McNemar |
| Reliability | Cronbach's alpha, McDonald's omega, split-half, item analysis |
| Factor analysis | EFA (PCA, PAF, ML), CFA, parallel analysis, scree plot |

**Statistical Methods (Phase 2):**

| Category | Methods |
|----------|---------|
| Mixed models | Linear mixed (LMM), generalized linear mixed (GLMM) |
| SEM | Path analysis, latent variable models, mediation, moderation |
| Bayesian | Bayesian t-test, ANOVA, regression, Bayes factors, posterior distributions |
| Survival | Kaplan-Meier, Cox regression, log-rank test |
| Machine learning | Classification, regression, clustering, cross-validation, feature importance |
| Time series | ARIMA, decomposition, forecasting, Granger causality |
| Meta-analysis | Fixed/random effects, forest plots, funnel plots, publication bias |
| Power analysis | Sample size estimation for all Phase 1 tests |
| Network analysis | Network estimation, centrality, community detection |

**Assumption Checking (automated for every analysis):**
- Normality: Shapiro-Wilk, Q-Q plots, histograms
- Homogeneity of variance: Levene's test, residual plots
- Linearity: scatter plots, residual vs fitted
- Independence: Durbin-Watson, autocorrelation
- Multicollinearity: VIF, tolerance, condition index
- Sphericity: Mauchly's test (for RM ANOVA)
- Sample size adequacy warnings

### 3.4 Visualization

**Auto-generated plots for every analysis:**
- Results-specific: forest plots, interaction plots, diagnostic plots
- Data-specific: histograms, box plots, scatter plots, bar charts, violin plots, heatmaps

**Interactive Plot Builder:**
- Drag-and-drop variable assignment
- Real-time preview
- APA-style defaults with full customization
- Themes: APA, minimal, colorblind-safe, journal-specific
- Export: PNG, SVG, PDF, interactive HTML

**AI-suggested visualizations:**
- "Best plot for this data" recommendations
- Automatic annotation of key findings
- Multi-panel figures for complex analyses

### 3.5 Results & Reporting

**Results Panel:**
- Plain-language interpretation alongside statistical output
- APA-formatted tables (copy-paste ready)
- Effect sizes with confidence intervals for every test
- Bayesian and frequentist results side-by-side (optional)
- Assumption check summaries with pass/fail indicators

**Code Export:**
- R script (base R + tidyverse)
- Python script (scipy + statsmodels + pandas)
- Jupyter notebook
- R Markdown / Quarto document
- Full analysis pipeline, not just the final test

**Report Generation:**
- Methods section draft (APA style)
- Results section draft with in-text statistics
- Table and figure captions
- Export to Word (.docx), LaTeX, Markdown, HTML

### 3.6 Collaboration

- Shareable project links (view/edit permissions)
- Real-time collaborative editing (like Google Docs for data analysis)
- Comments and annotations on results
- Version history for analyses
- Team workspaces

### 3.7 Teaching Mode

- Step-by-step analysis walkthroughs
- "Why this test?" explanations linked to concepts
- Interactive assumption checking tutorials
- Sample datasets with guided exercises
- Professor dashboard: see student progress, create assignments

---

## 4. AI Architecture

### 4.1 Agent System

**Orchestrator Agent:**
- Routes user requests to specialized agents
- Maintains conversation context and analysis history
- Manages multi-step workflows

**Data Agent:**
- Understands data structure, types, quality
- Handles cleaning, transformation, reshaping
- Generates data profiling reports

**Analysis Agent:**
- Translates research questions into statistical procedures
- Selects appropriate tests based on data characteristics and research design
- Checks assumptions and suggests corrections
- Interprets results in context

**Visualization Agent:**
- Recommends appropriate plots
- Generates publication-quality figures
- Handles customization requests

**Writing Agent:**
- Drafts methods and results sections
- Generates table/figure captions
- Formats citations and statistical reporting (APA, AMA, Vancouver)

### 4.2 AI Guardrails

- Every AI suggestion includes confidence level and reasoning
- Users can always see and edit the generated code before execution
- Analysis recommendations include alternatives with trade-offs
- Warning system for: small sample sizes, violated assumptions, multiple comparisons, p-hacking risk
- AI cannot fabricate data or results — all outputs trace to actual computations
- Reproducibility: same data + same question = same result (deterministic analysis selection)

### 4.3 Model Integration

- **Claude (Anthropic):** Primary reasoning engine for analysis selection, interpretation, report writing
- **OpenAI:** Secondary/fallback, specialized for certain NLP tasks
- **Local models (future):** For offline mode and data privacy requirements
- All model calls logged for transparency

---

## 5. Technical Architecture

### 5.1 Frontend

- **Framework:** React + Next.js (App Router)
- **UI Library:** Tailwind CSS + shadcn/ui (or custom design system)
- **Data Grid:** Custom virtual-scrolling grid (handle 1M+ rows)
- **Charts:** D3.js + custom React wrappers (for full control and publication quality)
- **Real-time:** WebSocket for collaboration and live analysis updates
- **State:** Zustand or Jotai (lightweight, performant)
- **Offline:** PWA with service workers

### 5.2 Backend

- **API:** Python (FastAPI) — primary backend
- **Statistical compute:** R (via rpy2 or subprocess) + Python (scipy, statsmodels, scikit-learn, pingouin)
- **AI orchestration:** LangGraph or custom agent framework
- **Task queue:** Celery + Redis (for long-running analyses)
- **File processing:** pandas, pyreadstat (SPSS/Stata), openpyxl (Excel)
- **Auth:** NextAuth.js or Clerk
- **Storage:** PostgreSQL (metadata) + S3-compatible (datasets, results)

### 5.3 Compute Engine

The statistical compute engine wraps R and Python packages:

```
User Request (natural language)
    ↓
AI Orchestrator (Claude)
    ↓ selects analysis + parameters
Statistical Router
    ↓ dispatches to appropriate backend
┌──────────────────────────────────────┐
│  R Worker          │  Python Worker  │
│  - lme4            │  - scipy        │
│  - BayesFactor     │  - statsmodels  │
│  - lavaan          │  - pingouin     │
│  - ggplot2         │  - scikit-learn │
│  - psych           │  - lifelines    │
│  - survival        │  - seaborn      │
│  - metafor         │  - plotnine     │
└──────────────────────────────────────┘
    ↓
Standardized Results (JSON)
    ↓
Frontend Rendering
```

### 5.4 Desktop & Mobile

- **Desktop:** Tauri (Rust-based, lighter than Electron) wrapping the web app
- **Mobile:** Responsive web app + PWA, native apps later if needed
- **Offline:** Local compute engine bundled with desktop app, sync when online

### 5.5 Infrastructure

- **Hosting:** Vercel (frontend) + Railway/Fly.io (backend) or self-hosted
- **Database:** Supabase (PostgreSQL + auth + realtime) or PlanetScale
- **File storage:** S3 / R2 (Cloudflare)
- **AI API:** Anthropic + OpenAI, with caching and rate limiting
- **Monitoring:** Sentry (errors) + PostHog (analytics)

---

## 6. Phased Roadmap

### Phase 0: Foundation (Weeks 1-4)
- [ ] Project scaffolding: Next.js + FastAPI + PostgreSQL
- [ ] Data import: CSV, Excel upload and parsing
- [ ] Data viewer: spreadsheet grid with column stats
- [ ] Basic AI integration: Claude API connected
- [ ] Single analysis: independent t-test (end-to-end proof of concept)

### Phase 1: MVP (Weeks 5-12)
- [ ] Full data import (CSV, Excel, SPSS, Stata)
- [ ] AI data profiling and cleaning agent
- [ ] Natural language analysis interface
- [ ] Core analyses: descriptives, t-tests, ANOVA, correlation, regression, chi-square
- [ ] Automated assumption checking
- [ ] Result visualization (auto-generated plots)
- [ ] APA-formatted tables
- [ ] R/Python code export
- [ ] User auth and project saving

### Phase 2: Power (Weeks 13-20)
- [ ] Advanced analyses: mixed models, factor analysis, reliability, non-parametric suite
- [ ] Interactive plot builder
- [ ] Report generation (methods + results sections)
- [ ] Teaching mode (guided walkthroughs)
- [ ] Collaboration (shared projects, comments)
- [ ] Desktop app (Tauri)

### Phase 3: Scale (Weeks 21-30)
- [ ] Bayesian analysis suite
- [ ] SEM and path analysis
- [ ] Machine learning module
- [ ] Survival analysis
- [ ] Meta-analysis
- [ ] Database connections
- [ ] API integrations (Qualtrics, REDCap, OSF)
- [ ] Mobile optimization + PWA

### Phase 4: Ecosystem (Weeks 30+)
- [ ] Plugin/extension system for custom analyses
- [ ] Marketplace for analysis templates
- [ ] Literature review integration
- [ ] Study design and power analysis wizard
- [ ] Institutional features (team management, SSO)
- [ ] Self-hosted / on-premise option for sensitive data

---

## 7. Success Metrics

### Product Metrics
- Time from data upload to first result: target < 2 minutes
- Analysis accuracy: AI suggests the correct test > 90% of the time
- User retention: 40% weekly active after first analysis
- NPS: > 50 within first 6 months

### Growth Metrics
- Organic signups from academic word-of-mouth
- University course adoptions
- GitHub stars (open-source core)
- Research papers citing SparsileX in methods section

---

## 8. Business Model

### Free Tier (open-source core)
- All statistical analyses
- AI-assisted analysis (rate-limited)
- Data import/export
- Code generation
- Local compute

### Pro ($15/month or $120/year)
- Unlimited AI assistance
- Collaboration features
- Cloud compute for large datasets
- Priority support
- Report generation

### Team ($30/user/month)
- Everything in Pro
- Team workspaces
- Admin dashboard
- SSO integration
- Priority onboarding

### Academic (50% discount on all paid tiers)
- Verified .edu email
- Student pricing: $5/month

### Enterprise (custom)
- Self-hosted deployment
- Custom model integration
- SLA and dedicated support
- HIPAA/FERPA compliance options

---

## 9. Competitive Advantages

1. **AI-native from day one** — not an add-on, the core experience
2. **Transparent AI** — every suggestion has reasoning, code, and alternatives
3. **Cross-platform** — web, desktop, mobile from a single codebase
4. **Dual-engine** — R and Python backends, best of both worlds
5. **Research-grade** — validated statistical implementations, assumption checking, reproducible output
6. **Modern UX** — designed for 2025+, not 2005
7. **Open-source core** — trust, transparency, community contributions
8. **Full pipeline** — data cleaning through publication, not just the test

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI suggests wrong analysis | High — erodes trust | Assumption checking, confidence levels, always show alternatives, user confirms before running |
| Researchers don't trust AI | High — adoption blocker | Full code transparency, reproducibility, "show your work" philosophy |
| Computation costs | Medium — margin pressure | Local compute for simple analyses, cloud for complex; efficient caching |
| R/Python package compatibility | Medium — maintenance burden | Pin versions, containerized compute, extensive testing |
| Incumbent lock-in (SPSS site licenses) | Medium — sales barrier | Target individual researchers first, bottom-up adoption, free tier |
| Data privacy concerns | High — deal breaker for medical/clinical | Self-hosted option, local compute mode, clear data handling policies |

---

## 11. Decisions Log

- [x] **Name:** SparsileX — unique, googleable, statistical roots
- [x] **License:** AGPL v3 + commercial dual-license (proven model: MongoDB, Grafana, JASP)
- [x] **Target:** Broad academic — all researchers from day one, not just psychology
- [x] **Architecture:** Cloud-first — web app MVP, ship fast, add desktop/mobile later
- [ ] **Design system:** TBD — custom vs existing component library
