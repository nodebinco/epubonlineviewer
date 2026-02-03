# AGENTS.md — AI / agent context for EPUB Online Viewer

This file gives AI assistants and code generators enough context to work on **epubonlineviewer** consistently.

## Project summary

- **Product**: epubonlineviewer.com — read EPUB ebooks in the browser.
- **Stack**: SvelteKit, TypeScript, DaisyUI, Paraglide (i18n), Cloudflare Pages.
- **Storage**: EPUBs are stored **only in the user’s browser** (IndexedDB). No server-side book storage.

## Naming and structure

- **kebab-case** everywhere: file names, route segments, component names, CSS classes, public IDs.
  - Examples: `epub-gallery.svelte`, `getting-started`, `privacy-policy`.
- **Routes**: SvelteKit file-based routing under `src/routes/`. Use `+page.svelte`, `+layout.svelte`, `+page.server.ts` where needed.
- **Shared code**: `src/lib/` — components, utilities, EPUB parsing, IndexedDB helpers. Prefer `lib/` over duplicating logic in routes.

## Key technical choices

1. **EPUB storage**: IndexedDB (e.g. via `idb` or native `indexedDB`). Key by a stable id (e.g. hash or uuid). Store blob + metadata (title, cover, last opened).
2. **EPUB parsing**: Use a JS EPUB library (e.g. `epub.js` or a lightweight parser) to get spine, chapters, and HTML. Render chapter HTML in a sandboxed iframe or sanitized container.
3. **i18n**: Paraglide (Inlang). All user-facing strings come from `messages/{locale}.json`. Use the generated `m.*` API in Svelte/TS. Add new keys for every new UI or supporting page. Target ~50 main languages; add locales in `project.inlang/settings.json` and translate in `messages/`.
4. **UI**: DaisyUI + Tailwind. Prefer DaisyUI components and themes; keep custom CSS minimal and in `app.css` or layout/component-scoped files.

## Main user flows (implement correctly)

1. **Landing** (single page at `/`)
   - One page combines upload UI and gallery list; no separate `/upload` or `/gallery` routes.
   - Upload: file input for `.epub` → parse → save to IndexedDB → gallery on same page updates; user MAY go to reader for new book.
   - Gallery: list/cards of stored EPUBs (title, cover, last opened). Click → open reader for that book.
   - No book data on server; gallery is read from IndexedDB.
2. **Reader**
   - Show current chapter; prev/next; optional TOC; full-screen mode; respect i18n.

## Supporting pages (all must exist and be translated)

- `getting-started` — How to upload and read.
- `what-is-epub` — What an EPUB file is.
- `supported-formats` (or similar) — Supported formats and limits.
- `keyboard-shortcuts` — Reader and app shortcuts.
- `faq` — FAQ.

Use route segments like: `/getting-started`, `/what-is-epub`, etc. Each page must use Paraglide for all text.

## Legal and info pages (required, translated)

- `about-us` — About the project/product.
- `contact-us` — Contact form or contact info.
- `privacy-policy` — Privacy policy (stress: data in browser only, no server-side book storage).
- `terms-of-use` — Terms of use.

Same rule: kebab-case routes, all copy via Paraglide.

## i18n rules

- **No hardcoded user-visible strings** in Svelte/TS. Every label, title, paragraph, button, error message must use a message key (e.g. `m.gallery_title()`).
- **New pages**: Add message keys for that page in `messages/en.json` (and other locales). Key names: kebab-case or snake_case as per existing style (e.g. `getting_started_title`).
- **50 languages**: Add locales in Inlang config; keep default/fallback to `en`. Translate all keys for each locale (or leave untranslated keys to fallback).

## OPSX / openspec

- **Changes** live under `openspec/changes/<change-name>/` (kebab-case).
- **Schema**: Default is `spec-driven` (proposal → design → specs → tasks). Use `bunx openspec` for `new`, `status`, `instructions`, `continue`, etc.
- Do not create artifacts until the user has seen the first-artifact instructions and confirmed (e.g. via `/opsx:continue` or explicit “go ahead”).

## What to do when adding a feature

1. **New route**: Add `src/routes/<route-name>/+page.svelte` (and optional `+layout.svelte`, `+page.server.ts`). Use kebab-case.
2. **New UI strings**: Add keys to `messages/en.json` (and other locales); use Paraglide in the component.
3. **New shared logic**: Put in `src/lib/` (e.g. `lib/epub-store.ts`, `lib/indexed-db.ts`). Export from `lib/index.ts` if appropriate.
4. **IndexedDB**: Centralize in one or a few modules under `lib/`; same API for “save EPUB”, “list EPUBs”, “get EPUB by id”, “delete”.

## What to avoid

- Storing EPUB content or user library on the server.
- Hardcoded English (or any) text in the UI.
- PascalCase or camelCase for route segments or public file/URL names.
- Skipping supporting or legal pages; they must exist and be translated.

## Quick reference

| Item            | Convention / location                    |
|-----------------|-------------------------------------------|
| Routes          | `src/routes/<kebab-case>/+page.svelte`   |
| i18n            | Paraglide; `messages/{locale}.json`      |
| EPUB storage    | IndexedDB, via `src/lib/`                |
| UI              | DaisyUI + Tailwind                       |
| OPSX changes    | `openspec/changes/<name>/`               |

Use this document to keep naming, structure, and behavior consistent when generating or modifying code.
