## ADDED Requirements

### Requirement: Paraglide/Inlang configured for ~50 locales

The system SHALL use Paraglide (Inlang) for internationalization. The project SHALL be configured with approximately 50 main languages (locales). Locale configuration SHALL live in the Inlang project (e.g. `project.inlang/settings.json`). Message strings SHALL be stored in message files per locale (e.g. `messages/{locale}.json`). The system SHALL support locale switching so the user MAY view the app in a chosen language.

#### Scenario: Many locales configured

- **WHEN** the app is built or run
- **THEN** the Inlang/Paraglide configuration includes approximately 50 locales; each locale has a corresponding message file or fallback

#### Scenario: Locale switching

- **WHEN** the user switches locale (e.g. via language selector)
- **THEN** the app displays user-facing strings in the selected locale using Paraglide

#### Scenario: Fallback for missing keys

- **WHEN** a message key is missing for the current locale
- **THEN** the system SHALL fall back to a default locale (e.g. base locale) so that no raw key ids are shown to the user

### Requirement: All pages and UI use Paraglide

Every user-facing string in the application (landing, upload, gallery, reader, supporting pages, legal pages, navigation, buttons, labels, errors) SHALL be sourced from the i18n system (Paraglide). There SHALL be no hardcoded user-visible copy in components or routes.

#### Scenario: No hardcoded user strings

- **WHEN** any page or component is rendered
- **THEN** all text shown to the user comes from Paraglide message keys (e.g. `m.*`); no literal strings are used for user-facing text

#### Scenario: New pages have message keys

- **WHEN** a new page or UI element is added
- **THEN** corresponding message keys are added to the message files and used in the component; the new content is translatable for all configured locales
