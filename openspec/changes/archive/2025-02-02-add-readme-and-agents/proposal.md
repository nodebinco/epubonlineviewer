## Why

The project lacked clear, audience-appropriate documentation. Users had no single place to learn what EPUB Online Viewer is, why it’s useful, and how to use it. Contributors and AI assistants had no shared reference for conventions, architecture, and behavior, which led to inconsistent naming and structure. Adding a user-facing README, an AGENTS.md for AI/agent context, and aligning the openspec config gives both users and tooling a clear source of truth.

## What Changes

- **README.md** — Rewritten for end users: what the app is, benefits, how to use it (upload, gallery, reader, full-screen), link to epubonlineviewer.com. No developer-only run/install content in the main narrative.
- **AGENTS.md** — New file for AI/agents: project summary, kebab-case and structure conventions, tech choices (IndexedDB, Paraglide, DaisyUI), main flows, required supporting and legal pages, i18n rules, OPSX usage, do’s and don’ts.
- **openspec/config.yaml** — Project context and per-artifact rules so openspec-driven changes stay aligned with README and AGENTS (tech stack, storage model, conventions, artifact guidelines).

## Capabilities

### New Capabilities

- `project-documentation`: User-facing README (what, benefits, how to use), AGENTS.md (AI/agent context and conventions), and openspec project context so all documentation and workflow artifacts stay consistent.

### Modified Capabilities

- _(none — no existing specs in openspec/specs/.)_

## Impact

- **Files**: Root `README.md`, root `AGENTS.md`, `openspec/config.yaml`. No application code or API changes.
- **Audiences**: End users (README); contributors and AI assistants (AGENTS.md, openspec context).
- **Dependencies**: None. Purely documentation and config.
