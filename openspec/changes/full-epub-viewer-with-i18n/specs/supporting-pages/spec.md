## ADDED Requirements

### Requirement: Supporting pages exist and are reachable

The system SHALL provide the following supporting pages at kebab-case routes: getting-started, what-is-epub, supported-formats, keyboard-shortcuts, faq. Each page SHALL be reachable via its route (e.g. `/getting-started`, `/what-is-epub`, `/supported-formats`, `/keyboard-shortcuts`, `/faq`). All user-visible content on these pages SHALL be provided via the app’s i18n mechanism (Paraglide); there SHALL be no hardcoded user-visible strings.

### Requirement: Supporting page content is substantive and SEO-friendly

The content of each supporting page SHALL be long-form, useful to users, and structured for SEO (e.g. clear headings, paragraphs, and relevant keywords such as "read epub online", "free epub viewer", "what is epub", "epub format"). Content SHALL follow the structure and depth of the reference document `supporting-pages-content.md` in this change (or equivalent). Each page SHALL have a descriptive title and meta description suitable for search results. All content SHALL be translatable via Paraglide for every supported locale.

### Requirement: Each supporting page has SEO meta (title, snippet, keywords)

Each supporting page SHALL have SEO meta suitable for search and sharing: (1) **Unique page title** (`<title>`) — descriptive, with brand suffix (e.g. " | EPUB Online Viewer"). (2) **Meta description (snippet)** — one or two sentences, approximately 120–160 characters, used as the search result snippet. (3) **Meta keywords** — comma-separated relevant terms (e.g. read epub online, free epub viewer, epub reader). All meta SHALL be localizable via Paraglide (per-locale). Optionally, each page MAY include Open Graph and Twitter Card meta for share snippets. The exact title, snippet, and keywords per page SHALL follow the reference in `supporting-pages-content.md` (or equivalent).

#### Scenario: Content depth and structure

- **WHEN** the user views any supporting page
- **THEN** the page contains substantive paragraphs and headings (not only a short stub); structure and topics match or exceed the reference content document

#### Scenario: SEO-friendly titles

- **WHEN** the page is rendered or indexed
- **THEN** the page has a descriptive title and meta description that include relevant terms (e.g. epub, read online, viewer)

#### Scenario: Meta description (snippet) and keywords

- **WHEN** the page is rendered or indexed
- **THEN** the page has a meta description (snippet) of appropriate length (~120–160 characters) and meta keywords (comma-separated) for SEO; both SHALL be localizable per locale

#### Scenario: Getting started page

- **WHEN** the user navigates to the getting-started route
- **THEN** the getting-started page is displayed with content explaining how to upload and read EPUBs; all text is translated

#### Scenario: What is EPUB page

- **WHEN** the user navigates to the what-is-epub route
- **THEN** the what-is-epub page is displayed with content explaining the EPUB format; all text is translated

#### Scenario: Supported formats page

- **WHEN** the user navigates to the supported-formats route
- **THEN** the supported-formats page is displayed with content about supported formats and limits; all text is translated

#### Scenario: Keyboard shortcuts page

- **WHEN** the user navigates to the keyboard-shortcuts route
- **THEN** the keyboard-shortcuts page is displayed with shortcuts for the reader and app; all text is translated

#### Scenario: FAQ page

- **WHEN** the user navigates to the faq route
- **THEN** the faq page is displayed with common questions and answers; all text is translated

#### Scenario: Supporting page content is localized

- **WHEN** the user views any supporting page in a given locale
- **THEN** all visible content is shown in that locale using the i18n system
