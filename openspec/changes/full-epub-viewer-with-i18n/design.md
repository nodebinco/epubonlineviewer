## Context

The app is a minimal SvelteKit scaffold (single landing route, Paraglide with en/es, DaisyUI, Cloudflare adapter). This change implements the full epubonlineviewer.com product: upload EPUBs, store them in the browser (IndexedDB), list them in a gallery, read in a reader with full-screen, plus supporting and legal pages—all with i18n for ~50 languages via Paraglide. Constraints: no server-side book storage; kebab-case everywhere; all user-facing strings through Paraglide; shared logic and storage in `src/lib/`, pages in `src/routes/`.

## Goals / Non-Goals

**Goals:**

- Single landing page at `/` that combines upload UI and gallery list; no separate `/upload` or `/gallery` routes; gallery state from IndexedDB only.
- Upload on landing: select `.epub` → parse metadata → store blob + metadata in IndexedDB → gallery on same page updates; user MAY be redirected to reader for the new book.
- Gallery on landing: list stored EPUBs (title, cover, last opened); click opens reader for that book.
- Reader: render current chapter; prev/next; optional TOC; full-screen; persist reading position.
- Supporting pages (getting-started, what-is-epub, supported-formats, keyboard-shortcuts, faq) and legal pages (about-us, contact-us, privacy-policy, terms-of-use); all content via Paraglide. Supporting page content SHALL be long-form, useful, and SEO-friendly (see `supporting-pages-content.md` in this change).
- i18n: Paraglide/Inlang configured for ~50 locales; message keys for every page and component; locale switching; no hardcoded user-facing strings.

**Non-Goals:**

- Server-side storage or sync of EPUBs; user accounts or auth; cloud backup.
- Offline-first service worker / PWA (can be a later change).
- Editing or annotating EPUBs; only viewing.
- Support for non-EPUB formats (e.g. PDF) in this change.

## Decisions

**1. EPUB parsing and rendering**

- **Choice:** Use a lightweight JS EPUB parser (e.g. `epub.js` or `@epubjs/epubjs` for parsing + rendering, or a smaller parser that yields spine/HTML and render in a controlled container).
- **Rationale:** Full parsing (OPF, NCX, spine, chapter HTML) and safe rendering (sanitized iframe or sandboxed div) are required. `epub.js` is widely used and handles many EPUBs; alternatives like a minimal custom parser reduce bundle size but increase maintenance.
- **Alternatives:** Custom parser (more work, edge cases); server-side parsing (rejected—no server storage).

**2. IndexedDB API**

- **Choice:** Use native `indexedDB` or a thin wrapper (e.g. `idb`) from `src/lib/`; one store (or small set) for “books” with key = stable id (hash or uuid), value = { blob, metadata }.
- **Rationale:** Keeps storage logic in one place, testable; `idb` gives Promise-based API and smaller boilerplate.
- **Alternatives:** LocalStorage (size limits, not for blobs); File System Access API (not universally supported; IndexedDB is sufficient).

**2b. EPUB storage format in IndexedDB: Blob (not MessagePack)**

- **Choice:** Store the EPUB file in IndexedDB as a **Blob** (or ArrayBuffer). Do not convert to MessagePack before storing.
- **Rationale:** (1) EPUB is already a ZIP archive; it is already compressed. (2) MessagePack is best for structured data (objects, arrays); using it for a single binary blob adds encode/decode overhead without meaningful size gain over raw blob. (3) EPUB parsers expect a Blob, ArrayBuffer, or URL—storing as Blob avoids extra conversion when loading. (4) Simpler implementation and fewer failure points. (5) If we ever stored only metadata as MessagePack, that could reduce metadata size, but the main payload is the book blob; keeping it as Blob is the right default.
- **Alternatives:** MessagePack-encode the whole file (adds complexity, no real compression benefit over ZIP); decompress ZIP and store chapters separately as MessagePack (high complexity, parser still needs to reassemble; only consider if we need to stream chapters without full parse).

**3. Route structure**

- **Choice:** SvelteKit file-based routes under `src/routes/`: `/` (landing with upload + gallery combined on one page), `/reader/[id]`, plus `/getting-started`, `/what-is-epub`, `/supported-formats`, `/keyboard-shortcuts`, `/faq`, `/about-us`, `/contact-us`, `/privacy-policy`, `/terms-of-use`. No separate `/upload` or `/gallery` routes. All segments kebab-case.
- **Rationale:** Single home page for upload and gallery simplifies navigation; `[id]` for reader keeps URLs shareable (within same device/browser).
- **Alternatives:** Separate upload/gallery routes (rejected per product decision).

**4. i18n locale list (50 locales)**

- **Choice:** Add exactly 50 locales to `project.inlang/settings.json`; add `messages/{locale}.json` per locale. Use the following list (ISO 639-1 / BCP 47; base locale first, then alphabetical by code):
- **Full list (50):** `en`, `es`, `fr`, `de`, `it`, `pt`, `pt-BR`, `nl`, `pl`, `ru`, `uk`, `ja`, `zh-CN`, `zh-TW`, `ko`, `ar`, `hi`, `bn`, `id`, `ms`, `th`, `vi`, `tr`, `fa`, `ur`, `sw`, `am`, `ha`, `yo`, `ig`, `ro`, `hu`, `cs`, `el`, `he`, `sv`, `da`, `no`, `fi`, `sk`, `bg`, `sr`, `hr`, `ca`, `eu`, `gl`, `sl`, `lt`, `lv`, `et`.
- **Rationale:** Covers major languages by population and web use; Paraglide/Inlang support these tags; fallback to `en` for missing keys.
- **Alternatives:** Fewer locales; regional variants only (e.g. more zh-*, ar-*); separate i18n system (unnecessary given Paraglide).

**5. Reader position persistence**

- **Choice:** Store last chapter/position (e.g. spine index + offset or CFI) per book in IndexedDB (or in the same book record); restore on open.
- **Rationale:** “Continue reading” improves UX; no server, so persistence lives in IndexedDB with the book.
- **Alternatives:** No persistence (worse UX); localStorage per book (works but IndexedDB keeps all book state together).

**6. Full-screen mode**

- **Choice:** Use Fullscreen API (e.g. `element.requestFullscreen()`) on the reader container; toggle via UI button and optional keyboard shortcut; exit on Esc.
- **Rationale:** Standard, no extra dependency; works in modern browsers.
- **Alternatives:** CSS “maximize” only (not true full-screen); third-party library (unnecessary).


**7. SEO: title, snippet, keywords per page**

- **Choice:** Every page (landing, reader, supporting, legal) SHALL have SEO meta suitable for search and sharing: (1) **Unique page title** (`<title>`) — descriptive, brand suffix (e.g. " | EPUB Online Viewer"). (2) **Meta description (snippet)** — one or two sentences, ~120–160 characters, used as the search result snippet. (3) **Meta keywords** — comma-separated relevant terms (e.g. read epub online, free epub viewer, epub reader). (4) **Optional:** Open Graph (`og:title`, `og:description`, `og:type`, `og:url`) and Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`) for share snippets. All meta SHALL be localizable via Paraglide (per-locale title, description, keywords).
- **Rationale:** Improves discoverability in search; snippets and keywords help relevance; share meta improves previews when links are shared. Per-page and per-locale meta support i18n and long-tail queries.
- **Alternatives:** No meta keywords (some engines ignore them; still useful for clarity); no og/twitter (weaker share previews).

## Risks / Trade-offs

- **[Risk] Large EPUBs or many books** → Mitigation: Rely on IndexedDB limits per origin; document or warn on very large files; consider lazy-loading chapter content.
- **[Risk] EPUB format variability** → Mitigation: Use a well-tested parser; handle parse errors gracefully (toast + stay on upload/gallery); document supported EPUB versions.
- **[Risk] 50 locales = many message files and keys** → Mitigation: Strict key naming; fallback to default locale; automate extraction/translation where possible.
- **[Risk] XSS from EPUB HTML** → Mitigation: Render chapter content in sandboxed iframe or sanitize HTML (e.g. DOMPurify) before rendering; no `eval` or unsafe dynamic scripts.
- **[Trade-off] Bundle size** → EPUB + UI dependencies increase bundle; accept for now; consider code-splitting reader route later.

## Migration Plan

- No existing book data to migrate. Implementation order: (1) IndexedDB + upload + gallery + reader in `src/lib/` and routes, (2) landing and navigation, (3) supporting and legal pages, (4) Paraglide locale expansion and full translation pass. Deploy via existing Cloudflare Pages build; no rollback of “book storage” needed (client-only).

## Open Questions

- Whether to use `epub.js` or a smaller parser after evaluating bundle size and compatibility.
- Contact-us: static page with email/links only, or simple form (e.g. mailto or external form service).
