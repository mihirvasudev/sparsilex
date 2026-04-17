# PRD — Sparx for RStudio

*Claude Code-style AI pair-programming, inside RStudio.*

**Author:** SparsileX team
**Status:** Draft
**Target ship:** MVP in 2 weekends

---

## 1. One-liner

An RStudio addin that adds an AI pair-programmer to RStudio. The user describes what they want in English; Sparx reads their script, their R session, and their data, then generates R code, runs it, reads the output/errors, and iterates until it works.

## 2. Why now

- A vocal healthtech founder and AIIMS Delhi med student tweeted **"we need a claude code extension for r studio"** — public demand signal.
- RStudio is the dominant IDE in medical research, biostatistics, epidemiology, and clinical trials worldwide.
- Copilot has a basic RStudio integration (tab-completion only) — no agentic workflow exists.
- Positron (Posit's new VS Code-based IDE) is still niche; RStudio has massive lock-in.
- We already have the hardest piece built: a production-grade stats-specialized AI agent (via SparsileX).

## 3. Target users

| Persona | Pain | How Sparx helps |
|---|---|---|
| **Med student doing a research project** | "My advisor said run a mixed-effects model. I've never touched lme4." | "Run a mixed model with patients nested in hospitals" → correct lme4 code, run, interpreted result. |
| **Clinical researcher** | Stuck on cryptic R errors at 11pm before submission | Paste error → Sparx reads the script context → fixes it. |
| **Biostatistician** | Repetitive cleaning/transforming across similar datasets | "Winsorize outliers at 1st/99th percentile and refit the model" → done. |
| **PhD student** | Method from a paper is complex | Drops methods section → Sparx writes matching code. |

Primary wedge: **medical and public-health researchers** using R for the first or second time. These users experience R as friction, not as expression — they want the analysis, not the code.

## 4. Goals & non-goals

### Goals

- **G1** Users can get a working statistical analysis without writing R code themselves.
- **G2** Users stay inside RStudio — no context switch, no data upload, no new login.
- **G3** Every action is transparent: user sees and approves every line of generated code before execution.
- **G4** Sparx understands statistical rigor (assumptions, effect sizes, power) — not just syntax.
- **G5** Works on any R script, on any dataframe already loaded in the user's session.

### Non-goals (MVP)

- **NG1** Not a full IDE replacement — Sparx lives inside RStudio.
- **NG2** Not for general R development (package building, Shiny apps, data engineering pipelines). Stats-focused.
- **NG3** Not auto-executing code without user approval. Claude Code's "yolo mode" is a v2 consideration.
- **NG4** Not for Python, Julia, or other languages (R only).
- **NG5** No self-hosted or offline mode in MVP.

## 5. User experience

### Entry points

1. **Toolbar button** — `Addins → Sparx` opens the chat pane.
2. **Keyboard shortcut** — `Cmd+Shift+A` (binds to the addin function) opens the pane.
3. **Right-click menu** — select code, right-click → "Explain with Sparx" / "Fix with Sparx" / "Improve with Sparx".

### Primary flow: "Write this analysis for me"

```
┌────────────────────────── RStudio ──────────────────────────┐
│  script.R          [Editor]            Environment          │
│  ──────────────────────────            ────────────         │
│  library(tidyverse)                     trial_data          │
│  trial_data <- read.csv(...)            150 obs, 8 vars     │
│  |_|  # cursor here                                         │
│                                                             │
│                                         Sparx  [x] [□]      │
│                                         ────────────        │
│                                         You: fit a mixed    │
│                                         model for bp        │
│                                         reduction, patients │
│                                         nested in hospitals │
│                                                             │
│                                         ↓ Generating...     │
│                                         library(lme4)       │
│                                         model <- lmer(      │
│                                           bp_reduction ~    │
│                                           treatment + age + │
│                                           (1|hospital_id),  │
│                                           data = trial_data)│
│                                         summary(model)      │
│                                                             │
│                                         [Insert] [Run] [×]  │
└─────────────────────────────────────────────────────────────┘
```

1. User places cursor in their script, opens Sparx pane.
2. Types natural-language request.
3. Sparx reads: current script, cursor position, active dataframes (names + column types), installed packages.
4. Streams generated R code with inline explanation.
5. User clicks **Insert** (puts code at cursor) or **Run** (executes in the R console via `rstudioapi::sendToConsole`).
6. If execution errors, Sparx reads the error and offers a fix.

### Secondary flows

**Fix this error** — User's code errors. Sparx reads the console error + the surrounding script, diagnoses, proposes a fix.

**Explain this code** — User selects code, right-click → Explain. Sparx walks through it in plain English.

**Improve this code** — User selects code. Sparx suggests idiomatic tidyverse rewrite, or more robust assumptions, or adds comments.

**Suggest an analysis** — User has data loaded but doesn't know what test to run. Describes the research question. Sparx inspects the data types, asks clarifying questions, proposes and runs.

### Guardrails

- Never runs destructive ops (`rm(...)`, `unlink()`, `system()`, `file.remove()`) without a confirmation dialog.
- Never overwrites files without explicit user confirmation.
- Never silently writes to `.GlobalEnv` — all changes are visible in the inserted code.

## 6. Functional requirements

### FR1 — Context awareness
Sparx reads on each request:
- Current editor document content (full text)
- Current cursor position + selection range
- Active dataframe summaries via `lapply(ls(envir=.GlobalEnv), function(x) { if(is.data.frame(get(x))) summary(get(x)) })`
- Installed packages list (for suggesting or loading)
- Console history of recent commands (last 20)

### FR2 — Code generation
- Streams response token-by-token into the chat pane
- Syntax-highlights generated R code
- Shows a diff when modifying existing user code

### FR3 — Code execution
Three execution modes:
- **Insert** — places code at cursor, does not run.
- **Run** — executes in R console via `rstudioapi::sendToConsole(code, execute=TRUE)`.
- **Preview** — runs in isolated R subprocess, shows result without polluting user's session.

### FR4 — Error recovery loop
When code fails, Sparx:
1. Reads the error from the console output
2. Reads back the code it generated + script context
3. Proposes a fix in the chat
4. User approves → retry

### FR5 — Conversation persistence
- Conversation history persists per-project (stored in `.Rproj.user/sparx/chat.json`)
- User can start a new conversation, archive, or clear.

### FR6 — Inline code actions
- Right-click on selected code → "Explain", "Fix", "Improve", "Add tests".
- Editor lens above function definitions → "Generate test", "Add docstring" (Roxygen).

### FR7 — Dataset inspection tool
Sparx has a built-in tool to run `dplyr::glimpse()`, `summary()`, `skimr::skim()` on a dataframe and feed results back to itself — so it knows the data shape before writing analysis code.

### FR8 — Authentication
Two modes:
- **BYOK (Bring Your Own Key):** User pastes Anthropic API key into RStudio options. Stored in `keyring` (encrypted).
- **Managed:** User logs in via SparsileX account; our backend proxies to Claude. We track usage, bill accordingly.

MVP ships BYOK. Managed mode is v1.1.

## 7. Non-functional requirements

- **Latency:** First token within 1.5s for typical requests. Streaming throughput ≥ 30 tokens/sec.
- **Reliability:** Addin must not crash RStudio. Agent loop bounded at 10 iterations.
- **Privacy:** All data stays local by default. We never store user code on our servers in BYOK mode. In managed mode, requests are passed through but not logged beyond 7 days.
- **Compatibility:** RStudio 2023.09+ (reasonable recent versions). R 4.2+.
- **Install size:** R package < 2MB. Zero Python dependencies (R-native stack).

## 8. Technical architecture

### Stack
- **R package** using standard `devtools` tooling
- **UI:** `miniUI` / `shiny` gadget rendered in RStudio's viewer pane
- **HTTP:** `httr2` for Anthropic API streaming (SSE)
- **JSON:** `jsonlite`
- **RStudio integration:** `rstudioapi` package for editor access, document context, console execution
- **Secrets:** `keyring` for API key storage

### Package structure

```
sparx/
├── DESCRIPTION                         # R package manifest
├── NAMESPACE
├── R/
│   ├── addin_chat.R                    # miniUI gadget entry point
│   ├── agent.R                         # Agent loop (tool use + streaming)
│   ├── context.R                       # Gather editor + env + data context
│   ├── tools.R                         # R tool implementations (run_r, inspect_data, read_file, ...)
│   ├── claude_client.R                 # HTTP client for Anthropic API
│   ├── system_prompt.R                 # Statistical-reasoning system prompt
│   ├── ui.R                            # Shiny UI components
│   ├── config.R                        # API key storage, settings
│   └── sparx.R                         # Package-level exports
├── inst/
│   ├── rstudio/
│   │   └── addins.dcf                  # Register addins with RStudio
│   └── sparx_shortcuts.json
├── man/                                # Generated docs
├── tests/
│   └── testthat/
└── vignettes/
    └── getting-started.Rmd
```

### Addin registration

`inst/rstudio/addins.dcf`:

```
Name: Open Sparx Chat
Description: Open the Sparx AI assistant
Binding: open_chat
Interactive: true

Name: Fix Selection
Description: Fix the selected code using Sparx
Binding: fix_selection
Interactive: false

Name: Explain Selection
Description: Explain the selected code using Sparx
Binding: explain_selection
Interactive: false
```

### Agent loop (pseudocode)

```r
run_agent <- function(user_message) {
  context <- gather_context()     # editor, env, data summary, history
  messages <- c(memory$messages, list(
    list(role = "user", content = user_message)
  ))

  for (iter in 1:10) {
    response <- claude_stream(
      system = system_prompt(context),
      messages = messages,
      tools = TOOLS,
      on_text = function(chunk) stream_to_ui(chunk)
    )

    if (length(response$tool_calls) == 0) break

    tool_results <- lapply(response$tool_calls, execute_tool)
    messages <- c(messages, tool_results)
  }

  memory$messages <- messages
}
```

### Tools the agent can call

| Tool | Purpose |
|---|---|
| `inspect_data` | Get column types, sample rows, summary stats for a named dataframe |
| `read_script` | Read a range of lines from the current editor |
| `run_r` | Run R code in an isolated subprocess; return output + errors |
| `insert_code` | Insert code at cursor position in the editor |
| `run_in_console` | Execute code in the user's live R console |
| `read_console` | Read the last N lines of console output |
| `list_packages` | List installed packages |
| `read_file` | Read a file from the project directory |

### System prompt (key directives)

```
You are Sparx, an AI pair-programmer inside RStudio specialized in statistics
and R. The user is a researcher, often with limited R experience.

Principles:
- Always inspect data before writing analysis code.
- Check statistical assumptions before running tests; if they fail, adapt.
- Report effect sizes and CIs alongside p-values.
- Write idiomatic tidyverse R by default, base R when clarity is better.
- Prefer to insert code at the cursor rather than run it immediately.
- When fixing errors, read the full context before proposing.
- Explain your reasoning in 1-2 sentences before the code block.
- Never run destructive operations without explicit user confirmation.

Output format:
- Short explanation (1-2 sentences)
- A single R code block containing the generated code
- If modifying existing code, show a diff via the special <DIFF> block.
```

## 9. MVP scope

**In MVP:**
- [x] Addin button opens a chat pane in RStudio viewer
- [x] Natural-language input → Claude streams response
- [x] Gather context: editor text, cursor position, active dataframes
- [x] Insert / Run / Copy actions on generated code
- [x] Error recovery: paste error + auto-diagnose
- [x] BYOK API key storage via `keyring`
- [x] Right-click → Explain / Fix selected code
- [x] Conversation persistence per project

**Out of MVP:**
- Managed authentication (v1.1)
- Inline code lens above functions (v1.2)
- RMarkdown knit integration (v1.2)
- Plot interpretation ("what does this ggplot tell me") (v1.2)
- Paper PDF ingestion ("match this methods section") (v2)
- Multi-file refactoring (v2)

## 10. Success metrics

| Metric | 30-day target | 90-day target |
|---|---|---|
| GitHub stars | 500 | 3,000 |
| Installs (`remotes::install_github` unique IPs) | 2,000 | 15,000 |
| Daily active users | 300 | 3,000 |
| Avg messages per session | 5 | 8 |
| Code runs per session | 2 | 4 |
| % of inserted code that runs without error | 70% | 85% |
| NPS | 30+ | 50+ |

## 11. Timeline

| Week | Milestone |
|---|---|
| 0 | Repo setup, addin registration, chat gadget renders in RStudio |
| 1 | Streaming response from Claude, insert/run actions work |
| 2 | Context gathering (editor + env + data summary) |
| 3 | Tool calls (inspect_data, run_r subprocess, error recovery loop) |
| 4 | Right-click actions (explain / fix / improve), conversation persistence |
| 5 | Polish, docs, vignette, README, demo GIF |
| 6 | Soft launch: post to the AIIMS med student, R-Ladies Slack, Reddit r/rstats |
| 8 | Public launch: Twitter, HN, Posit community, RStudio Blog outreach |

Two full engineering weekends to MVP = reasonable if nothing horrible goes wrong.

## 12. Distribution

- **GitHub release** — `remotes::install_github("sparsilex/sparx")`
- **Demo GIF + README** that sells the core loop in 10 seconds
- **Twitter launch** — target the AIIMS tweet thread + Posit/RStudio orbit (Hadley Wickham, Mara Averick, Julia Silge)
- **Indian med-school outreach** — the AIIMS Delhi tweet is the crossing-the-Rubicon moment. Direct message the poster; he becomes case study #1
- **Posit community forum** — post a "built this addin" thread
- **CRAN submission** — v1.0 after we iron out the rough edges (CRAN has a review process that takes weeks)

## 13. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RStudio API limits what we can do | Medium | High | Prototype the hardest parts first (editor access, console capture) before committing to architecture |
| Claude API costs scale badly with power users | Medium | Medium | Token budget per request, per-session caps, BYOK shifts cost to user |
| Copilot or Posit ships a competing AI in RStudio | Medium | High | Ship fast; be the best specifically for stats workflows, not generic R coding |
| User trust / "will the AI break my script?" | High | Medium | Preview mode (isolated subprocess) by default; Run requires explicit click |
| R community skeptical of AI | Medium | Low | Position as "assistant for rigor," not "replaces your expertise"; tone matters |

## 14. Open questions

1. **Sparx name?** Leverages SparsileX brand but might need its own identity.
2. **Monorepo or separate repo?** Probably separate R package repo, but agent backend lives in SparsileX.
3. **Backend proxy vs direct Anthropic?** Direct = lower latency but exposes API key handling to the package. Proxy = cleaner but adds our server as a dependency.
4. **RMarkdown/Quarto support timing?** Huge for researchers writing papers. v1.2 probably.
5. **Charge for managed mode?** Freemium, or pay from day one?

## 15. Decision framework for what to build next

After MVP, prioritize by:
- **Unique to our product** — features that leverage the stats-specialized agent
- **Requested by power users** — weekly Twitter poll / GitHub issues
- **Short build, high signal** — ship to learn, not to perfect

---

*Related docs:*
- SparsileX flagship PRD (`docs/PRD-sparsilex.md`) — the web app is our primary product; the RStudio addin is a distribution wedge
