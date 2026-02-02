## ADDED Requirements

### Requirement: Gallery on landing page lists stored EPUBs from IndexedDB

The system SHALL display an EPUB gallery on the landing page (`/`) that lists all EPUBs previously stored by the user in IndexedDB. Each list entry SHALL display at least: title, cover image (when available), and MAY display last-opened or other metadata. The list SHALL be read only from IndexedDB; no server-side book list SHALL be used. The gallery SHALL be on the same page as the upload UI; there SHALL be no separate gallery route.

#### Scenario: Landing page shows gallery with stored books

- **WHEN** the user is on the landing page and IndexedDB contains one or more stored EPUBs
- **THEN** each stored book is shown in the gallery on the same page with title and cover (if available)

#### Scenario: Landing page shows empty gallery

- **WHEN** the user is on the landing page and IndexedDB contains no stored EPUBs
- **THEN** the gallery on the same page shows an empty state (e.g. message or prompt to upload)

#### Scenario: Gallery data source is client-only

- **WHEN** the gallery on the landing page is loaded
- **THEN** the list of books is obtained only from IndexedDB; no request for book list is made to a server

#### Scenario: No separate gallery route

- **WHEN** the user views the gallery
- **THEN** the gallery is displayed on the landing page (`/`); there is no dedicated `/gallery` route

### Requirement: User can open a book from gallery

The system SHALL allow the user to select one book from the gallery on the landing page. Upon selection, the system SHALL open the reader for that book (e.g. navigate to reader route with that book’s id).

#### Scenario: Open reader from gallery

- **WHEN** the user clicks or selects a book in the gallery on the landing page
- **THEN** the system opens the EPUB reader for that book (e.g. navigates to reader route with the book id)
