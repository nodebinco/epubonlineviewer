## 1. Lib: IndexedDB and EPUB

- [x] 1.1 Add IndexedDB wrapper (e.g. idb) and create `src/lib/epub-store.ts` (or equivalent) with store for books: key = stable id (hash or uuid), value = { blob, metadata }; store EPUB as Blob per design
- [x] 1.2 Add EPUB parsing dependency (e.g. epub.js or lightweight parser) and create `src/lib/epub-parser.ts` (or equivalent) to parse .epub and yield metadata (title, cover, spine) and chapter content
- [x] 1.3 Expose list books, get book by id, save book, delete book (if needed) from `src/lib/`; ensure blob is stored as Blob (not MessagePack) per design decision 2b

## 2. Landing page (upload + gallery on /)

- [x] 2.1 Update `src/routes/+page.svelte` (or create landing layout) so the root route shows upload UI (file input for .epub) and gallery list on the same page; no separate /upload or /gallery routes
- [x] 2.2 Wire upload: on file select, parse EPUB via lib, store blob + metadata in IndexedDB, refresh gallery list on same page; optionally redirect to reader for new book
- [x] 2.3 Wire gallery: load list of stored books from IndexedDB, display title and cover (when available); click book navigates to `/reader/[id]`
- [x] 2.4 Add SEO meta for landing: unique title, meta description (snippet ~120–160 chars), meta keywords; localizable via Paraglide (reference supporting-pages-content.md Landing SEO block)

## 3. Reader route and core reading

- [x] 3.1 Create route `src/routes/reader/[id]/+page.svelte` (and +page.server.ts if needed); load book by id from IndexedDB
- [x] 3.2 Render current chapter using EPUB parser; safe rendering (sandboxed iframe or sanitized HTML per design); prev/next navigation along spine
- [x] 3.3 Add full-screen mode (Fullscreen API) with button and optional keyboard shortcut; exit on Esc
- [ ] 3.4 Optional: persist reading position (chapter + offset) per book in IndexedDB; restore on open
- [ ] 3.5 Optional: table of contents (TOC) from EPUB; allow jump to chapter
- [x] 3.6 Reader SEO meta: title (dynamic from book metadata when possible), meta description (snippet), meta keywords; localizable per locale

## 4. Supporting pages (routes + content + SEO)

- [ ] 4.1 Create routes: `src/routes/getting-started/`, `src/routes/what-is-epub/`, `src/routes/supported-formats/`, `src/routes/keyboard-shortcuts/`, `src/routes/faq/` with +page.svelte each; all content from Paraglide (no hardcoded strings)
- [ ] 4.2 Add message keys and English content for getting-started from `supporting-pages-content.md` (full text, long-form); use as base for Paraglide
- [ ] 4.3 Add message keys and English content for what-is-epub, supported-formats, keyboard-shortcuts, faq from `supporting-pages-content.md`
- [ ] 4.4 Each supporting page: set unique title, meta description (snippet), meta keywords per `supporting-pages-content.md` SEO blocks; localizable via Paraglide

## 5. Legal pages (routes + content + SEO)

- [ ] 5.1 Create routes: `src/routes/about-us/`, `src/routes/contact-us/`, `src/routes/privacy-policy/`, `src/routes/terms-of-use/` with +page.svelte each; all content via Paraglide
- [ ] 5.2 Add message keys and content for about-us, contact-us, privacy-policy, terms-of-use (stress: local-only storage, no server-side book storage for privacy policy)
- [ ] 5.3 Each legal page: unique title, meta description (snippet), meta keywords; localizable via Paraglide

## 6. i18n: 50 locales and Paraglide

- [ ] 6.1 Add all 50 locales to `project.inlang/settings.json` per design list: en, es, fr, de, it, pt, pt-BR, nl, pl, ru, uk, ja, zh-CN, zh-TW, ko, ar, hi, bn, id, ms, th, vi, tr, fa, ur, sw, am, ha, yo, ig, ro, hu, cs, el, he, sv, da, no, fi, sk, bg, sr, hr, ca, eu, gl, sl, lt, lv, et
- [ ] 6.2 Create `messages/{locale}.json` for each of the 50 locales; ensure base locale (en) has all keys used across landing, reader, supporting, legal pages and SEO meta
- [ ] 6.3 Replace any hardcoded user-facing strings in `src/routes/` and `src/lib/` with Paraglide message calls; ensure reader, landing, and all pages use m.\* (or equivalent) for labels, titles, buttons, errors
- [ ] 6.4 Translate or fill message files for non-en locales (machine or community); fallback to en for missing keys

## 7. SEO and share snippets (all pages)

- [ ] 7.1 Ensure every page (landing, reader, supporting, legal) has unique `<title>`, meta description (snippet ~120–160 chars), and meta keywords; all from Paraglide so they are localizable per locale
- [ ] 7.2 Optional: add Open Graph (og:title, og:description, og:type, og:url) and Twitter Card (twitter:card, twitter:title, twitter:description) for share snippets on key pages

## 8. Polish and verification

- [ ] 8.1 Handle upload errors (invalid EPUB, quota exceeded): show message, do not corrupt existing data; allow retry
- [ ] 8.2 Reader: ensure chapter HTML is rendered safely (sanitize or sandbox) to mitigate XSS from EPUB content
- [ ] 8.3 Verify keyboard shortcuts (reader prev/next, full-screen, Esc) and document on keyboard-shortcuts page
- [ ] 8.4 Smoke test: upload EPUB → see in gallery → open reader → prev/next, full-screen; visit all supporting and legal pages; switch locale and confirm translated strings
