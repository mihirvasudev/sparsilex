# PRD — SparsileX 2.0

*From click-to-run stats tool to full AI-native R IDE in the browser.*

**Author:** SparsileX team
**Status:** Draft
**Target ship:** 3 months to public beta

---

## 1. One-liner

Evolve SparsileX from "statistics app with menus" into the first AI-native IDE for research — keeping the click-to-run workflow for beginners, adding a full code editor + R/Python session for power users, with the same stats-specialized agent unifying both modes.

## 2. Why now

- The current SparsileX tops out at "run this predefined test." Power users hit the wall fast — they can't write a custom simulation, a non-standard transformation, or a bespoke plot.
- Our 29-analysis menu will never cover the long tail of real research. Medical researchers need custom code eventually.
- Positron (Posit's new IDE) proves there's appetite for modern data-science IDEs, but Positron is a tweaked VS Code — optimized for programmers, not researchers.
- If we stay menu-only, we lose users to RStudio/Positron as their needs grow. If we add code, we keep them forever.
- **The strategic insight**: SparsileX is currently the easy-mode alternative to RStudio. SparsileX 2.0 becomes the easy-mode *AND* pro-mode alternative.

## 3. Target users

| Persona | Path through the product |
|---|---|
| **First-year med student** | Stays in click-to-run mode. Never writes a line of code. Graduates with the menu. |
| **Grad student, year 2+** | Starts in menu mode. Agent generates code alongside each result. Curious, starts reading the code. Eventually writes their own. |
| **Biostatistician** | Skips the menu entirely. Goes straight to the code editor. Uses the agent for boilerplate, assumption checks, and plot debugging. |
| **Collaborating team** | One person in menu mode, another in code mode, both editing the same project in real-time. |

The product is **uni-product**: same files, same data, same agent — rendered differently depending on what you want.

## 4. Goals & non-goals

### Goals

- **G1** Remove the ceiling — anyone who hits "I can't do this in SparsileX" can escape to custom code without leaving the app.
- **G2** Dual mode: menus for non-coders, editor for coders, same project.
- **G3** The agent spans both worlds — it can operate the menu OR write code, depending on what's easier.
- **G4** Full R + Python support. Julia later.
- **G5** Keep the "2 minutes from CSV upload to first result" onboarding for new users.
- **G6** Reproducibility built in: every result is linked to the exact code and data that produced it.
- **G7** Real-time collaboration (Figma-style multiplayer) as a first-class feature.

### Non-goals (v2.0)

- **NG1** Not a general-purpose IDE. Research and stats are the identity.
- **NG2** No plugin marketplace / extensions in v2.0 (simplifies the surface area).
- **NG3** Not trying to replace VS Code for data engineering work — the data engineer stays in VS Code.
- **NG4** Not self-hosted in v2.0 (SaaS-first; on-prem is enterprise v2.2+).
- **NG5** Not competing on low-level R language tooling (debugger, profiler, package building) — those stay in RStudio/Positron for the tiny fraction of users who need them.

## 5. Core new capabilities (what's added to SparsileX 1.0)

### 5.1 Code editor pane

- **Monaco editor** (same as VS Code, open source, Apache 2.0)
- Files live alongside the CSV in the project
- Syntax highlighting, autocomplete, linting for R, Python, SQL, Markdown
- Multi-file tabs, file tree sidebar
- Find/replace, multi-cursor, go-to-definition

### 5.2 REPL session

- Persistent R and Python sessions per project
- Streamed execution output (text, plots, tables) into a Results pane
- `.R` and `.py` files can be run whole or line-by-line (cursor line, selection, or whole file)
- Session state (loaded packages, dataframes, variables) is visible in the Environment pane
- Sessions survive page refresh (server-side R/Python processes persisted for the session's duration)

### 5.3 Environment inspector

- Live list of all variables in the active session
- Click a dataframe → opens interactive data grid with same UX as current DataGrid
- Click a plot → opens full-size in the plots pane
- Memory usage per variable
- Clear-all, save-to-file, export actions

### 5.4 Notebook mode

- Quarto-style `.qmd` files: prose + code + outputs inline
- Live preview alongside the source
- Export to PDF, HTML, or a shareable SparsileX URL

### 5.5 The agent is upgraded

Current SparsileX agent has 8 tools operating on the menu. v2.0 adds:

- `write_to_file(path, content)` — create/edit files in the project
- `run_code_in_session(lang, code)` — execute in the live R or Python session
- `read_session_state()` — list loaded variables, their types/shapes
- `read_file(path, line_range)` — read parts of project files
- `replace_in_file(path, old, new)` — targeted edits, not whole-file rewrites
- `search_project(query)` — grep across the project
- `point_at(element)` — extended to editor positions: `point_at("file.R:42")`
- `install_package(name, language)` — install R/Python packages into the session

The agent can now write code for you, fix errors, or refactor — not just run menu analyses. It picks the right mode automatically.

### 5.6 Reproducibility graph

- Every result card links to the code block that generated it
- Every code block links to its inputs (which files, which variables)
- Full audit trail: who ran what, when, with what data
- One click to reproduce: "run this result in a fresh environment"

### 5.7 Real-time collaboration

- Multi-user editing (Yjs or Automerge CRDTs, same tech as Figma / Linear / Google Docs)
- See your collaborator's cursor, selection, current file
- Comment on any cell, result, or line of code
- Permissions: owner / editor / viewer / commenter
- Shareable links with fine-grained access

## 6. User experience

### Layout (v2.0)

```
┌────────────────────── SparsileX ────────────────────────────┐
│ trial_data.sparx ▾       [👥 Alex, Sam]  [▶ R]  [✓ Saved]  │
├──────────┬─────────────────────────────────┬───────────────┤
│ Files    │ analysis.R       × script.py  ×│ Environment   │
│          │ ─────────────────────────────── │ ────────────  │
│ ▾ trial  │ 1 library(lme4)                 │ trial_data    │
│   📄 an  │ 2                               │  150×8 df     │
│   📄 sc  │ 3 model <- lmer(                │ model         │
│   📊 dat │ 4   bp_reduction ~ treatment +  │  lme4 S4      │
│   📁 out │ 5   age + (1|hospital_id),      │ p_values      │
│          │ 6   data = trial_data           │  num [1:4]    │
│          │ 7 )                             │               │
│          │ 8 |_                            │ Packages      │
│          │                                 │ lme4, ggplot2 │
│          ├─────────────────────────────────┼───────────────┤
│          │ Results                         │ Clicky buddy  │
│          │ ─────────────                   │      ▲        │
│          │ [Mixed model output table]      │      │        │
│          │ [QQ-plot of residuals]          │ ────────────  │
│          │ [ICC = 0.312]                   │ Chat: "Let me │
│          │                                 │ check if the  │
│          │                                 │ residuals are │
│          │                                 │ normal..."    │
└──────────┴─────────────────────────────────┴───────────────┘
```

### Mode toggle

Top-right of the Files pane:
- **Menu mode** (default for new users) — the analysis ribbon appears, editor pane hides. Exactly the current SparsileX UX.
- **Code mode** — editor is front and center, analysis ribbon collapses to a dropdown.
- **Notebook mode** — Quarto split-pane preview.
- **Auto** — decides based on what you're doing. Opens a code file → code mode. Upload a CSV → menu mode.

### The agent unifies the modes

User in menu mode says "fit a mixed model with hospitals nested in state" — the agent:
1. Recognizes this requires `lme4` which isn't in the menu
2. Offers: "I can write this as R code for you. Open the editor?"
3. User agrees → creates `analysis.R` with the code → runs it → shows results
4. User is now in code mode, still without writing a line of R

Reverse: user in code mode with a half-broken script says "use SparsileX to run this properly" — the agent parses the code, recognizes it's a t-test, pre-fills the menu analysis panel with the right variables. One click to run the clean version.

## 7. Functional requirements

### FR1 — Persistent sessions

- R and Python subprocesses live per-project, per-user
- Survives tab refresh (backend reattach via session ID)
- Dies after 1 hour of inactivity (configurable)
- Memory capped at 4GB per session (enforced)

### FR2 — Code execution

- **Run file** (Cmd+Shift+Enter) — entire script
- **Run line / selection** (Cmd+Enter) — current line or highlighted range
- **Run block** — Quarto-aware: runs the cell under the cursor
- Streams output to Results pane as it arrives
- Errors highlight the failing line in the editor

### FR3 — Plot output

- R plots: captured via `png()` device, streamed as base64 to Results
- ggplot: detected and rendered as interactive Plotly where possible
- Python: matplotlib + Plotly supported natively

### FR4 — Environment awareness

- Backend tails R/Python subprocess; every statement updates an env cache
- Env pane subscribes via WebSocket; updates in real-time
- Clicking a variable sends `View(varname)` to the subprocess, captures the result

### FR5 — File operations

- File tree reflects project directory on backend
- Create / rename / delete / upload / download
- Autosave every 2 seconds after last keystroke
- File contents stored in SparsileX project (the `.sparx` becomes a ZIP with all files)

### FR6 — Collaboration (v2.0 Phase 2)

- Yjs CRDT for text sync per file
- Awareness protocol for cursors
- Changes broadcast via WebSocket
- Conflict-free by design; offline edits reconcile on reconnect

### FR7 — Reproducibility manifest

- Each `.sparx` project has a `manifest.json`:
  ```json
  {
    "r_version": "4.4.2",
    "python_version": "3.12.3",
    "packages": { "lme4": "1.1.35.5", "ggplot2": "3.5.1", ... },
    "results": [
      {
        "id": "res-abc123",
        "source": "analysis.R",
        "lines": [3, 10],
        "inputs": ["trial_data.csv"],
        "output_hash": "sha256:..."
      }
    ]
  }
  ```
- "Reproduce" button recreates the exact environment via renv/uv and re-runs

## 8. Non-functional requirements

- **Editor latency:** Keystroke → paint < 16ms (Monaco handles this natively)
- **Run → output start:** < 500ms for small R scripts
- **Save latency:** Autosave persists within 1s
- **Collaboration latency:** Remote cursor updates within 150ms
- **Session restart:** Persist session state to disk; restart after crash in < 5s
- **Security:** R/Python sessions run in sandboxed containers; no network egress except whitelisted package registries; no filesystem access outside the project

## 9. Technical architecture

### Frontend
- **Framework:** Next.js 15 (App Router) — we're already here
- **Editor:** Monaco editor via `@monaco-editor/react`
- **R language support:** `monaco-languageclient` bridging to an R language server (future; v2.0 starts with syntax highlighting only)
- **Collaboration:** Yjs + y-monaco for shared editor state
- **State:** Zustand or Jotai for client state (existing Context API doesn't scale to multi-pane)
- **Real-time:** Socket.IO or native WebSocket to the backend session manager

### Backend
- **API:** FastAPI (existing) + new session manager service
- **R session:** subprocess of `R --no-save --interactive` with a custom wrapper using the `reprex`-style eval loop, or port to `knitr`'s evaluation engine
- **Python session:** `ipykernel` (Jupyter kernel protocol) — battle-tested, just use it
- **Session isolation:** Docker containers per project per user (container per language or combined)
- **File storage:** MinIO (S3-compatible) or native filesystem
- **Agent:** existing `agent.py` with new tools added (write_to_file, run_in_session, etc.)

### Execution engine

```
User clicks Run
      ↓
Frontend sends { session_id, code, lang }
      ↓
Backend SessionManager routes to correct subprocess
      ↓
Subprocess evaluates; captures stdout, stderr, plot bytes, result objects
      ↓
Streamed back as SSE events: { type: "output", ... }, { type: "plot", ... }, { type: "error", ... }
      ↓
Frontend renders into Results pane
```

### Why this split
- Monaco in the browser: zero install for users
- R/Python subprocesses on backend: real execution, not WebAssembly simulacrum
- Docker containers: isolation without burdening the user's machine
- Trade-off: costs scale with concurrent users (each needs a container). At low scale, free tier on a beefy VM handles it. At high scale, Kubernetes.

## 10. Rollout strategy

### Phase 1 — Code editor beta (weeks 1-4)
- Monaco editor pane behind a feature flag
- R subprocess execution (no Python yet)
- File tree, multi-file support
- Basic environment inspector
- Agent can read files and write files

**Beta users:** existing SparsileX users who opt in. Target 50 users.

### Phase 2 — Python + Notebook mode (weeks 5-8)
- Python via ipykernel
- Quarto `.qmd` support with split-pane preview
- Per-cell execution
- Agent can run cells directly

**Target:** 500 weekly active users.

### Phase 3 — Collaboration (weeks 9-12)
- Yjs integration for editor
- Presence (cursors, selections)
- Comments
- Shareable links with permissions

**Target:** 2,000 weekly active users, first team subscriptions.

### Phase 4 — Reproducibility + Polish (weeks 13-16)
- Manifest.json, Reproduce button
- renv/uv environment capture
- Public launch

**Target:** 10,000 WAU, $5k MRR.

## 11. Pricing model (v2.0)

| Tier | Price | Included |
|---|---|---|
| **Free** | $0 | 1 project, menu mode + editor, up to 4h session/day, 500MB storage, Claude Haiku |
| **Plus** | $20/mo | Unlimited projects, 24h sessions, 10GB storage, Claude Sonnet, priority support |
| **Team** | $60/user/mo (min 3) | Collaboration, shared projects, org management, SSO |
| **Enterprise** | Custom | On-prem, audit logs, HIPAA BAA, dedicated infra |

MVP launches free-only. Billing comes in Phase 4.

## 12. Success metrics

| Metric | 3 months | 6 months | 12 months |
|---|---|---|---|
| Weekly active users | 2,000 | 15,000 | 80,000 |
| Paid subscribers | 50 | 500 | 3,000 |
| MRR | $1k | $10k | $60k |
| % of sessions using editor mode | 20% | 40% | 55% |
| Avg session length | 15min | 25min | 35min |
| 30-day retention | 40% | 55% | 65% |

## 13. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Execution sandbox security (arbitrary R/Python code) | High | Critical | Dockerized sessions, network egress blocked, fs scoped, runtime limits |
| Infrastructure costs balloon with free tier | Medium | High | Aggressive idle timeouts, container hibernation, Firecracker microVMs for cost efficiency |
| Feature creep blurs the identity (are we an IDE? a stats app?) | High | Medium | The menu-to-code bridge is the product; anything that doesn't serve it gets cut |
| Monaco + Yjs collaboration edge cases | Medium | Medium | Use proven stack (Excalidraw, Linear use this); prototype sync early |
| RStudio/Positron ship competing AI | High | High | Our wedge is stats-specialization and the menu↔code bridge, not raw code assistance |
| Users prefer local-first IDEs over cloud | Medium | Medium | Tauri desktop app in v2.3 wraps the web app for offline use |

## 14. Open questions

1. **R subprocess vs WebR?** WebR runs R in WebAssembly in the browser — zero backend cost but limited (no most CRAN packages). MVP: backend R. Long-term: hybrid (simple code in WebR, heavy code on server).
2. **Monaco vs CodeMirror 6?** Monaco is heavier (VS Code-sized) but has better R tooling potential. CodeMirror is lighter and modular. Recommendation: Monaco for now, revisit at 50K users.
3. **Notebook format — Quarto, Jupyter, or custom?** Quarto is most researcher-friendly; Jupyter has the widest ecosystem. Recommendation: Quarto as primary, import Jupyter.
4. **When does the buddy become essential vs distracting?** In editor mode with expert users, it might get in the way. Need a setting to dock it or silence it.
5. **Open-source strategy?** Open-source the client, proprietary the execution infrastructure? Or source-available under BSL?

## 15. Competitive positioning (v2.0)

| Product | Strength | Weakness | Our advantage |
|---|---|---|---|
| **RStudio Server** | Mature, free, web-based | No AI, clunky UX, not stats-aware | Agent + menu mode for non-coders |
| **Posit Cloud** | Hosted RStudio, multi-user | Expensive for orgs, no AI | Agent, lower price, unified UX |
| **Positron** | Modern VS Code-based | Desktop-only, programmer-focused | Web, researcher-focused, agent |
| **JASP / Jamovi** | Easy stats, free | No code mode at all | Menu *and* code in same app |
| **Cursor + R** | Best code assistant | Not stats-aware, no menu mode | Stats domain expertise + menus |
| **Google Colab** | Notebook + sharing + GPUs | Python-first, weak stats | R + Python, stats-native |

Our wedge: **we are the only product that works for both the non-coder researcher and the biostatistician on the same team, in the same project**. That's a real moat.

---

*Related docs:*
- `PRD-rstudio-addin.md` — tactical distribution play for users who won't leave RStudio
- `PRD-agentic-ide.md` — the ambitious long-term vision (if v2.0 succeeds, v3.0 is the standalone IDE)
