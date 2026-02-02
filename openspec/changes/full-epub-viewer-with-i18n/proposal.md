## Why

The app is currently a minimal SvelteKit scaffold. Users cannot yet upload EPUBs, store them, or read them in the browser. Implementing the full epubonlineviewer.com experience—upload, gallery, reader, supporting and legal pages, and i18n with Paraglide for ~50 languages—delivers the product described in README and AGENTS: read EPUBs online with no account, local-only storage, and full localization.

## What Changes

- **Landing** — Home page at `/` that combines upload and gallery on one page: upload UI (file input for `.epub`) and gallery list (stored EPUBs from IndexedDB) are both on the same route; no separate `/upload` or `/gallery` routes.
- **EPUB upload** — On the landing page: file input for `.epub`; parse and store in IndexedDB with metadata (title, cover, id); after success, gallery on the same page updates and user MAY be redirected to reader for the new book.
- **EPUB gallery** — On the landing page: list/cards of stored EPUBs from IndexedDB; click to open reader for that book.
- **EPUB reader** — Render current chapter; prev/next navigation; optional TOC; full-screen mode; all UI translated.
- **Supporting pages** — getting-started, what-is-epub, supported-formats, keyboard-shortcuts, faq (all translated).
- **Legal pages** — about-us, contact-us, privacy-policy, terms-of-use (all translated).
- **i18n (Paraglide)** — Configure Paraglide/Inlang for ~50 main languages; add message keys for every page and component; translate all user-facing strings; no hardcoded copy in UI.

## Capabilities

### New Capabilities

- `landing`: Single entry page at `/` that combines upload UI and gallery list; reads from IndexedDB only; no separate upload or gallery routes.
- `epub-upload`: On landing page: upload `.epub` file, parse metadata, store blob and metadata in IndexedDB; after success gallery updates on same page; user MAY be redirected to reader for the new book.
- `epub-gallery`: On landing page: list previously uploaded EPUBs from IndexedDB (title, cover, last opened); open selected book in reader.
- `epub-reader`: Read EPUB (spine/chapters); prev/next; optional TOC; full-screen mode; persisted position.
- `supporting-pages`: Routes and content for getting-started, what-is-epub, supported-formats, keyboard-shortcuts, faq; all copy via Paraglide.
- `legal-pages`: Routes and content for about-us, contact-us, privacy-policy, terms-of-use; all copy via Paraglide.
- `i18n-paraglide`: Paraglide/Inlang config for ~50 locales; message files and keys for all pages and UI; locale switching and translated strings everywhere.

### Modified Capabilities

- *(none — no existing specs in openspec/specs/.)*

## Impact

- **Routes**: New routes under `src/routes/`: `/` (landing with upload + gallery combined), `/reader/[id]`, plus supporting and legal pages; no separate `/upload` or `/gallery`; kebab-case segments.
- **Lib**: `src/lib/` for IndexedDB store, EPUB parsing/rendering, shared components and utilities.
- **i18n**: `project.inlang/settings.json` (locales); `messages/{locale}.json` for all keys; Paraglide usage in every page and component.
- **Dependencies**: EPUB parsing library; optional IndexedDB wrapper (e.g. `idb`); existing Paraglide/DaisyUI/Tailwind retained.
- **Storage**: IndexedDB only; no server-side book storage or new backend APIs.
