## ADDED Requirements

### Requirement: Reader renders current chapter

The system SHALL render the current chapter (or equivalent spine item) of the opened EPUB. Content SHALL be displayed in a safe manner (e.g. sandboxed iframe or sanitized HTML). The system SHALL support prev/next navigation along the spine. The reader SHALL load the EPUB from IndexedDB only; no server-side book content SHALL be used.

#### Scenario: Open book in reader

- **WHEN** the user opens a stored book in the reader (e.g. from gallery or after upload)
- **THEN** the current chapter is rendered and the user can read the content

#### Scenario: Prev/next navigation

- **WHEN** the user triggers previous or next in the reader
- **THEN** the system displays the previous or next spine item (chapter) and updates the current position; navigation at spine boundaries MAY disable prev/next or show a message

#### Scenario: Content is loaded from IndexedDB only

- **WHEN** the reader renders chapter content
- **THEN** the EPUB data is read only from IndexedDB; no chapter content is fetched from a server

### Requirement: Reader supports full-screen mode

The system SHALL provide a full-screen mode for the reader. The user SHALL be able to enter and exit full-screen (e.g. via button or shortcut). Standard full-screen exit (e.g. Esc) SHALL be supported.

#### Scenario: Enter full-screen

- **WHEN** the user activates full-screen in the reader
- **THEN** the reader content is displayed in full-screen (e.g. using the Fullscreen API)

#### Scenario: Exit full-screen

- **WHEN** the user exits full-screen (e.g. button or Esc)
- **THEN** the reader returns to normal layout

### Requirement: Reading position may be persisted

The system MAY persist the user’s reading position (e.g. current chapter and offset) per book. When the user reopens the same book, the system MAY restore the last position.

#### Scenario: Restore position on reopen

- **WHEN** the user has previously read a book and reopens it from the gallery
- **THEN** the reader MAY open at the last read position (if persistence is implemented)

### Requirement: Optional table of contents

The system MAY display a table of contents (TOC) for the EPUB. If present, the user MAY navigate to a chapter by selecting it from the TOC.

#### Scenario: Navigate via TOC

- **WHEN** the user selects a chapter from the TOC (if TOC is shown)
- **THEN** the reader displays that chapter and updates the current position

### Requirement: Reader UI is localized

All user-facing text in the reader (labels, buttons, messages) SHALL be provided via the app’s i18n mechanism (Paraglide); there SHALL be no hardcoded user-visible strings.

#### Scenario: Reader strings are translated

- **WHEN** the user views the reader in a given locale
- **THEN** all visible labels and messages are shown in that locale using the i18n system

### Requirement: Reader page has SEO meta (title, snippet, keywords)

The reader page SHALL have SEO meta suitable for search and sharing: (1) **Page title** (`<title>`) — MAY be dynamic (e.g. book title from EPUB metadata + " | EPUB Online Viewer") or a generic reader title. (2) **Meta description (snippet)** — ~120–160 characters (e.g. "Read [book title] in your browser. EPUB Online Viewer – full-screen, chapter navigation."). (3) **Meta keywords** — comma-separated (e.g. read epub online, epub reader, [book title]). All meta SHALL be localizable via Paraglide. Optionally Open Graph and Twitter Card for share snippets. Reference: `supporting-pages-content.md` (Reader SEO block).

#### Scenario: Reader has title, snippet, and keywords

- **WHEN** the reader page is rendered or indexed
- **THEN** the page has a title (possibly dynamic from book metadata), meta description (snippet), and meta keywords; all SHALL be localizable per locale
