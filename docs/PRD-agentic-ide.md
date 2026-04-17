# PRD — Sparsile (the IDE)

*An AI-native, agent-first research IDE. Better than RStudio, friendlier than JASP, cleaner than Cursor.*

**Author:** SparsileX team
**Status:** Draft / Vision
**Target ship:** 9–12 months to alpha

---

## 1. One-liner

A standalone desktop + cloud research IDE built from first principles around an AI agent as the primary interface. You don't "use" Sparsile; you collaborate with it. The agent reads your data, writes your code, checks your assumptions, explains your results, and teaches you the methods — all while you stay in control of every decision.

If SparsileX 2.0 is "RStudio + AI on the side," Sparsile is "AI in the driver's seat, code as artifact."

## 2. Why now

### The moment
- LLMs got good enough at statistics + R/Python in 2024. Claude Sonnet 4.6 writes better lme4 code than most PhD students.
- Cursor proved code editors can rewire around an AI agent as the primary loop.
- Every existing stats/research IDE was designed pre-LLM. RStudio's UX is from 2011. JASP's is from 2013. They're all trying to bolt AI on; none are rethinking from scratch.
- Posit pivoted to Positron (VS Code fork) — explicit acknowledgment that research UX needs rebuilding, but they're constrained by VS Code's DNA.

### The vision worth betting on
Researchers don't want a code editor. They want answers. They want to say "was this drug's effect significant" and receive: a rigorous analysis, a clean visualization, a plain-English interpretation, and a reproducible record of how it was done. The *existence* of R code is incidental — a receipt, not the point.

The next IDE for researchers doesn't start with "here's your text file." It starts with "here's your question."

### Market signal
- AIIMS Delhi med student publicly asking "we need a Claude Code extension for RStudio"
- Cursor crossed $100M ARR in 18 months
- Positron / Quarto signals Posit sees this coming and is repositioning
- Medical AI is a multi-billion dollar category — the infrastructure layer (how research gets done) is unbuilt

## 3. Product pillars

### Pillar 1: Agent-first, file-second
The entry point is a chat prompt, not a file tree. Files are generated artifacts of the conversation. You can dig into them, edit them, version them — but the default view is the conversation + the results.

### Pillar 2: Reproducibility by default, not by discipline
Every result carries its provenance: the exact code, the exact data hash, the exact package versions, the exact random seed. One click to re-run. One click to share the whole thing as an immutable capsule.

### Pillar 3: Stats expertise as a core feature, not a fine-tune
The agent is grounded in a first-class statistical knowledge base — not just "Claude knows stats." Actual test-selection trees, assumption hierarchies, effect-size libraries, reporting standards (APA, CONSORT, STROBE) baked into the product, not the prompt.

### Pillar 4: Multiplayer as the unit of work
Research is never solo. The lab meeting, the biostats consult, the peer review, the revise-and-resubmit — all of it involves multiple humans. The IDE treats projects as shared workspaces from day one.

### Pillar 5: Works with the tools you have
Import from RStudio projects, R Markdown, Jupyter, Quarto, SPSS (.sav), Stata (.dta), JASP. Export back out. You can leave anytime. This isn't a roach motel.

## 4. Target users

| Persona | The promise |
|---|---|
| **Med student / resident** | "Describe your research question. I'll get you to a publishable analysis." |
| **Biostatistician** | "Skip the boilerplate. Focus on the design, not the syntax." |
| **PI / lab director** | "See the lab's full analytical pipeline in one place. Review, comment, approve." |
| **Journal reviewer** | "One link, one click, full reproducibility check. No docker files to chase." |
| **Journal editor / regulator** | "Audit trail: who ran what, when, with what data. End of the reproducibility crisis." |
| **Course instructor** | "Assign real analyses. Grade automatically. Everyone has the same environment." |

## 5. Differentiation matrix

| | RStudio | JASP / Jamovi | SparsileX 2.0 | Cursor | **Sparsile** |
|---|---|---|---|---|---|
| Code editor | ✓✓✓ | ✗ | ✓✓ | ✓✓✓ | ✓✓ |
| Menu-driven analyses | ✗ | ✓✓✓ | ✓✓ | ✗ | ✓✓ |
| AI agent, primary UX | ✗ | ✗ | ✓ | ✓✓ | ✓✓✓ |
| Stats domain knowledge | Experts' brains | Hardcoded | In agent prompts | None | First-class knowledge base |
| Reproducibility | renv + effort | None | Manifest | None | Immutable capsules by default |
| Multiplayer | ✗ | ✗ | ✓ (v2.0+) | Basic | Figma-grade |
| Paper-aware | ✗ | ✗ | ✗ | ✗ | ✓ (parses methods sections) |
| Runs anywhere | Desktop + server | Desktop | Web | Desktop | Desktop + web + cloud |

## 6. Core capabilities

### 6.1 Conversational workspace (the new "file")

A `.sparsile` project is a **conversation**, not a folder. The conversation has:
- A chronological thread (your prompts, agent responses, results, revisions)
- Derived artifacts (code files, data files, plots, reports) auto-organized in a sidebar
- A "current state" — the latest running environment, variables, results

Researcher writes: *"Test if this new drug lowered blood pressure more than standard of care, adjusting for age and hospital."*

The agent:
1. Asks for the data file if not uploaded
2. Inspects it, identifies treatment/BP/age/hospital columns
3. Proposes a mixed-effects model with hospital as random
4. Shows assumption checks
5. Writes the lme4 code, shows it
6. Runs it, shows the result
7. Writes the APA-format paragraph
8. Offers to add this to the manuscript

All in one thread. All reproducible. All editable.

### 6.2 Hybrid modes (not just editor + menu)

Instead of toggling "menu mode" vs "code mode" (SparsileX 2.0's model), Sparsile lets every artifact exist at every level of abstraction:

- **Natural-language** — how the user describes what they want
- **Structured parameters** — a form/widget for precise control
- **Code** — the R or Python that actually runs
- **Result** — the output, plot, or table

You can modify at any level and the others update:
- Edit the natural language → agent regenerates code
- Edit the code → natural-language description auto-updates, result re-runs
- Tweak a parameter in the widget → code updates, re-runs

Similar to how a design tool lets you edit the property panel or the canvas and both stay in sync.

### 6.3 The Knowledge Base

Not a prompt. A first-class data structure shipped with the IDE:

- **Decision trees** for test selection (given data type, design, question → suggested test hierarchy)
- **Assumption catalog** for every test (what to check, how to check, what to do when violated)
- **Effect size conventions** per field (medicine uses different benchmarks than psychology)
- **Reporting standards** (APA 7, CONSORT 2010, STROBE, PRISMA) codified as checklists
- **Common pitfalls** (p-hacking, HARKing, multiple comparisons, Simpson's paradox) detected automatically

The agent queries this knowledge base during reasoning. Updates to the knowledge base are tracked separately from LLM updates — we can improve stats rigor without retraining models.

### 6.4 Reproducibility capsules

Each project produces an immutable capsule:
- Locked package versions (R + Python + system libs)
- Content-addressed data files
- Deterministic execution (fixed seeds, sorted dependencies)
- Signed by the creator; tamper-evident
- Packable as single file (`.sparsile-capsule`), distributable via any channel
- Reproducible by anyone with the IDE (or via `sparsile run capsule.sparsile` on the command line)

This makes peer review trivial: reviewer clicks "Reproduce," gets the exact results the author got. If they don't match, the reviewer knows immediately.

### 6.5 Paper mode

User pastes a link to a PDF or an arXiv URL or drops a PDF into the conversation:
- Agent parses the Methods section
- Identifies: study design, statistical tests, software used
- Generates matching code for the user's data
- Side-by-side compare: "This paper reports β = 0.42. Your data yields β = 0.39."

Opens the door to: literature-aware research, cross-study meta-analyses in-app, automated methodological critique.

### 6.6 Real-time collaboration

- Figma-style multiplayer on every artifact (code, conversation, widgets)
- Presence, cursors, comments, suggestions
- Role-based access (PI, grad student, biostatistician, reviewer, public)
- Branching conversations: "what if we used a non-parametric test instead?" forks the analysis without touching the main thread

### 6.7 The execution layer

Behind the scenes, every project runs in a sandboxed compute environment:
- R 4.4+, Python 3.12+, Julia (optional), Stan, JAGS
- Pre-installed: ~500 common research packages
- Can install anything else on-demand
- GPU-backed compute for simulation / Bayesian workloads (paid tiers)
- Runs in: WebAssembly (for free tier, simple computations), Firecracker microVMs (standard), or dedicated containers (enterprise)

User never thinks about this. It just works.

### 6.8 Export paths out

- Quarto `.qmd` with full reproducibility
- RMarkdown `.Rmd`
- Jupyter `.ipynb`
- Static HTML report (publishable)
- PDF (for submissions)
- Raw R / Python scripts
- Docker image (for archival or enterprise)

## 7. UX architecture

### 7.1 The home screen

Not a file tree. A **conversation list**:

```
┌────────────────── Sparsile ──────────────────────┐
│  Welcome back, Dr. Kumar                          │
│                                                   │
│  Start a new analysis                             │
│  [+ Drop a CSV or describe what you have]        │
│                                                   │
│  Recent projects                                  │
│  ▫ Hospital BP trial (3 hours ago)               │
│    "Random effects were significant..."           │
│  ▫ Survival analysis for AMI cohort (yesterday)  │
│    "Cox PH assumption violated..."                │
│  ▫ Survey validation - PHQ9 Hindi (last week)    │
│                                                   │
│  Shared with me                                   │
│  ▫ Dr. Sharma's meta-analysis draft               │
│  ▫ Lab's ongoing COVID dataset                    │
└───────────────────────────────────────────────────┘
```

### 7.2 Project view

```
┌─────────────────── Sparsile ────────────────────────────────┐
│ Hospital BP trial                      👥 ▾   [Share] [⚙]  │
├─────────────────────────────────┬──────────────────────────┤
│ Conversation                    │ Artifacts                 │
│ ──────────────                  │ ────────                  │
│ You: does the new drug work     │ ▾ Data                   │
│ better than standard care,      │   📄 trial_data.csv       │
│ adjusted for age and hospital?  │   📄 trial_data_cleaned   │
│                                 │                           │
│ Sparsile:                       │ ▾ Code                   │
│   Let me inspect the data.      │   📜 model.R              │
│   [▶ inspect_data]              │   📜 plots.R              │
│                                 │                           │
│   150 rows, 8 columns. Looks    │ ▾ Results                │
│   like a multi-site RCT.        │   📊 mixed_model          │
│   I'll fit a mixed-effects      │   📊 residual_qq          │
│   model with hospital as random │   📊 effect_plot          │
│   and check assumptions.        │                           │
│   [▶ run code]                  │ ▾ Reports                │
│                                 │   📄 manuscript.qmd       │
│   Treatment effect: -6.2 mmHg   │                           │
│   (95% CI: -8.9, -3.5), p=.003  │ ─────────────             │
│   Moderate effect size (d=0.42) │ Env (R 4.4.2)             │
│   [📊 see result]                │ trial_data, model, ...   │
│                                 │                           │
│ You: write an APA paragraph...  │ Status: ✓ Reproducible    │
│                                 │ Last run: 2m ago          │
│ [↻ You edited model.R]          │                           │
│ [↻ result auto-updated]         │                           │
└─────────────────────────────────┴──────────────────────────┘
```

### 7.3 Progressive disclosure

- Novice user sees: conversation + results, nothing else
- Grad student sees: + the widget/parameter view on each analysis
- Coder sees: + the code editor, the env inspector, the file tree
- Expert sees: + the execution logs, the package versions, the reproducibility manifest

Progressive disclosure isn't a "view mode" — it's driven by user actions. Open the code? You get code view. Open the env? You get env view. The agent adjusts its explanations to match what you've chosen to see.

## 8. Technical architecture

### 8.1 Shell
- **Tauri** (Rust + WebView) for desktop — lightweight, cross-platform, native performance
- **Web version** shares the same UI code; backend is cloud-hosted
- **CLI** (`sparsile`) for headless reproducibility, CI, batch jobs

### 8.2 Frontend
- TypeScript + React (lingua franca, largest hireable pool)
- Monaco for code editing
- Yjs/Automerge for CRDTs
- React Query for server state
- Tailwind for styling (already used in SparsileX)

### 8.3 Compute layer
- **Execution**: Firecracker microVMs for isolation + fast cold start; WASM for simple free-tier compute
- **R runtime**: Custom-built R execution service extending knitr's eval engine for streaming
- **Python runtime**: Jupyter kernel protocol (ipykernel), proven
- **Orchestration**: Kubernetes for the cloud tier, systemd for self-hosted

### 8.4 Agent
- **Models**: Claude Opus 4.6 for reasoning-heavy, Sonnet 4.6 default, Haiku for fast ops
- **Tool system**: ~25 tools spanning data ops, file ops, code execution, knowledge base queries, plot rendering
- **Memory**: structured conversation history + project knowledge graph (not just token context)

### 8.5 Knowledge base
- **Storage**: SQLite-per-project for local, Postgres for cloud
- **Format**: YAML-based, version controlled, open source (even if the product is proprietary)
- **Contributors**: statistics community; we curate, they PR

### 8.6 Collaboration infrastructure
- Yjs over WebSocket with a coordinating hub (Hocuspocus or custom)
- Presence via separate awareness protocol
- Persistence to Postgres for server-authority

## 9. Development phases

### Phase 0: Research + design (Month 1)
- Interview 20 researchers (med, biostats, social science, psych) about their workflow
- Build clickable Figma prototype of the core conversation-centric UX
- Validate: would they actually use this? What's missing?

### Phase 1: Core conversation + execution (Months 2-4)
- Desktop Tauri shell
- Single-project conversation UX
- R + Python execution
- Agent with basic toolset (run code, read file, write file, inspect data)
- Artifacts sidebar

### Phase 2: Knowledge base + rigor (Months 5-7)
- Build the statistical knowledge base (decision trees, assumptions, reporting standards)
- Agent integrates KB into reasoning
- Assumption-check automation
- APA/CONSORT/STROBE-aware reports

### Phase 3: Reproducibility + paper mode (Months 8-9)
- Immutable capsules
- PDF ingestion and method extraction
- Cross-project re-run

### Phase 4: Collaboration (Months 10-11)
- Yjs integration
- Multiplayer across conversation + artifacts
- Sharing, permissions, comments

### Phase 5: Web + cloud (Month 12)
- Hosted version at sparsile.com
- Billing
- Alpha launch

## 10. Success metrics

| Metric | Alpha (Month 12) | Year 2 | Year 3 |
|---|---|---|---|
| Active users | 5,000 | 50,000 | 250,000 |
| Paid users | 200 | 3,000 | 20,000 |
| ARR | $50k | $1M | $10M |
| % of users who publish a paper using Sparsile | 2% | 10% | 25% |
| Reproducibility capsules created | 1,000 | 50,000 | 500,000 |
| Median time from "I have data" → "I have a result" | <10 min | <5 min | <3 min |

## 11. Business model

- **Free tier** — Individual researchers, unlimited projects, community support, basic compute. Aggressive free tier to drive adoption.
- **Pro** — $30/mo. Better models, more compute, offline mode, priority support.
- **Team** — $100/user/mo. Multiplayer, shared projects, private knowledge base.
- **Institution** — Custom. Per-seat for universities/hospitals. SSO, HIPAA, dedicated infra, training, custom knowledge base for internal standards.
- **Enterprise** — Pharma / CROs. Per-project or per-trial pricing. Audit trails, regulatory compliance (21 CFR Part 11), on-prem.

Estimated unit economics at 1,000 paid users (mixed tiers): ~$80/user/mo blended, ~$20 COGS (compute), ~$60 gross margin/user/mo.

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 12-month build horizon; market moves in 3 | High | Critical | Ship SparsileX 2.0 first (3mo), ship Sparsile later. Don't bet everything on the long horizon. |
| Posit ships Positron + AI → direct competition | High | High | Our UX is fundamentally different (conversation-first, not editor-first). Don't try to out-edit Posit. |
| OpenAI / Anthropic ships a research agent | Medium | Critical | Our moat is the knowledge base + stats specialization, not the model. If they ship a product, partner or sell. |
| Researchers don't want a new tool; want AI in existing tools | Medium | Critical | That's what the RStudio addin is for. Three shots on goal: addin (quick), SparsileX 2.0 (medium), Sparsile (long). |
| Compute costs unsustainable at free scale | Medium | High | Free tier uses WebAssembly (near-zero cost) for simple work. Heavy compute gates to paid. |
| Regulatory barrier (HIPAA, 21 CFR Part 11) too high | Medium | Medium | Consumer + academic tier doesn't need it. Enterprise tier builds it when revenue justifies. |
| Not enough stats researchers to reach scale | Low | Medium | Adjacent markets: data science education, journalism data work, policy research, consulting. |

## 13. Why this wins (if it does)

1. **Timing**: LLMs are exactly good enough to make this work in 2025, not before. The window is open for 2-3 years.
2. **Unique positioning**: Nobody else is building an agent-first research IDE. Posit is rebuilding VS Code. Cursor is general-purpose. JASP is menu-only. We occupy an empty quadrant.
3. **Distribution unlocks**: Medical schools, grad programs, academic conferences — these are natural distribution channels we can penetrate cheaply with champions.
4. **Moat compounds**: The knowledge base + reproducibility capsules + collaboration graph get more valuable with use. Network effects.
5. **Reproducibility crisis is real**: Regulators (FDA, EMA) and journals (Nature, Science) are increasing requirements. A product that solves this by default — not by discipline — is positioned at a structural tailwind.

## 14. Open questions

1. **Is this one product, or three?** RStudio addin / SparsileX 2.0 / Sparsile. Do they eventually merge? Are they always three?
2. **Open-source strategy?** Client + knowledge base open, execution + collaboration proprietary? All open? None?
3. **How does the knowledge base stay accurate?** Expert review process? Community PRs? AI-generated with expert validation?
4. **When does Tauri vs Electron matter?** Tauri is lighter, but the ecosystem is smaller. Revisit if team isn't Rust-comfortable.
5. **Medical AI regulation (FDA SaMD)?** If we help generate analyses in clinical trials, are we a regulated medical device? Legal review required before clinical-trial features ship.

## 15. First principles

- Researchers have problems, not files
- The agent is the interface; code is the artifact
- Rigor is a feature, not a limitation
- Reproducibility is the point, not an afterthought
- The best tool for solo work is also the best for collaboration
- Free for the student, priced for the institution
- Extend the researcher, don't replace them

---

*Related docs:*
- `PRD-rstudio-addin.md` — Path A: RStudio addin (weekend → ship)
- `PRD-sparsilex-2.0.md` — Path B: SparsileX extends into IDE (quarter → ship)
- `PRD-agentic-ide.md` — Path C: Standalone agentic IDE (year → ship)

*Path A derisks B. B derisks C. Paths compound.*
