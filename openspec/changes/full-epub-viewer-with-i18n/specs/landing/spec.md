## ADDED Requirements

### Requirement: Landing page at root combines upload and gallery

The system SHALL provide a single landing page at the app root (`/`) that combines both upload UI and gallery list on the same page. The page SHALL include: (1) upload UI (e.g. file input for `.epub`), and (2) gallery list of stored EPUBs from IndexedDB. There SHALL be no separate `/upload` or `/gallery` routes; upload and gallery are both on `/`. The page SHALL NOT require authentication. Gallery state SHALL be derived only from IndexedDB in the browser; no server-side book data SHALL be used.

#### Scenario: User opens app root

- **WHEN** the user navigates to the app root (`/`)
- **THEN** the landing page is displayed with upload UI and gallery list on the same page

#### Scenario: No separate upload or gallery routes

- **WHEN** the user is on the landing page
- **THEN** upload and gallery are both visible on the same route; the system does not navigate to a separate `/upload` or `/gallery` route for these functions

#### Scenario: No server book data

- **WHEN** the landing page (upload or gallery) is rendered
- **THEN** no book list or state is loaded from a server; only client-side (IndexedDB) data MAY be used

### Requirement: Landing page has SEO meta (title, snippet, keywords)

The landing page SHALL have SEO meta suitable for search and sharing: unique page title (`<title>`), meta description (snippet, ~120–160 characters), and meta keywords (comma-separated). All meta SHALL be localizable via Paraglide. Optionally Open Graph and Twitter Card for share snippets. Reference: `supporting-pages-content.md` (Landing SEO block).

#### Scenario: Landing has title, snippet, and keywords

- **WHEN** the landing page is rendered or indexed
- **THEN** the page has a unique title, meta description (snippet), and meta keywords; all SHALL be localizable per locale
