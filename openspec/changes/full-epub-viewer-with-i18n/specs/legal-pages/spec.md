## ADDED Requirements

### Requirement: Legal and info pages exist and are reachable

The system SHALL provide the following pages at kebab-case routes: about-us, contact-us, privacy-policy, terms-of-use. Each page SHALL be reachable via its route (e.g. `/about-us`, `/contact-us`, `/privacy-policy`, `/terms-of-use`). All user-visible content on these pages SHALL be provided via the app’s i18n mechanism (Paraglide); there SHALL be no hardcoded user-visible strings.

#### Scenario: About us page

- **WHEN** the user navigates to the about-us route
- **THEN** the about-us page is displayed with content about the project/product; all text is translated

#### Scenario: Contact us page

- **WHEN** the user navigates to the contact-us route
- **THEN** the contact-us page is displayed with contact information or a contact form; all text is translated

#### Scenario: Privacy policy page

- **WHEN** the user navigates to the privacy-policy route
- **THEN** the privacy-policy page is displayed with privacy policy content (e.g. local-only storage, no server-side book storage); all text is translated

#### Scenario: Terms of use page

- **WHEN** the user navigates to the terms-of-use route
- **THEN** the terms-of-use page is displayed with terms of use content; all text is translated

#### Scenario: Legal page content is localized

- **WHEN** the user views any of these pages in a given locale
- **THEN** all visible content is shown in that locale using the i18n system

### Requirement: Each legal page has SEO meta (title, snippet, keywords)

Each legal/info page (about-us, contact-us, privacy-policy, terms-of-use) SHALL have SEO meta: unique page title (`<title>`), meta description (snippet, ~120–160 characters), and meta keywords (comma-separated). All meta SHALL be localizable via Paraglide. Optionally Open Graph and Twitter Card for share snippets.

#### Scenario: Legal page has title, snippet, and keywords

- **WHEN** any legal page is rendered or indexed
- **THEN** the page has a unique title, meta description (snippet), and meta keywords; all SHALL be localizable per locale
