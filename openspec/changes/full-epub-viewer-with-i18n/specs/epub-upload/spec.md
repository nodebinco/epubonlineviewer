## ADDED Requirements

### Requirement: User can upload an EPUB file on the landing page

The system SHALL allow the user to select a single `.epub` file from the device on the landing page (upload UI on `/`). The system SHALL parse the file to extract metadata (at least title and, when present, cover image). The system SHALL store the EPUB blob and metadata in IndexedDB under a stable identifier (e.g. hash or UUID). After successful storage, the gallery list on the same page SHALL update to include the new book. The system MAY redirect the user to the reader for the newly added book.

#### Scenario: User selects valid EPUB on landing

- **WHEN** the user selects a valid `.epub` file on the landing page and confirms upload
- **THEN** the system parses metadata, stores the blob and metadata in IndexedDB, and the gallery on the same page updates; the user MAY be redirected to the reader for the new book

#### Scenario: Upload uses only client storage

- **WHEN** the user uploads an EPUB
- **THEN** the file and metadata are stored only in the browser (IndexedDB); no copy is sent to or stored on a server

#### Scenario: Gallery updates after successful upload

- **WHEN** storage in IndexedDB completes successfully
- **THEN** the gallery list on the landing page is updated to show the new book; the user MAY be redirected to the reader for the new book (behavior MAY be configurable or default to one)

### Requirement: Upload errors are handled

The system SHALL handle parse or storage errors (e.g. invalid EPUB, quota exceeded) without corrupting existing data. The user SHALL receive a clear indication of failure and MAY retry or stay on the landing page.

#### Scenario: Invalid or unparseable file

- **WHEN** the selected file is not a valid EPUB or cannot be parsed
- **THEN** the system does not store the file, and the user is informed of the error and can try another file

#### Scenario: Storage failure

- **WHEN** IndexedDB storage fails (e.g. quota exceeded)
- **THEN** the user is informed and existing stored books are unchanged; the user MAY free space or retry
