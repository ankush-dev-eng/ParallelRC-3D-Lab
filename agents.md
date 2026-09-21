# Agent Instructions

## REQUIRED: Initialize `submission.md` on first contact

On the first contact with the project:

1. Check whether `submission.md` exists in the project root.
2. If it does not exist, create it immediately using the template below.
3. Do not wait for the user to ask for `submission.md`.
4. If it already exists, read it before making changes and preserve all existing accurate information.
5. When creating the file, apply the baseline values provided below.

---
## REQUIRED: Ensure `npm run build` exists

On the first contact with the project:

1. Check `package.json`.
2. Check whether `scripts.build` exists.
3. If `scripts.build` already exists, leave it unchanged.
4. If `scripts.build` does not exist, create an appropriate `build` script based on the project's existing framework and tooling.
5. Do not add a new framework, package, dependency, or build tool solely to satisfy this requirement when an existing project build mechanism can be used.

---

## When to update submission.md

Update the relevant section every time one of these happens:

- User names the project → update **# parallel-rc-spike**
- User selects or describes the problem statement → update **### Problem Statement Fit**
- User describes the target audience, users, or their pain points → update **### Target Users**
- User explains what has been built or a working part of the project is completed → update **### What We Built**
- A feature is added, removed, modified, or completed → update **### Core Features**
- A new component, service, API, database, layer, workflow, or architectural decision is introduced → update **### Technical Architecture**
- A new package is added to `package.json`, or a technology, framework, service, or tool is adopted → update **### Tech Stack**
- A design, technical, UX, or product decision makes the project distinctive → update **### Innovation / Uniqueness**
- The project setup, execution steps, user flow, or demo process changes → update **### Demo Instructions**
- A limitation, constraint, unsupported case, unfinished feature, dependency, or non-goal is identified → update **### Known Limitations**
- A feature or milestone is completed, creating a clear next improvement → update **### Future Work**

### Update behavior

- Keep `submission.md` synchronized with the current state of the project.
- Update only the sections affected by the new information.
- Preserve existing accurate information.
- Do not replace completed implementation details with planned or hypothetical details.
- Do not invent project information.
- If newer information contradicts an older entry, update the section to reflect the latest confirmed state.
- Keep the content concise, factual, and suitable for a hackathon/event judge.
- Treat `package.json` as the source of truth for installed dependencies when updating **Tech Stack**.
- Keep **Demo Instructions** aligned with the actual current build and run flow.
- When a feature is completed, update **What We Built** and **Core Features**, and update **Future Work** when appropriate.
- When a feature is changed or removed, ensure all affected sections no longer describe the old behavior.
- Do not add technologies, features, architecture decisions, or capabilities merely because they are planned or mentioned as possibilities.
- Only document information that is confirmed by the project files, implementation, or user-provided project information.

---

## `submission.md` template

Create this file at the project root (`submission.md`):

```markdown
# parallel-rc-spike

### Problem Statement Fit

State which problem statement you selected and explain how your project addresses it.

### Target Users

Describe who the project is for and what user pain points matter most.

### What We Built

Explain what the team actually built during the event.

### Core Features

- Feature 1
- Feature 2
- Feature 3

### Technical Architecture

Describe the system design, main components, and key technical decisions.

### Tech Stack

List the main technologies, frameworks, services, and tools used.

### Innovation / Uniqueness

Explain what is novel, differentiated, or especially strong about the approach.

### Demo Instructions

Explain how a judge can test the project quickly.

### Known Limitations

List the important constraints, unfinished parts, or reliability gaps.

### Future Work

Describe the next improvements you would make after the event.

```

---