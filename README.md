# ClarityOS — Personal Productivity & Second Brain

A responsive personal productivity and goal execution web application built with React, TypeScript, and Tailwind CSS. ClarityOS bridges high-level strategic direction with daily tactical execution using the **Eisenhower Matrix**, the **Six Honest Serving Men** framework, and an iterative **Short-Term Experiments** tracker.

It is designed to run statically on **GitHub Pages** (with Cloudflare custom domain support) and features local **Second Brain Markdown (`.md`) storage** and automatic browser persistence (IndexedDB + `localStorage`).

---

## Key Features

### 1. Eisenhower Matrix (Urgent / Important Prioritization)
- **4-Quadrant Board:**
  - **1. Do First** (Urgent & Important)
  - **2. Schedule** (Not Urgent & Important)
  - **3. Delegate** (Urgent & Not Important)
  - **4. Eliminate** (Not Urgent & Not Important)
- **Fluid Organization:** Move tasks between quadrants using HTML5 drag-and-drop or quick-move dropdowns.
- **Task Management:** Quick-add bar, task notes, completion toggles, goal filtering, and completed-task purging.
- **Goal Linking:** Link any task directly to a Long-Term Goal or Experiment with interactive badges.

### 2. Long-Term Goals (Six Honest Serving Men Framework)
- Enforces clarity on high-stakes, irreversible commitments before locking them in:
  1. **What** is the exact goal and measurable deliverable?
  2. **Why** does this matter (core motivation & alignment)?
  3. **When** are the key milestones and final deadline?
  4. **How** will this be executed (strategy & resources)?
  5. **Where** will this happen (market, environment, or context)?
  6. **Who** is involved (stakeholders, mentors, accountability)?
- Live `0/6` completion tracker with lock-in protection, revision unlock, and status tracking (*Draft*, *Locked In*, *Achieved*).
- **Execution Bridge:** Break down goals directly into actionable tasks on the Eisenhower Matrix.

### 3. Short-Term Goals & Experiments (Rapid Feedback Loops)
- Lightweight workspace for rapid hypothesis testing and habit formation:
  - **Hypothesis / Objective** & **Action Steps**
  - **Chronological Feedback Log** with timestamps
  - **4-Way Re-assessment Engine:** *Persevere*, *Pivot*, *Scale*, or *Drop*
  - **Next Iteration** notes and direct Eisenhower Matrix task creation

### 4. Second Brain Memory & File Persistence
- **Dual Automatic Persistence:** All workspace changes persist immediately in **IndexedDB** (`ClarityOSSecondBrainDB`) and **`localStorage`** with persistent storage requests.
- **Local Markdown (.md) Vault Sync:** Connect any local directory (e.g. an Obsidian vault or local Git folder) via the browser File System Access API. ClarityOS automatically writes:
  - `README.md` — Vault index summary
  - `matrix/eisenhower-matrix.md` — Quadrant checklists with `[[Goal]]` wiki-links
  - `goals/*.md` — Frontmatter + Six Honest Serving Men prompts
  - `experiments/*.md` — Frontmatter + logs and re-assessment decisions
- **Portable Backups:** One-click Export / Import for single-file Markdown (`clarityos-second-brain.md`) and JSON backups.

---

